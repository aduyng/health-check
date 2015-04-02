/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Select2 = require('select2'),
        TEMPLATE = require('hbs!./site-edit.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        Super.prototype.initialize.call(that, options);
    };


    View.prototype.render = function() {
        var that = this;

        that.$el.html(TEMPLATE({
            id: that.id,
            data: that.model.toJSON()
        }));
        that.mapControls();

        that.controls.tags.select2({
            tags: [],
            tokenSeparators: [",", " "]
        });

        var events = {};
        that.delegateEvents(events);

        return B.resolve();
    };

    View.prototype.val = function(value) {
        var that = this;
        if (!value) {
            return that.serialize();
        }

        return this;
    };


    return View;
});