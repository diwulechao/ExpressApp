var mongodbinit = require('./mongodbinit.js');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var moment = require('moment');

function insert(data, callback) {
    var collection = mongodbinit.getDb().collection('c2');
    collection.insert(data, function (err, result) {
        callback(result);
    });
};

function query(data, sort, limit, callback) {
    var collection = mongodbinit.getDb().collection('c2');
    collection.find(data).sort(sort).limit(limit).toArray(function (err, result) {
        callback(result);
    });
};

module.exports = {
    trigger: function () {
        request('https://www.my089.com/Loan/default.aspx?&ou=1&mit=1&oc=3&mat=1', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var doc = new dom().parseFromString(body);
                var nodes = xpath.select("//dd[@class='dd_2 mar_top_18']/span/text()", doc);
                var sum = 0;
                for (var i = 0; i < nodes.length; i++) {
                    sum += parseFloat(nodes[i].toString());
                }

                insert({ time: new Date().getTime(), score: sum / nodes.length }, function (result) {
                    console.log(sum / nodes.length);
                });
            }
        });
    },

    query: function (req, res) {
        var data = [];
        var labels = [];
        query({}, { time: 1 }, 97, function (docs) {
            docs.forEach(function (doc) {
                data.push(Math.round(doc.score * 100) / 100);
                var day = moment(new Date(parseInt(doc.time)));
                labels.push(day.utcOffset("+08:00").format("HH:mm"));
            });

            for (var i = 0; i < labels.length - 1; i++) {
                if (i % 4 > 0) labels[i] = '';
            }

            res.render('./hl', { doc: { 'data': data, 'labels': JSON.stringify(labels) }, title: '红岭创投净值标利率曲线' });
        });
    }
};