module.exports = {
  /**
   * 对比2个字符串是否相等
   * 如果compare为undefined，或者与reference相同，则返回true
   * @param {string} reference 参照物
   * @param {string} compare 对比物，即需要对比的字符串
   * @returns {boolean}
   */
  isMatchOrUndefined(reference, compare) {
    if (typeof compare === 'undefined') {
      return true;
    }

    return String(reference) === String(compare);
  }
};
