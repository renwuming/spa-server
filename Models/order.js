var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var orderSchema = new Schema({
  orderTime: String,
  orderStatus: Boolean,
  openId: String,
  createTime: String,
  server: String,
  price: String,
  name: String,
  phoneNumber: String,
  address: String
})

module.exports = mongoose.model('order',orderSchema)