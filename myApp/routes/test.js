/**
 * Created by bll on 16/6/16.
 */
var express = require('express');
var router = express.Router();
var url = require('url'); //解析操作url
var superagent = require('superagent'); //这三个外部依赖不要忘记npm install
var cheerio = require('cheerio');
var eventproxy = require('eventproxy');
var targetUrls = ['https://cnodejs.org/'];


router.get('/', function(req, res, next) {
    var ep = new eventproxy();
    ep.after('topic_html', targetUrls.length, function(topics){
        // topics 是个数组，包含了 40 次 ep.emit('topic_html', pair) 中的那 40 个 pair
        //.map
        //console.log(topics);
        topics = topics.map(function(topicPair){
            //use cheerio
            var topicUrl = topicPair[0];
            var topicHtml = topicPair[1];
            res.send(topicHtml);
            var $ = cheerio.load(topicHtml);
            return ({
                title: $('#topic_list .topic_title').text().trim(),
                href: $('#topic_list .topic_title').attr('href')
            });
        });
        //outcome
        //console.log('outcome:');
        //console.log(topics);
    });
    targetUrls.forEach(function (topicUrl) {
        superagent.get(topicUrl)
            .end(function (err, response) {
                //res.writeHead(200, {'Content-Type': 'text/html'});
                //res.send(response.text);
                var $ = cheerio.load(response.text);
                //res.end();
                //通过CSS selector来筛选数据
                $('#topic_list .topic_title').each(function (idx, element) {
                    //console.log(element.attribs.title);
                    ep.emit('topic_html', [topicUrl, response.text]);
                    //res.send(element);
                    //res.send(response.text);
                });
            });
    })
});

var mapUrl ='http://api.map.baidu.com/place/v2/SearchInBound?query='+encodeURIComponent('银行')+
    '&page_size=20&page_num=19&scope=2&output=json&region='+encodeURIComponent('盐城')+
    '&city_limit=true&&output=json&ak=9L2GOOak2gq437N2jPsXUekcd0KHTK3Z' ;
router.get('/map', function(req, res, next) {
    superagent.get(mapUrl)
        .end(function (err, response) {
            if(err){
                res.send("ERROR:"+err);
                return;
            }
            var s=JSON.parse(response.text);
            //console.log(s);
            res.send("<pre>"+response.text+"</pre>");
            //res.send(response.text);
        });
});

var url2='http://map.baidu.com/?newmap=1&reqflag=pcmap&biz=1&from=webmap&' +
    'da_par=direct&pcevaname=pc4.1&hitxijiangtest=1&qt=con&from=webmap&c=289&' +
    'wd='+encodeURIComponent('中餐厅')+'&wd2='+encodeURIComponent('上海')+'&pn=0&nn=&db=1&sug=0&addr=0&pl_data_type=bank&pl_sub_type=%E9%93%B6%E8%A1%8C&' +
    'pl_price_section=0%2C%2B&pl_sort_type=&pl_sort_rule=0&pl_discount2_section=0%2C%2B&' +
    'pl_groupon_section=0%2C%2B&pl_cater_book_pc_section=0%2C%2B&pl_hotel_book_pc_section=0%2C%2B&pl_ticket_book_flag_section=0%2C%2B&' +
    'pl_movie_book_section=0%2C%2B&pl_business_type=bank&pl_business_id=&da_src=pcmappg.poi.page&on_gel=1&' +
    'src=7&gr=3&l=12&tn=B_NORMAL_MAP&u_loc=13517614.535513,3637184.295415&ie=utf-8&b=(13485486.535513,3602560.295415;13505966.535513,3671808.295415)&t=1466733411952';
var url2Arr=[];
for(var i=0;i<100;i++){
    var urlStr='http://map.baidu.com/?newmap=1&reqflag=pcmap&biz=1&from=webmap&' +
        'da_par=direct&pcevaname=pc4.1&hitxijiangtest=1&qt=con&from=webmap&c=289&' +
        'wd='+encodeURIComponent('中餐厅')+'&wd2='+encodeURIComponent('上海')+'&pn='+i+'+&nn='+i*10+'&db=1&sug=0&addr=0&pl_data_type=bank&pl_sub_type=%E9%93%B6%E8%A1%8C&' +
        'pl_price_section=0%2C%2B&pl_sort_type=&pl_sort_rule=0&pl_discount2_section=0%2C%2B&' +
        'pl_groupon_section=0%2C%2B&pl_cater_book_pc_section=0%2C%2B&pl_hotel_book_pc_section=0%2C%2B&pl_ticket_book_flag_section=0%2C%2B&' +
        'pl_movie_book_section=0%2C%2B&pl_business_type=bank&pl_business_id=&da_src=pcmappg.poi.page&on_gel=1&' +
        'src=7&gr=3&l=12&tn=B_NORMAL_MAP&u_loc=13517614.535513,3637184.295415&ie=utf-8&b=(13485486.535513,3602560.295415;13505966.535513,3671808.295415)&t=1466733411952';
    url2Arr.push(urlStr);
}

function sj(url,fn){


}
router.get('/map2', function(req, res, next) {
    var l=0;
    url2Arr.forEach(function(url,k){
        superagent.get(url)
            .end(function (err, response) {
                if(err){
                    console.log("ERROR:"+err);
                    superagent.get(url)
                        .end(function (err, response) {
                            var s=JSON.parse(response.text);
                            console.log(s.content);
                            if(s.content!=undefined){
                                console.log(s.content.length);
                                l+=s.content.length;
                            }else{
                                return;
                            }
                            //res.send(s.content);
                            //res.send(response.text);
                            console.log(l,8282828);
                        });
                    return;
                }
                //for(i in response.text){
                //    console.log(response.text[i]+"\n");
                //}
                var s=eval(response.text);
                console.log(s.content);
                if(s.content!=undefined){
                    console.log(s.content.length);
                    l+=s.content.length;
                }else{
                    return;
                }
                //res.send(s.content);
                //res.send(response.text);
                console.log(l,9090);

            });
    });
});
router.get('/map2test', function(req, res, next) {
        var l=0;
        superagent.get("http://map.baidu.com/?qt=ugcPhotos&poiId='+uid+'&type=life&pageIndex=1&pageCount=100")
            .end(function (err, response) {
                if(err){
                    res.send("ERROR:"+err);
                    return;
                }
                //console.log(response);
                //for(i in response.text){
                //    console.log(response.text[i]+"\n");
                //}
                //console.log(response);
                //var s=JSON.parse(response.text);
                //console.log(s);
                //if(s.content!=undefined){
                //    console.log(s.content.length);
                //    l+=s.content.length;
                //}else{
                //    return;
                //}
                res.send(response);
                //res.send(response.text);
            });

});

router.get("/baidu", function(req, res, next) {
    var baidu_poi = require('./baidu_poi');
    baidu_poi.init(req, res, next);
});
//router.get("/baidu_new", function(req, res, next) {
    var baidu_poi = require('./baidu_poi_new');
    baidu_poi.init();
//});
//router.get("/remove", function(req, res, next) {
//    var baidu_poi = require('../server_api/baidu_poi.api');
//    baidu_poi.removeAll();
//});
//router.get("/find", function(req, res, next) {
//    var baidu_poi = require('./baidu_poi');
//    baidu_poi.handleDetailStore(req,res,next);
//
//
//});
module.exports = router;