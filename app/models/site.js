define(function(require) {
  var Super = require('./base'),
    B = require('bluebird'),
    ExecutionStatus = require('./execution-status'),
    Modules = require('collections/module'),
    _ = require('underscore'),
    Model = Super.extend({
      name: 'site'
    });

  Model.prototype.run = function() {
    var that = this;
    return that.save({
      requestType: 'run'
    })
      .then(function(result) {
        that.set('requestType', undefined);
        return B.resolve(result);
      });
  };

  Model.prototype.duplicate = function() {
    var clonedModel = new Model(_.omit(this.toJSON(), 'id', '_id'));
    clonedModel.set('name', 'Copy of ' + clonedModel.get('name'));
    return B.resolve(clonedModel.save())
      .then(function() {
        return clonedModel;
      });
  };

  Model.prototype.stop = function() {
    var that = this;
    return that.save({
      requestType: 'stop'
    })
      .then(function(result) {
        that.set('requestType', undefined);
        return B.resolve(result);
      });
  };


  return Model;
});