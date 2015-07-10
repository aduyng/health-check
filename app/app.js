/* global Backbone*/

define(function(require) {

  //require the layout
  var Super = Backbone.Model,
    Layout = require('./views/layout'),
    Router = require('./router'),
    Config = require('./config'),
    Socket = require('./socket'),
    Toastr = require('toastr'),
    User = require('models/user'),
    Types = require('collections/type'),
    B = require('bluebird');

  var App = Super.extend({});

  App.prototype.initialize = function(options) {
    Super.prototype.initialize.call(this, options);
    this.user = new User(window.config.user);
  };


  App.prototype.initConfig = function() {
    this.config = new Config(window.config);
    return B.resolve();
  };

  App.prototype.initRouter = function() {
    this.router = new Router({
      app: this
    });
    return B.resolve();
  };

  App.prototype.initSocket = function() {
    this.socket = new Socket({
      app: this
    });

    this.socket.on('error', function(jqXHR, statusCode, errorThrown) {
      var options = {
        code: statusCode,
        message: jqXHR.responseText
      };
      try {
        options = JSON.parse(jqXHR.responseText);
      }
      catch (e) {
      }
      Toastr.error(options.message);
    });

    return Promise.resolve();
  };

  App.prototype.initLayout = function() {
    this.layout = new Layout({
      app: this
    });

    return B.resolve();
  };

  App.prototype.run = function() {
    var that = this;

    return B.all([
      this.initConfig(),
      this.initLayout(),
      this.initSocket(),
      this.initRouter()
    ]).then(function() {
      return that.layout.render();
    }).then(function() {
      return that.router.start();
    });
  };


  Object.defineProperty(App.prototype, 'router', {
    get: function() {
      return this.get('router');
    },
    set: function(val) {
      this.set('router', val);
    }
  });

  Object.defineProperty(App.prototype, 'layout', {
    get: function() {
      return this.get('layout');
    },
    set: function(val) {
      this.set('layout', val);
    }
  });


  Object.defineProperty(App.prototype, 'config', {
    get: function() {
      return this.get('config');
    },
    set: function(val) {
      this.set('config', val);
    }
  });

  Object.defineProperty(App.prototype, 'socket', {
    get: function() {
      return this.get('socket');
    },
    set: function(val) {
      this.set('socket', val);
    }
  });
  Object.defineProperty(App.prototype, 'user', {
    get: function() {
      return this.get('user');
    },
    set: function(val) {
      this.set('user', val);
    }
  });


  return App;
});