/*global _*/
define(function(require) {
    var Super = require('views/base'),
        Nav = require('views/nav'),
        Boostrap = require('bootstrap'),
        Bluebird = require('bluebird'),
        Template = require("hbs!views/layout.tpl");

    var Layout = Super.extend({
        el: 'body'
    });

    Layout.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);

        if (!options.app) {
            throw new Error("app must be passed!");
        }

        this.app = options.app;
    };

    Layout.prototype.render = function() {
        var that = this;
        var loggedIn = window.app.session && window.app.session.get('user');

        that.$el.html(Template({
            id: that.id,
            name: window.config.fullName,
            version: window.config.version,
            loggedIn: loggedIn
        }));
        
        that.mapControls();
        that.controls.container = $('#container');
        that.controls.mainContent = $('#main-content');
        

        that.nav = new Nav({
            el: that.controls.nav
        });
        that.nav.render();


        return Bluebird.resolve();

    };
    
    

    return Layout;
});