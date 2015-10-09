/* global Backbone, _*/
define(function(require) {
    var Super = Backbone.Collection,
        Model = require('../models/base'),
        connection = require('connection'),
        B = require('bluebird'),
        Collection = Super.extend({
            model: Model
        });

    Collection.prototype.initialize = function(options) {
        var that = this;
        var url, name = (this.name || this.model.prototype.name);

        Super.prototype.initialize.call(this, options);
        if (_.isEmpty(_.result(this, 'url'))) {
            url = _.result(this.model.prototype, 'url');
            if (!_.isEmpty(url)) {
                this.url = url;
            }
            else {
                this.url = '/rest' + (this.name || this.model.prototype.name)
            }
        }
        this.connection = connection;
        this.resource = connection.resource(name);


        that.resource.subscribe('create', function(data) {
            that.add(data);
        });

        that.resource.subscribe('update', 'patch', function(data, action) {
            var item = that.get(data._id);
            if (item) {
                item.set(data, {
                    silent: true
                });
                item.trigger('sync', item, data);
            }

        });

        that.resource.subscribe('delete', function(data) {
            that.remove(data._id);
        });
    };

    Collection.prototype.sync = function(method, model, options) {
        var that = this;
        options || (options = {});

        var success = options.success || function() {};
        var error = options.error || function() {};

        delete options.success;
        delete options.error;

        if (method === 'read' && !model.id) method = 'list';
        

        return new B(function(resolve, reject) {
            that.resource.sync(method, model, options, function(err, res) {
                if (err) {
                    error(err);
                    return reject(err);
                }
                success(res);
                resolve(res);
            });
        });
    };

    return Collection;
});