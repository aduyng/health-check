/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Module = require('models/module'),
        CodeView = require('./code'),
        Dialog = require('views/controls/dialog'),
        TEMPLATE = require('hbs!./modules.tpl'),
        LIST = require('hbs!./modules.list.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
    };


    View.prototype.render = function() {
        var that = this;

        that.$el.html(TEMPLATE({
            id: that.id
        }));
        that.mapControls();

        var events = {};
        events['click ' + that.toId('new')] = 'newButtonClickHandler';
        events['click ' + that.toClass('remove')] = 'removeButtonClickHandler';
        events['click ' + that.toClass('code')] = 'codeButtonClickHandler';
        events['click ' + that.toClass('view-log')] = 'logButtonClickHandler';
        events['click ' + that.toId('all-modules-checkbox')] = 'allModulesCheckboxClickHandler';
        events['click ' + that.toClass('module-checkbox')] = 'moduleCheckboxClickHandler';
        events['change ' + that.toClass('name')] = 'onNameChange';
        events['change ' + that.toClass('abbreviation')] = 'onAbbreviationChange';

        that.delegateEvents(events);

        that.renderModules();
        that.model.on('change:module sync', that.renderModules.bind(that));

    };

    View.prototype.onNameChange = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var modules = (that.model.get('modules') || []);
        modules[e.data('index')].name = e.val().trim();
        that.model.set('modules', modules);

        return that.model.save();
    };

    View.prototype.onAbbreviationChange = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var modules = (that.model.get('modules') || []);
        modules[e.data('index')].abbreviation = e.val().trim();
        that.model.set('modules', modules);

        return that.model.save();
    };

    View.prototype.removeButtonClickHandler = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var modules = (that.model.get('modules') || []);
        var module = modules[e.data('index')];

        var buttons = [{
            id: 'yes',
            label: 'Yes, I\'m sure',
            iconClass: 'fa fa-trash-o',
            buttonClass: 'btn-danger',
            align: 'left'
        }, {
            id: 'no',
            label: 'No',
            iconClass: 'fa fa-times',
            buttonClass: 'btn-default',
            align: 'right',
            autoClose: true
        }];


        var dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: 'Are you sure you want to delete: ' + module.name,
            title: 'Confirmation',
            buttons: buttons
        });

        dlg.on('yes', function() {
            that.model.set('modules', _.filter(modules, function(m, i) {
                return i !== parseInt(e.data('index'), 10);
            }));

            that.model.save();
            that.renderModules();

            dlg.close();
        });


    };

    View.prototype.codeButtonClickHandler = function(event) {
        var that = this,
            dlg;
        var e = $(event.currentTarget);
        var modules = that.model.get('modules') || [];

        var model = modules[e.data('index')];

        var view = new CodeView({
            model: that.model,
            moduleIndex: e.data('index'),
            module: model
        });

        var buttons = [{
            id: 'done',
            label: 'Done',
            iconClass: 'fa fa-check',
            buttonClass: 'btn-primary',
            align: 'right',
            autoClose: true
        }];


        dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: view,
            title: 'Script for ' + model.name,
            buttons: buttons
        });

        dlg.on('save', function(event) {
            _.extend(modules[e.data('index')], view.serialize());
            that.model.set('modules', modules);
            that.model.save();
            dlg.close();
        });
    };

    View.prototype.logButtonClickHandler = function(event) {
        var that = this;
        that.model.trigger('view-module-log', event);
    };

    View.prototype.newButtonClickHandler = function() {
        var that = this;
        var modules = (that.model.get('modules') || []);
        modules.push({
            name: 'New Module',
            abbreviation: 'New'
        });

        that.model.set('modules', modules);

        return that.model.save();
    };

    View.prototype.allModulesCheckboxClickHandler = function() {
        var that = this;
        var isEnabled = that.controls.allModulesCheckbox.prop('checked');
        var modules = that.model.get('modules') || [];
        that.model.set('modules', _.map(modules, function(model, index) {
            that.findById('module-checkbox-' + index).prop('checked', isEnabled);
            model.isEnabled = isEnabled;
            return model;
        }));
        return that.model.save();
    };

    View.prototype.moduleCheckboxClickHandler = function(event) {
        var that = this;
        if (that.findByClass('module-checkbox').size() === that.findByClass('module-checkbox:checked').size()) {
            that.findById('all-modules-checkbox').attr('checked', 'checked');
        }
        else {
            that.findById('all-modules-checkbox').removeAttr('checked');
        }
        var e = $(event.currentTarget);
        var modules = that.model.get('modules') || [];
        modules[e.data('index')].isEnabled = e.prop('checked');
        that.model.set('modules', modules);

        return that.model.save();
    };

    View.prototype.renderModules = function() {
        var that = this;

        that.controls.modules.html(LIST({
            id: that.id,
            modules: _.map(that.model.get('modules') || [], function(module) {
                return module;
            })
        }));

        that.controls.allModulesCheckbox.prop('checked', (that.model.get('modules') || []).length > 0 && _.every(that.model.get('modules') || [], function(model) {
            return model.isEnabled;
        }));
    };


    return View;
});