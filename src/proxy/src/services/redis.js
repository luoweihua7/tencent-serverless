const Redis = require('ioredis');

class RedisStore {
  constructor({
    host,
    port,
    password,
    lazyConnect = true,
    maxRetriesPerRequest = 3,
    connectTimeout = 300,
    expire = 0
  }) {
    this.redis = new Redis({
      host,
      port,
      password,
      lazyConnect,
      maxRetriesPerRequest,
      connectTimeout // ioredis默认超时10s
    });
    this._key = 'ProxyFunc';
    this.expire = expire;
  }

  /**
   * 获取最后保存的预警ID列表
   */
  async hget(key) {
    try {
      // 取最后10条，如果告警超过10条将会有重复通知的情况
      await this.tryConnect();
      let value = await this.redis.hget(this._key, key);

      return value;
    } catch (e) {
      return;
    }
  }

  async hset(url, value) {
    try {
      await this.tryConnect();
      await this.redis.hset(this._key, url, value);

      // 设置过期时间
      if (this.expire) {
        await this.redis.expire(this._key, this.expire);
      }
    } catch (e) {}
  }

  /**
   * 如果redis连接未就绪，则尝试重连
   */
  async tryConnect() {
    if (this.redis && this.redis.status !== 'ready') {
      console.log(`Redis 连接未就绪 [${this.redis.status}]，尝试重连`);

      try {
        await this.redis.connect();
      } catch (e) {}

      console.log(`Redis 重连完成 [${this.redis.status}]`);
    }
  }

  async quit() {
    return await this.redis.quit();
  }
}

module.exports = RedisStore;
