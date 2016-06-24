/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var BaiduPoi=mongoose.model("Baidu_poi");
var BaiduPoiDetail=mongoose.model("Baidu_poi_detail");

var baidu_poi={
    model:"",
    insertReturnDoc:"",
    canInsertData:[],
    init:(data)=>{
        baidu_poi.insert(data);
    },
    removeAll:()=>{
        BaiduPoi.remove(function(err, p){
            if(err){
                throw err;
            } else{
                console.log('已经全部删除:' + p);
            }
        });
    },
    detailRemoveAll:()=>{
        BaiduPoiDetail.remove(function(err, p){
            if(err){
                throw err;
            } else{
                console.log('已经全部删除:' + p);
            }
        });
    },
    getInstance:(data)=>{
        this.model = new BaiduPoi(data||"");
        return baidu_poi;
    },
    insert:(data,fn)=>{
        //baidu_poi.filterIsSetData(data,req, res, next);
        baidu_poi.insertCanData(data,fn);
        return baidu_poi;
    },
    /*
    * 过滤已存在数据
    * */
    filterIsSetData:function(data,req, res, next){
        var bp=baidu_poi;
        BaiduPoi.find(function(err,doc){
            if(err){
                console.log(err);
                return ;
            }
            if(doc.length==0){
                bp.insertCanData(data);
            }else{
                data.forEach(function(v,k){
                    var request={
                        name:v.name
                    };
                    BaiduPoi.find(request,function(err,doc){
                        if(err){
                            console.log(err);
                            return ;
                        }
                        if(doc.length==0){
                            bp.canInsertData.push(v);
                        }
                        bp.canInsertData.remove(undefined);
                    });
                });
                //var t=setInterval(function(){
                    if(bp.canInsertData.length>0){
                        bp.insertCanData(bp.canInsertData,req, res, next);
                    }else{
                        //clearInterval(t);
                        return;
                    }
                //},1000);
            }
        });
    },
    insertCanData:function(data,fn){
        BaiduPoi.create(data,function(err,doc){
            if(err){
                console.log(err);
                return ;
            }
            baidu_poi.insertReturnDoc=doc;
            if(fn instanceof Function){
                fn(doc);
            }
            //console.log(baidu_poi.insertReturnDoc);
        });
    },
    insertCanDetailData:function(data,req, res, next,fn){
        BaiduPoiDetail.create(data,function(err,doc){
            if(err){
                console.log(err);
                return ;
            }
            console.log('insert');
            //baidu_poi.insertReturnDoc=doc;
            if(fn instanceof Function){
                fn(doc);
            }
        });
    },
    findPoiListLimit:(num,page,fn)=>{
        BaiduPoi.count({}, function(err, count) {
            BaiduPoi.find({}, 'pid name primary_uid ext', {skip: (page) * num, limit: num}, function (err, doc) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (fn instanceof Function) {
                    fn(doc);
                }
            });
        })
    },
    getPoiCount:function(fn){
        BaiduPoi.count({}, function(err, count) {
            if (err) {
                console.log(err);
                return;
            }
            if (fn instanceof Function) {
                fn(count);
            }
        })
    }
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
module.exports=baidu_poi;
