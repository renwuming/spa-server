// mongoose 链接
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/spa') 

var db = mongoose.connection


// Schema 结构
var mongooseSchema = new mongoose.Schema({
    username : {type : String, default : '匿名用户'},
    title    : {type : String},
    content  : {type : String},
    time     : {type : Date, default: Date.now},
    age      : {type : Number}
});

mongooseSchema.methods.findbyusername = function(username, callback) {
    return this.model('mongoose').find({username: username}, callback);
}

// model
var mongooseModel = db.model('mongoose', mongooseSchema);

// 查询
// 基于实例方法的查询
var mongooseEntity = new mongooseModel({});
mongooseEntity.findbyusername('model_demo_username', function(error, result){
    if(error) {
        console.log(error);
    } else {
        console.log(result);
    }
    //关闭数据库链接
    db.close();
});

// 增加记录 基于model操作
// var doc = {username : 'model_demo_username', title : 'model_demo_title', content : 'model_demo_content'};
// mongooseModel.create(doc, function(error){
//     if(error) {
//         console.log(error);
//     } else {
//         console.log('save ok');
//     }
//     // 关闭数据库链接
//     db.close();
// });

// // 增加记录 基于 entity 操作
// var doc = {username : 'emtity_demo_username', title : 'emtity_demo_title', content : 'emtity_demo_content'};
// var mongooseEntity = new mongooseModel(doc);

// mongooseEntity.save(function(error) {
//     if(error) {
//         console.log(error);
//     } else {
//         console.log('saved OK!');
//     }
//     // 关闭数据库链接
//     db.close();
// });