/**
 * Created by bll on 16/6/17.
 */
var mongoose=require("mongoose");
var BaiduPoi=mongoose.model("Baidu_poi");

var baidu_poi={
    model:"",
    insertReturnDoc:"",
    canInsertData:[],
    init:(data)=>{
        baidu_poi.insert(data);
    },
    getInstance:(data)=>{
        this.model = new BaiduPoi(data||"");
        return baidu_poi;
    },
    insert:(data)=>{
        baidu_poi.filterIsSetData(data);
        return baidu_poi;
    },
    /*
    * 过滤已存在数据
    * */
    filterIsSetData:function(data){
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
                        console.log(doc,888);
                        if(doc.length==0){
                            bp.canInsertData.push(v);
                        }
                        bp.canInsertData.remove(undefined);
                        console.log(bp.canInsertData,999);
                    });
                });
                var t=setInterval(function(){
                    if(bp.canInsertData.length>0){
                        bp.insertCanData(bp.canInsertData,t);
                    }else{
                        clearInterval(t);
                        return;
                    }
                },1000);
            }
        });
    },
    insertCanData:function(data,t){
        BaiduPoi.create(data,function(err,doc){
            if(err){
                console.log(err);
                return ;
            }
            baidu_poi.insertReturnDoc=doc;
            console.log(baidu_poi.insertReturnDoc);
            if(t!==undefined){
                clearInterval(t);
            }
        });
    }
};
Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
module.exports=baidu_poi;
