const moment = require('moment-timezone');
const TimeMatcher = require('node-cron/src/time-matcher');

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
  },

  /**
   * 当前时间是否命中cron
   * @param {string} pattern 时间Cron，例如 "0 0 12 * * *" 表示每天的12点整
   */
  matchCron(pattern, tz = 'Asia/Shanghai') {
    if (!pattern) return false;

    const matcher = new TimeMatcher(pattern, tz);
    return matcher.match(new Date());
  }
};
