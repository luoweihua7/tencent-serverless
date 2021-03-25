const axios = require('axios');

module.exports = class IFTTT {
  constructor({ key, webhook, value1, value2, value3 }) {
    if (!key) {
      throw new Error(`[IFTTT] 参数key不能为空`);
    }

    if (!webhook) {
      throw new Error(`[IFTTT] 参数webhook不能为空`);
    }

    this.requestUrl = `https://maker.ifttt.com/trigger/${webhook}/with/key/${key}`;
    this.defaults = { value1, value2, value3 };
  }

  async send({ value1, value2, value3 } = {}) {
    let opts = JSON.parse(JSON.stringify({ value1, value2, value3 })); // 去掉无效的undefined字段
    let params = { ...this.defaults, ...opts };

    let { data } = await axios.post(this.requestUrl, params);
    return data;
  }
};
