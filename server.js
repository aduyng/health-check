/**
 * Module dependencies.
 */

var path = require('path'),
    express = require('express'),
    session = require('express-session'),
    exphbs = require('express-handlebars'),
    env = process.env.NODE_ENV || 'development',
    _ = require('underscore'),
    _s = require('underscore.string'),
    config = require('./config')[env],
    app = express(),
    odm = require('./odm'),
    B = require('bluebird'),
    User = require('./odm/models/user'),
    pkg = require('./package.json'),
    logger = require('./logger'),
    hasher = require('password-hash'),
    MongoStore = require('connect-mongo')(session),
    bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));

// parse application/json
app.use(bodyParser.json());

app.use(session({
    secret: config.session.secret,
    store: new MongoStore({
        url: config.mongo.url
    })
}));

app.use('/screenshots', express.static(path.join(__dirname, '/data/screenshots'), {
    maxAge: (env === 'development') ? 1000 : 86400000 * 90
}));


app.engine('hbs', exphbs({
    defaultLayout: false,
    extname: '.hbs'
}));
app.set('view engine', 'hbs');


app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    
    if( req.session.userId ){
        User.findByIdAsync(req.session.userId, {password: 0})
        .then(function(user){
            req.user = user;
            next();
        });
        return;
    }
    
    next();
});

app.get('/', function(req, res) {
    res.render('home', {
        path: config.app.frontend || '/app',
        pkg: pkg,
        config: config,
        user: JSON.stringify(req.user || {})
    });
});


app.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    //hash the password using a hash algorithm
    var hashedPassword = hasher.generate(password);
    User.findOneAsync({
            username: username
        })
        .then(function(user) {
            if( _.isEmpty(user) ){
                res.send(404, {});
                return;
            }
            
            if( !hasher.verify(password, user.password)){
                res.send(400, {});
                return;
            }
            
            req.session.userId = user._id;
            res.send(_.omit(user.toJSON(), 'password'));
        });
});



B.all([odm.initialize()])
    .then(function() {
        var port = process.env.PORT || 5000;
        var server = app.listen(port, process.env.IP, function() {
            logger.info(_s.repeat('=', 80).red);
            logger.info('Server is listening at %s, port: %d', server.address().address, server.address().port);
        });
        var connection = require('./connection')(server);
        require('./resources/site')(connection);
        require('./resources/type')(connection);
    });