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
        events['click ' + that.toId('all-modules-checkbox')] = 'allModulesCheckboxClickHandler';
        events['click ' + that.toClass('module-checkbox')] = 'moduleCheckboxClickHandler';
        events['change ' + that.toClass('name')] = 'onNameChange';

        that.collection.on('all', that.renderModules.bind(that));

        that.delegateEvents(events);

        that.renderModules();

    };

    View.prototype.save = _.debounce(function(model, params) {
        return model.save(params, {
            wait: true
        });
    }, 300);

    View.prototype.onNameChange = function(event) {
        var that = this;

        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        that.save(model, {
            name: e.val().trim()
        });
    };

    View.prototype.removeButtonClickHandler = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var module = that.collection.get(e.data('id'));
        B.resolve(module.destroy({
            wait: true
        }));
    };

    View.prototype.codeButtonClickHandler = function(event) {
        var that = this,
            dlg;
        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));

        var view = new CodeView({
            model: model
        });

        var buttons = [{
            id: 'done',
            label: 'Done',
            iconClass: 'fa fa-check',
            buttonClass: 'btn-primary',
            align: 'left',
            autoClose: true
        }];


        dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: view,
            title: 'Script for ' + model.get('name'),
            buttons: buttons
        });

        dlg.on('save', function(event) {
            model.set(view.serialize());
            dlg.close();
        });
    };

    View.prototype.newButtonClickHandler = function() {
        var that = this;
        var model = new Module({
            siteId: that.model.id,
            name: 'New Module'
        });
        model.once('sync', function() {
            that.collection.add(model);
            that.renderModules();
        });

        model.save(null, {
            wait: true
        });
    };

    View.prototype.allModulesCheckboxClickHandler = function() {
        var that = this;
        var isEnabled = that.controls.allModulesCheckbox.prop('checked');
        that.controls.allModulesCheckboxSpinner.removeClass('hidden');
        that.controls.allModulesCheckbox.addClass('hidden');

        return B.all(that.collection.map(function(model) {
                that.findById('module-checkbox-' + model.id).prop('checked', isEnabled);
                return model.save({
                    isEnabled: isEnabled
                }, {
                    wait: true,
                    silent: true
                });
            }))
            .then(function() {
                that.controls.allModulesCheckboxSpinner.addClass('hidden');
                that.controls.allModulesCheckbox.removeClass('hidden');
            });
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
        var model = that.collection.get(e.data('id'));
        model.set('isEnabled', e.is(':checked'));
        return model.save(null, {
            wait: true
        });
    };

    View.prototype.renderModules = function() {
        var that = this;

        that.controls.modules.html(LIST({
            id: that.id,
            modules: that.collection.map(function(module) {
                return module.toJSON();
            })
        }));

        that.controls.allModulesCheckbox.prop('checked', that.collection.length > 0 && that.collection.every(function(model) {
            return model.get('isEnabled');
        }));
    };


    return View;
});