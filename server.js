/**
 * Module dependencies.
 */
"use strict";
var path = require('path'),
  express = require('express'),
  expressSession = require('express-session'),
  exphbs = require('express-handlebars'),
  env = process.env.NODE_ENV || 'development',
  _ = require('underscore'),
  L = require('./logger'),
  S = require('underscore.string'),
  config = require('./config'),
  app = express(),
  cookie = require('cookie'),
  cookieParser = require('cookie-parser'),
  odm = require('./odm'),
  B = require('bluebird'),
  User = require('./odm/models/user'),
  Site = require('./odm/models/site'),

  pkg = require('./package.json'),
  logger = require('./logger'),
  hasher = require('password-hash'),
  MongoStore = require('connect-mongo')(expressSession),
  bodyParser = require('body-parser'),
  sessionStore = new MongoStore({
    url: config.mongo.url
  }),
  session = expressSession({
    name: config.session.name,
    secret: config.session.secret,
    saveUninitialized: true,
    resave: true,
    store: sessionStore
  });
//var Site = require('./odm/models/site');
//Site.findAsync()
//.then(function(sites){
//    "use strict";
//    return _.map(sites, function(site){
//      if( site.name.indexOf('MOBILE') !== -1){
//        site.userId = '55527e06c32fdead383e4aba';
//      }else{
//        site.userId = '55527e06c32fdead383e4abb';
//      }
//      return site.saveAsync();
//    })
//  });

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
  extended: false
}));

// parse application/json
app.use(bodyParser.json());

app.use(session);

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

  if (req.session.userId) {
    User.findByIdAsync(req.session.userId, {password: 0})
      .then(function(user) {
        req.user = user;
        next();
      });
    return;
  }

  next();
});

app.get('/', function(req, res) {
  var Type = require('./odm/models/type');
  Type.findAsync()
    .then(function(types) {
      "use strict";
      res.render('home', {
        path: config.app.frontend || '/app',
        pkg: pkg,
        config: config,
        user: JSON.stringify(_.pick(req.user || {}, '_id', 'username')),
        types: JSON.stringify(types)
      });
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
      if (_.isEmpty(user)) {
        res.send(404, {});
        return;
      }

      if (!hasher.verify(password, user.password)) {
        res.send(400, {});
        return;
      }

      req.session.userId = user._id;
      res.send(_.omit(user.toJSON(), 'password'));
    });
});


B.all([odm.initialize()])
  .then(function() {
    var port = config.port;
    var server = app.listen(port, process.env.IP, function() {
      logger.info(S.repeat('=', 80).red);
      logger.info('Server is listening at %s, port: %d', server.address().address, server.address().port);
    });
    var socketIO = require('socket.io')(server);

    var dataIO = require('data.io')(socketIO);
    var name = 'api',
      siteRS = dataIO.resource(name);

    siteRS.on('connection', function(socket) {
      var next = this.async(), hs;
      L.warnAsync(__filename + '::connection(%s)', socket.id);

      try {
        hs = socket.handshake || socket.request;
        if (!hs.headers.cookie) {
          return next(new Error('Missing cookie headers'));
        }
        var cookies = cookie.parse(hs.headers.cookie);
        if (!cookies[config.session.name]) {
          return next(new Error('Missing cookie ' + config.session.name));
        }
        var sid = cookieParser.signedCookie(cookies[config.session.name], config.session.secret);
        if (!sid) {
          return next(new Error('Cookie signature is not valid'));
        }
        hs.sid = sid;
        sessionStore.get(sid, function(err, session) {
          if (err) return next(err);
          if (!session) return next(new Error('session not found'));
          hs.session = session;
          L.infoAsync(__filename + ' ::connection() joined user:%s', hs.session.userId);
          socket.join('user:' + hs.session.userId);
          next();
        });
      } catch (err) {
        console.error(err.stack);
        next(new Error('Internal server error'));
      }
    });

    siteRS.on('sync', function(sync) {
      L.infoAsync(__filename + ' ::sync(%s)', sync.action);
      // Prevent sync event from being broadcast to connected clients
      sync.stop();

      if (!_.contains(['read', 'list'], sync.action)) {
        L.infoAsync(__filename + ' ::sync() notify user:%s', sync.client.handshake.session.userId);
        sync.notify(sync.client.broadcast.to('user:' + sync.client.handshake.session.userId));
      }
    });

    siteRS.use('create', function(req, res) {
      L.infoAsync(__filename + ' ::create(%s)', name, req.data);
      new Model(req.data)
        .saveAsync()
        .spread(function(doc) {

          res.send(doc);

        });
    });

    siteRS.use('update', 'patch', function(req, res) {
      L.infoAsync(__filename + ' ::update(%s, %s)', req.data.model, JSON.stringify(req.data));
      switch (req.data.model) {
        case 'site':
          L.infoAsync('requestType: %s', req.data.requestType);
          switch (req.data.requestType) {
            case 'run':
              return Site.findOneAsync({
                _id: req.data.id
              })
                .then(function(doc) {
                  return doc.run()
                    .then(function() {
                      res.send(doc);
                    });
                });
              break;
            case 'stop':
              return Site.findOneAsync({
                _id: req.data.id
              })
                .then(function(doc) {
                  return doc.stop()
                    .then(function() {
                      res.send(doc);
                    });
                });
              break;
            case 'status-report':
              _.extend(doc, _.pick(req.data, 'status'));
              if (req.data.modules) {
                var modules = doc.modules || [];
                _.forEach(modules, function(module, index) {
                  _.every(req.data.modules, function(m) {
                    if (m._id === module._id.toHexString()) {
                      modules[index].logs = m.logs;
                      modules[index].status = m.status;
                      return false;
                    }
                    return true;
                  });
                });
                doc.modules = modules;
                doc.markModified("modules");
              }

              return doc.saveAsync()
                .spread(function(d) {
                  res.send(d);
                });
            default:
              return Site.findOneAsync({
                _id: req.data.id
              })
                .then(function(doc) {
                  _.extend(doc, _.omit(req.data, 'id', 'model'));
                  return doc.saveAsync()
                    .spread(function(doc) {
                      res.send(doc);
                    });
                });
          }
          break;
        default:
          res.send(404);
      }

    });

    siteRS.use('delete', function(req, res) {
      L.infoAsync(__filename + ' ::delete(%s, %s)', name, req.data.id);
      Model.findOneAsync({
        _id: req.data.id
      })
        .then(function(doc) {
          return doc.removeAsync();
        })
        .then(function(doc) {
          res.send(200);
        });
    });

    siteRS.use('read', function(req, res) {
      L.infoAsync(__filename + ' ::read(%s, %s)', name, req.data.id);
      Model.findOneAsync({
        _id: req.data.id
      })
        .then(function(doc) {
          res.send(doc);
        });
    });

    siteRS.use('list', function(req, res) {
      L.infoAsync(__filename + ' ::list(%s) with data: %s', name, JSON.stringify(req.data));

      switch (req.data.model) {
        case 'site':
          return Site.findAsync(_.extend(_.omit(req.data, 'model'), {userId: req.client.handshake.session.userId}), {})
            .then(function(docs) {
              res.send(docs);
            });
        default:
          res.send(404);
        //var Model = requireModel(req.data);
        //Model.findAsync(_.extend(_.omit(req.data, 'model'), {userId: req.client.handshake.session.userId}), {})
        //  .then(function(docs) {
        //    res.send(docs);
        //  });
      }
    });

    siteRS.use('status', function(req, res) {
      L.infoAsync(__filename + ' ::status(%s)', name, req.data);
      var Model = require('../odm/' + req.data.model);
      Model.findOneAsync({
        _id: req.data.id
      })
        .then(function(doc) {
          _.extend(doc, _.pick(req.data, 'status', 'logs'));
          return doc.saveAsync()
            .spread(function(doc) {
              res.send(doc);
            });
        });
    });

  });