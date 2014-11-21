/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./index.tpl'),
        AIRLINES = require('hbs!./index/airlines.tpl'),
        ExecutionStatus = require('models/execution-status'),
        Backbone = require('backbone'),
        EditView = require('./index/edit'),
        ModulesView = require('./index/modules'),
        ScheduleView = require('./index/schedule'),
        Airline = require('models/airline'),
        Dialog = require('views/controls/dialog'),
        StatusCollection = require('collections/execution-status'),
        AirlineCollection = require('collections/airline'),
        ModuleCollection = require('collections/module');
    // ,
    // Select2 = require('select2');


    var Page = Super.extend({});


    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);

        that.statusCollection = new StatusCollection();
        that.airlineCollection = new AirlineCollection();
        that.moduleCollection = new ModuleCollection();
    };

    Page.prototype.render = function() {
        var that = this;
        return B.all([
                that.statusCollection.fetch()
            ])
            .then(function() {
                that.$el.html(MAIN({
                    id: that.id
                }));
                that.mapControls();
            })
            .then(function() {
                var events = {};
                events['click ' + that.toId('new')] = 'onNewClick';
                events['click ' + that.toClass('edit')] = 'onEditClick';
                events['click ' + that.toClass('modules')] = 'onModulesClick';
                events['click ' + that.toClass('schedule')] = 'onScheduleClick';
                events['click ' + that.toClass('run')] = 'onRunClick';
                that.delegateEvents(events);

                // that.airlineCollection.on('reset add remove sort', that.renderAirlines.bind(that));

                //keep updating airlines
                that.fetch();
            })
            .then(function() {
                return Super.prototype.render.call(that);
            });

    };
    Page.prototype.onRunClick = function(event) {
        var that = this;
        event.preventDefault();

        var model = this.airlineCollection.get($(event.currentTarget).data('id'));

        model.run();
    };

    Page.prototype.onScheduleClick = function(event) {
        var that = this;
        event.preventDefault();

        var model = this.airlineCollection.get($(event.currentTarget).data('id'));
        this.showScheduleDialog(model);

    };

    Page.prototype.onModulesClick = function(event) {
        var that = this;
        event.preventDefault();

        var model = this.airlineCollection.get($(event.currentTarget).data('id'));
        this.showModulesDialog(model);

    };

    Page.prototype.onNewClick = function(event) {
        var that = this;
        event.preventDefault();

        var model = new Airline({
            name: 'New Airline'
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.airlineCollection.add(model);
                that.showEditAirlineDialog(model);
            });


    };

    Page.prototype.onEditClick = function(event) {
        event.preventDefault();

        var model = this.airlineCollection.get($(event.currentTarget).data('id'));
        this.showEditAirlineDialog(model);
    };

    Page.prototype.showScheduleDialog = function(model) {
        var that = this,
            dlg;

        var view = new ScheduleView({
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
            title: 'Schedule of ' + model.get('name'),
            buttons: buttons
        });
    };


    Page.prototype.showModulesDialog = function(model) {
        var that = this,
            dlg;

        var view = new ModulesView({
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
            title: 'Modules of ' + model.get('name'),
            buttons: buttons
        });

        dlg.on('done', function() {
            that.fetch();
        });

    };

    Page.prototype.showEditAirlineDialog = function(model) {
        var that = this,
            dlg,
            isNew = model.isNew();



        var view = new EditView({
            model: model
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
            title: model.get('name'),
            buttons: buttons
        });

        dlg.on('save', function(event) {
            B.resolve(model.save(view.serialize(), {
                    patch: true,
                    wait: true
                }))
                .then(function() {
                    if (isNew) {
                        that.airlineCollection.add(model);
                    }
                    that.toast.success("Airline has been saved!");
                    dlg.close();
                });

        });

        dlg.on('delete', function(event) {
            var confirmDlg = new Dialog({
                body: 'Are you sure you want to delete ' + model.get('name') + '?',
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
                B.resolve(model.destroy({
                        wait: true
                    }))
                    .then(function() {
                        that.toast.success("Airline has been deleted!");
                        confirmDlg.close();
                        dlg.close();
                    });
            });
        });
    };


    Page.prototype.renderAirlines = function() {
        var that = this;
        that.controls.airlines.html(AIRLINES({
            id: that.id,
            airlines: that.airlineCollection.map(function(airline) {
                return _.extend(airline.toJSON(), {
                    modules: _.map(that.moduleCollection.filter(function(model) {
                        return model.get('airlineId') == airline.id &&
                            model.get('isEnabled');
                    }), function(module) {
                        return _.extend(module.toJSON(), {
                            isRunning: module.get('executionStatusId') == ExecutionStatus.ID_RUNNING,
                            isError: module.get('executionStatusId') == ExecutionStatus.ID_ERROR,
                            isOK: module.get('executionStatusId') == ExecutionStatus.ID_OK,
                            isNotStarted: module.get('executionStatusId') == ExecutionStatus.ID_NOT_STARTED,
                        });
                    })
                });
            })
        }));
    };

    Page.prototype.fetch = function() {
        var that = this;
        return B.resolve(that.airlineCollection.fetch())
            .then(function() {
                return that.moduleCollection.fetch({
                    data: {
                        selection: [{
                            field: 'airlineId',
                            operand: 'in',
                            value: that.airlineCollection.pluck('id')
                    }, {
                            field: 'isEnabled',
                            value: 1
                    }]
                    }
                });
            })
            .then(function() {
                that.backoffCounter = 0;
                that.renderAirlines();
                window.setTimeout(that.fetch.bind(that), 5000);
            })
            .catch(function(e){
                that.backoffCounter++;
                window.setTimeout(that.fetch.bind(that), 5000*Math.pow(2, that.backoffCounter));
            })

    };


    return Page;


});