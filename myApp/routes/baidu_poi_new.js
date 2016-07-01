/**
 * Created by pzl on 16/6/29.
 */
/**
 * Created by bll on 16/6/17.
 */
var express = require('express');
//var router = express.Router();
//var url = require('url'); //解析操作url
var superagent = require('superagent'); //这三个外部依赖不要忘记npm install
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var baidu_poi_new=require("../server_api/baidu_poi_new.api");
var poiObj=require("../config/POI_config");
var tagArr=poiObj.tag.split(",");
console.log(tagArr);
var reptile_baidu_data_new={
    /*
    * 判断是否经纬度成功
    * */
    getGeo:false,
    /*
    * 经纬度坐标数组
    * */
    geoLatArr:[],
    geoLngArr:[],
    /*
    *
    * 初始化经纬度
    * */
    minLat:'30.693714',
    minLng:'120.854023',
    maxLat:"31.395077",
    maxLng:'121.975977',
    /*
    * 矩形内的url数组及是否获取成功
    * */
    rectUrlArr:[],
    getReactUrl:false,
    /*
    * 所有数据
    * */
    RectAllData:[],
    getAllDataIs:false,
    pageNumArr:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20],
    /*
    * url是否请求过
    * */
    urlRequest:[],
    /*
    * 判断该范围是否请求完,或者没数据
    * */
    rangeRequest:[],
    geoArr:[],
    /*
    * 处理经纬度
    * */
    handleGetGeo:function(req,res,next){
        var rbdn=reptile_baidu_data_new;
        rbdn.rectUrlArr=[];
        rbdn.geoLatArr=[];
        rbdn.geoLngArr=[];
        rbdn.RectAllData=[];
        rbdn.urlRequest=[];
        rbdn.rangeRequest=[];
        if(rbdn.getAllDataIs==true){
            return;
        }
        var la=parseFloat(rbdn.minLat).toFixed(4),ln=parseFloat(rbdn.minLng).toFixed(4);
        rbdn.geoLatArr.push(la);
        rbdn.geoLngArr.push(ln);
        var t=setInterval(function(){
            console.log(la,ln,rbdn.geoLatArr.length,rbdn.geoLngArr.length);
            la=(parseFloat(la)+parseFloat(0.1)).toFixed(4);
            ln=(parseFloat(ln)+parseFloat(0.1)).toFixed(4);
            rbdn.geoLatArr.push(la);
            rbdn.geoLngArr.push(ln);
            if(la>parseFloat(rbdn.maxLat).toFixed(4)&&ln>parseFloat(rbdn.maxLng).toFixed(4)){
                rbdn.getGeo=true;
                console.log(rbdn.geoLatArr,rbdn.geoLngArr,rbdn.geoLatArr.length,rbdn.geoLngArr.length);
                rbdn.getUrlFromRect(res);
                //console.log(rbdn.geoLatArr.length,rbdn.geoLngArr.length);
                clearInterval(t);
                return;
            }
        },100);
    },
    /*
    * 得到矩形内的url
    * http://api.map.baidu.com/place/v2/search?query=%E9%93%B6%E8%A1%8C&page_size=20&page_num=0&scope=2&bounds=31.6937,121.8540,31.7937,121.9540&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z
    * */
    getUrlFromRect:(res)=>{
        var rbdn=reptile_baidu_data_new;
        console.log(rbdn.geoLatArr.length);
        console.log(rbdn.geoLngArr.length);
        rbdn.geoArr=[];rbdn.rectUrlArr=[];rbdn.rangeRequest=[];
        rbdn.geoLatArr.forEach(function(lat,k){
            var latNext=rbdn.geoLatArr[k+1];
            rbdn.geoLngArr.forEach(function(lng,i){
                if(latNext!=undefined&&rbdn.geoLngArr[i+1]!=undefined){
                    var geo=lat+","+rbdn.geoLngArr[i]+","+latNext+","+rbdn.geoLngArr[i+1];
                    rbdn.geoArr.push(geo);
                    //console.log(rbdn.rangeRequest.length,'撒打算打算的');
                    var rg={
                        geo:geo,
                        value:false,
                        urlArr:[]
                    };
                    for(var k in rbdn.pageNumArr){
                        var url="http://api.map.baidu.com/place/v2/search?query="+ encodeURIComponent('中餐厅')+"&page_size=20&" +
                            "page_num="+rbdn.pageNumArr[k]+"&scope=2&scope=2&bounds="+geo+"&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z";
                        rg.urlArr.push(url);
                        if(k == rbdn.pageNumArr.length-1){
                            rbdn.rangeRequest.push(rg);
                        }
                        //rbdn.handleUrl2FromRect(url,geo,res);
                        //console.log(rbdn.rangeRequest.length,(rbdn.geoLatArr.length-1)*(rbdn.geoLngArr.length-1),"qweqwe");

                    }
                    if(rbdn.rangeRequest.length==(rbdn.geoLatArr.length-1)*(rbdn.geoLngArr.length-1)){
                        rbdn.getReactUrl=true;
                        console.log(rbdn.rangeRequest.length,'ooooo');
                        rbdn.handleRectUrl(res);
                        //res.send(rbdn.rangeRequest);
                        return;
                    }

                    //console.log(rbdn.geoArr,rbdn.geoArr.length, rbdn.rectUrlArr.length);
                }

            });
        });
        //res.writeHead(200, {'Content-Type': 'text/html'});

    },
    /*
    * 处理url,得到数据
    * */
    handleRectUrl:(res)=>{
        var rbdn=reptile_baidu_data_new;
           res.send(rbdn.rangeRequest) ;
        rbdn.rangeRequest.forEach(function(reqObj,k){
            var reqSuccess=[];
            reqObj.urlArr.forEach(function(url,i){
                //rbdn.superagentUrl(url,reqObj,i,res);
            });
        });
    },
    superagentUrl:(url,obj,page,res)=>{
        var rbdn=reptile_baidu_data_new;
        superagent.get(url)
            .end(function (err, response) {
                rbdn.urlRequest.push(true);
                if(err){
                    console.log(err);
                    rbdn.superagentUrl(url,obj);
                    return;
                }
                //rbdn.urlRequest.push(true);
                if(obj.value==true)return;
                if(response.text==undefined||response.text.length==0){
                    obj.value=true;
                    console.log('return1');
                    return;
                }
                var results=JSON.parse(response.text).results;
                if(results.length==0){
                    obj.value=true;
                    //success.push(true);
                    //console.log(obj.geo,rbdn.geoArr[rbdn.geoArr.length-2],page,"64646466");
                    //if(obj.geo==rbdn.geoArr[rbdn.geoArr.length-2]){
                    //    console.log(rbdn.RectAllData.length);
                    //    res.send(rbdn.RectAllData);
                    //}
                    console.log('return2');
                    return;
                }
                baidu_poi_new.insertData(results,function(){
                    /*开始判断是否全部成功!!*/
                    var allSuccess=[];
                    for(var i in rbdn.rangeRequest){
                        allSuccess.push(rbdn.rangeRequest[i].value);
                    }
                    /*
                    * 判断是否已经全部执行完成
                    * */
                    if(allSuccess.length==rbdn.rangeRequest.length&&allSuccess.indexOf(false)==-1){
                        res.send('全部成功!!');
                        return;
                    }
                    console.log(allSuccess.length,rbdn.rangeRequest.length,allSuccess,"opoppoopo");
                    console.log('insert完毕!!');
                });
                //results.forEach(function(v,k){
                //    rbdn.RectAllData.push(v);
                //});
                //console.log(rbdn.RectAllData.length,rbdn.urlRequest.length,rbdn.rectUrlArr.length);
            });

    },
    /*
    * 处理rect的url(新)
    * */
    handleUrl2FromRect:function(url,geo,res){
        var rbdn=reptile_baidu_data_new;
        superagent.get(url)
            .end(function (err, response) {
                //rbdn.urlRequest.push(true);
                if(err){
                    console.log(err);
                    //if(rbdn.rangeRequest[rbdn.rangeRequest.length-1].name==geo){
                    //    rbdn.rangeRequest[rbdn.rangeRequest.length-1].value=true;
                    //}
                    rbdn.handleUrl2FromRect(url,geo);
                    return;
                }
                //rbdn.urlRequest.push(true);

                if(response.text==undefined||response.text.length==0){
                    //if(rbdn.rangeRequest[rbdn.rangeRequest.length-1].name==geo){
                    //    rbdn.rangeRequest[rbdn.rangeRequest.length-1].value=true;
                    //}
                    console.log('return1');
                    return;
                }
                //console.log(rbdn.rangeRequest.length,rbdn.geoArr.length,111 ,rbdn.RectAllData.length);

                var results=JSON.parse(response.text).results;
                console.log(results);
                if(results.length==0){
                    rbdn.rangeRequest.push(true);
                    /*
                     * 所有的矩形范围全部获取过之后进行数据库操作
                     * */

                    if(rbdn.rangeRequest.length == rbdn.geoArr.length){
                        //console.log(rbdn.rangeRequest.length,rbdn.geoArr.length,333,rbdn.RectAllData.length);
                        //rbdn.geoArr=[];rbdn.rangeRequest=[];
                        console.log(rbdn.RectAllData.length,'数据数量');
                        res.send(rbdn.RectAllData);
                        /*
                         * TODO::数据插入到数据库
                         * */
                        return;
                    }
                    console.log('return2');
                    return;
                }
                //console.log(rbdn.rangeRequest.length,rbdn.geoArr.length,222,rbdn.RectAllData.length);
                results.forEach(function(v,k){
                    rbdn.RectAllData.push(v);
                });

                //console.log(rbdn.RectAllData.length,rbdn.urlRequest.length,rbdn.rectUrlArr.length);
                //if(rbdn.urlRequest.length>=rbdn.rectUrlArr.length){
                //    //setTimeout(function(){
                //    rbdn.getAllDataIs=true;
                //    res.send(rbdn.RectAllData);
                //    //},2000);
                //    return;
                //}
                //if(k>=rbdn.rectUrlArr.length-1){
                //
                //}
            });
    },
    /*
     * 开始处理URl
     * */
    handleGetUrlArr:function(req, res, next){
        var rbd=reptile_baidu_data_new;
        var t=setInterval(function(){
            //console.log(tagArr.length*100,rbd.finalUrlArr.length);
            if(tagArr.length*100==rbd.finalUrlArr.length){
                clearInterval(t);
                console.log('开始处理数据!!');
                rbd.finalUrlArr.forEach(function(url,k){
                    if(rbd.finalUrlSuccess[k-1]==true&&k!=0){
                        rbd.handleData(url,k,req, res, next);
                        return;
                    }
                    rbd.handleData(url,k,req, res, next);
                    //console.log(url);
                })
            }
        },100);
    },
    /*
     *
     * 处理数据
     * */
    handleData:(mapUrl,k,req, res, next)=>{
        var rbd=reptile_baidu_data_new;
        superagent.get(mapUrl)
            .end(function (err, response) {
                if (err) {
                    console.log(err);
                    rbd.handleData(mapUrl,k,req, res, next);
                    return;
                }
                if(response.text==undefined){
                    return;
                }
                //var s={};
                //s.content=JSON.parse(response.text.split(',\"content\":')[1]);
                try{
                    var s = JSON.parse(response.text);
                }catch(err){
                    console.log('无法解决的错误!!');
                    return;
                }
                console.log(s);
                var results = s.content, dataAll = [];
                if(results==undefined||results.length==0){
                    console.log('无数据');
                    return;
                }
                for(var k in results){
                    console.log(results[k]);
                    for(var i in results[k]){
                        if(results[k][i] instanceof Object){
                            results[k][i]= JSON.stringify(results[k][i]);
                        }
                    }
                    dataAll.push(results[k]);
                }
                console.log(dataAll,dataAll.length);
                baidu_poi.insert(dataAll,req, res, next);
                rbd.finalUrlSuccess[k]=true;
            });
    },
    init:(req, res, next)=>{
        //baidu_poi.removeAll();
        //baidu_poi.detailRemoveAll();
        //reptile_baidu_data_new.pageHandle(req, res, next);
        //reptile_baidu_data_new.handleGetUrlArr();
        reptile_baidu_data_new.handleGetGeo(req,res,next);
        //reptile_baidu_data_new.handleDetailStore(req,res,next);
    }
};
function final_reptile_baidu_data(req, res, next){
    reptile_baidu_data_new.init(req, res, next);
}
var indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
var remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
module.exports=reptile_baidu_data_new;