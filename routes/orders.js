var express = require('express');
var router = express.Router();
var mid = require('../lib/middleware');
const weixin = require('../lib/pay');
const moment = require('moment');
const xml2js = require('xml2js');
const xmlBuilder = new xml2js.Builder({
  rootName: 'xml'
});

//model
var Order = require('../Models/order')
var User = require('../Models/usersInfo')


global.wss.on('connection', function (ws) {
  console.log('client connected')

  var sendStockUpdates = async function (ws) {
      if (ws.readyState == 1) {
        let result = await Order.find({})
        ws.send(JSON.stringify(result))
      }
  }

  var clientStockUpdater = setInterval(function () {
      sendStockUpdates(ws);
  }, 1000*30);


  ws.on('message', function (message) {
      console.log(message)
  })

})

// 获取所有的订单
router.get('/', async function(req, res, next) {
  let result = await Order.find({payStatus: true})
  res.send(result)
})

// 查询用户订单
router.get('/find', async function(req, res, next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  if(!appid) {
    res.json({errMsg: "sessionkey not found"});
    return;
  }
  let result = await Order.find({openId: appid, payStatus: true})
  res.send(result)
})

async function submitOrder(data) {
  let {orderTime, createTime, orderStatus, server, price, name, phoneNumber, address, appid, tradeId} = data;
  const notify_url = 'https://www.renwuming.cn/maidu/orders/notify';
  var order = {
    body: `脉度良子 - ${server}`,
    attach: server,
    openid: appid,
    out_trade_no: tradeId,
    total_fee: toCents(data.price),
    trade_type: 'JSAPI',
    spbill_create_ip: '127.0.0.1',
    notify_url,
  };

  var _order = await weixin.pay.unifiedOrder(order);

  if (_order.return_code == 'SUCCESS' && _order.result_code == 'SUCCESS') {
    // 订单存入数据库
    saveOrder(data, false);

    var jsPay = weixin.pay.toJsPay(_order);

    return {
      success: true,
      jsPay: jsPay,
    };
  } else {
    return {
      success: false,
      msg: _order.return_code == 'SUCCESS' ? _order.err_code_des : _order.return_msg
    };
  }
}

function saveOrder(data, payStatus) {
  data.payStatus = payStatus;
  var oneOrder = new Order({
    ...data,
    openId: data.appid,
  })
  oneOrder.save((err)=>{
    if(err) {
      console.log(err);
    }
  });
}

function toCents(n) {
  return parseInt(n*100);
}

function toYuan(n) {
  return parseFloat(n/100);
}


//添加订单
router.post('/', async function (req, res, next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  if(!appid) {
    res.json({errMsg: "sessionkey not found"});
    return;
  }
  let msg;
  try {
    const tradeId = 'PM' + moment().format('YYYYMMDDHHmmssSSS');
    let data = {...req.body, tradeId, appid},
        userInfo = await User.findOne({appid}),
        {price} = data;
    if(userInfo&&userInfo.money >= price) { // 余额支付
      await User.update({ appid }, { "$inc": {money: -price } });
      saveOrder(data, true);
      msg = {
        success: true,
        balancePay: true,
      }
    } else { // 调起支付
      msg = await submitOrder(data);
    }
  } catch(e) {
    console.log(e);
    res.send({error: e});
    return;
  }
  res.send(msg);
});

// 充3000送200
function handleRecharge(value) {
  if(value >= 3000 ) return value + 200;
  else return value;
}


router.post('/notify', async function (req, res, next) {
    const data = req.body,
        {xml} = data;

    // 若成功收到回调消息
    if (xml && xml.return_code == 'SUCCESS') {
      let {result_code, sign, out_trade_no, attach, openid, total_fee} = xml;
        delete xml.sign;
        var _sign = weixin.sign.build(xml);
        // 若签名校验成功
        if (sign == _sign) {
            // 若支付成功
            if(result_code == 'SUCCESS'){
              // 更新数据库
              try {
                await Order.update({ tradeId: out_trade_no[0] }, { payStatus: true });
                if(attach == 'recharge') {
                  const value = handleRecharge(toYuan(total_fee));
                  await User.update({ appid: openid }, { "$inc": {money: value } });
                }
              } catch(e) {
                console.log(e);
              }
            }

            const result = {
                return_code: 'SUCCESS',
                return_msg: 'OK'
            };
            const xml = xmlBuilder.buildObject(result);
            console.log('支付回调返回成功');
            res.send(xml);
        } else {
            // 若签名校验失败
            const result = {
                return_code: 'FAIL',
                return_msg: '签名失败'
            };
            const xml = xmlBuilder.buildObject(result);
            console.log('支付回调返回失败');
            res.send(xml);
        }
    }
});


// 更改订单的状态
router.put('/', async function(req, res, next) {
  let resdata = await Order.update(req.body, { orderStatus: true })
  res.send(resdata)
})

module.exports = router;
