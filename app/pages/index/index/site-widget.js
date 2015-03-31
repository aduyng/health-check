/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        EditView = require('./site-edit'),
        ModulesView = require('./modules'),
        Dialog = require('views/controls/dialog'),
        Modules = require('collections/module'),
        ModuleList = require('./module-list'),
        ExecutionStatus = require('models/execution-status'),
        TEMPLATE = require('hbs!./site-widget.tpl');

    var View = Super.extend({
        className: 'panel panel-default site'
    });


    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
    };

    View.prototype.render = function() {
        var that = this;

        that.draw();
        that.mapControls();


        that.model.modules = new Modules();
        that.model.modules.on('all', that.output.bind(that));
        that.children.moduleList = new ModuleList({
            el: that.controls.moduleList,
            collection: that.model.modules,
            model: that.model
        });
        that.children.moduleList.render();


        var events = {};
        events['click ' + that.toId('header')] = 'onHeaderClick';
        events['click ' + that.toId('edit')] = 'onEditClick';
        events['click ' + that.toId('show-modules')] = 'onModulesClick';
        events['click ' + that.toId('run')] = 'onRunClick';
        that.delegateEvents(events);

        that.model.on('sync', that.output.bind(that));
        that.model.on('destroy', that.remove.bind(that));

        return B.resolve(that.model.modules.fetch({
            data: {
                siteId: that.model.id
            }
        }));
    };

    View.prototype.remove = function() {
        //stop the status querying process
        return Super.prototype.remove.apply(this, arguments);
    }

    View.prototype.draw = function(isRunning) {
        var that = this;

        that.$el.html(TEMPLATE({
            id: that.id,
            data: that.model.toJSON()
        }));
    };

    View.prototype.output = function() {
        var that = this;
        that.controls.name.text(that.model.get('name'));
        that.controls.run.prop('disabled', that.model.modules.length === 0 || _.contains([ExecutionStatus.ID_RUNNING, ExecutionStatus.ID_SCHEDULED], that.model.get('status')));

        var iconClass = 'fa-square-o',
            panelClass = 'panel-default';
        if (that.model.get('status') === ExecutionStatus.ID_ERROR) {
            iconClass = 'fa-exclamation-circle text-danger';
            panelClass = 'panel-danger';
        }
        else if (that.model.get('status') === ExecutionStatus.ID_RUNNING) {
            iconClass = 'fa-spinner fa-spin text-warning';
            panelClass = 'panel-warning';
        }
        else if (that.model.get('status') === ExecutionStatus.ID_OK) {
            iconClass = 'fa-check text-success';
            panelClass = 'panel-success';
        }
        that.controls.icon.attr('class', 'fa ' + iconClass);
        that.$el.removeClass('panel-default panel-danger panel-success panel-warning').addClass(panelClass);
    };

    View.prototype.onHeaderClick = function(event) {
        event.preventDefault();
        this.$el.toggleClass('expanded');
    };

    View.prototype.onRunClick = function(event) {
        var that = this;
        event.preventDefault();
        that.run();
    };

    View.prototype.run = function() {
        var that = this;

        that.controls.run.prop('disabled', true);
        return that.model.run()
            .then(function() {
                that.trigger('schedule');
            });
    };

    View.prototype.startUpdateStatusProcess = function() {
        var that = this;
        return B.resolve(that.model.modules.fetch({
                data: {
                    siteId: that.model.id
                }
            }))
            .then(function() {
                if (that.model.modules.find(function(module) {
                        return module.get('status') === ExecutionStatus.ID_RUNNING
                    }) !== undefined) {
                    _.delay(that.startUpdateStatusProcess.bind(that), 5000);
                }
                else {
                    that.trigger('completed');
                }
            });
    };


    View.prototype.onEditClick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.showEditDialog();
    };

    View.prototype.showEditDialog = function() {
        var that = this,
            dlg,
            isNew = that.model.isNew();

        var view = new EditView({
            model: that.model
        });

        var buttons = [{
            id: 'save',
            label: 'Save',
            iconClass: 'fa fa-save',
            buttonClass: 'btn-primary',
            align: 'left'
        }, {
            id: 'cancel',
            label: 'Cancel',
            iconClass: 'fa fa-times',
            buttonClass: 'btn-default',
            align: 'left',
            autoClose: true
        }];

        if (!isNew) {
            buttons.push({
                id: 'clone',
                label: 'Clone',
                iconClass: 'fa fa-copy',
                buttonClass: 'btn-info',
                align: 'right'
            });

            buttons.push({
                id: 'delete',
                label: 'Delete',
                iconClass: 'fa fa-trash-o',
                buttonClass: 'btn-danger',
                align: 'right'
            });
        }

        dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: view,
            title: 'Edit:' + that.model.get('name'),
            buttons: buttons
        });

        dlg.on('save', function(event) {
            B.resolve(that.model.save(view.val(), {
                    patch: true,
                    wait: true
                }))
                .then(function() {
                    dlg.close();
                });
        });

        dlg.on('delete', function(event) {
            var confirmDlg = new Dialog({
                body: 'Are you sure you want to delete ' + that.model.get('name') + '?',
                buttons: [{
                    id: 'delete',
                    label: 'Delete',
                    iconClass: 'fa fa-trash-o',
                    buttonClass: 'btn-danger',
                    autoClose: false
                }, {
                    id: 'no',
                    label: 'Nope!',
                    iconClass: 'fa fa-times',
                    autoClose: true
                }]
            });
            confirmDlg.on('delete', function() {
                B.resolve(that.model.destroy({
                        wait: true
                    }))
                    .then(function() {
                        _.delay(function() {
                            confirmDlg.close();
                            dlg.close();
                            that.remove();
                        }, 1000);

                    });
            });
        });

        dlg.on('clone', function(event) {
            B.resolve(that.model.duplicate())
                .then(function() {
                    that.trigger('cloned', that.model);
                    dlg.close();
                });
        });
    };



    View.prototype.showModulesDialog = function() {
        var that = this;

        var view = new ModulesView({
            model: that.model,
            collection: that.model.modules
        });

        var buttons = [{
            id: 'done',
            label: 'Done',
            iconClass: 'fa fa-check',
            buttonClass: 'btn-primary',
            align: 'left',
            autoClose: true
        }];

        var dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: view,
            title: 'Modules of ' + that.model.get('name'),
            buttons: buttons
        });

    };

    View.prototype.onModulesClick = function(event) {
        var that = this;
        event.preventDefault();
        this.showModulesDialog();
    };

    View.prototype.remove = function() {
        Super.prototype.remove.call(this);
    };



    return View;
});