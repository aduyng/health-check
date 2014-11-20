/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/page/edit'),
        B = require('bluebird'),
        TypeCollection = require('collections/job-type'),
        BoxCollection = require('collections/box'),
        ScriptCollection = require('collections/script'),
        DeviceCollection = require('collections/device'),
        FIELDS = require('hbs!./edit/fields.tpl'),
        Model = require('models/job'),
        Type = require('models/job-type'),
        Select2 = require('select2'),
        Ace = require('ace');


    var Page = Super.extend({});

    Page.prototype.getPageName = function() {
        return 'Job';
    };

    Page.prototype.getModelClass = function() {
        return Model;
    };

    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };

    Page.prototype.preRender = function() {
        var that = this;
        that.types = new TypeCollection();
        that.devices = new DeviceCollection();
        that.scripts = new ScriptCollection();
        that.boxes = new BoxCollection();

        return B.all([
            that.types.fetch({
                data: {
                    columns: ['id', 'name']
                }
            }),
            that.devices.fetch({
                data: {
                    columns: ['id', 'name', 'width', 'height']
                }
            }),
            that.scripts.fetch({
                data: {
                    columns: ['id', 'name', 'typeId']
                }
            }),
            that.boxes.fetch({
                data: {
                    columns: ['id', 'name', 'url']
                }
            })
        ]);
    };

    Page.prototype.postRender = function() {
        var that = this;
        that.types.toDropdown(that.controls.typeId);
        that.boxes.toDropdown(that.controls.oldBoxId);
        that.boxes.toDropdown(that.controls.newBoxId);
        
        that.devices.toDropdown(that.controls.deviceId);
        that.updateUIAccordingToType();
    };

    Page.prototype.getExtraEvents = function() {
        var that = this;
        var events = {};
        events['change ' + that.toId('type-id')] = 'onTypeChangeClick';
        return events;
    };

    Page.prototype.onTypeChangeClick = function(event) {
        var that = this;
        that.updateUIAccordingToType();
    };

    Page.prototype.updateUIAccordingToType = function() {
        var that = this;
        if (that.controls.typeId.val() == Type.ID_HEALTH_CHECK) {
            that.controls.newBoxGroup.addClass('hidden');
            that.controls.deviceGroup.addClass('hidden');
        }
        else {
            that.controls.newBoxGroup.removeClass('hidden');
            that.controls.deviceGroup.removeClass('hidden');
        }

        var scripts = new ScriptCollection(that.scripts.filter(function(model) {
            return model.get('typeId') == that.controls.typeId.val();
        }));
        
        scripts.toDropdown(that.controls.scriptId);
    }


    Page.prototype.prepareForOutput = function() {
        var that = this;
        var data = that.model.toJSON();

        if (!data.typeId) {
            data.typeId = that.types.at(0).id;
        }

        return data;
    };

    return Page;


});