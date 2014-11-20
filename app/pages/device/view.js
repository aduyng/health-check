/*global _, _s*/
define(function(require) {
    var Super = require('views/page/view'),
        B = require('bluebird'),
        Model = require('models/box'),
        FIELDS = require('hbs!./view/fields.tpl');

    var Page = Super.extend({});

    Page.prototype.getModelClass = function() {
        return Model;
    };

    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };

    Page.prototype.getPageName = function() {
        return 'Box';
    };
    
    return Page;


});