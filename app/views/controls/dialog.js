/*global _, Backbone*/

define(function(require) {
    var Super = require('../base'),
        Template = require('hbs!./dialog.tpl');

    var View = Super.extend({
        className: 'modal fade'
    });
    View.instanceCount = 0;

    View.prototype.initialize = function(options) {
        var that = this;

        Super.prototype.initialize.call(that, options);

        if (!options.buttons) {
            that.buttons = new Backbone.Collection();
            that.buttons.add({
                id: 'ok',
                label: 'OK',
                iconClass: 'fa fa-check-circle',
                buttonClass: 'btn-primary',
                align: 'left'
            });

            that.buttons.add({
                id: 'cancel',
                label: 'Cancel',
                iconClass: 'fa fa-times',
                buttonClass: 'btn-default',
                align: 'left',
                autoClose: true
            });
        }
        else {
            that.buttons = (options.buttons instanceof Backbone.Collection) ? options.buttons : new Backbone.Collection(options.buttons)
        }

        //make sure that required attributes are passed in all buttons
        that.buttons.forEach(function(button, index) {
            if (!button.id) {
                throw new Error("Button " + index + " does not have an id!");
            }
        });


        if (this.options.autoOpen !== false) {
            this.open();
        }
        this.instanceCount = ++View.instanceCount;
    };

    View.prototype.open = function() {
        var that = this;

        this.$el.html(Template({
            id: this.getId(),
            sizeClass: this.options.sizeClass,
            title: this.options.title || '',
            headerClass: this.options.title ? '' : 'hide',
            leftButtons: _.map(
                that.buttons.filter(function(button) {
                    return !button.get('align') || button.get('align') == 'left';
                }), function(button) {
                    return button.toJSON();
                }),
            rightButtons: _.map(
                that.buttons.filter(function(button) {
                    return button.get('align') === 'right';
                }), function(button) {
                    return button.toJSON();
                })
        }));
        this.mapControls();

        //render body
        var msg = this.options.body || this.options.message;

        if (msg) {
            if (msg instanceof Super) {
                msg.render();
                msg.$el.appendTo(this.controls.body);
            }
            else {
                this.controls.body.html(msg);
            }
        }

        this.$el.appendTo($('body'));

        this.$el.modal({
            keyboard: false,
            show: true,
            backdrop: 'static'
        });

        this.$el.on('shown.bs.modal', function() {
            if (this.options.body && this.options.body instanceof Super && this.options.body.focus) {
                this.options.body.focus();
            }
            that.$el.css('z-index', 1040 + that.instanceCount+1);
            that.$el.next().css('z-index', 1040 + that.instanceCount);
        }.bind(this));
        this.$el.on('hidden.bs.modal', function() {
            this.remove();
            View.instanceCount--;
        }.bind(this));

        var events = {};
        events['click ' + that.toClass('button')] = 'onButtonClickHandler';
        this.delegateEvents(events);
    };


    View.prototype.onButtonClickHandler = function(event) {
        var that = this;
        event.preventDefault();
        var e = $(event.currentTarget);
        var model = that.buttons.get(e.data('id'));

        that.trigger(model.id, model);
        if (model.get('autoClose')) {
            that.close();
        }
    };


    View.prototype.close = function() {
        this.$el.modal('hide');
    };

    Object.defineProperty(View.prototype, 'body', {
        get: function() {
            if (this.options.body instanceof Super) {
                return this.options.body;
            }
            return this.controls.body;
        }
    });

    return View;
});