var azure = require('azure-storage');
var tableSvc = azure.createTableService('DefaultEndpointsProtocol=https;AccountName=portalvhds2cs8z8pb23x18;AccountKey=zDKFOvhDcg6ePG6i5GaP3W7CJ/98pktO8xVjv0oNHnziZuChhVvmZ7/rfQ75tKHE6WCtitYuH9PdM7YC4gnVJQ==');
var moment = require('moment');
var sanitizer = require('sanitizer');

function creatTable() {
    tableSvc.createTableIfNotExists('mytable', function(error, result, response) {
        if (!error) {
            // Table exists or created
        }
    });
};

function insert(user, value) {
    var entGen = azure.TableUtilities.entityGenerator;
    var task = {
        PartitionKey: entGen.String('1'),
        RowKey: entGen.String((9999999999999 - moment().valueOf()).toString()),
        comment: entGen.String(sanitizer.escape(value)),
        user: entGen.String(sanitizer.escape(user))
    };

    tableSvc.insertEntity('mytable', task, function(error, result, response) {
        if (!error) {
            // Entity inserted
        }
    });
};

function query(top, cb) {
    var query = new azure.TableQuery().where('PartitionKey eq ?', '1');
    if (top >= 0) {
        query = query.top(top);
    }

    tableSvc.queryEntities('mytable', query, null, function(error, result, response) {
        if (!error) {
            cb(result);
        }
    });
}

module.exports = {
    insert: function(user, value) {
        insert(user, value);
    },

    query: function(top, cb) {
        query(top, cb);
    }
};