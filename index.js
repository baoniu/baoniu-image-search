var express = require('express');
var app = express();
var Config = require('./config.js');
var Bing = require('node-bing-api')({accKey: Config.accKey});
var mongoose = require('mongoose');

global.dbHelper = require('./common/dbHelper');

global.db = mongoose.connect(Config.db.production, function(err) {
    if(err){
        console.log('mongodb connect err',err ,'\n');
    }else{
        console.log('mongodb is connected');
    }
});
Date.prototype.format = function(fmt)
{ //author: meizz
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
}

app.set('port', (process.env.PORT || 5000));
app.set( 'view engine', 'html' );
app.engine( '.html', require( 'ejs' ).__express );
app.set('views', require('path').join(__dirname, 'views'));
app.use(express.static(require('path').join(__dirname, 'public')));


app.get('/', function(request, response) {
    response.render('pages/index', {host_domain: request.protocol + '://' + request.get('host')});
});

app.get('/api/imagesearch/', function (req, res) {
   res.send('please use /api/imagesearch/{ keyword }');
});

app.get('/api/imagesearch/:search', function(req, res) {

    var keyword = req.params.search;
    var offset = req.query.offset || 0;

    Bing.images(keyword,{ top: 10, skip: offset }, function (err, result, body) {
        if(body) {
            if(result.statusCode == 200) {
                var o = body.d.results.map(function (v) {
                    return {
                        url: v.MediaUrl,
                        snippet: v.Title,
                        thumbnail: v.Thumbnail.MediaUrl,
                        context: v.SourceUrl
                    }
                });

                res.send(o);
                var History = global.dbHelper.getModel('history');

                History.find({term: keyword}, function (err, doc) {
                    if(doc.length){
                        History.update({term: keyword}, {
                            $set: {
                                when: new Date().format("yyyy-MM-dd hh:mm:ss")
                            }
                        }, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('updated');
                            }
                        });
                    } else {
                        History.create({
                            term: keyword,
                            when: new Date().format("yyyy-MM-dd hh:mm:ss")
                        }, function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('inserted');
                            }
                        });
                    }
                });
                return true;
            }
        }
        res.send({error: err, error_code: result.statusCode});
    });
    
});
app.get('/api/latest/imagesearch', function (req, res) {
   global.dbHelper.getModel('history').find({}, {"_id": 0, '__v':0}, {'sort': {'when': -1}}, function (err,v) {
       if(err) {
            res.send('error connect');
           return;
       }
       res.send(v);
   }) 
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


