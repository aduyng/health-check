/*global _, _s, Backbone*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Template = require('hbs!./status.tpl');


    var View = Super.extend({});

    View.Columns = Backbone.Collection.extend();

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {

                that.$el.html(Template({
                    id: that.id
                }));

                that.mapControls();

                var events = {};
                //events['click th.sortable'] = 'sortableColumnClickHandler';
                that.delegateEvents(events);

                // that.collection.on('sync add remove', that.renderBody.bind(that));
                // that.on('sort', that.sortHandler.bind(that));
            });

    };

    return View;
});