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
                query('c2', {}, { time: -1 }, 96, function (docs) {
                    var cnt = 0;
                    var sum = 0;
                    docs.forEach(function (doc) {
                        sum += Math.round(doc.score * 100) / 100;
                        cnt++;
                    });

                    // avg for today
                    var avg = sum / cnt;
                    insert('c3', { 'score': avg, 'date': date }, function (result) { });
                });
            }
        });
    },

    query: function (req, res) {
        var dataSet = { 'data1': {}, 'data2': {} };

        async.parallel([
            function (callback) {
                var data = [];
                var labels = [];
                query('c2', {}, { time: -1 }, 97, function (docs) {
                    docs.forEach(function (doc) {
                        data.push(Math.round(doc.score * 100) / 100);
                        var day = moment(new Date(parseInt(doc.time)));
                        labels.push(day.utcOffset("+08:00").format("HH:mm"));
                    });

                    for (var i = 0; i < labels.length - 1; i++) {
                        if (i % 4 > 0) labels[i] = '';
                    }

                    dataSet.data1.data = data.reverse();
                    dataSet.data1.labels = labels.reverse();
                    callback(null, null);
                });
            },

            function (callback) {
                var data = [];
                var labels = [];
                query('c3', {}, { 'date': -1 }, 100, function (docs) {
                    docs.forEach(function (doc) {
                        data.push(Math.round(doc.score * 100) / 100);
                        labels.push(doc.date);
                    });

                    for (var i = 0; i < labels.length - 1; i++) {
                        if (i % 2 > 0) labels[i] = '';
                    }

                    dataSet.data2.data = data.reverse();
                    dataSet.data2.labels = labels.reverse();
                    callback(null, null);
                });
            }
        ],

        function (error, results) {
            res.render('./hl', { doc: { 
                'data': dataSet.data1.data, 
                'labels': JSON.stringify(dataSet.data1.labels), 
                'data2': dataSet.data2.data, 
                'labels2': JSON.stringify(dataSet.data2.labels) }, title: '红岭创投净值标利率曲线' });
            }
        );
    }
};