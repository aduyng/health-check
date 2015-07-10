define(function(require) {
  var Backbone = require('backbone'),
    _ = require('underscore'),
    connection = require('connection'),
    B = require('bluebird'),
    Super = Backbone.Model;

  var Model = Super.extend({
    url: function() {
      return '/rest/' + this.name + (this.id ? '/' + this.id : '');
    },
    idAttribute: '_id',
    name: 'api'
  });

  Model.prototype.initialize = function(options) {
    var that = this,
      name = _.result(this, 'name');
    Super.prototype.initialize.call(this, options);

    that.connection = connection;
    that.resource = B.promisifyAll(connection.resource('api'));
  };

  Model.prototype.sync = function(method, model, options) {
    var that = this;
    options || (options = {});

    var success = options.success || function() {
      };
    var error = options.error || function() {
      };

    delete options.success;
    delete options.error;

    if (method === 'read' && !model.id) {
      method = 'list';
    }
    options.data = _.extend(options.data || {}, model.toJSON() || {}, options.attrs || {}, {
      id: model.id,
      model: _.result(this, 'name')
    });
    return new B(function(resolve, reject) {
      that.resource.sync(method, model, options, function(err, res) {
        if (err) {
          error(err);
          return reject(err);
        }
        success(res);
        return resolve(res);
      });
    });
  };

  Model.prototype.request = function(method, data) {
    var that = this;
    return new B(function(resolve, reject) {
      that.resource.sync(method, data, function(err, res) {
        if (err) {
          return reject(err);
        }
        return resolve(res);
      });
    });
  };

  Model.prototype.toJSON = function() {
    var data = Super.prototype.toJSON.apply(this, arguments);
    if (!data.id && this.id) {
      data.id = this.id;
    }
    return data;
  };

  return Model;
});