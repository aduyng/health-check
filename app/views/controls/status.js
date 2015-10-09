/*global _, _s, Backbone*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Template = require('hbs!./status.tpl');


    var View = Super.extend({});

    View.Columns = Backbone.Collection.extend();

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);

        this.errors = options.errors;
        this.yesterday = options.yesterday;
        this.weeks = options.weeks;
        this.percentage = options.percentage;
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {
                

                that.$el.html(Template({
                    id: that.id,
                    errors: that.errors,
                    yesterday: that.yesterday,
                    weeks: that.weeks,
                    percentage: that.percentage
                }));

                that.mapControls();

                var events = {};
                that.delegateEvents(events);
            });

    };

    return View;
});