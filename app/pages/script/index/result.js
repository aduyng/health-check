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


    
    
    return View;


});