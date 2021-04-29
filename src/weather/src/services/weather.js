const Axios = require('axios');
const moment = require('moment-timezone');

class Weather {
  /**
   * AccuWeather
   * @param {object} options 初始化参数
   * @param {string} options.apiKey ApiKey
   * @param {string} options.locationKey 城市ID
   * @param {string} [params.language] 语言，默认为 zh-CN. https://developer.accuweather.com/localizations-by-language
   * @param {string|object} [params.proxy] 代理配置
   * @param {number} [parms.timeout] 超时时间，单位为毫秒，默认5000
   */
  constructor({ apiKey, locationKey, language = 'zh-CN', proxy, timeout = 5 * 1000, timezone }) {
    if (!apiKey) {
      throw new Error(`[AccuWeather] 参数apiKey不能为空`);
    }

    if (!locationKey) {
      throw new Error(`[AccuWeather] 参数locationKey不能为空`);
    }

    this.locationKey = locationKey;
    this.timezone = timezone;

    let instance = Axios.create({
      baseURL: 'http://api.accuweather.com/',
      timeout
    });

    // 使用实例拦截器添加必须的URLSearchParams
    instance.interceptors.request.use((config) => {
      config.proxy = proxy;
      config.params = {
        language: language,
        metric: true,
        apiKey,
        details: true
      };
      return config;
    });

    this.axios = instance;
  }

  /**
   * 获取城市的天气基本信息
   */
  async currentConditions() {
    let [data] = await this._currentConditions();
    let today = {
      lastupdate: moment(data.EpochTime * 1000) // 最后更新时间
        .tz(this.timezone)
        .format('YYYY-MM-DD HH:mm:ss'),
      icon: data.WeatherIcon, // 天气图标
      temperature: `${Math.round(data.Temperature.Metric.Value)}`, // 温度
      weather: data.WeatherText // 天气描述
    };

    return today;
  }

  /**
   * 获取城市的天气预报信息，默认为5天
   */
  async forecasts() {
    let hour = new Date().getHours();
    let { DailyForecasts: days } = await this._forecasts();

    // 转换
    let _forecasts = days.map(({ Day: day, Night: night, Temperature: temperature, EpochDate: datetime }) => {
      let minTemp = Math.round(temperature.Minimum.Value);
      let maxTemp = Math.round(temperature.Maximum.Value);

      if (temperature.Minimum.Unit === 'F') {
        minTemp = f2c(minTemp);
      }
      if (temperature.Maximum.Unit === 'F') {
        maxTemp = f2c(maxTemp);
      }

      let info = 6 < hour && hour < 18 ? day : night;

      return {
        datetime: datetime * 1000, // 时间
        date: moment(datetime * 1000) // 时间，格式化后
          .tz(this.timezone)
          .format('YYYY-MM-DD'),
        icon: info.Icon, // 天气图标
        weather: info.IconPhrase, // 天气描述
        temperature: `${minTemp}~${maxTemp}` // 温度范围
      };
    });

    return _forecasts;
  }

  /**
   * 获取城市位置信息
   */
  async locations() {
    let data = await this._locations();

    let _location = {
      id: data.Key, // 城市ID
      city: data.LocalizedName, // 城市名
      region: data.Region.LocalizedName, // 大洲
      country: data.Country.LocalizedName, // 国家
      province: data.AdministrativeArea.LocalizedName // 省份
    };

    return _location;
  }

  /**
   * 获取城市天气预警信息
   */
  async alerts() {
    let _alerts = await this._alerts();
    let alertList = [];

    if (Array.isArray(_alerts)) {
      alertList = _alerts
        .map((alert) => {
          return {
            id: Number(alert.AlertID), // 告警ID，例如10000
            city: alert.Area && alert.Area[0] && alert.Area[0].Name, // 城区：深圳市
            level: alert.Level, // 告警等级，一般为红色，橙色等几种
            source: alert.Source, // 来源，例如国家预警信息发布中心
            alert: alert.Description.Localized, // 预警，例如大风蓝色预警
            text: alert.Area && alert.Area[0] && alert.Area[0].Text, // 完整的告警信息: 预计3月19日12时01分起，利州区、朝天区、昭化区24小时内可能受大风影响,平均风力可达6级以上或者阵风7级以上。
            summary: alert.Area && alert.Area[0] && alert.Area[0].Summary // 完整的告警信息: 大风蓝色预警 生效，持续时间至 星期六，12:01下午 CST。来源：国家预警信息发布中心
          };
        })
        .sort((a, b) => a.id - b.id);
    }

    return alertList;
  }

  /**
   * 获取当前位置的基本天气信息
   */
  async _currentConditions() {
    let { data } = await this.axios.get(`currentconditions/v1/${this.locationKey}.json`);
    return data;
  }

  /**
   * 获取days天数的天气预报信息
   * @param {number}} days 天数，支持3/5/7
   */
  async _forecasts(days = 5) {
    let num = [3, 5, 7].includes(days) ? days : 5;
    let { data } = await this.axios.get(`forecasts/v1/daily/${num}day/${this.locationKey}`);
    return data;
  }

  /**
   * 通过城市ID获取当前的位置信息
   */
  async _locations() {
    let { data } = await this.axios.get(`locations/v1/${this.locationKey}`);
    return data;
  }

  /**
   * 获取天气预警信息
   */
  async _alerts() {
    let { data } = await this.axios.get(`alerts/v1/${this.locationKey}`);
    return data;
  }
}

module.exports = Weather;
