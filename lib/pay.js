'use strict';

var Promise = require('bluebird');
var https = require('https');
var URL = require('url');
var extend = require('node.extend');
var xml2js = require('xml2js');
var md5 = require('MD5');
var moment = require('moment');
const config = require('./config');

var weixin = (function() {

  return {
    config: config,

    unified_order_url: 'https://api.mch.weixin.qq.com/pay/unifiedorder'
  };
})();

weixin.getOpenId = function(req, res, next) {
  var code = req.param('code');
  var full_url = req.protocol + '://' + req.get('host') +req.baseUrl+ req.path;
  var wx_auth_url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + weixin.config.AppID + '&redirect_uri=' + encodeURIComponent(full_url) + '&response_type=code&scope=snsapi_base&state=123&connect_redirect=1#wechat_redirect';
  if (!code) {
    res.redirect(wx_auth_url);
  } else {
    getWxOpenId(code).then(function(openId) {
      req.wx = {
        openId: openId
      };
      next();
    }).catch(function(e) {
      console.log('获取微信OpenId失败', e);
      res.redirect(wx_auth_url);
    });
  }
};

var getWxOpenId = new Promise.method(function(code) {
  return new Promise(function(resolve, reject) {
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + weixin.config.AppID + '&secret=' + weixin.config.APPSECRET + '&code=' + code + '&grant_type=authorization_code';
    https.get(url, function(r) {
      r.setEncoding('utf8');
      r.on('data', function(d) {
        var data = JSON.parse(d);
        if (data.errcode) {
          console.log(data);
          reject(data);
        } else {
          var openId = data.openid;
          resolve(openId);
        }
      });
    });
  });
});

var wx_post_xml = new Promise.method(function(url, data) {
  return new Promise(function(resolve, reject) {
    var options = URL.parse(url);
    options.method = 'POST';
    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    };
    var post = https.request(options, function(r) {
      r.setEncoding('utf8');
      r.on('data', function(d) {
        console.log(d);
        var xmlParser = new xml2js.Parser({
          trim: true,
          explicitArray: false
        });
        xmlParser.parseString(d, function(err, result) {
          resolve(result.xml);
        });
      });
    });
    post.on('error', function(err) {
      console.error('ERROR failed to login into website');
      reject(err);
    });
    post.write(data);
    post.end();
  });
});


weixin.pay = {
  unifiedOrder: function(data) {
    var unifiedOrder = {
      appid: weixin.config.AppID,
      mch_id: weixin.config.MCHID,
      nonce_str: weixin.sign.nonceStr()
    };
    var order = extend(unifiedOrder, data);
    order.sign = weixin.sign.build(order);
    var xmlBuilder = new xml2js.Builder({
      rootName: 'xml'
    });
    var xml = xmlBuilder.buildObject(order);
    console.log(xml);
    // return xml;
    return wx_post_xml(weixin.unified_order_url, xml);
  },
  toJsPay: function(unifiedOrder) {
    if (unifiedOrder.hasOwnProperty('appid') && unifiedOrder.hasOwnProperty('prepay_id') && unifiedOrder.prepay_id != '') {
      var jsPay = {
        appId: unifiedOrder.appid,
        timeStamp : moment().unix().toString(),
        nonceStr: weixin.sign.nonceStr(),
        signType: 'MD5',
        package: 'prepay_id='+unifiedOrder.prepay_id
      };
      jsPay.paySign = weixin.sign.build(jsPay);
      return jsPay;
    } else {
      console.error('统一下单转jsPay错误', unifiedOrder);
      return {};
    }
  },
  notify: function(req, res, next) {
    var xmlParser = new xml2js.Parser();
    var xml = req.body;
    xmlParser.parseString(xml, function(err, result) {
      req.wx = result.xml;
      next();
    });
  }
};

weixin.sign = {
  nonceStr: function() {
    return Math.random().toString(36).substr(2, 15);
  },
  build: function(data) {
    var args = this.toSorted(data);
    args += "&key=" + weixin.config.PAYKEY;
    return md5(args).toUpperCase();
  },
  toSorted: function(args) {
    var keys = Object.keys(args);
    keys = keys.sort()
    var newArgs = {};
    keys.forEach(function(key) {
      newArgs[key] = args[key];
    });

    var string = '';
    for (var k in newArgs) {
      string += '&' + k + '=' + newArgs[k];
    }
    string = string.substr(1);
    return string;
  }
};

module.exports = weixin;