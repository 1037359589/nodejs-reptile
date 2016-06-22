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

var reptile_baidu_data={
    success:[],
    poiSuccess:false,
    /*
    *
    * detail失败记录(暂无用)
    * */
    defeated:[],
    /*
    * detail首次数据更新成功
    * */
    detailSuccess:[],
    /*
    *
    * 处理数据
    * */
    handleData:(mapUrl,k,req, res, next)=>{
        var rbd=reptile_baidu_data;
        superagent.get(mapUrl)
            .end(function (err, response) {
                if (err) {
                    console.log(err);
                    return;
                }
                var s = JSON.parse(response.text);
                var results = s.results, dataAll = [];
                if(results.length==0){
                    rbd.poiSuccess=true;
                    return;
                }
                results.forEach(function (v, k) {
                    var data = {
                        name: v.name,
                        location: JSON.stringify(v.location),
                        address: v.address,
                        telephone: v.telephone,
                        detail: v.detail,
                        uid: v.uid,
                        detail_info: JSON.stringify(v.detail_info),
                        city: "上海",
                    };
                    dataAll.push(data);
                });
                baidu_poi.insert(dataAll,req, res, next);
            });
    },
    /*
    * 获取url
    * */
    getPoiUrls:(page_num,req, res, next)=>{
        var rbd=reptile_baidu_data;
        rbd.success[page_num]=true;
        for(var k in poiObj.tag){
                var mapUrl = 'http://api.map.baidu.com/place/v2/search?query='+encodeURIComponent(poiObj.tag[k])+
                    '&page_size=20&page_num='+page_num+'&scope='+poiObj.scope+'&output='+poiObj.output+'&region='
                    +encodeURIComponent('上海')+'&city_limit='+poiObj.city_limit+'&&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z'
                rbd.handleData(mapUrl,k,req, res, next);
        };

    },
    /*
    * 分页处理
    * */
    pageHandle:function(req, res, next){
        for(var i=0;i<20;i++){
            reptile_baidu_data.getPoiUrls(i,req, res, next);
        }
    },
    /*
    * 获取detial链接
    * */
    getDetailLink:(num,page,t,req,res,next)=>{
        var poi=baidu_poi.findPoiListLimit(num,page,function(doc){
            var detail_info_arr=[];
            if(doc.length==0){
                clearInterval(t);
                //clearTimeout(t);
                return;
            }
            doc.forEach(function(v,k){
                //console.log(v);
                //detail_info_arr.push(JSON.parse(v.detail_info)['detail_url']);
                detail_info_arr.push(v.uid);
            });
           //res.send(detail_info_arr);
            reptile_baidu_data.handleDerailUrl(detail_info_arr,page,num,req,res);
        });
    },
    /*
    * 处理url
    * */
    handleDerailUrl:(detail_info_arr,page,num,req,res)=>{
        var detail_collect=[];
        detail_info_arr.forEach(function(uid,k){
            superagent.get('http://map.baidu.com/detail?qt=ninf&uid='+uid+'&detail=life')
                .end(function (err, response) {
                    if (err) {
                        reptile_baidu_data.defeated.push(page);
                        console.log(err, reptile_baidu_data.defeated,111111);
                        return;
                    }
                    var $ = cheerio.load(response.text);
                    var other={};
                    var other_msg= $("#detailInfo").find(".bd>dl dd").text();
                    var other_msg_field= $("#detailInfo").find(".bd>dl dt>span").text();
                    other[other_msg_field]=other_msg;
                    var otherStr=JSON.stringify(other);
                    superagent.get('http://map.baidu.com/?qt=ugcPhotos&poiId='+uid+'&type=life&pageIndex=1&pageCount=100')
                        .end(function (err, response) {
                            if (err) {
                                reptile_baidu_data.defeated.push(page);
                                console.log(err, reptile_baidu_data.defeated,222222);

                                return;
                            }
                            var photo=JSON.stringify(JSON.parse(response.text).data);
                            superagent.get('http://map.baidu.com/?qt=comments&poiId='+uid+'&type=life&pageIndex=1&pageCount=10000')
                                .end(function (err, response) {
                                    if (err) {
                                        reptile_baidu_data.defeated.push(page);
                                        console.log(err, reptile_baidu_data.defeated,33333);
                                        reptile_baidu_data.handleDetailUrls(page);
                                        return;
                                    }
                                    var comments=JSON.stringify(JSON.parse(response.text).data);
                                    var data={
                                        uid:uid,
                                        other_msg:otherStr,
                                        photo:photo,
                                        comments:comments
                                    };
                                    detail_collect.push(data);
                                    console.log(detail_collect.length,num);
                                    if(detail_collect.length==num){
                                        baidu_poi.insertCanDetailData(detail_collect);
                                        //res.send(detail_collect);
                                    }
                                });
                        });
                });
        });
            //res.send(detail_collect);
    },
    /*
     * 处理超时链接
     * */
    handleDetailUrls:function(page){
        setTimeout(function(){
        console.log('开始失败操作');
        reptile_baidu_data.getDetailLink(20,page);
        },1000);
    },
    //开始存detail数据
    handleDetailStore:function(req,res,next){
        baidu_poi.detailRemoveAll();
        var rbp=reptile_baidu_data;
        var s=setInterval(function(){
            if(rbp.poiSuccess==false)return;
            /*
            * 计算总数量
            * */
            baidu_poi.getPoiCount(function(count){
                page=0;
                /*
                * 定时处理detail
                * */
                var t=setInterval(function(){
                    if(page>Math.ceil(count/20)){
                        rbp.detailSuccess[0]=true;
                        //rbp.handleDetailUrl();
                        res.send(rbp.defeated);
                        clearInterval(t);
                        return;
                    }
                    page++;
                    rbp.getDetailLink(20,page,t,req,res,next);
                },1000);
            });
            clearInterval(s);
        });


    },
    init:(req, res, next)=>{
        baidu_poi.removeAll();
        reptile_baidu_data.pageHandle(req, res, next);
    }
};
function final_reptile_baidu_data(req, res, next){
    reptile_baidu_data.init(req, res, next);
}
module.exports=reptile_baidu_data;