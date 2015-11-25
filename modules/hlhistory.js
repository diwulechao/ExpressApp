var mongodbinit = require('./mongodbinit.js');
var request = require('request');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

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
        res.render('./hl', { doc: { 'str': '1', 'pagetime': '2', 'time': '3' } });
    }
};