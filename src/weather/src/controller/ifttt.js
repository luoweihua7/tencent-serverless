const template = require('lodash/template');
const IFTTTService = require('../services/ifttt');
const { SERVICES: { ifttt: conf = {} } = {} } = require('../config');
const { isPlainObject } = require('lodash');

class IFTTT {
  constructor() {
    if (isPlainObject(conf)) {
      console.log(`未配置IFTTT通知参数，跳过`);
      return;
    }

    this.ifttt = new IFTTTService({
      key: conf.key,
      webhook: conf.webhook,
      value1: conf.title,
      value3: conf.icon
    });

    this.notification = template(conf.notification);
    this.alert = template(conf.alert);
  }

  /**
   * 通过IFTTT服务发送推送消息
   * @param {string} text 需要发送的消息内容
   */
  async send(text = '') {
    if (!this.ifttt) return;

    // notification 的Webhook，第二个参数是通知内容，第一个和第三个参数由config配置
    console.log(`IFTTT发送：${text}`);
    await this.ifttt.send({ value2: text });
  }

  /**
   * 发送天气预报信息
   * @param {object} data 天气预报对象
   */
  async sendNotification(data) {
    if (!this.notification) return;

    let notification = this.notification(data);
    return this.send(notification);
  }

  /**
   * 发送天气预警信息
   * @param {object} data 天气预警对象
   */
  async sendAlert(data) {
    if (!this.alert) return;

    let alert = this.alert(data);
    return this.send(alert);
  }
}

module.exports = new IFTTT();
