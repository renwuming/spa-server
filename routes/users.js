var express = require('express');
var router = express.Router();
var mid = require('../lib/middleware');

//model
var UsersInfo = require('../Models/usersInfo');

// find UserInfo 
router.get('/', async function(req,res,next) {
  let sessionid = req.headers.session
  let appid = await mid.getSessionBy(sessionid)
  if(!appid) {
    res.json({errMsg: "sessionkey not found"});
    return;
  }
  let resdata;
  try {
    resdata = await UsersInfo.find({"appid": appid})
    if(resdata.toString() === '') {
      res.send({success:false})
    } else {
      res.send({...resdata[0]._doc, success:true, appid: ""})
    }
  } catch (e) {
    res.send({success:false})
  }
})

// add userinfo
router.post('/', async function(req, res, next) {
  let sessionid = req.headers.session
  let appid =await mid.getSessionBy(sessionid)
  if(!appid) {
    res.json({errMsg: "sessionkey not found"});
    return;
  }
  let data = { ...req.body, appid } 

  try {
    resdata = await UsersInfo.find({"appid": appid})
    if(resdata.toString() === '') {
      let onePerson = new UsersInfo(data)
      onePerson.save((err)=>{
        if(err) {
          res.send(err)
        } else {
          res.send('success!')
        }
      })
    }
  } catch (e) {
    res.send('fail!')
  }
});

//  update userinfo
router.put('/', async function(req, res, next) {
  let sessionid = req.headers.session
  let appid =await mid.getSessionBy(sessionid)
  if(!appid) {
    res.json({errMsg: "sessionkey not found"});
    return;
  }
  let resdata = await UsersInfo.update({"appid": appid}, req.body)
  // console.log(resdata)
  res.send(resdata)
})


module.exports = router;
