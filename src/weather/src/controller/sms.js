const template = require('lodash/template');
const SMSService = require('../services/sms');
const {
  SERVICES: { sms: { notification: notificationConf = {}, alert: alertConf = {} } = {} } = {}
} = require('../config');

class SMS {
  constructor({ secretId, secretKey, token, region } = {}) {
    // process.env上的云函数环境变量如 TENCENTCLOUD_SECRETID 是在调用入口函数之前动态挂载上去的
    // 在这里初始化时直接init获取不到，除非显式传入参数
    // token非必选，但如果使用SCF运行角色时，必须传入

    if (secretId && secretKey && region) {
      this.init({ secretId, secretKey, token, region });
    }
  }

  /**
   * 初始化短信实例
   * @param {object} param0 初始化参数
   */
  init({ secretId, secretKey, token, region } = {}) {
    // 判断实例是否初始化，原因见constructor
    if (this.sms) return;

    // 为了本地调试时，可以先设置process.env环境变量后调用init重新初始化实例
    const { env } = process;
    const options = {
      secretId: secretId || env.TENCENTCLOUD_SECRETID,
      secretKey: secretKey || env.TENCENTCLOUD_SECRETKEY,
      token: token || env.TENCENTCLOUD_SESSIONTOKEN,
      region: region || env.TENCENTCLOUD_REGION
    };

    // 通过一次初始化后的同一个实例，实现不同短信模板发送的目的
    this.sms = new SMSService(options);
  }

  /**
   * 发送天气通知
   * @param {object} param0 请求参数
   */
  async sendNotification({ city, weather, temperature, forecasts, summary }) {
    if (Object.keys(notificationConf).length === 0) {
      console.log(`未配置短信通知参数，跳过`);
      return { code: 0, message: 'config not found' };
    }

    let { SmsSdkAppid, TemplateID, Sign, PhoneNumberSet, TemplateParamSet } = notificationConf;

    // 对短信内容进行模板格式化
    TemplateParamSet = TemplateParamSet.map((content) => {
      let compiled = template(content);
      return compiled({ city, weather, temperature, forecasts, summary });
    });

    this.init();
    return await this.sms.send({ SmsSdkAppid, Sign, TemplateID, PhoneNumberSet, TemplateParamSet });
  }

  async sendAlert({ id, city, level, source, alert, text, summary }) {
    if (Object.keys(alertConf).length === 0) {
      console.log(`未配置短信预警参数，跳过`);
      return { code: 0, message: 'config not found' };
    }

    let { SmsSdkAppid, TemplateID, Sign, PhoneNumberSet, TemplateParamSet } = alertConf;

    // 对短信内容进行模板格式化
    TemplateParamSet = TemplateParamSet.map((content) => {
      let compiled = template(content);
      return compiled({ id, city, level, source, alert, text, summary });
    });

    this.init();
    return await this.sms.send({ SmsSdkAppid, Sign, TemplateID, PhoneNumberSet, TemplateParamSet });
  }
}

module.exports = new SMS();
