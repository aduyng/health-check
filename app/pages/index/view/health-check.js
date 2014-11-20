/*global Backbone, _*/
define(function(require) {

    var Super = require('views/base'),
        B = require('bluebird'),
        TEMPLATE = require('hbs!./health-check.tpl');

    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);


    };

    View.prototype.render = function() {
        var that = this;

        // var params = {
        //     id: this.id,
        //     appFullName: window.app.config.get('fullName')
        // };

        // this.$el.html(Template(params));
        // this.mapControls();
        // var events = {};

        // this.delegateEvents(events);

        // this.listenTo(window.app, 'page-rendered', this.onPageRendered.bind(this));
    };

    View.prototype.renderFinalResult = function() {
       
    };

    return View;
});