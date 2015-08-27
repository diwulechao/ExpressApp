var MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

// Connection URL
var url = 'mongodb://MongoLab-4:941k5WQ6x_oFzQW8fvB2OHnTdtDELoztEdEOyd_QgI4-@ds042128.mongolab.com:42128/MongoLab-4';
var mongoDb;
// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    mongoDb = db;
});

module.exports = {
    getDb: function () {
        return mongoDb;
    }
};