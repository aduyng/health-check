/*global Backbone, _*/
define(function(require) {

    var Super = require('views/base'),
        Promise = require('bluebird'),
        accounting = require('accounting'),
        Template = require('hbs!./nav.tpl');

    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
    }

    View.prototype.render = function() {
        var that = this;

        var params = {
            id: this.id,
            appFullName: window.app.config.get('fullName')
        };

        this.$el.html(Template(params));
        this.mapControls();
        var events = {};

        this.delegateEvents(events);

        this.listenTo(window.app, 'page-rendered', this.onPageRendered.bind(this));
    };

    View.prototype.onPageRendered = function(page) {
        var that = this;
        try {
            that.controls.items.find('>li').removeClass('active');
            that.controls.items.find('[data-controller=' + page.options.controller + ']').addClass('active');
        }
        catch (e) {

        }
    };

    return View;
});