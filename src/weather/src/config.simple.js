module.exports = {
  // AccuWeather配置
  ACCUWEATHER: {
    apiKey: '配置你自己的apiKey',
    locationKey: '58194', // 城市ID，在 https://m.accuweather.com 中搜索你想要的城市，并在url链接中获取到城市ID
    timezone: 'Asia/Shanghai', // 时区，这里可以不改
    days: 3 // 预报几天，可选3，5，7天
  },

  // 存储，使用函数配置存储会有问题
  // 用于保存已经通知过的预警，否则会一直通知
  REDIS: {
    host: '10.0.0.100', // Redis的地址，可以是IP，也可以是域名
    port: '6379', // 端口，按照实际修改即可
    password: 'abcdefg1234567' // Redis密码，强烈建议设置长一点的密码
  },

  IFTTT: {
    notification: {
      key: 'xxxxxxxxxx', // IFTTT通知的KEY，在 https://ifttt.com/maker_webhooks 右上角的 Document 按钮获取
      webhook: 'weather', // IFTTT的Webhook名，请按照实际填写
      title: '天气通知',
      icon: 'https://i.loli.net/2020/01/10/ZiEQzbLFSmoag3O.png',
      template: [
        // 天气通知
        '${city}${weather}，温度${temperature}度',
        '今天${forecasts[0].weather}，气温${forecasts[0].temperature}度',
        '明天${forecasts[1].weather}，气温${forecasts[1].temperature}度',
        '后天${forecasts[2].weather}，气温${forecasts[2].temperature}度'
      ].join('，'),
      cron: '* 0 9,21 * * *' // 每天的9点和21点通知
    },
    alert: {
      key: 'xxxxxxxxxx', // IFTTT通知的KEY，在 https://ifttt.com/maker_webhooks 右上角的 Document 按钮获取
      webhook: 'weather', // IFTTT的Webhook名，请按照实际填写
      title: '天气通知',
      icon: 'https://i.loli.net/2020/01/10/ZiEQzbLFSmoag3O.png',
      template: '${summary}',
      cron: '* * * * * *' // 每次执行，如果有都通知
    }
  },
  SMS: {
    notification: {
      Sign: '你自己的签名内容', // 在 https://console.cloud.tencent.com/smsv2/csms-sign 创建并获取，注意这里是用的是“内容”字段
      TemplateID: '1000000', // 在 https://console.cloud.tencent.com/smsv2/csms-template 创建并获取
      SmsSdkAppid: '111111', // 在 https://console.cloud.tencent.com/smsv2/app-manage 创建并获取
      PhoneNumberSet: ['13800138000'], // 手机号码，暂时只支持国内手机号，不需要+86
      // 注意每个变量取值最多支持12个字
      // 例如，这里创建的短信模板为：{1}{2}，温度{3}。明天{4}，{5}度，后天{6}，{7}度，大后天{8}，{9}度
      TemplateParamSet: [
        '${city}', // 对应 {1}
        '${weather}', // 对应 {2} ,下同
        '${temperature}',
        '${forecasts[0].weather}',
        '${forecasts[0].temperature}',
        '${forecasts[1].weather}',
        '${forecasts[1].temperature}',
        '${forecasts[2].weather}',
        '${forecasts[2].temperature}'
      ],
      cron: '* 0 9,21 * * *' // 每天的9点和21点通知
    },
    alert: {
      Sign: '你自己的签名内容',
      TemplateID: '20000',
      SmsSdkAppid: '22222',
      PhoneNumberSet: ['13800138000'],
      // 例如，这里创建的短信模板为：{1}发布{2}的{3}
      TemplateParamSet: ['${city}', '${level}', '${alert}'],
      cron: '* * * * * *' // 每次执行，如果有都通知
    }
  }
};
