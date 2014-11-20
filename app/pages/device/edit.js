/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/page/edit'),
        B = require('bluebird'),
        FIELDS = require('hbs!./edit/fields.tpl'),
        Model = require('models/box'),
        Select2 = require('select2');


    var Page = Super.extend({});

    Page.prototype.getPageName = function() {
        return 'Box' + (this.model.id ? (' #' + this.model.id) : '');
    };

    Page.prototype.getModelClass = function() {
        return Model;
    };

    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };
    return Page;


});