/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Dialog = require('views/controls/dialog'),
        TEMPLATE = require('hbs!./edit.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
    };


    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {
                that.$el.html(TEMPLATE({
                    id: that.id,
                    data: that.model.toJSON()
                }));
                that.mapControls();

            })
            .then(function() {
                var events = {};
                that.delegateEvents(events);
            });
    };



    return View;
});