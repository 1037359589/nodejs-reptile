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
                    rbd.handleData(mapUrl,k,req, res, next);
                    return;
                }
                var s = JSON.parse(response.text);
                var results = s.results, dataAll = [];
                //console.log(response);
                if(results.length==0||results==undefined){
                    //console.log('成功')
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
        //rbd.success[page_num]=true;
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
        for(var i=0;i<100;i++){
            reptile_baidu_data.getPoiUrls(i,req, res, next);
            reptile_baidu_data.success.push(true);
        }
    },
    /*
    * 获取detial链接
    * */
    getDetailLink:(num,page,t,count,req,res,next)=>{
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
            reptile_baidu_data.handleDerailUrl(detail_info_arr,page,num,count,req,res);
        });
    },
    /*
    * 处理url
    * */
    handleDerailUrl:(detail_info_arr,page,num,count,req,res)=>{
        var detail_collect=[];
        detail_info_arr.forEach(function(uid,k){
            superagent.get('http://map.baidu.com/detail?qt=ninf&uid='+uid+'&detail=life')
                .end(function (err, response) {
                    if (err) {
                        reptile_baidu_data.defeated.push(page);
                        console.log(err, reptile_baidu_data.defeated,111111);
                        reptile_baidu_data.handleDetailUrls(page);
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
                                reptile_baidu_data.handleDetailUrls(page);
                                return;
                            }
                            var photo="",comments="";
                            if(JSON.parse(response.text).data!=undefined){
                                photo=JSON.stringify(JSON.parse(response.text).data);
                            }
                            superagent.get('http://map.baidu.com/?qt=comments&poiId='+uid+'&type=life&pageIndex=1&pageCount=10000')
                                .end(function (err, response) {
                                    if (err) {
                                        reptile_baidu_data.defeated.push(page);
                                        console.log(err, reptile_baidu_data.defeated,33333);
                                        reptile_baidu_data.handleDetailUrls(page);
                                        return;
                                    }
                                    if(JSON.parse(response.text).data!=undefined){
                                        comments=JSON.stringify(JSON.parse(response.text).data);
                                    }
                                    var data={
                                        uid:uid,
                                        other_msg:otherStr,
                                        photo:photo,
                                        comments:comments
                                    };
                                    detail_collect.push(data);
                                    //console.log(detail_collect.length,num);
                                    if(detail_collect.length==num||detail_collect.length==(count-parseInt(count/20)*20)){
                                        reptile_baidu_data.detailSuccess.push(true);
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
        var rbp=reptile_baidu_data;
        /*
         * 计算总数量
         * */

            var s=setInterval(function(){

                if(rbp.success.length==100){
                    baidu_poi.getPoiCount(function(count){
                        console.log(rbp.success.length,count);
                    //console.log(rbp.success.length/100,poiObj.tag.length);
                    //clearInterval(s);
                        var page=0;
                        console.log("开始detail");
                        /*
                         * 定时处理detail
                         * */
                        var t=setInterval(function(){
                            //Math.ceil(count/20)
                            if(page==0){
                                rbp.getDetailLink(20,page,t,count,req,res,next);
                                page=1;
                                return;
                            }

                            console.log(page,reptile_baidu_data.detailSuccess[page-1],Math.ceil(count/20));
                            if(reptile_baidu_data.detailSuccess[page-1]==true&&reptile_baidu_data.detailSuccess[page-1]!=undefined){
                                if(page>=Math.ceil(count/20)){
                                    /*更新成功!!*/
                                    console.log(reptile_baidu_data.detailSuccess.length,Math.ceil(count/20),999999);
                                    console.log('数据更新成功!!');
                                    //rbp.handleDetailUrl();
                                    res.send(rbp.defeated);
                                    clearInterval(t);
                                    return;
                                }
                                page++;
                                console.log(page,222);
                                rbp.getDetailLink(20,page,t,req,res,next);
                            }
                        },1000);
                        clearInterval(s);
                        return;
                    })
                }
            },10000);
    },
    init:(req, res, next)=>{
        baidu_poi.removeAll();
        baidu_poi.detailRemoveAll();
        reptile_baidu_data.pageHandle(req, res, next);
        reptile_baidu_data.handleDetailStore(req,res,next);
    }
};
function final_reptile_baidu_data(req, res, next){
    reptile_baidu_data.init(req, res, next);
}
module.exports=reptile_baidu_data;