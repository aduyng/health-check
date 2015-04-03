/**
 * Module dependencies.
 */
var path = require('path'),
    express = require('express'),
    exphbs = require('express-handlebars'),
    env = process.env.NODE_ENV || 'development',
    _ = require('underscore'),
    _s = require('underscore.string'),
    config = require('./config')[env],
    app = express(),
    odm = require('./odm'),
    B = require('bluebird'),
    pkg = require('./package.json'),
    load = require('express-load'),
    logger = require('./logger');



app.use('/app', express.static(path.join(__dirname, '/app'), {
    maxAge: (env === 'development') ? 1000 : 86400000 * 90
}));

//app.use(express.favicon());
app.use(express.basicAuth('cssmobile', 'mobile10'));
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());

app.engine('hbs', exphbs({
    defaultLayout: false,
    extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(app.router);

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

app.get('/', function(req, res) {
    res.render('home', {
        path: config.app.frontend || '/app',
        pkg: pkg,
        config: config
    });
});


load('controllers').then('routes').into(app);

B.all([odm.initialize()])
    .then(function() {
        var port = process.env.PORT || 5000;
        var server = app.listen(port, process.env.IP, function() {
            logger.info(_s.repeat('=', 80).red);
            logger.info('Server is listening at %s, port: %d', server.address().address, server.address().port);
        });
        var connection = require('./connection')(server);
        require('./resources/site')(connection);
        // require('./resources/module')(connection);
    });