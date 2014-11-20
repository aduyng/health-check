/*global _, _s*/
define(function(require) {
    var Super = require('views/page/view'),
        B = require('bluebird'),
        Model = require('models/script'),
        Type = require('models/job-type'),
        // NProgress = require('nprogress'),
        // HEADER = require('hbs!./view/header.tpl'),
        FIELDS = require('hbs!./view/fields.tpl');
    // FORM = require('hbs!./view/form.tpl'),
    // BUTTONS = require('hbs!./view/buttons.tpl'),
    // Ladda = require('ladda'),
    // Template = require('hbs!./view.tpl');

    var Page = Super.extend({});

    Page.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
        this.type = new Type();
    };

    Page.prototype.getModelClass = function() {
        return Model;
    };



    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };

    Page.prototype.fetch = function() {
        var that = this;

        return B.resolve(that.model.fetch())
            .then(function() {
                that.type = new Type({
                    id: that.model.get('typeId')
                });

                return that.type.fetch();
            });
    };

    Page.prototype.getPageName = function() {
        return 'Script';
    };


    // Page.prototype.getFieldsTemplate = function() {
    //     return FIELDS;
    // };


    // Page.prototype.getButtonsHtml = function(data) {
    //     var that = this;
    //     var template = that.getButtonsTemplate();

    //     return template({
    //         id: that.id,
    //         data: data
    //     });
    // };

    // Page.prototype.getButtonsTemplate = function() {
    //     return BUTTONS;
    // };

    // Page.prototype.initializeEvents = function() {
    //     var that = this;
    //     var events = {};
    //     events['click ' + that.toId('back')] = 'backButtonClickHandler';
    //     _.extend(events, that.getExtraEvents());
    //     that.delegateEvents(events);
    // };

    // Page.prototype.getExtraEvents = function() {

    // };

    Page.prototype.prepareForOutput = function() {
        return _.extend(this.model.toJSON(), {
            type: this.type.toJSON()
        });
    };

    return Page;


});