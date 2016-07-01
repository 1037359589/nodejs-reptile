/**
 * Created by pzl on 16/7/1.
 */
/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var BaiduPoiNew=mongoose.model("Baidu_poi_new");
var BaiduPoiDetail=mongoose.model("Baidu_poi_detail");

var baidu_poi_new={
    insertData:function(data,fn){
        BaiduPoiNew.create(data,function(err,doc){
            if(err){
                console.log(err);
                return ;
            }
            console.log('inserted');
            if(fn instanceof Function){
                fn(doc);
            }
        });
    },
};
//Array.prototype.indexOf = function(val) {
//    for (var i = 0; i < this.length; i++) {
//        if (this[i] == val) return i;
//    }
//    return -1;
//};
//Array.prototype.remove = function(val) {
//    var index = this.indexOf(val);
//    if (index > -1) {
//        this.splice(index, 1);
//    }
//};
module.exports=baidu_poi_new;
