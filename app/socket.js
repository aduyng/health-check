/*global Backbone, _*/
define(function(require) {
    var Backbone = require('backbone'),
        Super = Backbone.Model,
        moment = require('moment'),
        Model = Super.extend({});

    Model.prototype.initialize = function(options) {};

    Model.prototype.request = function(options) {
        if (!options) {
            options = {};
        }
        if (!options.url) {
            options.url = [options.controller || 'index',
                           options.action || 'index'].join('/');
            delete options.controller;
            delete options.action;
        }
        if (!options.data) {
            options.data = {};
        }

        var oldCallbacks = _.pick(options, 'success', 'error');

        var callbacks = {
            success: function(resp, textStatus, jqXHR) {
                if (!oldCallbacks.success || oldCallbacks.success(resp, textStatus, jqXHR) !== false) {
                    console.log(options.url, resp);
                }
            }.bind(this),
            error: function(jqXHR, status, errorThrown) {
                if (!oldCallbacks.error || oldCallbacks.error(jqXHR, status, errorThrown) !== false) {
                    console.error(jqXHR, status, errorThrown);
                    this.trigger('error', jqXHR, status, errorThrown);
                }
            }.bind(this)
        };

        _.extend(options, callbacks);
        return Backbone.ajax.call(this, options);
    };

    return Model;
});