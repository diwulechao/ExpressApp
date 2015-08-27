var mongodbinit = require('./mongodbinit.js');

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
        insert([{ a: 1, time: new Date() }]
            , function (result) {
                res.status(200).send('Inserted 3 documents into the document collection');
            });
    },

    remove: function (req, res) {
        remove({}, function (result) {
            res.status(200).send('remove');
        });
    },

    query: function (req, res) {
        query({}, { time: -1 }, 1, function (result) {
            res.status(200).send(JSON.stringify(result));
        });
    }
};