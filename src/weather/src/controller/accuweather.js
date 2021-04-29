const template = require('lodash/template');

const Weather = require('../services/weather');
const Redis = require('../services/redis');
const IFTTT = require('../services/ifttt');
const SMS = require('../services/sms');

const { date, string } = require('../utils');
const { sms } = require('tencentcloud-sdk-nodejs');

class AccuWeather {
  constructor({ weather, redis, ifttt, sms, env = process.env }) {
    this.redis = new Redis(redis);
    this.weather = new Weather(weather);

    this.options = { weather, redis, ifttt, sms, env };
  }

  async _forecasts() {
    let [currentConditions, _forecasts, locations] = await Promise.all([
      this.weather.currentConditions(),
      this.weather.forecasts(),
      this.weather.locations()
    ]);

    let { city } = locations;
    let { weather, temperature } = currentConditions;
    let days = 3; // 默认3天，可选3，5，7天
    let forecasts = [];
    let _nextdays = _forecasts
      .filter((day, index) => index < days)
      .map((d) => {
        let day = d.date.split('-').pop();
        forecasts.push({
          day,
          weather: d.weather,
          temperature: d.temperature
        });
        return `${d.date.split('-').pop()}号${d.weather}, 气温${d.temperature}度`;
      })
      .join('\n');

    // 返回可选信息，按需使用
    return {
      city,
      weather,
      temperature,
      forecasts,
      summary: `${city}${weather}, 温度${temperature}度\n${_nextdays}`
    };
  }

  async forecasts() {
    const {
      ifttt: { notification: iftttCfg = {} },
      sms: { notification: smsCfg = {} },
      env
    } = this.options;
    // 获取天气数据
    const { city, weather, temperature, forecasts, summary } = await this._forecasts();
    console.log(`天气情况：${summary.replace(/\n/g, '；')}`);

    // IFTTT 通知
    if (iftttCfg.key && iftttCfg.webhook && date.matchCron(iftttCfg.cron)) {
      const ifttt = new IFTTT(iftttCfg);
      const content = template(iftttCfg.template)({ city, weather, temperature, forecasts, summary });
      let iftttRet = await ifttt.send({ title: iftttCfg.title, content, icon: iftttCfg.icon });

      console.log(`IFTTT通知发送结果: ${JSON.stringify(iftttRet)}`);
    }

    // SMS 通知
    const { Sign, TemplateID, SmsSdkAppid, PhoneNumberSet, TemplateParamSet, cron: smsCron } = smsCfg;
    if (Sign && TemplateID && SmsSdkAppid && PhoneNumberSet && TemplateParamSet && date.matchCron(smsCfg.cron)) {
      const {
        TENCENTCLOUD_SECRETID: secretId,
        TENCENTCLOUD_SECRETKEY: secretKey,
        TENCENTCLOUD_REGION: region,
        TENCENTCLOUD_SESSIONTOKEN: token
      } = env;
      const sms = new SMS({ secretId, secretKey, token, region });
      const params = {
        Sign,
        TemplateID,
        SmsSdkAppid,
        PhoneNumberSet,
        TemplateParamSet: TemplateParamSet.map((item) => {
          return template(item)({ city, weather, temperature, forecasts, summary });
        })
      };

      const smsRet = await sms.send(params);
      console.log(`天气通知发送结果: ${JSON.stringify(smsRet)}`);
    }
  }

  async _alert() {
    const { locationKey } = this.options.weather;
    let alerts = await this.weather.alerts();

    try {
      const sentAlerts = await this.redis.getAlerts(locationKey);
      let sentIdList = [];
      let sentSummaryList = [];

      sentAlerts.forEach(({ id, summary } = {}) => {
        sentIdList.push(Number(id));
        sentSummaryList.push(summary);
      });

      alerts = alerts.filter(({ id, summary } = {}) => {
        if (!sentIdList.includes(id) && !sentSummaryList.includes(summary)) {
          // 未包含已经通知过的AlertID，以及预警信息文本也没有通知过
          // 注：这里AccuWeather返回的预警信息中，会出现预警文本Summary相同，而AlertID会不同
          console.log(`新预警：AlertID=${id}，Summary=${summary}`);
          return true;
        } else {
          console.log(`过滤已通知预警：AlertID=${id}，Summary=${summary}`);
          return false;
        }
      });

      // 将新预警写入到存储
      await this.redis.setAlerts(locationKey, alerts);
    } catch (e) {
      console.log(`获取或处理已发送记录失败：${e.message}`);
    }
    await this.redis.quit();

    return alerts;
  }

  async alert() {
    const { ifttt = {}, sms = {}, env } = this.options;
    const { alert: iftttCfg = {} } = ifttt;
    const { alert: smsCfg = {} } = sms;
    const alerts = await this._alert();

    // IFTTT 通知
    if (iftttCfg.key && iftttCfg.webhook && date.matchCron(iftttCfg.cron)) {
      const ifttt = new IFTTT(iftttCfg);
      const compiled = template(iftttCfg.template);

      let promises = alerts.map(async ({ id, city, level, source, alert, text, summary } = {}) => {
        const content = compiled({ id, city, level, source, alert, text, summary });
        return await ifttt.send({ title: iftttCfg.title, content, icon: iftttCfg.icon });
      });

      await Promise.all(promises);
    }

    // SMS 通知
    const { Sign, TemplateID, SmsSdkAppid, PhoneNumberSet, TemplateParamSet, cron: smsCron } = smsCfg;
    if (Sign && TemplateID && SmsSdkAppid && PhoneNumberSet && TemplateParamSet && date.matchCron(smsCron)) {
      const {
        TENCENTCLOUD_SECRETID: secretId,
        TENCENTCLOUD_SECRETKEY: secretKey,
        TENCENTCLOUD_REGION: region,
        TENCENTCLOUD_SESSIONTOKEN: token
      } = env;
      const sms = new SMS({ secretId, secretKey, token, region });
      const defaults = { Sign, TemplateID, SmsSdkAppid, PhoneNumberSet };
      const compiles = TemplateParamSet.map((item) => template(item));

      let promises = alerts.map(async ({ id, city, level, source, alert, text, summary } = {}) => {
        const params = {
          ...defaults,
          TemplateParamSet: compiles.map((tpl) => tpl({ id, city, level, source, alert, text, summary }))
        };
        return await sms.send(params);
      });

      await Promise.all(promises);
    }
  }
}

module.exports = AccuWeather;
