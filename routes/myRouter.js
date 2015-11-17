var myRouter = {};
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

module.exports = myRouter;