var mongodbinit = require('./mongodbinit.js');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var moment = require('moment');
var async = require('async');

function insert(col, data, callback) {
    var collection = mongodbinit.getDb().collection(col);
    collection.insert(data, function (err, result) {
        callback(result);
    });
};

function query(col, data, sort, limit, callback) {
    var collection = mongodbinit.getDb().collection(col);
    collection.find(data).sort(sort).limit(limit).toArray(function (err, result) {
        callback(result);
    });
};

module.exports = {
    trigger: function () {
        // 24 hours
        request('https://www.my089.com/Loan/default.aspx?&ou=1&mit=1&oc=3&mat=1', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var doc = new dom().parseFromString(body);
                var nodes = xpath.select("//dd[@class='dd_2 mar_top_18']/span/text()", doc);

                var array = [];
                for (var i = 0; i < nodes.length; i++) {
                    var val = parseFloat(nodes[i].toString());
                    if (val <= 15 && val >= 7) {
                        array.push(val);
                    }
                }

                var min = 16.0, max = 5.0, sum = 0, result = 0;
                for (var i = 0; i < array.length; i++) {
                    if (array[i] > max) max = array[i];
                    if (array[i] < min) min = array[i];
                    sum += array[i];
                }
                
                if (array.length > 0) {
                    if (array.length>=3) {
                        result = (sum-min-max)/(array.length-2);
                    }
                    else {
                        result = sum/array.length;
                    }
                    
                    insert('c2', { time: new Date().getTime(), score: result }, function (result) {});
                }
                    
            }
        });

        // daily
        var date = moment().utcOffset("+08:00").add(-1, 'days').format("YYYY-MM-DD");
        query('c3', { 'date': date }, {}, 1, function (result) {
            if (result == null || result.length == 0) {
                var startTimestamp = parseInt(moment().utcOffset("+08:00").add(-1, 'days').hour(0).minute(0).second(0).format('x'));
                var endTimestamp = parseInt(moment().utcOffset("+08:00").add(-1, 'days').hour(23).minute(59).second(59).format('x'));
                    
                query('c2', { time: { $gt: startTimestamp, $lt: endTimestamp } }, {}, 200, function (docs) {
                    var firstPoint = 2448427377023, lastPoint = 0;
                    var max = 0, min = 100, start = 0, end = 0;

                    docs.forEach(function (doc) {
                        if (doc.time >= startTimestamp && doc.time <= endTimestamp) {
                            if (min > doc.score) min = doc.score;
                            if (max < doc.score) max = doc.score;
                            if (firstPoint > doc.time) {
                                firstPoint = doc.time;
                                start = doc.score;
                            }
                            if (lastPoint < doc.time) {
                                lastPoint = doc.time;
                                end = doc.score;
                            }
                        }
                    });

                    insert('c3', { 'date': date,'min':min,'max':max,'start':start,'end':end }, function (result) { });
                });
            }
        });
    },

    query: function (req, res) {
        var dataSet = { 'data1': {}, 'data2': {} };

        async.parallel([
            function (callback) {
                var data = [];
                query('c2', {}, { time: -1 }, 97, function (docs) {
                    docs.forEach(function (doc) {
                        var point = {};
                        point.y = Math.round(doc.score * 100) / 100;
                        point.x = new Date(parseInt(doc.time));
                        data.push(point);
                    });

                    dataSet.data1.data = data.reverse();
                    callback(null, null);
                });
            },

            function (callback) {
                var data = [];
                query('c3', {}, { 'date': -1 }, 100, function (docs) {
                    docs.forEach(function (doc) {
                        var point = {};
                        point.y = [doc.start,doc.max,doc.min,doc.end];
                        point.x = doc.date
                        data.push(point);
                    });

                    dataSet.data2.data = data.reverse();
                    callback(null, null);
                });
            }
        ],

        function (error, results) {
            res.render('./hl', { doc: { 
                'data': dataSet.data1.data, 
                'data2': dataSet.data2.data }, title: '红岭创投净值标利率曲线' });
            }
        );
    }
};