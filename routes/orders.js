var express = require('express');
var router = express.Router();
var mid = require('../lib/middleware');
const weixin = require('../lib/pay');
const moment = require('moment');
const xmlBuilder = new xml2js.Builder({
  rootName: 'xml'
});

//model
var Order = require('../Models/order')


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
  let result = await Order.find({})
  res.send(result)
})

// 查询用户订单
router.get('/find', async function(req, res, next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  let result = await Order.find({openId: appid})
  res.send(result)
})

async function submitOrder(data) {
  let {orderTime, createTime, orderStatus, server, price, name, phoneNumber, address, appid} = data;
  const _tradeId = 'PM' + moment().format('YYYYMMDDHHmmssSSS');
  const notify_url = 'https://www.renwuming.cn/maidu/orders/notify';
  var order = {
    body: `脉度良子 - ${server}`,
    attach: server,
    openid: appid,
    out_trade_no: _tradeId,
    total_fee: toCents(data.price),
    trade_type: 'JSAPI',
    spbill_create_ip: '127.0.0.1',
    notify_url,
  };

  var _order = await weixin.pay.unifiedOrder(order);

  if (_order.return_code == 'SUCCESS' && _order.result_code == 'SUCCESS') {
    // 订单存入数据库
    saveOrder(data, appid, _tradeId);

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

function saveOrder(data, openId, tradeId) {
  data.payStatus = false;
  var oneOrder = new Order({
    ...data,
    openId,
    tradeId,
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


//添加订单
router.post('/', async function (req, res, next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  let data = req.body;
  let msg;
  try {
    data.appid = appid;
    msg = await submitOrder(data);
  } catch(e) {
    console.log(e);
    res.send({error: e});
    return;
  }
  res.send(msg);
});



router.post('/notify', async function (req, res, next) {
    const data = req.body,
        {xml} = data;

    // 若成功收到回调消息
    if (xml && xml.return_code == 'SUCCESS') {
      let {result_code, sign, out_trade_no} = xml;
        delete xml.sign;
        var _sign = weixin.sign.build(xml);
        // 若签名校验成功
        if (sign == _sign) {
            const status = result_code == 'SUCCESS' ? 1 : 2;

            // 若支付成功
            if(status===1){
              // 更新数据库
              Order.update(
                { tradeId: out_trade_no },
                { "$set": {"payStatus": true} }
              );
            }

            const result = {
                return_code: 'SUCCESS',
                return_msg: 'OK'
            };
            const xml = xmlBuilder.buildObject(result);
            console.log('支付回调返回成功', xml);
            res.send(xml);
        } else {
            // 若签名校验失败
            const result = {
                return_code: 'FAIL',
                return_msg: '签名失败'
            };
            const xml = xmlBuilder.buildObject(result);
            console.log('支付回调返回失败', xml);
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
