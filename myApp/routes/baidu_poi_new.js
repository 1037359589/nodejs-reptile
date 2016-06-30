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
var baidu_poi=require("../server_api/baidu_poi.api");
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
    pageNumArr:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
    /*
    * url是否请求过
    * */
    urlRequest:[],
    /*
    * 判断该范围是否请求完,或者没数据
    * */
    rangeRequest:[],
    /*
    * 处理经纬度
    * */
    handleGetGeo:function(req,res,next){
        var rbdn=reptile_baidu_data_new;
        if(rbdn.getAllDataIs==true){
            return;
        }
        var la=parseFloat(rbdn.minLat).toFixed(4),ln=parseFloat(rbdn.minLng).toFixed(4);
        rbdn.geoLatArr.push(la);
        rbdn.geoLngArr.push(ln);
        var t=setInterval(function(){
            console.log(la,ln);
            if(la>=parseFloat(rbdn.maxLat).toFixed(4)&&ln>=parseFloat(rbdn.maxLng).toFixed(4)){
                rbdn.getGeo=true;
                rbdn.getUrlFromRect(res);
                clearInterval(t);
                return;
            }
            la=(parseFloat(la)+parseFloat(0.005)).toFixed(4);
            ln=(parseFloat(ln)+parseFloat(0.005)).toFixed(4);
            rbdn.geoLatArr.push(la);
            rbdn.geoLngArr.push(ln);
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
        rbdn.geoLatArr.forEach(function(lat,k){
            if(k==rbdn.geoLatArr.length-1){
                rbdn.getReactUrl=true;
                //rbdn.handleRectUrl(res);
                //res.send(rbdn.rectUrlArr);
                return;
            }
            var geo=lat+","+rbdn.geoLngArr[k]+","+rbdn.geoLatArr[k+1]+","+rbdn.geoLngArr[k+1];
            for(var k in rbdn.pageNumArr){
                if(k>=rbdn.pageNumArr.length-2)return;
                var url="http://api.map.baidu.com/place/v2/search?query="+ encodeURIComponent('中餐厅')+"&page_size=20&" +
                    "page_num="+rbdn.pageNumArr[k]+"&scope=2&bounds="+geo+"&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z";
                //rbdn.rectUrlArr.push(url);
                if(rbdn.rangeRequest[rbdn.rangeRequest.length-1].name==geo
                    &&rbdn.rangeRequest[rbdn.rangeRequest.length-1].value==true&&rbdn.geoLatArr.length==rbdn.rangeRequest.length){
                    console.log('已经完成了该范围数据调取!!');
                    return;
                }
                rbdn.handleUrl2FromRect(url,geo);
            }
        });
        //res.writeHead(200, {'Content-Type': 'text/html'});

    },
    /*
    * 处理url,得到数据
    * */
    handleRectUrl:(res)=>{
        var rbdn=reptile_baidu_data_new;
        rbdn.rectUrlArr.forEach(function(url,k){
            if(rbdn.rangeRequest[k]==true){
                console.log('该范围的数据已经请求完了!!');
                return;
            }
            superagent.get(url)
                .end(function (err, response) {
                    rbdn.urlRequest.push(true);
                    if(err){
                        console.log(err);
                        return;
                    }
                    //rbdn.urlRequest.push(true);
                    if(response.text==undefined||response.text.length==0){
                        rbdn.rangeRequest[k]=true;
                        console.log('return1');
                        return;
                    }
                    var results=JSON.parse(response.text).results;
                    if(results.length==0){
                        console.log('return2');
                        return;
                    }
                    results.forEach(function(v,k){
                        rbdn.RectAllData.push(v);
                    });

                    console.log(rbdn.RectAllData.length,rbdn.urlRequest.length,rbdn.rectUrlArr.length);
                    if(rbdn.urlRequest.length>=rbdn.rectUrlArr.length){
                        //setTimeout(function(){
                            rbdn.getAllDataIs=true;
                            res.send(rbdn.RectAllData);
                        //},2000);
                        return;
                    }
                    //if(k>=rbdn.rectUrlArr.length-1){
                    //
                    //}
                });

        });
    },
    /*
    * 处理rect的url(新)
    * */
    handleUrl2FromRect:function(url,geo){
        var rbdn=reptile_baidu_data_new;
        superagent.get(url)
            .end(function (err, response) {
                rbdn.urlRequest.push(true);
                if(err){
                    console.log(err);
                    return;
                }
                //rbdn.urlRequest.push(true);
                if(response.text==undefined||response.text.length==0){
                    var rangeResObj={
                        name:geo,
                        value:true
                    };
                    rbdn.rangeRequest.push(rangeResObj);
                    console.log('return1');
                    /*
                    * 所有的矩形范围全部获取过之后进行数据库操作
                    * */
                    if(rbdn.rangeRequest.length == rbdn.geoLatArr.length){
                        res.send(rbdn.RectAllData);
                        /*
                        * TODO::数据插入到数据库
                        * */
                        return;
                    }
                    return;
                }
                var results=JSON.parse(response.text).results;
                if(results.length==0){
                    console.log('return2');
                    return;
                }
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
module.exports=reptile_baidu_data_new;