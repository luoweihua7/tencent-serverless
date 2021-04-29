const { TENCENTCLOUD_RUNENV } = process.env;
const AccuWeather = require('./controller/accuweather');
const { ACCUWEATHER: weather, REDIS: redis, IFTTT: ifttt = {}, SMS: sms = {} } = require('./config');

const serverless = async (event, context, callback) => {
  const accuweather = new AccuWeather({ weather, redis, ifttt, sms, env: process.env });

  await accuweather.forecasts();
  await accuweather.alert();

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
    process.env.TENCENTCLOUD_SESSIONTOKEN = ''; // 本地只需要填ID和KEY即可

    console.log(`本地环境测试`);

    // 非Serverless环境，本地执行
    serverless(event, context);
  }
})();
