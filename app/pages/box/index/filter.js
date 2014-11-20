/*global _, _s*/
define(function(require) {
    var Super = require('views/page/list/filter'),
        B = require('bluebird'),
        Template = require('hbs!./filter.tpl');


    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
    };
    
    View.prototype.getFieldTemplate = function(){
        return Template;
    };

    return View;
});