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
                events['click ' + that.toId('run-all')] = 'onRunAllClick';
                events['click ' + that.toId('stop')] = 'onStopClick';
                that.delegateEvents(events);

                that.on('run-all-terminated', that.onRunAllTerminated.bind(that));
                that.on('run-all-started', that.onRunAllStarted.bind(that));
                that.on('run-all-completed', that.onRunAllStarted.bind(that));

                //keep updating airlines
                that.fetch();
            })
            .then(function() {
                return Super.prototype.render.call(that);
            });

    };
    
    
    Page.prototype.onRunAllCompleted = function(){
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };
    
    Page.prototype.onRunAllTerminated = function(){
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };
    
    Page.prototype.onRunAllStarted = function(){
        this.controls.runAll.addClass('hidden');
        this.controls.new.addClass('hidden');
        this.controls.stop.removeClass('hidden');
    };

    Page.prototype.onStopClick = function(event) {
        var that = this;
        that.runAllStopRequested = true;
    };


    Page.prototype.onRunAllClick = function(event) {
        var that = this;
        that.runningAirlineIndex = 0;
        that.trigger('run-all-started');
        that.run();
    };

    Page.prototype.run = function() {
        var that = this;
        var runningAirline = that.airlineCollection.at(that.runningAirlineIndex);

        that.listenToOnce(runningAirline.view, 'completed', function() {
            that.runningAirlineIndex++;
            if (that.runAllStopRequested) {
                that.runAllStopRequested = false;
                that.trigger('run-all-terminated');
            }
            else {
                if (that.runningAirlineIndex < that.airlineCollection.length) {
                    that.run();
                }
                else {
                    that.trigger('run-all-completed');
                }
            }
        });

        runningAirline.view.run();
    };

    Page.prototype.onNewClick = function(event) {
        var that = this;
        event.preventDefault();

        var model = new Airline({
            abbr: 'ZZ',
            name: 'New Airline'
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.refresh();
                that.toast.success('A new airline has been added at the bottom.');
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
        this.airlineCollection.remove(airline);
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

    };

    Page.prototype.fetch = function() {
        var that = this;
        return B.resolve(that.airlineCollection.fetch(undefined, {
                reset: true
            }))
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
                }, {
                    reset: true
                });
            });

    };


    return Page;


});