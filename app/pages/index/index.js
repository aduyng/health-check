/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./index.tpl'),
        AIRLINES = require('hbs!./index/airlines.tpl'),
        Backbone = require('backbone'),
        AirlineView = require('./index/airline'),
        Airline = require('models/airline'),
        Dialog = require('views/controls/dialog'),
        // BoxCollection = require('collections/box'),
        // ScriptCollection = require('collections/script'),
        // DeviceCollection = require('collections/device'),
        // TypeCollection = require('collections/job-type'),
        StatusCollection = require('collections/execution-status'),
        AirlineCollection = require('collections/airline'),
        ModuleCollection = require('collections/module'),
        ScheduleCollection = require('collections/schedule');
    // ,
    // Select2 = require('select2');


    var Page = Super.extend({
        id: '4b4cc7c5-bdde-439c-926a-1f4b5adecb19'
    });


    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);

        that.statusCollection = new StatusCollection();
        that.airlineCollection = new AirlineCollection();
        that.moduleCollection = new ModuleCollection();
        that.scheduleCollection = new ScheduleCollection();
    };

    Page.prototype.render = function() {
        var that = this;
        return B.all([
                that.statusCollection.fetch(),
                that.airlineCollection.fetch(),
                that.moduleCollection.fetch(),
                that.scheduleCollection.fetch()
            ])
            .then(function() {
                that.$el.html(MAIN({
                    id: that.id
                }));
                that.mapControls();
                return that.renderAirlines();
            })
            .then(function() {
                var events = {};
                events['click ' + that.toId('new-airline')] = 'newAirlineClickHandler';
                events['click ' + that.toId('edit-airline')] = 'editAirlineClickHandler';
                that.delegateEvents(events);

                that.airlineCollection.on('all', that.renderAirlines.bind(that));
            })
            .then(function() {
                return Super.prototype.render.call(that);
            });

    };

    Page.prototype.newAirlineClickHandler = function(event) {
        event.preventDefault();

        var model = new Airline({
            name: 'New Airline'
        });
        this.showEditAirlineDialog(model);
    };

    Page.prototype.editAirlineClickHandler = function(event) {
        event.preventDefault();

        var model = this.airlineCollection.get($(event.currentTarget).data('id'));
        this.showEditAirlineDialog(model);
    };


    Page.prototype.showEditAirlineDialog = function(model) {
        var that = this,
            dlg,
            isNew = model.isNew();



        var view = new AirlineView({
            model: model,
            modules: new ModuleCollection(that.moduleCollection.where({
                airlineId: model.id
            }))
        });

        dlg = new Dialog({
            sizeClass: 'modal-lg',
            body: view,
            title: model.get('name'),
            buttons: [{
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
                    }]
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
    };


    Page.prototype.renderAirlines = function() {
        var that = this;
        that.controls.airlines.html(AIRLINES({
            id: that.id,
            airlines: that.airlineCollection.map(function(airline) {
                return _.extend(airline.toJSON(), {
                    modules: _.map(that.moduleCollection.where({
                        airlineId: airline.id
                    }), function(module) {
                        return module.toJSON();
                    })
                });
            })
        }))

    };

    // Page.prototype.getCollection = function() {
    //     return new Collection();
    // };

    // Page.prototype.getRenderOptions = function() {
    //     return {
    //         pageName: 'Execution Queue'
    //     };
    // };

    // Page.prototype.preRender = function() {
    //     var that = this;
    //     return B.all([
    //             that.statusCollection.fetch()
    //             ]);
    // };



    // Page.prototype.getFilterOptions = function() {
    //     var that = this;

    //     return {

    //         statusCollection: that.statusCollection
    //     };
    // };

    // Page.prototype.getResultOptions = function() {
    //     var that = this;
    //     return {
    //         statusCollection: that.statusCollection
    //     };
    // };

    // Page.prototype.getFilterClass = function() {
    //     return Filter;
    // };

    // Page.prototype.getResultClass = function() {
    //     return Result;
    // };

    Page.prototype.fetch = function() {
        var that = this;
        var data = that.children.filter.serialize();
        var parseValue = function(value) {
            return _.reduce(value.split(','), function(memo, v) {
                var parseValue = parseInt(v);
                if (!isNaN(parseValue)) {
                    memo.push(parseValue);
                }
                return memo;
            }, []);
        };

        var selection = _.reduce(_.omit(data, 'perPage', 'page', 'orderBy'), function(memo, value, key) {
            if (value) {
                switch (key) {
                    case 'statusIds':
                        memo.push({
                            field: 'statusId',
                            value: parseValue(value),
                            operand: 'in'
                        });
                        break;
                }
            }
            return memo;
        }, []);

        var column = that.children.result.getTable().getSortedColumn();
        var orderBy = {};
        if (column) {
            orderBy[column.id] = column.get('direction');
        }
        var page = data.page || 1;
        var perPage = data.perPage || 20;

        return that.collection.fetch({
            data: {
                selection: selection,
                orderBy: orderBy,
                limit: perPage,
                offset: (page - 1) * perPage
            }
        });
    };


    return Page;


});