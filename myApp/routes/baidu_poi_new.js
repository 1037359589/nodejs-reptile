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
    pageNumArr:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30],
    /*
    * 处理经纬度
    * */
    handleGetGeo:function(req,res,next){
        var rbdn=reptile_baidu_data_new;
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
            la=(parseFloat(la)+parseFloat(0.02)).toFixed(4);
            ln=(parseFloat(ln)+parseFloat(0.02)).toFixed(4);
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
                rbdn.handleRectUrl(res);
                //res.send(rbdn.rectUrlArr);
                return;
            }
            var geo=lat+","+rbdn.geoLngArr[k]+","+rbdn.geoLatArr[k+1]+","+rbdn.geoLngArr[k+1];
            for(var k in rbdn.pageNumArr){
                if(k>=30)return;
                var url="http://api.map.baidu.com/place/v2/search?query="+ encodeURIComponent('美食')+"&page_size=20&" +
                    "page_num="+rbdn.pageNumArr[k]+"&scope=2&bounds="+geo+"&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z";
                rbdn.rectUrlArr.push(url);
            }
        });
        //res.writeHead(200, {'Content-Type': 'text/html'});

    },
    /*
    * 处理url,得到数据
    * */
    handleRectUrl:(res)=>{
        var rbdn=reptile_baidu_data_new;
        //superagent.get("http://api.map.baidu.com/place/v2/search?query="+ encodeURIComponent('美食')+"&page_size=20&" +
        //        "page_num=0&scope=2&bounds=31.1737,121.3340,31.2037,121.3640&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z")
        //    .end(function (err, response) {
        //        if(err){
        //            console.log(err);
        //        }
        //      res.send(response.text);
        //    });
        rbdn.rectUrlArr.forEach(function(url,k){
            superagent.get(url)
                .end(function (err, response) {
                    if(err){
                        console.log(err);
                        return;
                    }
                    if(response.text==undefined||response.text.length==0){return;}
                    var results=JSON.parse(response.text).results;
                    results.forEach(function(v,k){
                        rbdn.RectAllData.push(v);
                    });
                    console.log(rbdn.RectAllData.length);
                    if(k>=rbdn.rectUrlArr.length-1){
                        setTimeout(function(){
                            res.send(rbdn.RectAllData);
                        },2000);

                        return;
                    }
                });

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