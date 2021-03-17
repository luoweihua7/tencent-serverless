const get = require('lodash/get');
const axios = require('axios');
const RedisService = require('./services/redis');
// const cos = require('./services/cos');
const { proxies, cache: { redis: redisConfig = {}, cos: cosConfig = {} } = {} } = require('./config');

const { TENCENTCLOUD_RUNENV: isServerlessRun } = process.env;

const serverless = async (event, context, callback) => {
  console.log(`UA头`, event.headers['user-agent']);
  let { key } = event.queryString || {};
  let response = {
    isBase64: false,
    statusCode: 404,
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    body: ''
  };

  if (key) {
    let url = get(proxies, key, '');

    if (url) {
      let { status, data, headers = {} } = await axios.get(url);

      console.log(`${key}请求状态为`, status);

      response.statusCode = status;
      response.body = data;
      response.headers = {
        'Content-Type': headers['Content-Type'] || 'text/plain; charset=UTF-8'
      };

      // 如果有配置缓存存储，则写入到缓存
      let redis = new RedisService(redisConfig);
      redis.hset(url, data);
    }
  }

  return response;
};

// Serverless 入口
exports.main_handler = serverless;

// 本地模拟调试
(async () => {
  if (!isServerlessRun) {
    // 模拟参数
    let event = {
      queryString: { key: 'iplc.clash.sz' },
      headers: { 'user-agent': 'Local Debug' }
    };
    let context = {};

    // 非Serverless环境，本地执行
    let ret = await serverless(event, context);
    console.log(`返回结果`, ret);
  }
})();
