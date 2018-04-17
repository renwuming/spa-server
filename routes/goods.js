var express = require('express');
var router = express.Router();

//model
var Production = require('../Models/production')

//查询商品
router.get('/',async function(req,res,next) {
  let result = await Production.find({})
  res.send(result)
})

//save production
router.post('/', function(req, res, next) {
  var onePro = new Production({...req.body, orderCount: 0})
  onePro.save((err)=>{
    if(err) {
       res.send(err)
    } else {
       res.send('success')
    }
  })
})

// 删除商品
router.delete('/', async function(req, res, next) {
  // console.log(res)
  let result = await Production.remove({_id: req.query._id})
  res.send(result)
})

// 修改商品内容
router.put('/', async function(req,res,next) {
  let { _id } = req.body
  let data = req.body
  let resdata = await Production.update({"_id": _id}, {
    leftImg: data.leftImg,
    title: data.title,
    price: data.price,
    listDesc: data.listDesc,
    showImg: data.showImg,
    serviceTime: data.serviceTime,
    serviceStatus: data.serviceStatus,
    fixPersion: data.fixPersion,
    unfixPersion: data.unfixPersion,
    producInfo: data.producInfo,
    serviceProcress: data.serviceProcress,
    need: data.need,
  })
  // console.log(resdata)
  res.send(resdata)
})

// 修改商品内容
router.put('/addone', async function(req,res,next) {
  let { _id } = req.body
  let resdata = await Production.update(
    { _id },
    { "$inc": {"orderCount":1} }
  )
  res.send(resdata)
})

module.exports = router;
