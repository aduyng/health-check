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
    db = require('./db'),
    B = require('bluebird'),
    pkg = require('./package.json'),
    load = require('express-load'),
    logger = require('./logger');



app.use('/resources', express.static(path.join(__dirname, '/app/dist'), {
    maxAge: 86400000
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
        path: ['resources', pkg.version].join('/'),
        // path: ['//development.vrt.divshot.io', pkg.version].join('/'),
        pkg: pkg,
        config: config
    });
});


load('controllers').then('routes').into(app);

var port = process.env.PORT || 5000;
var server = app.listen(port, process.env.IP, function() {
    logger.info(_s.repeat('=', 80).red);
    logger.info('Server is listening at %s, port: %d', server.address().address, server.address().port);
});

// /****************************************** BACKGROUND PROCESSES *****************************************/
// runInTheBackground();

// function runInTheBackground() {
//     checkExecutionQueue();
//     console.log('background process started.');
// }

// function checkExecutionQueue() {
//     logger.info('checkExecutionQueue() started');
    
//     Execution.forge()
//         .query(function(qb) {
//             qb.orderBy('createdAt', 'asc');
//             qb.where('statusId', ExecutionStatus.ID_SCHEDULED);
//         })
//         .fetch()
//         .then(function(execution) {
//             if (execution) {
//               logger.info('Found ' + execution.id + '. Will schdule to run now...' );
//                 return execution.run();
//             }
//             return B.resolve();
//         })
//         .catch(function(e){
//             logger.error(e);
//         })
//         .finally(function() {
//             _.delay(checkExecutionQueue, 5000);
//         });

// }