/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./index.tpl'),
        AIRLINES = require('hbs!./index/airlines.tpl'),

        Backbone = require('backbone'),
        EditView = require('./index/edit'),
       

        Airline = require('models/airline'),
        Dialog = require('views/controls/dialog'),
        AirlineView = require('./index/airline'),
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
                that.statusCollection.fetch(),
                that.fetch()
            ])
            .then(function() {

                that.$el.html(MAIN({
                    id: that.id,
                    airlines: that.airlineCollection.toJSON()
                }));
                that.mapControls();

                that.renderAirlines();
            })
            .then(function() {
                var events = {};
                events['click ' + that.toId('new')] = 'onNewClick';
                that.delegateEvents(events);

                // that.airlineCollection.on('reset add remove sort', that.renderAirlines.bind(that));

                //keep updating airlines
                that.fetch();
            })
            .then(function() {
                return Super.prototype.render.call(that);
            });

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


    




    Page.prototype.refresh = function() {
        var that = this;
        //clean up 
        that.airlineCollection.forEach(function(airline) {
            if (airline.view) {
                airline.view.remove();
            }
        });

        return that.fetch()
            .then(function() {
                that.renderAirlines();
            });
    };

    Page.prototype.onAirlineCreated = function(airline) {
        this.refresh();
        this.toast.success("Airline has been created!");
    };

    Page.prototype.onAirlineSaved = function(airline) {
        this.refresh();
        this.toast.success("Airline has been saved!");
    };

    Page.prototype.onAirlineDeleted = function(airline) {
        this.refresh();
        this.toast.success("Airline has been deleted!");
    };

    Page.prototype.onAirlineCloned = function(airline) {
        this.refresh();
        this.toast.success("Airline has been cloned!");
    };

    Page.prototype.renderAirlines = function() {
        var that = this;

        this.airlineCollection.forEach(function(airline) {
            var view = new AirlineView({
                airline: airline,
                modules: new ModuleCollection(that.moduleCollection.where({
                    airlineId: airline.id
                }))
            });
            view.render();
            that.find(that.toId('airline-' + airline.id)).append(view.$el);

            view.on('new', that.onAirlineCreated.bind(that));
            view.on('saved', that.onAirlineSaved.bind(that));
            view.on('deleted', that.onAirlineDeleted.bind(that));
            view.on('cloned', that.onAirlineCloned.bind(that));

            airline.view = view;
        });



        // that.controls.airlines.html(AIRLINES({
        //     id: that.id,
        //     airlines: that.airlineCollection.map(function(airline) {
        //         return _.extend(airline.toJSON(), {
        //             modules: _.map(that.moduleCollection.filter(function(model) {
        //                 return model.get('airlineId') == airline.id &&
        //                     model.get('isEnabled');
        //             }), function(module) {
        //                 return _.extend(module.toJSON(), {
        //                     isRunning: module.get('executionStatusId') == ExecutionStatus.ID_RUNNING,
        //                     isError: module.get('executionStatusId') == ExecutionStatus.ID_ERROR,
        //                     isOK: module.get('executionStatusId') == ExecutionStatus.ID_OK,
        //                     isNotStarted: module.get('executionStatusId') == ExecutionStatus.ID_NOT_STARTED,
        //                 });
        //             })
        //         });
        //     })
        // }));
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
            });

    };


    return Page;


});