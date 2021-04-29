## 腾讯云函数 - 天气预报
腾讯云下Serverless的天气预报函数。

支持
- [x] 天气预警通知，可通过 `IFTTT` 和 `短信` 通知
- [x] 定时发送天气预报
- [x] 天气通知支持模板化


## 使用

从代码中复制 `config.simple.js` 一份，并改名为 `config.js`

### 天气服务配置
在AccuWeather配置内容中，按照实际情况配置apiKey和需要预报的城市
```js
  // AccuWeather配置
  ACCUWEATHER: {
    apiKey: '配置你自己的apiKey',
    locationKey: '58194', // 城市ID，在 https://m.accuweather.com 中搜索你想要的城市，并在url链接中获取到城市ID
    timezone: 'Asia/Shanghai', // 时区，这里可以不改
    days: 3 // 预报几天，可选3，5，7天
  },
```

### Redis配置
在STORE配置内容中，配置redis存储的信息，用于存储已经通知过的预警，否则预警可能会一直下发

```js
  // 存储，使用函数配置存储会有问题
  // 用于保存已经通知过的预警，否则会一直通知
  STORE: {
    host: '10.0.0.100', // Redis的地址，可以是IP，也可以是域名
    port: '6379', // 端口，按照实际修改即可
    password: 'abcdefg1234567' // Redis密码，强烈建议设置长一点的密码
  },
```

### 天气预报通知时间
在指定时间，获取天气信息并进行通知。修改 `IFTTT` 和 `SMS` 中的参数 `cron`，具体配置可参考 [这里](https://crontab.guru/)

### 需要通知的服务
这里暂时支持 IFTTT 的Webhook和短信，这2种通知方式，且需要在对应服务中，添加对应配置

```js
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
```

#### 天气预报参数
天气预报通知，支持参数如下，可使用字符串模板自主拼接
**注意**，短信通知时，每个参数只支持12个字（即summary尽量不要拼到短信通知中，会导致发送失败）

> `city` 城市名，例如“深圳”
> `weather` 天气情况，例如“阴天”
> `temperature` 当前温度，例如“28”，没有度
> `forecasts` 数组，预报情况。例如 `[{day: "18", weather: "多云", temperature: "20~28"}, {day: "19", weather: "多云转晴", temperature: "22~30"}]`
> `summary` 天气预报的描述情况，例如“深圳多云，温度28度，18号多云，气温20～28度，19号多云转晴，气温22～30度”

#### 天气预警参数
天气预警通知，支持参数如下，可使用字符串模板自主拼接
**注意**，短信通知时，每个参数只支持12个字（即text和summary参数尽量不要拼到短信通知中，会导致发送失败）

> `city` 城市名，例如“深圳”
> `level` 预警级别，例如“蓝色”
> `source` 发布来源，一般是“国家预警信息发布中心”
> `alert` 简单预警内容。例如“大风蓝色预警”
> `text` 预警的具体内容。例如“预计3月19日12时01分起，24小时内可能受大风影响,平均风力可达6级以上或者阵风7级以上”
> `summary` 具体的描述内容，例如“霾橙色预警 生效，持续时间至 星期二，10:00上午 CST。来源：国家预警信息发布中心”

## Serverless 函数配置
按照如上修改后，部署到腾讯云Serverless中，然后做如下配置
在函数的配置中，建议做如下修改
> 【基础配置】执行超时时间，建议修改时间长一些，例如10-25秒
> 【基础配置】内存建议设置为128M以上
> 【触发配置】创建定时触发器，并配置为每分钟一次（免费流量完全可以支撑一个月的使用量）

