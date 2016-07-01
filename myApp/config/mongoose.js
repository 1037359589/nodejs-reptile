/**
 * Created by pzl on 16/6/17.
 */
var mongoose=require("mongoose");
var config=require("./config.js");
module.exports=function(){
    var db=mongoose.connect(config.mongodb);
    require("../model/Baidu_Poi_Data.js");
    require("../model/Baidu_Poi_Data_new.js");
    require("../model/Baidu_Poi_Detail_Data.js");
    return db;
};
