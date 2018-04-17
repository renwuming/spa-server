const redis = require("./redis");
const WXBizDataCrypt = require("./WXBizDataCrypt");
const config = require("./config");
const mid = {};

mid.getSession = function() {
  return async function(req, res, next) {
    const sessionid = req.body.sessionid;
    let sk = await redis.getSync(sessionid);
    if(sk) {
      sk = JSON.parse(sk);
      req.locals.sessionkey = sk.session_key;
      req.locals.openid = sk.openid;
      await next();
    } else {
      res.json({errMsg: "sessionkey not found"});
    }
  }
}

mid.getSessionBy = async function(sessionid) {
    let sk = await redis.getSync(sessionid);
    sk = JSON.parse(sk) || {};
    return sk.openid;
}

mid.decryptedData = function() {
  return async function(req, res , next) {

    if(req.body.encryptedData && req.body.iv) {
      const pc = new WXBizDataCrypt(config.AppID, req.locals.sessionkey);
      try {
        req.locals.decryptedData = pc.decryptData(req.body.encryptedData, req.body.iv);
      } catch(e) {
        res.send({errMsg: e.toString()});
        return;
      }
      await next();
    } else {
      res.send({errMsg: "encryptedData not found"});
    }
  }
}

module.exports = mid;