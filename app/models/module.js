/* global app*/
define(function(require) {
    var Super = require('./base'),
        _ = require("underscore"),
        B = require('bluebird');

    var Model = Super.extend({
        name: 'module'
    });
   
    
    return Model;
});