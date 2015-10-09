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
        var modules = _.map(that.get('modules') ||[], function(m){
            m.status = ExecutionStatus.ID_SCHEDULED;
            return m;
        });

        return that.save({
                requestType: 'run',
                modules: modules,
                userId: window.app.user.id,
                lastExecutedAt: new Date() //TODO may need to change to moment(new Date()).unix()
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
