var myRouter = {};
var dataController = require('../controllers/dataController.js');

myRouter.router204 = function (app) {
    // generate 204 for android 5.0
    app.use('/generate_204', function (req, res) {
        res.sendStatus(204);
    });
}

myRouter.weatherRouter = function (app, weatherquery) {
    app.use('/trigger', function (req, res, next) {
        weatherquery.trigger(req, res);
    });

    app.use('/query', function (req, res, next) {
        weatherquery.query(req, res);
    });

    app.use('/', function (req, res, next) {
        weatherquery.query(req, res);
    });
}

myRouter.hlRouter = function (app, hlquery) {
    app.use('/hl/data', function (req, res, next) {
        if (req.query['type'] == 1) {
            dataController.getMinuteData(req.query['time'], res);
        }
        else if (req.query['type'] == 2) {
            dataController.getDailyData(req.query['date1'], req.query['date2'], res);
        }
        else {
            res.sendStatus(404);
        }
    });
    
    app.use('/hl', function (req, res, next) {
        hlquery.query(req, res);
    });
    
    app.use('/testt', function (req, res, next) {
        hlquery.test(req, res);
    });
}

module.exports = myRouter;