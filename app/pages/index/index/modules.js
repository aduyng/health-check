/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Module = require('models/module'),
        ModuleCollection = require('collections/module'),
        CodeView = require('./code'),
        SettingView = require('./setting'),
        Dialog = require('views/controls/dialog'),
        TEMPLATE = require('hbs!./modules.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);

        that.collection = new ModuleCollection();
    };


    View.prototype.render = function() {
        var that = this;
        return B.resolve(that.fetch())
            .then(function() {
                that.renderModules();
                that.mapControls();
            })
            .then(function() {
                var events = {};
                events['click ' + that.toId('new')] = 'newButtonClickHandler';
                events['click ' + that.toClass('remove')] = 'removeButtonClickHandler';
                events['click ' + that.toClass('settings')] = 'settingsButtonClickHandler';
                events['click ' + that.toClass('code')] = 'codeButtonClickHandler';
                events['click ' + that.toId('all-modules-checkbox')] = 'allModulesCheckboxClickHandler';
                events['click ' + that.toClass('module-checkbox')] = 'moduleCheckboxClickHandler';
                events['input ' + that.toClass('name')] = 'onNameInput';
                events['input ' + that.toClass('url')] = 'onUrlInput';
                
                that.delegateEvents(events);
                
                that.collection.on('add remove reset sort', that.renderModules.bind(that));
            });
    };

    View.prototype.save = _.debounce(function(model, params) {
        return model.save(params, {
            patch: true,
            wait: true
        });
    }, 300);

    View.prototype.onNameInput = function(event) {
        var that = this;
        

        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        that.save(model, {
            name: e.val().trim()
        });
    };

    View.prototype.onUrlInput = function(event) {
        var that = this;

        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        that.save(model, {
            url: e.val().trim()
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
    
    View.prototype.settingsButtonClickHandler = function(event) {
        var that = this,
            dlg;
        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));

        console.log(model);
        var view = new SettingView({
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
            title: 'Settings for ' + model.get('name'),
            buttons: buttons
        });

        dlg.on('save', function(event) {
            model.set(view.serialize());
            dlg.close();
        });
    };

    View.prototype.codeButtonClickHandler = function(event) {
        var that = this,
            dlg;
        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));

        // console.log(module);
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
            title: 'Steps for ' + model.get('name'),
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
            airlineId: that.model.id,
            name: 'New Module',
            url: that.model.get('url')
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.collection.add(model);
            });
    };

    View.prototype.allModulesCheckboxClickHandler = function() {
        var that = this;
        var isEnabled = that.findById('all-modules-checkbox').is(':checked');
        if (isEnabled) {
            that.findByClass('module-checkbox').attr('checked', 'checked');
        }
        else {
            that.findByClass('module-checkbox').removeAttr('checked');
        }

        that.collection.forEach(function(model) {
            return model.save({
                isEnabled: isEnabled
            }, {
                patch: true,
                wait: true
            });
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
        return model.save({
            isEnabled: e.is(':checked')
        }, {
            patch: true,
            wait: true
        });

    };

    View.prototype.renderModules = function() {
        var that = this;
        that.$el.html(TEMPLATE({
            id: that.id,
            modules: _.map(_.sortBy(that.collection.where({
                airlineId: that.model.id
            }), function(module) {
                return module.get('name');
            }), function(module) {
                return module.toJSON();
            }),
            allModulesChecked: that.collection.every(function(model){
                return model.get('isEnabled');
            })
        }));
    };


    View.prototype.fetch = function() {
        var that = this;
        return that.collection.fetch({
            data: {
                selection: [{
                    field: 'airlineId',
                    value: that.model.id
                }]
            }
        });
    };
    
    return View;
});