const express = require('express');
const router = express.Router();
const config = require('../lib/config');
const http = require("../lib/http");
const cache = require('../lib/cache')()

const middleware = require('../lib/middleware')
let WXBizDataCrypt = require("../lib/WXBizDataCrypt");

router.get('/sessionkey', async function (req, res, next) {

  const data = {
    appid: config.AppID,
    secret: config.AppSecret,
    js_code: req.query.code,
    grant_type: 'authorization_code'
  }

  const resData = await http.get("https://api.weixin.qq.com/sns/jscode2session", data);

  if(resData.errcode) {
    res.send(resData)
  } else {
    const sessionid = WXBizDataCrypt.randomKey()
    cache.set(sessionid, resData)
    res.send({ thirdSession: sessionid})
  }
})


router.get('/validate', async function (req, res, next) {
  const sessionid = req.query.thirdSession,
        openid = await middleware.getSessionBy(sessionid);
  res.send({
    success: !!openid
  })
})


router.get('/checkUserinfo', async function (req, res, next) {

})


router.get('/decodeUserinfo', async function (req, res, next) {

})

module.exports = router;
