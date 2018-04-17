var express = require('express');
var router = express.Router();
var mid = require('../lib/middleware');

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

//添加订单
router.post('/', async function(req, res, next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  var oneOrder = new Order({...req.body, openId:appid})
  oneOrder.save((err)=>{
    if(err) {
       res.send(err)
    } else {
       res.send('success!')
    }
  })
});

// 更改订单的状态
router.put('/', async function(req, res, next) {
  let resdata = await Order.update(req.body, { orderStatus: true })
  res.send(resdata)
})

module.exports = router;
