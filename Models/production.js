var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var productionSchema = new Schema({
  leftImg: String,
  title: String,
  price: Number,
  orderCount: Number,
  listDesc: String,
  showImg: String,
  serviceTime: String,
  serviceStatus: String,
  fixPersion: String,
  unfixPersion: String,
  producInfo: String,
  serviceProcress: String,
  need: String
})

module.exports = mongoose.model('production',productionSchema)