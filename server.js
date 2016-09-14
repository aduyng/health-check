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
    
    // var Sites = require('./odm/models/site');
    // Sites.findAsync()
    // .then(function (sites) {
    //     return _.map(sites, function (site) {
    //       var str = site.tags.toLowerCase();
    //       if(str.indexOf('prod') > -1) {
    //           site.stats.error.total = 0 ;
    //         site.stats.error.months.total = 0 ;
    //         site.stats.error.months.dates = [
    //             {'date': 10, 'total': 0 },
    //             {'date': 11, 'total': 0 },
    //             {'date': 0, 'total': 0 },
    //             {'date': 1, 'total': 0 },
    //             {'date': 2, 'total': 0 },
    //             {'date': 3, 'total': 0 },
    //             {'date': 4, 'total': 0 },
    //             {'date': 5, 'total': 0 },
    //             {'date': 6, 'total': 0 },
    //             {'date': 7, 'total': 0 },
    //             {'date': 8, 'total': 0 },
    //             {'date': 9, 'total': 0 }
    //         ];
    //         site.stats.error.weeks.total = 0 ;
    //         site.stats.error.weeks.dates = [
    //             {'date': 33, 'total': 0 },
    //             {'date': 34, 'total': 0 },
    //             {'date': 35, 'total': 0 },
    //             {'date': 36, 'total': 0 },
    //             {'date': 37, 'total': 0 },
    //             {'date': 38, 'total': 0 },
    //             {'date': 39, 'total': 0 },
    //             {'date': 40, 'total': 0 },
    //             {'date': 41, 'total': 0 },
    //             {'date': 42, 'total': 0 }];
    //         site.stats.error.days.total = 0 ;
    //         site.stats.error.days.dates = [
    //             {'date':281, 'total': 0 },
    //             {'date':282, 'total': 0 },
    //             {'date':283, 'total': 0 },
    //             {'date':284, 'total': 0},
    //             {'date':285, 'total': 0 }, // day befor
    //             {'date':286, 'total': 0 }, // yesterdy
    //             {'date':287, 'total': 0 }
    //         ];
    //         //site.stats.total = 372;
    //         site.markModified('stats');
    //         return site.saveAsync();
    //       } else {
            
    //       }
    //     });
    // })

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json());

app.use(session({
    secret: config.session.secret,
    store: new MongoStore({
        url: config.mongo.url
    })
}));


app.use('/app', express.static(path.join(__dirname, '/app'), {
    maxAge: (env === 'development') ? 1000 : 86400000 * 90
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
        require('./resources/status')(connection);
        require('./resources/stat')(connection);
    });