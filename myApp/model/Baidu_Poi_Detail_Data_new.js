/**
 * Created by Administrator on 2016/7/2 0002.
 */
/**
 * Created by pzl on 16/6/22.
 */
var mongoose=require("mongoose");
var autoIncrement = require('mongoose-auto-increment');   //自增ID 模块
autoIncrement.initialize(mongoose.connection);
var baiduPoiDetailNewSchema=new mongoose.Schema({
    name:{
        type:String,
        index:true,
    },
    location:{
        type:Object
    },
    address:{
        type:String
    },
    telephone:{
        type:String,
        index:true
    },
    detail:{
        type:Number
    },
    uid:{
        type:String,
        index:true
    },
    detail_info:{
        type:Object
    }
});
baiduPoiDetailNewSchema.post('save',function(next){
    //console.log('已经执行了save操作!!');
});
baiduPoiDetailNewSchema.pre('save',function(next){
    //console.log('即将执行save操作!!');
    next();
});
//baiduPoiDetailSchema.plugin(autoIncrement.plugin, {
//    model: 'Baidu_poi_detail',   //数据模块，需要跟同名 x.model("Baidu_poi", BooksSchema);
//    field: 'pid',     //字段名
//    startAt: 0,    //开始位置，自定义
//    incrementBy: 1    //每次自增数量
//});
var baiduPoi=mongoose.model('Baidu_poi_detail_new',baiduPoiDetailNewSchema);