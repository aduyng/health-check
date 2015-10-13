/*global Backbone, _*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Template = require('hbs!./nav.tpl');

    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
    }

    View.prototype.render = function() {
        var that = this;

        var params = {
            id: this.id,
            appFullName: window.app.config.get('fullName'),
            path: window.app.config.get('baseUrl')
        };

        this.$el.html(Template(params));
        this.mapControls();

        var events = {};
        events['keyup ' + that.toId('query')] = 'onQueryKeyup';
        events['click ' + that.toId('new')] = 'onNewClick';
        events['click ' + that.toId('run-all')] = 'onRunAllClick';
        events['click ' + that.toId('stop')] = 'onStopClick';

        this.delegateEvents(events);
    };

    View.prototype.onQueryKeyup = _.debounce(function(event) {
        this.trigger('search', {
            query: this.controls.query.val().trim()
        });
    }, 300);

    View.prototype.onNewClick = function(event) {
        this.trigger('add-new-site', event);
    };

    View.prototype.onRunAllClick = function(event) {
        this.trigger('run-all-sites', event);
    };

    View.prototype.onStopClick = function(event) {
        this.trigger('stop-all-sites', event);
    };

    return View;
});