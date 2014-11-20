/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        NProgress = require('nprogress'),
        HEADER = require('hbs!./edit/header.tpl'),
        FIELDS = require('hbs!./edit/fields.tpl'),
        FORM = require('hbs!./edit/form.tpl'),
        BUTTONS = require('hbs!./edit/buttons.tpl'),
        Ladda = require('ladda'),
        Template = require('hbs!./edit.tpl');

    var Page = Super.extend({});

    Page.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);

        this.model = this.getModel();
    };

    Page.prototype.getModel = function() {
        var Model = this.getModelClass();
        return new Model({
            id: this.options.params.id
        });
    };

    Page.prototype.getModelClass = function() {
        throw new Error("You must define Page.prototype.getModelClass()");
    };


    Page.prototype.render = function() {
        var that = this;

        B.resolve()
            .then(function() {
                return that.preRender();
            })
            .then(function() {
                if (!that.model.isNew()) {
                    return that.model.fetch();
                }
                return B.resolve();

            })
            .then(function() {
                return that.prepareForOutput();
            })
            .then(function(data) {
                that.$el.html(Template({
                    id: that.id,
                    header: that.getHeaderHtml(data),
                    form: that.getFormHtml(data)
                }));

                that.mapControls();

                that.initializeEvents();
            })
            .then(function() {
                return that.postRender();
            })
            .then(function() {
                that.ready();
            });

    };

    Page.prototype.getPageName = function() {
        return '';
    };

    Page.prototype.preRender = function() {
        return B.resolve();
    };

    Page.prototype.postRender = function() {
        return B.resolve();
    };
    Page.prototype.getHeaderTemplate = function() {
        return HEADER;
    };

    Page.prototype.getHeaderHtml = function(data) {
        var that = this;
        var template = that.getHeaderTemplate();

        return template({
            id: that.id,
            data: data,
            name: that.getPageName()
        });
    };

    Page.prototype.getFormHtml = function(data) {
        var that = this;
        var template = that.getFormTemplate();

        return template({
            id: that.id,
            fields: that.getFieldsHtml(data),
            buttons: that.getButtonsHtml(data)
        });
    };

    Page.prototype.getFormTemplate = function() {
        return FORM;
    };

    Page.prototype.getFieldsHtml = function(data) {
        var that = this;
        var template = that.getFieldsTemplate();
        return template({
            id: that.id,
            data: data
        });
    };

    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };


    Page.prototype.getButtonsHtml = function(data) {
        var that = this;
        var template = that.getButtonsTemplate();

        return template({
            id: that.id,
            data: data
        });
    };

    Page.prototype.getButtonsTemplate = function() {
        return BUTTONS;
    };



    Page.prototype.initializeEvents = function() {
        var that = this;
        var events = {};
        events['click ' + that.toId('save')] = 'saveButtonClickHandler';
        events['click ' + that.toId('cancel')] = 'cancelButtonClickHandler';
        _.extend(events, that.getExtraEvents());
        that.delegateEvents(events);
    };

    Page.prototype.getExtraEvents = function() {

    };

    Page.prototype.prepareForOutput = function() {
        return this.model.toJSON();
    };


    Page.prototype.cancelButtonClickHandler = function(event) {
        var that = this;
        event.preventDefault();
        that.back();
    };

    Page.prototype.saveButtonClickHandler = function(event) {
        this.save(event);
    };

    Page.prototype.save = function(event) {
        var that = this;
        var isNew = that.model.isNew();
        event.preventDefault();

        var params = _.extend(that.serialize());

        var l = Ladda.create(event.currentTarget);
        l.start();
        NProgress.start();

        B.resolve(that.model.save(params))
            .then(function() {
                if( isNew ){
                    that.goTo(that.options.controller + '/view/id/' + that.model.id);
                }else{
                    that.back();
                }
                
            })
            .finally(function() {
                l.stop();
                NProgress.done();
            });
        return false;
    };


    return Page;


});