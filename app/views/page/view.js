/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        NProgress = require('nprogress'),
        HEADER = require('hbs!./view/header.tpl'),
        FIELDS = require('hbs!./view/fields.tpl'),
        FORM = require('hbs!./view/form.tpl'),
        BUTTONS = require('hbs!./view/buttons.tpl'),
        Ladda = require('ladda'),
        Dialog = require('views/controls/dialog'),
        Template = require('hbs!./view.tpl');

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
    
    Page.prototype.getTemplate = function(){
        return Template;  
    };


    Page.prototype.render = function() {
        var that = this;

        B.resolve(that.fetch())
            .then(function() {
                return that.preRender();
            })
            .then(function() {
                var data = that.prepareForOutput();

                that.$el.html(that.getTemplate()({
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
    
    Page.prototype.fetch = function(){
        return this.model.fetch();
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
            action: that.options.action, 
            controller: that.options.controller,
            data: data
        });
    };

    Page.prototype.getButtonsTemplate = function() {
        return BUTTONS;
    };

    Page.prototype.initializeEvents = function() {
        var that = this;
        var events = {};
        events['click ' + that.toId('back')] = 'backButtonClickHandler';
        events['click ' + that.toId('delete')] = 'deleteButtonClickHandler';
        _.extend(events, that.getExtraEvents());
        that.delegateEvents(events);
    };

    Page.prototype.getExtraEvents = function() {

    };

    Page.prototype.prepareForOutput = function() {
        return this.model.toJSON();
    };
    
    Page.prototype.deleteButtonClickHandler = function(event){
        event.preventDefault();
        
        var that = this; 
        
        var confirmDlg = new Dialog({
            body: 'Are you sure you want to delete this item?',
            buttons: [{
                id: 'yes',
                label: "Yes. I'm sure.",
                iconClass: 'fa fa-check',
                buttonClass: 'btn-danger'
        }, {
                id: 'no',
                label: 'Nope!',
                iconClass: 'fa fa-times',
                buttonClass: 'btn-default',
                autoClose: true
        }]
        });
        confirmDlg.on('yes', function() {
            B.resolve()
                .then(function() {
                    NProgress.start();
                })
                .then(function() {
                    return that.model.destroy();
                })
                .then(function() {
                    that.toast.success('Item has been deleted successfully.');
                    confirmDlg.close();
                    that.back();
                })
                .catch(that.error.bind(that))
                .finally(function() {
                    NProgress.done();
                });
        });
};

    return Page;


});