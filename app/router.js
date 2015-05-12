define(function(require) {
    var NProgress = require('nprogress'),
        Backbone = require('backbone'),
        _ = require('underscore'),
        S = require('underscore.string'),
        moment = require('moment'),
        Toastr = require('toastr'),
        B = require('bluebird'),
        Router = Backbone.Router.extend({
            routes: {
                "*action": 'defaultAction'
            }
        });
    Router.prototype.initialize = function(options) {
        Backbone.Router.prototype.initialize.call(this, options);
        this.app = options.app || console.error("app must be passed!");
    };

    Router.prototype.defaultAction = function(url) {
        var that = this;
        if (!url) {
            url = 'index/index';
        }
        if (that.app.page) {
            //clean up
            that.app.page.close();
            //trigger an event
            that.app.trigger('closed');
        }
        
        if(url !== 'index/login' && !that.app.user.isLoggedIn() ){
            url = 'index/login';
            that.navigate(url, {trigger: true});
            return;
        }

        //split the url to controller/action
        var parts = url.split('/');
        var controller = parts[0] || 'index';
        var action = parts[1] || 'index';
        var params = {
            now: moment().unix()
        };
        if (parts.length > 2) {
            var i;
            for (i = 2; i < parts.length; i += 2) {
                params[S.camelize(parts[i])] = parts[i + 1];
            }
        }
        NProgress.start();

        var pagePath = 'pages/' + controller + '/' + action;

        require([pagePath], function(Page) {
            NProgress.inc();
            that.app.page = new Page({
                el: that.app.layout.controls.mainPanel,
                controller: controller,
                action: action,
                app: that.app,
                params: params
            });

            var actionContainer = that.app.layout.controls.mainPanel.parent();
            actionContainer.attr('id', 'action-' + action);
            var controllerContainer = actionContainer.parent();
            controllerContainer.attr('id', 'controller-' + controller);

            NProgress.inc();
            B.resolve(that.app.page.render()).then(function() {
                NProgress.done();
                that.app.trigger('page-rendered', that.app.page);
            });

        }.bind(this));

    };
    Router.prototype.parseUrlParams = function(url) {
        if (!url) {
            url = window.location.hash;
        }
        var parts = url.split('/');
        var params = {};

        if (parts.length > 2) {
            var i;
            for (i = 2; i < parts.length; i += 2) {
                params[parts[i]] = decodeURIComponent(parts[i + 1]);
            }
        }
        return params;
    };

    Router.prototype.start = function() {
        Backbone.history.start();
    };


    return Router;
});