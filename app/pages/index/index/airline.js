/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        EditView = require('./edit'),
        ModulesView = require('./modules'),
        Dialog = require('views/controls/dialog'),
        ScheduleView = require('./schedule'),
        ExecutionStatus = require('models/execution-status'),
        TEMPLATE = require('hbs!./airline.tpl'),
        MODULES = require('hbs!./airline.modules.tpl');


    var View = Super.extend({
        className: 'airline'
    });

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
        this.airline = options.airline;
        this.modules = options.modules;
    };

    View.prototype.render = function() {
        var that = this;


        that.$el.html(TEMPLATE({
            id: that.id,
            airline: that.airline.toJSON()
        }));
        that.mapControls();
        that.renderModules();


        var events = {};
        events['click ' + that.toClass('edit')] = 'onEditClick';
        events['click ' + that.toClass('show-modules')] = 'onModulesClick';
        events['click ' + that.toClass('show-schedule')] = 'onScheduleClick';
        events['click ' + that.toId('run')] = 'onRunClick';
        that.delegateEvents(events);

        that.updateStatus();

    };

    View.prototype.renderModules = function() {
        var that = this;

        that.controls.modules.html(MODULES({
            modules: that.modules.map(function(module) {
                return _.extend(module.toJSON(), {
                    isRunning: module.get('executionStatusId') == ExecutionStatus.ID_RUNNING,
                    isError: module.get('executionStatusId') == ExecutionStatus.ID_ERROR,
                    isOK: module.get('executionStatusId') == ExecutionStatus.ID_OK,
                    isNotStarted: module.get('executionStatusId') == ExecutionStatus.ID_NOT_STARTED,
                });
            })
        }));
    };


    View.prototype.onRunClick = function(event) {
        var that = this;
        event.preventDefault();

        that.airline.run()
            .then(function() {
                that.updateStatus();
                that.startUpdateStatusProcess();
            });
    };

    View.prototype.startUpdateStatusProcess = function() {
        var that = this;

        that.modules.fetch({
                data: {
                    selection: [{
                        field: 'airlineId',
                        value: that.airline.id
                }, {
                        field: 'isEnabled',
                        value: 1
                    }]
                }
            }, {
                reset: true
            })
            .then(function() {
                that.updateStatus();
                that.renderModules();

                if (that.modules.find(function(module) {
                        return module.get('executionStatusId') === ExecutionStatus.ID_RUNNING
                    }) !== undefined) {
                    _.delay(that.startUpdateStatusProcess.bind(that), 5000);
                }
            });
    };

    View.prototype.updateStatus = function() {
        var that = this;
        var isRunning = that.modules.find(function(module) {
            return module.get('executionStatusId') === ExecutionStatus.ID_RUNNING
        }) !== undefined;

        that.controls.run.prop('disabled', isRunning);
        that.controls.showModules.prop('disabled', isRunning);
        that.controls.edit.prop('disabled', isRunning);
        that.controls.showSchedule.prop('disabled', isRunning);
    };



    View.prototype.onEditClick = function(event) {
        event.preventDefault();
        this.showEditAirlineDialog();
    };

    View.prototype.showEditAirlineDialog = function() {
        var that = this,
            dlg,
            isNew = that.airline.isNew();

        var view = new EditView({
            model: that.airline
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
            title: that.airline.get('name'),
            buttons: buttons
        });

        dlg.on('save', function(event) {
            B.resolve(that.airline.save(view.serialize(), {
                    patch: true,
                    wait: true
                }))
                .then(function() {
                    if (isNew) {
                        that.trigger('new', that.airline);
                    }
                    else {
                        that.trigger('saved', that.airline);
                    }
                    dlg.close();
                });

        });

        dlg.on('delete', function(event) {
            var confirmDlg = new Dialog({
                body: 'Are you sure you want to delete ' + that.airline.get('name') + '?',
                buttons: [
                    {
                        id: 'delete',
                        label: 'Delete',
                        iconClass: 'fa fa-trash-o',
                        buttonClass: 'btn-danger',
                        autoClose: false
                    },
                    {
                        id: 'no',
                        label: 'Nope!',
                        iconClass: 'fa fa-times',
                        autoClose: true
                    }
                ]
            });
            confirmDlg.on('delete', function() {
                B.resolve(that.airline.destroy({
                        wait: true
                    }))
                    .then(function() {
                        that.trigger('deleted', that.airline);
                        confirmDlg.close();
                        dlg.close();
                    });
            });
        });

        dlg.on('clone', function(event) {
            B.resolve(that.airline.duplicate())
                .then(function() {
                    that.trigger('cloned', that.airline);
                    dlg.close();
                });
        });
    };



    View.prototype.showModulesDialog = function() {
        var that = this,
            dlg;

        var view = new ModulesView({
            model: that.airline
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
            title: 'Modules of ' + that.airline.get('name'),
            buttons: buttons
        });

        dlg.on('done', function() {
            that.trigger('saved', that.airline);
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

    View.prototype.onScheduleClick = function(event) {
        var that = this;
        event.preventDefault();

        this.showScheduleDialog();

    };


    View.prototype.showScheduleDialog = function() {
        var that = this,
            dlg;

        var view = new ScheduleView({
            model: that.airline
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
            title: 'Schedule of ' + that.airline.get('name'),
            buttons: buttons
        });
    };


    return View;
});