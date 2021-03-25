module.exports = {
  /**
   * 华氏度转摄氏度
   * @param {number} fahrenheit 华氏度
   */
  f2c(fahrenheit) {
    return Math.round((fahrenheit - 32) / 1.8);
  },
  /**
   * 摄氏度转华氏度
   * @param {number} celsius 摄氏度
   */
  c2f(celsius) {
    return Math.round(1.8 * celsius + 32);
  }
};
