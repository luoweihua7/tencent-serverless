const moment = require('moment-timezone');

module.exports = {
  /**
   * 获取当前时间的字符串
   * @param {string} fmt 时间格式，支持moment的所有格式
   */
  now(fmt = 'YYYY-MM-DD HH:mm:ss', tz = 'Asia/Shanghai') {
    return moment().tz(tz).format(fmt);
  },
  /**
   * 按照指定的时间格式，格式化时间
   * @param {Date} date 时间
   * @param {string} fmt 时间格式，支持moment的所有格式
   */
  formatDate(date = new Date(), fmt = 'YYYY-MM-DD HH:mm:ss', tz = 'Asia/Shanghai') {
    return moment(date.getTime()).tz(tz).format(fmt);
  }
};
