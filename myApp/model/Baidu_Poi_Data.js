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
    city:{
        type:String,
        index:true,
        default:'上海'
    },
    acc_flag:{
        type:Number,
        index:true
    },
    addr:{
        type:String,
        index:true
    },
    address_norm:{
        type:String,
    },
    aoi:{
        type:String,
        index:true
    },
    area:{
        type:String,
        index:true
    },
    biz_type:{
        type:Number,
        index:true
    },
    catalogID:{
        type:Number,
        index:true
    },
    cla:{
        type:String,
        index:true
    },
    detail:{
        type:Number,
        index:true
    },
    diPointX:{
        type:Number,
        index:true
    },
    diPointY:{
        type:Number,
        index:true
    },
    dis:{
        type:Number,
        index:true
    },
    dist2route:{
        type:Number,
        index:true
    },
    dist2start:{
        type:Number,
        index:true
    },
    ext:{
        type:String,
    },
    ext_display:{
        type:String,
    },
    ext_type:{
        type:Number,
        index:true
    },
    f_flag:{
        type:Number,
        index:true
    },
    father_son:{
        type:Number,
        index:true
    },
    flag_type:{
        type:Number,
        index:true
    },
    geo:{
        type:String,
        index:true
    },
    geo_type:{
        type:Number,
        index:true
    },
    name:{
        type:String,
        index:true
    },
    navi_x:{
        type:String,

    },
    navi_y:{
        type:String,

    },
    new_catalog_id:{
        type:String,
    },
    origin_id:{
        type:String,
    },
    poiType:{
        type:Number,
    },
    poi_click_num:{
        type:Number,
        index:true
    },
    poi_profile:{
        type:Number,
    },
    primary_uid:{
        type:String,
        index:true
    },
    prio_flag:{
        type:Number,
    },
    route_flag:{
        type:Number,
        index:true
    },
    show_tag:{
        type:Array,
        index:true
    },
    status:{
        type:Number,
        index:true
    },
    std_tag:{
        type:String,
        index:true
    },
    storage_src:{
        type:String,
        index:true
    },
    tag:{
        type:String,
        index:true
    },
    tel:{
        type:String,
        index:true
    },
    ty:{
        type:Number,
        index:true
    },
    uid:{
        type:String,
        index:true
    },
    view_type:{
        type:Number,
        index:true
    },
    x:{
        type:Number,
        index:true
    },
    y:{
        type:Number,
        index:true
    }
});
baiduPoiSchema.post('save',function(next){
    //console.log('已经执行了save操作!!');
});
baiduPoiSchema.pre('save',function(next){
    //console.log('即将执行save操作!!');
    next();
});
baiduPoiSchema.plugin(autoIncrement.plugin, {
    model: 'Baidu_poi',   //数据模块，需要跟同名 x.model("Baidu_poi", BooksSchema);
    field: 'pid',     //字段名
    startAt: 0,    //开始位置，自定义
    incrementBy: 1    //每次自增数量
});
var baiduPoi=mongoose.model('Baidu_poi',baiduPoiSchema);