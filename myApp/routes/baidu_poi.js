/**
 * Created by bll on 16/6/17.
 */
var express = require('express');
var router = express.Router();
//var url = require('url'); //解析操作url
var superagent = require('superagent'); //这三个外部依赖不要忘记npm install
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
//var _ = require('underscore');
var baidu_poi=require("../server_api/baidu_poi.api");
var poiObj=require("../config/POI_config");
//var mapUrl = 'http://api.map.baidu.com/place/v2/search?query='+encodeURIComponent('银行')+
//    '&page_size=20&page_num=20&scope=2&output=json&region='
//    +encodeURIComponent('上海')+'&city_limit=true&&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z' ;

var reptile_baidu_data={
    mapUrls:[],
    success:[],
    /*
    *
    * 凯斯处理数据
    * */
    handleData:(mapUrl)=>{
        var rbd=reptile_baidu_data;
        //rbd.forEach(function(mapUrl){
            superagent.get(mapUrl)
                .end(function (err, response) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    var s = JSON.parse(response.text);
                    var results = s.results, dataAll = [];
                    if(results.length==0){
                        console.log(results,11);
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
                            poi: '银行'
                        };
                        dataAll.push(data);
                    });
                    console.log(dataAll);
                    baidu_poi.insert(dataAll);
                });
        //});
    },
    /*
    * 获取url
    * */
    getPoiUrls:function(){
        //var rbd=reptile_baidu_data;
        //console.log(poiObj.tag);
        //for(var k in poiObj.tag){
        //    var query =poiObj.tag[k].replace(/\s/g,"").split(",");
        //        t=0;
        //    console.log(query,111);
        //    query.forEach(function(v,k){
        //        //setInterval(function(){
        //            t++;
        //            var mapUrl = 'http://api.map.baidu.com/place/v2/search?query='+encodeURIComponent(v)+
        //                '&page_size=20&page_num='+t+'&scope='+poiObj.scope+'&output='+poiObj.output+'&region='
        //                +encodeURIComponent('上海')+'&city_limit='+poiObj.city_limit+'&&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z';
        //           console.log(mapUrl);
        //            //rbd.handleData(mapUrl);
        //        //},2000);
        //    })
        //
        //};

    }
};
function final_reptile_baidu_data(){
    reptile_baidu_data.getPoiUrls();
}
module.exports=final_reptile_baidu_data;