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
var reptile_baidu_data={
    finalUrlArr:[],
    finalUrlSuccess:[],
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
    * 开始处理URl
    * */
    handleGetUrlArr:function(req, res, next){
        var rbd=reptile_baidu_data;
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
        },1000);
    },
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
    /*
    * 获取url
    * */
    getPoiUrls:(page_num,req, res, next)=>{
        var rbd=reptile_baidu_data;
        //rbd.success[page_num]=true;
        //for(var k in poiObj.tag){
        //        var mapUrl = 'http://api.map.baidu.com/place/v2/search?query='+encodeURIComponent(poiObj.tag[k])+
        //            '&page_size=20&page_num='+page_num+'&scope='+poiObj.scope+'&output='+poiObj.output+'&region='
        //            +encodeURIComponent('上海')+'&city_limit='+poiObj.city_limit+'&&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z'
        //        rbd.handleData(mapUrl,k,req, res, next);
        //};
        for(var k in tagArr) {
            var urlStr = 'http://map.baidu.com/?newmap=1&reqflag=pcmap&biz=1&from=webmap&' +
                'da_par=direct&pcevaname=pc4.1&hitxijiangtest=1&qt=con&from=webmap&c=289&' +
                'wd=' + encodeURIComponent(tagArr[k]) + '&wd2=' + encodeURIComponent('上海') + '&pn=' + page_num + '&nn=' + page_num * 10 + '&db=1&sug=0&addr=0&pl_data_type=bank&pl_sub_type=%E9%93%B6%E8%A1%8C&' +
                'pl_price_section=0%2C%2B&pl_sort_type=&pl_sort_rule=0&pl_discount2_section=0%2C%2B&' +
                'pl_groupon_section=0%2C%2B&pl_cater_book_pc_section=0%2C%2B&pl_hotel_book_pc_section=0%2C%2B&pl_ticket_book_flag_section=0%2C%2B&' +
                'pl_movie_book_section=0%2C%2B&pl_business_type=bank&pl_business_id=&da_src=pcmappg.poi.page&on_gel=1&' +
                'src=7&gr=3&l=12&tn=B_NORMAL_MAP&u_loc=13517614.535513,3637184.295415&ie=utf-8&b=(13485486.535513,3602560.295415;13505966.535513,3671808.295415)&t=1466733411952';
            //rbd.handleData(urlStr, k, req, res, next);
            rbd.finalUrlArr.push(urlStr);
        }

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
                detail_info_arr.push(v.primary_uid);
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
                    //console.log(response.text);
                    //if(response.text==undefined)return;
                    var $ = cheerio.load(response.text);
                    var other={};
                    $("#detailInfo").find(".bd>dl").each(function(index,dom){
                        var other_msg= $(dom).find("dd").eq(index).text();
                        var other_msg_field= $(dom).find("dt").eq(index).find('span').text();
                        other[other_msg_field]=other_msg;
                    });
                    var otherStr=JSON.stringify(other);
                    //console.log(otherStr,2);
                    superagent.get('http://map.baidu.com/?qt=ugcPhotos&poiId='+uid+'&type=life&pageIndex=1&pageCount=100')
                        .end(function (err, response2) {
                            if (err) {
                                reptile_baidu_data.defeated.push(page);
                                console.log(err, reptile_baidu_data.defeated,222222);
                                reptile_baidu_data.handleDetailUrls(page);
                                return;
                            }
                            var photo="",comments="";
                            //console.log(response2.text,3);
                            try{
                                var s=JSON.parse(response2.text).data;
                            }catch(err){
                                console.log('detail的第二步发生错误!!'+err);
                                return;
                            }

                            if(s!=undefined){
                                photo=JSON.stringify(s);
                            }
                            superagent.get('http://map.baidu.com/?qt=comments&poiId='+uid+'&type=life&pageIndex=1&pageCount=10000')
                                .end(function (err, response3) {
                                    if (err) {
                                        reptile_baidu_data.defeated.push(page);
                                        console.log(err, reptile_baidu_data.defeated,33333);
                                        reptile_baidu_data.handleDetailUrls(page);
                                        return;
                                    }
                                    if(s!=undefined){
                                        try{
                                            comments=JSON.stringify(s);
                                        }catch(err){
                                            console.log('detail的第三步发生错误!!'+err);
                                            return;
                                        }
                                    }
                                    var data={
                                        uid:uid,
                                        other_msg:otherStr,
                                        photo:photo,
                                        comments:comments
                                    };
                                    detail_collect.push(data);
                                    //console.log(detail_collect.length,num,detail_collect.length,(count-parseInt(count/20)*20));
                                    if(detail_collect.length==num||detail_collect.length==(count-parseInt(count/20)*20)){
                                        console.log('开始insert');
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
            //if(rbp.success.length==100){
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
                            console.log(page,'page');
                            return;
                        }
                        console.log(page,reptile_baidu_data.detailSuccess[page-1],Math.ceil(count/20),888888);
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
                            rbp.getDetailLink(20,page,t,count,req,res,next);
                        }
                    },1000);
                    clearInterval(s);
                    return;
                })
            //}
        },1000);
    },
    init:(req, res, next)=>{
        //baidu_poi.removeAll();
        //baidu_poi.detailRemoveAll();
        //reptile_baidu_data.pageHandle(req, res, next);
        //reptile_baidu_data.handleGetUrlArr();
        reptile_baidu_data.handleDetailStore(req,res,next);
    }
};
function final_reptile_baidu_data(req, res, next){
    reptile_baidu_data.init(req, res, next);
}
module.exports=reptile_baidu_data;