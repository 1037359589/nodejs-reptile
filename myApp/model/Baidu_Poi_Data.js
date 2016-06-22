/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var autoIncrement = require('mongoose-auto-increment');   //自增ID 模块
autoIncrement.initialize(mongoose.connection);
var baiduPoiSchema=new mongoose.Schema({
    pid:{
        type:Number,
        index:true
    },
    uid:{
        type:String,
        index:true,
    },
    name:{
        type:String,
        index:true,
        //unique:true
    },
    location:{
        type:String,
    },
    address:{
        type:String
    },
    telephone:{
        type:String
    },
    detail:{
        type:Number
    },
    detail_info:{
        type:String
    },
    city:{
        type:String,
        index:true,
        default:"-"
    },
    poi:{
        type:String,
        index:true,
        default:"-"
    }
});
baiduPoiSchema.post('save',function(next){
    console.log('已经执行了save操作!!');
});
baiduPoiSchema.pre('save',function(next){
    console.log('即将执行save操作!!');
    next();
});
baiduPoiSchema.plugin(autoIncrement.plugin, {
    model: 'Baidu_poi',   //数据模块，需要跟同名 x.model("Baidu_poi", BooksSchema);
    field: 'pid',     //字段名
    startAt: 0,    //开始位置，自定义
    incrementBy: 1    //每次自增数量
});
var baiduPoi=mongoose.model('Baidu_poi',baiduPoiSchema);