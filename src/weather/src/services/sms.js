const TencentCloudSDK = require('tencentcloud-sdk-nodejs');

// 电话号码正则，简单处理
const phoneReg = /(^\+86\d{11})|^\d{11}/;

module.exports = class SMS {
  constructor({ secretId, secretKey, token, region }) {
    const SmsClient = TencentCloudSDK.sms.v20190711.Client;
    const smsConfig = {
      credential: { secretId, secretKey, token },
      region,
      profile: { httpProfile: { reqMethod: 'POST', reqTimeout: 10, endpoint: 'sms.tencentcloudapi.com' } }
    };
    let client = new SmsClient(smsConfig);

    // 短信实例
    this.client = client;
  }

  async send({ SmsSdkAppid, Sign, TemplateID, PhoneNumberSet: _PhoneNumberSet = [], TemplateParamSet = [] }) {
    // 号码需要以+86开头，统一处理并过滤不符合规则的号码
    const PhoneNumberSet = _PhoneNumberSet
      .map((phone = '') => {
        phone = phone.replace(/[^0-9+]+/g, '');
        if (phoneReg.test(String(phone))) {
          // 号码规则ok
          if (phone.length === 11) {
            return '+86' + phone;
          } else {
            return phone;
          }
        } else {
          // 返回空，后面过滤掉
          return '';
        }
      })
      .filter((phone) => phone);

    try {
      // 发送短信
      const params = { SmsSdkAppid, TemplateID, Sign, PhoneNumberSet, TemplateParamSet };
      let { SendStatusSet = [] } = await this.client.SendSms(params);

      // 遍历所有结果，获取发送结果：全部成功，部分成功，全部失败
      let data = { sentSet: [], failureSet: [] };
      SendStatusSet.forEach(({ Code, PhoneNumber, Message } = {}) => {
        let { sentSet, failureSet } = data;

        if (Code === 'Ok') {
          sentSet.push({ PhoneNumber, Code, Message });
        } else {
          console.log(`号码${PhoneNumber}发送失败，Message=${Message}`);
          failureSet.push({ PhoneNumber, Code, Message });
        }
      });

      const CODES = { ok: 0, partial: 1, failure: -1 };
      const MESSAGES = { ok: 'send success', partial: 'partial sent', failure: 'send failure' };
      let code, message;

      if (data.sentSet.length > 0) {
        if (data.failureSet.length === 0) {
          // 全部发送成功
          code = CODES.ok;
          message = MESSAGES.ok;
        } else {
          // 部分成功，部分失败
          code = CODES.partial;
          message = MESSAGES.partial;
        }
      } else {
        // 全部失败
        code = CODES.failure;
        message = MESSAGES.failure;
      }

      console.log(`短信发送：code=${code}，message=${message}`);
      return { code, message, data };
    } catch (e) {
      console.log(`发送短信异常`, e);
      return { code: -1, message: `error: ${e.message}` };
    }
  }
};
