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
console.log(tagArr.length);
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
    geoArr:[],//暂无用处
    allGet:false, //请求成功判断，暂无用处
    /*每访问一次，加1，判断url是否已全部请求*/
    allGetNum:0,
    allDetailNum:0,
    /*
    * 所有的detail链接,uid,所有的detail数据
    * */
    detailUrls:[],
    detailUids:[],
    detailAllData:[],
    /*
    * 处理经纬度
    * */
    handleGetGeo:function(req,res,next){
        var rbdn=reptile_baidu_data_new;
        rbdn.rectUrlArr=[];
        rbdn.geoLatArr=[];
        rbdn.geoLngArr=[];
        rbdn.geoArr=[];
        rbdn.RectAllData=[];
        rbdn.urlRequest=[];
        rbdn.rangeRequest=[];
        rbdn.allGetNum=0;
        rbdn.allDetailNum=0;
        if(rbdn.getAllDataIs==true){
            return;
        }
        var la=parseFloat(rbdn.minLat).toFixed(4),ln=parseFloat(rbdn.minLng).toFixed(4);
        rbdn.geoLatArr.push(la);
        rbdn.geoLngArr.push(ln);
        var t=setInterval(function(){
            console.log(la,ln,rbdn.geoLatArr.length,rbdn.geoLngArr.length);
            la=(parseFloat(la)+parseFloat(0.3)).toFixed(4);
            ln=(parseFloat(ln)+parseFloat(0.3)).toFixed(4);
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
        // rbdn.geoArr=[];rbdn.rectUrlArr=[];rbdn.rangeRequest=[];
        tagArr.forEach(function(tag,k){
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
                            var url="http://api.map.baidu.com/place/v2/search?query="+ encodeURIComponent(tag)+"&page_size=20&" +
                                "page_num="+rbdn.pageNumArr[k]+"&scope=2&scope=2&bounds="+geo+"&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z";
                            rg.urlArr.push(url);
                            if(k == rbdn.pageNumArr.length-1){
                                rbdn.rangeRequest.push(rg);
                            }
                            //rbdn.handleUrl2FromRect(url,geo,res);
                            //console.log(rbdn.rangeRequest.length,(rbdn.geoLatArr.length-1)*(rbdn.geoLngArr.length-1),"qweqwe");

                        }
                        if(rbdn.rangeRequest.length==(rbdn.geoLatArr.length-1)*(rbdn.geoLngArr.length-1)*tagArr.length){
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
        });
        //res.writeHead(200, {'Content-Type': 'text/html'});
    },
    /*
    * 处理url,得到数据
    * */
    handleRectUrl:(res)=>{
        var rbdn=reptile_baidu_data_new;
        rbdn.allGet=false;
        console.log(rbdn.rangeRequest.length);
           // res.send(rbdn.rangeRequest) ;
        rbdn.rangeRequest.forEach(function(reqObj,k){
            var reqSuccess=[];
            // reqObj.urlArr.forEach(function(url,i){
            //     console.log(reqObj.urlArr);
            //     // rbdn.superagentUrl(url,reqObj,i,res);
            // });
            for(var i in reqObj.urlArr){
                rbdn.superagentUrl(reqObj.urlArr[i],reqObj,i,res);
            }
        });
    },
    superagentUrl:(url,obj,page,res)=>{
        var rbdn=reptile_baidu_data_new;
        // if(rbdn.allGet==true)return;
        superagent.get(url)
            .end(function (err, response) {
                rbdn.urlRequest.push(true);
                if(err){
                    console.log(err);
                    rbdn.superagentUrl(url,obj);
                    return;
                }
                //rbdn.urlRequest.push(true);
                // if(obj.value==true){
                //     return;
                // }
                rbdn.allGetNum++;
                if(response.text==undefined||response.text.length==0){
                    // obj.value=true;
                    console.log('return1');
                    return;
                }
                // console.log(url);
                // console.log(JSON.parse(response.text));
                var results=JSON.parse(response.text).results;
                if(results.length==0){
                    console.log('return2');
                    rbdn.updatePoiList();
                    return;
                }
                results.forEach(function(v,k){
                    rbdn.RectAllData.push(v);
                });
                rbdn.updatePoiList();
            });
    },
    /*
    * 获取成功，更新数据
    * */
    updatePoiList:()=>{
        var rbdn=reptile_baidu_data_new;
        console.log(rbdn.RectAllData.length,rbdn.allGetNum,rbdn.rangeRequest.length*rbdn.pageNumArr.length,"kkkk",page);
        if(rbdn.allGetNum==rbdn.rangeRequest.length*rbdn.pageNumArr.length){
            console.log('获取数据成功，正在更新数据库......');
            baidu_poi_new.insertData( rbdn.RectAllData,function(){
                //console.log(allSuccess.length,rbdn.rangeRequest.length,allSuccess,"opoppoopo");
                console.log('数据库更新完毕,开始进行数据详情更新.....');
                rbdn.getDetailUrl(res);
            });
        }
    },
    /*
    * TODO::数据的详情处理
    * 获取数据的detail的url
    * */
    getDetailUrl:(res)=>{
        var rbdn=reptile_baidu_data_new;
        rbdn.detailUids=[];rbdn.detailUrls=[];
        rbdn.RectAllData.forEach((rd,k)=>{
            rbdn.detailUids.push(rd.uid);
        });
        rbdn.detailUids.forEach((uid,k)=>{
            var url='http://api.map.baidu.com/place/v2/detail?uid='+uid+
                '&output=json&scope=2&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z';
            rbdn.detailUrls.push(url);
        });
        console.log(rbdn.detailUrls.length);
        // res.send(rbdn.detailUrls);

        rbdn.detailUrls.forEach((url,i)=>{
            console.log('获取次数：'+i);
            rbdn.superagentdetailUrl(url);
        });
        // rbdn.superagentdetailUrl();
    },
    /*
    * 处理url获取数据
    * */
    superagentdetailUrl:(url)=>{
        var rbdn=reptile_baidu_data_new;
        // if(rbdn.allGet==true)return;
        superagent.get(url)
            .end(function (err, response) {
                rbdn.urlRequest.push(true);
                if(err){
                    console.log(err);
                    rbdn.superagentdetailUrl(url);
                    return;
                }
                //rbdn.urlRequest.push(true);
                // if(obj.value==true){
                //     return;
                // }
                rbdn.allDetailNum++;
                console.log("开始获取数据......,"+rbdn.allDetailNum+"次");
                if(response.text==undefined||response.text.length==0){
                    // obj.value=true;
                    console.log('return1');
                    return;
                }
                // console.log(url);
                // console.log(JSON.parse(response.text));
                var result=JSON.parse(response.text).result;
                if(result.length==0){
                    console.log('return2');
                    rbdn.updatePoiDetail();
                    return;
                }
                rbdn.detailAllData.push(result);
                rbdn.updatePoiDetail();
            });
    },
    updatePoiDetail:()=>{
        var rbdn=reptile_baidu_data_new;
        console.log(rbdn.detailAllData.length,rbdn.allDetailNum,rbdn.detailUrls.length,"yyyy");
        if(rbdn.allDetailNum==rbdn.detailUrls.length){
            console.log('获取详情数据成功，正在更新数据库......');
            baidu_poi_new.insertDetailData( rbdn.detailAllData,function(){
                //console.log(allSuccess.length,rbdn.rangeRequest.length,allSuccess,"opoppoopo");
                console.log('数据详情更新完毕......');
                console.log('全部更新完成......');
            });
        }
    },
    /*
    * 处理rect的url(新)(废除)
    *
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
    init:(req, res, next)=>{
        //baidu_poi.removeAll();
        //baidu_poi.detailRemoveAll();
        //reptile_baidu_data_new.pageHandle(req, res, next);
        //reptile_baidu_data_new.handleGetUrlArr();

        //reptile_baidu_data_new.handleDetailStore(req,res,next);

        reptile_baidu_data_new.handleGetGeo(req,res,next);
    }
};
// function final_reptile_baidu_data(req, res, next){
//     reptile_baidu_data_new.init(req, res, next);
// }
// var indexOf = function(val) {
//     for (var i = 0; i < this.length; i++) {
//         if (this[i] == val) return i;
//     }
//     return -1;
// };
// var remove = function(val) {
//     var index = this.indexOf(val);
//     if (index > -1) {
//         this.splice(index, 1);
//     }
// };
module.exports=reptile_baidu_data_new;