/**
 * Created by pzl on 16/6/22.
 */
/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var autoIncrement = require('mongoose-auto-increment');   //自增ID 模块
autoIncrement.initialize(mongoose.connection);
var baiduPoiDetailSchema=new mongoose.Schema({
    uid:{
        type:String,
        index:true,
    },
    other_msg:{
      type:String
    },
    photo:{
        type:String
    },
    comments:{
        type:String
    }
});
baiduPoiDetailSchema.post('save',function(next){
    console.log('已经执行了save操作!!');
});
baiduPoiDetailSchema.pre('save',function(next){
    console.log('即将执行save操作!!');
    next();
});
//baiduPoiDetailSchema.plugin(autoIncrement.plugin, {
//    model: 'Baidu_poi_detail',   //数据模块，需要跟同名 x.model("Baidu_poi", BooksSchema);
//    field: 'pid',     //字段名
//    startAt: 0,    //开始位置，自定义
//    incrementBy: 1    //每次自增数量
//});
var baiduPoi=mongoose.model('Baidu_poi_detail',baiduPoiDetailSchema);