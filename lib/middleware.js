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

mid.decryptedData = async function(data, sessionid) {
  let sk = await redis.getSync(sessionid);
  sk = JSON.parse(sk) || {};
  const sessionkey = sk.session_key;
  if(data.encryptedData && data.iv && sessionkey) {
    const pc = new WXBizDataCrypt(config.AppID, sessionkey);
    return pc.decryptData(data.encryptedData, data.iv);;
  } else {
    throw new Error("encryptedData not found or sessionkey error");
  }
}

module.exports = mid;