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

router.get("/baidu", function(req, res, next) {
    var baidu_poi = require('./baidu_poi');
    baidu_poi.init(req, res, next);
});
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