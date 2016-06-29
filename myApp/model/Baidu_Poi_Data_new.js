/**
 * Created by pzl on 16/6/29.
 */
/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var autoIncrement = require('mongoose-auto-increment');   //自增ID 模块
autoIncrement.initialize(mongoose.connection);
var baiduPoiNewSchema=new mongoose.Schema({
    pid:{
        type:Number,
        index:true
    },
    name:{
        type:String,
        index:true
    },
    location:{
        type:String
    },
    address:{
        type:String,
        index:true
    },
    street_id:{
        type:String,
        index:true,
    },
    detail:{
        type:Number,
        index:true,
        default:"-"
    },
    uid:{
        type:String,
        index:true
    },
    detail_info:{
        type:String,
        index:true,
        default:"-"
    }
});
baiduPoiNewSchema.post('save',function(next){
    //console.log('已经执行了save操作!!');
});
baiduPoiNewSchema.pre('save',function(next){
    //console.log('即将执行save操作!!');
    next();
});
baiduPoiNewSchema.plugin(autoIncrement.plugin, {
    model: 'Baidu_poi_new',   //数据模块，需要跟同名 x.model("Baidu_poi", BooksSchema);
    field: 'pid',     //字段名
    startAt: 0,    //开始位置，自定义
    incrementBy: 1    //每次自增数量
});
var baiduPoi=mongoose.model('Baidu_poi_new',baiduPoiNewSchema);