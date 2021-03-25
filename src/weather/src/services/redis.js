const Redis = require('ioredis');

class RedisStore {
  constructor({ host, port, password }) {
    this.redis = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 3000 // ioredis默认超时10s
    });
    this._key = 'Alerts';
  }

  /**
   * 获取最后保存的预警ID列表
   */
  async getAlerts(cityId) {
    let redisKey = `${this._key}-${cityId}`;

    // 取最后10条，如果告警超过10条将会有重复通知的情况
    await this.tryConnect();
    let list = await this.redis.lrange(redisKey, -10, -1);

    if (list && list.length > 0) {
      try {
        list = list.map((item) => JSON.parse(item));
      } catch (e) {
        console.error(`从Redis中获取数据后转换失败`, e.message);
        list = [];
      }
    }

    return list;
  }

  async setAlerts(cityId, alerts = []) {
    let redisKey = `${this._key}-${cityId}`;
    if (!Array.isArray(alerts)) {
      throw new Error(`预警信息列表类型错误`);
    }

    let list = alerts.map((item) => JSON.stringify(item));

    // 保留旧数据好了，不清理，否则可能会出现预警重复出现的情况
    // await this.redis.ltrim(redisKey, 1, 0) // 清理旧数据

    if (list.length > 0) {
      await this.tryConnect();
      await this.redis.rpush(redisKey, list); // 保存新数据
    }
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
    console.log(`Redis 关闭连接`);
    return await this.redis.quit();
  }
}

module.exports = RedisStore;
