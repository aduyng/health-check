define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        _ = require('underscore'),
        Model = Super.extend({
            name: 'user'
        });

    Model.prototype.isLoggedIn = function() {
        return !this.isNew();
    };


    return Model;
});