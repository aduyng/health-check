/*global _, _s*/
define(function(require) {
    var Super = require('views/page/list/result'),
        B = require('bluebird'),
        Table = require('./table');


    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
    };
    
    View.prototype.getTableClass = function(){
        return Table;
    };
    
    View.prototype.getTableOptions = function(){
        var that = this;
        return {
            boxCollection: that.options.boxCollection,
            scriptCollection: that.options.scriptCollection,
            scriptBoxCollection: that.options.scriptBoxCollection,
            deviceCollection: that.options.deviceCollection,
            typeCollection: that.options.typeCollection,
            statusCollection: that.options.statusCollection
        };
    };
    

    
    
    return View;


});