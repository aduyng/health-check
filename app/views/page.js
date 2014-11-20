/*global _, Ladda, NProgress*/
define(function (require) {
    var Super = require('./base'),
        Toastr = require('toastr'),
        Bluebird = require('bluebird'),
        Page = Super.extend({
        });


    Page.prototype.initialize = function (options) {
        //super(options)
        Super.prototype.initialize.call(this, options);

        this.app = options.app;
        this.layout = options.app.layout;
        this.router = options.app.router;
        this.session = options.app.session;
        this.socket = options.app.socket;
        this.toast = Toastr;
        this.config = window.app.config;
        this.params = options.params;


        this.toast.options = {
            "closeButton": false,
            "debug": false,
            "positionClass": "toast-bottom-right",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

    };

    Page.prototype.start = function () {
        this.trigger('start');
        return Promise.resolve();
    };

    Page.prototype.render = function () {
        return this.ready();
    };

    Page.prototype.ready = function () {
        this.trigger('ready');
        return Bluebird.resolve();
    };

    Page.prototype.cleanUp = function () {

    };

    Page.prototype.close = function () {
        this.cleanUp();
        this.undelegateEvents();
        this.$el.empty();
    };

    Page.prototype.reload = function (options, navOptions) {
        var params = _.extend(this.options.params, {rand: new Date().getTime()}, options);
        var url = this.generateHash(this.options.controller, this.options.action, params);
        var navOpts = _.extend({trigger: true, replace: true}, navOptions);
        this.router.navigate(url, navOpts);
    };

    Page.prototype.generateHash = function (controller, action, params) {
        var parts = [controller, action];
        var keys = _.keys(params);

        _.forEach(keys, function (index) {
            var value = params[index];

            if (value !== undefined && value !== '') {
                parts.push(index);
                parts.push(encodeURIComponent(value));
            }
        });
        return parts.join('/');
    };

    Page.prototype.backButtonClickHandler = function (event) {
        event.preventDefault();
        this.back();


    };

    Page.prototype.back = function () {
        if (this.backUrl) {
            this.goTo(this.backUrl, {trigger: true});
            return;
        }
        window.history.back();
    };

    Page.prototype.setBackLink = function () {
        this.session.set('backUrl', window.location.hash);
    };

    Page.prototype.startWait = function (event) {
        if (event && event.currentTarget) {
            this.ladda = Ladda.create(event.currentTarget);
            this.ladda.start();
        }

        NProgress.start();

    };

    Page.prototype.incWait = function (event) {
        NProgress.inc();
    };

    Page.prototype.stopWait = function (event) {
        if (this.ladda) {
            this.ladda.stop();
            delete this.ladda;
        }
        NProgress.done();
    };

    Page.prototype.goTo = function (hash, options) {
        var url = hash;

        if (_.isObject(hash)) {
            // console.log(hash, _.omit(hash, 'controller', 'action'));
            url = this.generateHash(hash.controller || this.options.controller,
                    hash.action || this.options.action, _.omit(hash, 'controller', 'action'));
        }
        this.router.navigate(url, options || {trigger: true});
    };


    Page.prototype.error = function (message, title) {
        var that = this;
        var msg = 'Unknown Error!';
        var caption = 'Error!';
        console.error(message, message.stack, title);
        return (function () {
            return new Promise(function (resolve, reject) {
                var show = function (message, title) {
                    that.toast.error(message, title, {
                        onHidden: function () {
                            resolve();
                        }
                    });
                };

                if ($.type(message) === "string") {
                    msg = message
                } else if (message.promise) {
                    var err = message.responseJSON || {};

                    switch (err.type) {
                        case 'ValidationError':
                            msg = '<ul>' + _.map(err.data, function (value, field) {
                                return '<li>' + (_.isArray(value) ? value.join(', ') : value) + '</li>';
                            }).join('') + '</ul>';
                            caption = err.message;
                            break;
                        default:
                            if (_.isObject(err)) {
                                msg = _.map(err, function (value, key) {
                                    return value;
                                }).join('<br />');
                            }
                    }

                }
                show(msg, caption);
            });
        })();
    };

    Page.prototype.success = function (message, title) {
        var that = this;
        var f = function () {
            return new Promise(function (resolve, reject) {
                that.toast.success(message, title, {
                    onHidden: function () {
                        resolve();
                    }
                });
            });
        };
        return f();
    };

    return Page;


});