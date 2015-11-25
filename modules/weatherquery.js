var mongodbinit = require('./mongodbinit.js');
var hlHistory = require('./hlhistory.js');
var request = require('request');
var moment = require('moment');

function insert(data, callback) {
    var collection = mongodbinit.getDb().collection('c1');
    collection.insert(data, function (err, result) {
        callback(result);
    });
};

function remove(data, callback) {
    var collection = mongodbinit.getDb().collection('c1');
    collection.remove(data, function (err, result) {
        callback(result);
    });
};

function query(data, sort, limit, callback) {
    var collection = mongodbinit.getDb().collection('c1');
    collection.find(data).sort(sort).limit(limit).toArray(function (err, result) {
        callback(result);
    });
};

module.exports = {
    trigger: function (req, res) {
        request('http://www.stateair.net/mobile/post/1/1.html', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var position = body.indexOf('Most Recent AQI');
                var position2 = body.indexOf('</span>', position);
                var pagetime = body.substring(position, position2).trim();
                position = body.indexOf('<span class="aqi_', position);
                var aqi = body.substring(position + 20, body.indexOf('</span>', position + 20)).trim();
                remove({ type: 'weather' }, function (result) {
                    insert({ type: 'weather', time: moment().utcOffset('+0800').format("MMMM Do YYYY, h:mm:ss A"), str: aqi, pagetime: pagetime }, function (result) {
                        res.sendStatus(200);
                    });
                });
            }
        });

        hlHistory.trigger();
    },

    remove: function (req, res) {
        remove({}, function (result) {
            res.status(200).send('remove');
        });
    },

    query: function (req, res) {
        query({ type: 'weather' }, { time: -1 }, 1, function (docs) {
            docs.forEach(function (doc) {
                var str = "";
                str = doc.str;
                str = str.substr(0, str.indexOf('A')).trim();
                doc.num = parseInt(str);
                res.render('./aqi', { title: 'AQI', doc: doc });
            });
        });
    }
};