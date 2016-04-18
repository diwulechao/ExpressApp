var mongodbinit = require('../modules/mongodbinit.js');
var moment = require('moment');
var comment = require('../modules/comment.js');

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

function round(num) {
    return Math.round(num * 100) / 100;
}

module.exports = {
    getMinuteData: function (time, res) {
        if (time == null) time = new Date().getTime();
        var data = [];
        query('c2',  { 'time': { $lt: parseFloat(time) } }, { time: -1 }, 97, function (docs) {
            docs.forEach(function (doc) {
                var point = {};
                point.y = round(doc.score);
                point.x = new Date(parseInt(doc.time));
                data.push(point);
            });

            data.reverse();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        });
    },

    getDailyData: function (date1, date2, res) {
        var ret = 'world';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(ret));
    },
    
    insertComment: function (user, value, res) {
        comment.insert(user,value);
        res.sendStatus(204);
    },
    
    queryComment: function (top, res) {
        comment.query(top, function (result) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        });
    }
}