const AccuWeatherService = require('../services/accuweather');
const redis = require('./redis');
const { ACCUWEATHER } = require('../config');

class AccuWeather {
  constructor() {
    this.weather = new AccuWeatherService(ACCUWEATHER);
  }

  /**
   * 天气预报
   */
  async forecast() {
    let [currentConditions, _forecasts, locations] = await Promise.all([
      this.weather.currentConditions(),
      this.weather.forecasts(),
      this.weather.locations()
    ]);

    // 信息处理
    let { city } = locations;
    let { weather, temperature } = currentConditions;
    let days = Math.max(ACCUWEATHER.days || 0, 1) || 3; // 预报天数，默认3天
    let forecasts = [];
    let _nextdays = _forecasts
      .filter((day, index) => index < days)
      .map((day) => {
        let _day = day.date.split('-').pop();
        forecasts.push({
          day: _day,
          weather: day.weather,
          temperature: day.temperature
        });
        return `${day.date.split('-').pop()}号${day.weather}, 气温${day.temperature}度`;
      })
      .join('\n');

    // 组装
    let summary = `${city}${weather}, 温度${temperature}度\n${_nextdays}`;

    // 返回可选信息，按需使用
    return {
      city,
      weather,
      temperature,
      forecasts,
      summary
    };
  }

  /**
   * 天气预警
   * @param {boolean} filter 是否过滤已发送的预警，默认为true
   */
  async alerts(filter = true) {
    let alerts = await this.weather.alerts();

    // 根据条件，决定是否处理已经通知过的预警
    if (filter) {
      try {
        let sentList = await redis.getAlerts();
        let sentIdList = [];
        let sentSummaryList = [];

        sentList.forEach(({ id, summary } = {}) => {
          sentIdList.push(Number(id));
          sentSummaryList.push(summary);
        });

        alerts = alerts.filter(({ id, summary } = {}) => {
          if (!sentIdList.includes(id) && !sentSummaryList.includes(summary)) {
            // 未包含已经通知过的AlertID，以及预警信息文本也没有通知过
            // 注：这里AccuWeather返回的预警信息中，会出现预警文本Summary相同，而AlertID会不同
            console.log(`新预警：AlertID=${id}，Summary=${summary}`);
            return true;
          } else {
            console.log(`过滤已通知预警：AlertID=${id}，Summary=${summary}`);
            return false;
          }
        });
      } catch (e) {
        console.log(`获取已发送记录失败：${e.message}`);
      }
    }

    return alerts;
  }
}

module.exports = new AccuWeather();
