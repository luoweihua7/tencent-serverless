const { TENCENTCLOUD_RUNENV } = process.env;
const weather = require('./controller/accuweather');
const sms = require('./controller/sms');
const ifttt = require('./controller/ifttt');
const redis = require('./controller/redis');

const date = require('./utils/date');
const string = require('./utils/string');

const { NOTIFY_TIMES } = require('./config');

/**
 * 发送天气预报
 */
const sendWeatherReport = async () => {
  let now = new Date();
  let hour = date.formatDate(now, 'HH');
  let minute = date.formatDate(now, 'mm');
  let isSendTime = NOTIFY_TIMES.some(
    (time) => string.isMatchOrUndefined(hour, time.hour) && string.isMatchOrUndefined(minute, time.minute)
  );

  if (isSendTime) {
    const data = await weather.forecast();

    await Promise.all([sms.sendNotification(data), ifttt.sendNotification(data)]);
    console.log(`发送天气预报：${data.summary.replace(/\r|\n/g, '')}`);
  } else {
    console.log(`未在指定时间范围内，不发送天气预报`);
  }
};

/**
 * 发送天气预警
 */
const sendWeatherAlert = async () => {
  let alerts = await weather.alerts(true);

  let promises = alerts.map(async ({ id, city, level, source, alert, text, summary } = {}) => {
    return await Promise.all([
      sms.sendAlert({ id, city, level, source, alert, text, summary }),
      ifttt.sendAlert({ id, city, level, source, alert, text, summary })
    ]);
  });

  // 发送天气预警
  await Promise.all(promises);

  // 记录已发送的天气预警
  await redis.setAlerts(alerts);
  alerts.forEach(({ id, text } = {}) => {
    console.log(`新增预警：id=${id}，text=${text}`);
  });
};

const serverless = async (event, context, callback) => {
  await sendWeatherReport();
  await sendWeatherAlert();
  await redis.quit();

  return { code: 0 };
};

/**
 * Serverless 主入口
 */
exports.main_handler = serverless;

// 本地模拟调试
(async () => {
  if (!TENCENTCLOUD_RUNENV) {
    // 模拟参数
    let event = {
      Type: 'Timer',
      TriggerName: 'EveryDay',
      Time: new Date().toISOString(),
      Message: 'user define msg body'
    };
    let context = {};

    process.env.TENCENTCLOUD_REGION = 'ap-guangzhou'; // 随便选区域填，例如这里使用广州区域
    process.env.TENCENTCLOUD_SECRETID = ''; // 填写具体的SecretId
    process.env.TENCENTCLOUD_SECRETKEY = ''; // 填写具体的SecretKey

    // 非Serverless环境，本地执行
    serverless(event, context);
  }
})();
