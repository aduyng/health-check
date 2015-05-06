define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        _ = require('underscore'),
        Model = Super.extend({
            name: 'type'
        });


    return Model;
});