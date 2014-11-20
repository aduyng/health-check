/*global _, _s*/
define(function(require) {
    var Super = require('views/page/view'),
        B = require('bluebird'),
        Model = require('models/job'),
        Type = require('models/job-type'),
        Script = require('models/script'),
        Box = require('models/box'),
        Execution = require('models/execution'),
        ExecutionStatus = require('models/execution-status'),
        Device = require('models/device'),
        // NProgress = require('nprogress'),
        // HEADER = require('hbs!./view/header.tpl'),
        FIELDS = require('hbs!./view/fields.tpl'),
        // FORM = require('hbs!./view/form.tpl'),
        BUTTONS = require('hbs!./view/buttons.tpl');
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

                that.oldBox = new Box({
                    id: that.model.get('oldBoxId')
                });

                if (that.model.get('typeId') == Type.ID_VISUAL_REGRESSION) {
                    that.newBox = new Box({
                        id: that.model.get('newBoxId')
                    });

                    that.device = new Device({
                        id: that.model.get('deviceId')
                    });
                }

                that.script = new Script({
                    id: that.model.get('scriptId')
                });

                return B.all([that.script.fetch(), that.type.fetch(), that.oldBox.fetch(), (function() {
                    if (that.model.get('typeId') == Type.ID_VISUAL_REGRESSION) {
                        return B.all([that.newBox.fetch(), that.device.fetch()]);
                    }
                    return B.resolve();
                })()]);
            });
    };


    Page.prototype.getPageName = function() {
        return 'Job';
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

    Page.prototype.getButtonsTemplate = function() {
        return BUTTONS;
    };

    // Page.prototype.initializeEvents = function() {
    //     var that = this;
    //     var events = {};
    //     events['click ' + that.toId('back')] = 'backButtonClickHandler';
    //     _.extend(events, that.getExtraEvents());
    //     that.delegateEvents(events);
    // };

    Page.prototype.getExtraEvents = function() {
        var events = {};
        events['click ' + this.toId('run')] = 'onRunClickHandler';
        return events;
    };

    Page.prototype.onRunClickHandler = function(event) {
        var that = this;
        event.preventDefault();

        //create a new execution
        var execution = new Execution({
            jobId: that.model.id,
            statusId: ExecutionStatus.ID_SCHEDULED
        });

        return B.resolve(execution.save())
            .then(function() {
                that.toast.success('Job has been scheduled to run.');
                that.goTo('#index/view/id/' + execution.id);
            });

    };

    Page.prototype.prepareForOutput = function() {
        var that = this;
        return _.extend(that.model.toJSON(), {
            type: that.type.toJSON(),
            oldBox: that.oldBox.toJSON(),
            newBox: that.model.get('typeId') == Type.ID_VISUAL_REGRESSION ? that.newBox.toJSON() : undefined,
            script: that.script.toJSON(),
            device: that.device ? that.device.toJSON() : {}
        });
    };



    return Page;


});