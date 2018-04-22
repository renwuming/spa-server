var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userInfoSchema = new Schema({
  appid: {type: String},
  nickName: {type: String},  
  name: {type: String},
  money: {type: Number},
  phoneNumber: {type: String},
  address: {type: String},
  orderCount: Number,
  gender: Number,
})

module.exports = mongoose.model('usersInfo',userInfoSchema)