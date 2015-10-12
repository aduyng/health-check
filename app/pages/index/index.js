/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./index.tpl'),
        Backbone = require('backbone'),
        SiteEdit = require('./index/site-edit'),
        SiteWidget = require('./index/site-widget'),
        TypeWidget = require('./index/type-widget'),
        ExecutionStatus = require('models/execution-status'),
        Dialog = require('views/controls/dialog'),
        Sites = require('collections/site'),
        StatusCollection = require('collections/status'),
        Modules = require('collections/module'),
        Types = require('collections/type'),
        Site = require('models/site'),
        Status = require('models/status'),
        moment = require('moment'),
        StatusWidget = require('views/controls/status'),
        Chart = require('vendors/Chart.js/Chart.min'),
        GraphWidget = require('views/controls/graph'),
        StatCollection = require('collections/stat');

    var Page = Super.extend({});
    var activeTypeArray = [];

    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);

        that.sites = new Sites();
        that.types = new Types();
        that.modules = new Modules();
        this.statuses = new StatusCollection();
        this.stats = new StatCollection();
        this.moduleNamesMap = {};
    };

    Page.prototype.renderStats = function(d) {
        console.log('Stats: ', d);
    };

    Page.prototype.renderStatus = function(d) {
        var that = this;
        this.errors = d.findWhere({status: 0}).collection.length;
        var now = moment();
        var yesterday = 0;
        var weeks = 0;
        var lastMonth = 0;
        var thisMonth = 0;

        d.findWhere({status: 0}).collection.each(function(model) {
            if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'days'))) {
                yesterday++;
            }

            if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'weeks'))) {
                weeks++;
            }

            if (moment(model.get('dateCreated')).isBefore(now.subtract(1, 'months'))) {
                lastMonth++;
            }

            if (moment(model.get('dateCreated')).isAfter(now.subtract(1, 'months'))) {
                thisMonth++;
            }
        });

        var statusWidget = new StatusWidget({
            errors: this.errors || 0,
            el: that.$el.find('.statuses'),
            yesterday: yesterday || 0,
            weeks: weeks || 0,
            percentage: (thisMonth - lastMonth) / thisMonth  * 100
        });

        statusWidget.render();

        that.statuses.on('add change', that.renderStatus.bind(that));

        var graphWidget = new GraphWidget({
            el: that.$el.find('.status-graph')
        });

        graphWidget.render();
    };

    Page.prototype.render = function() {
        var that = this;

        that.$el.html(MAIN({
            id: that.id
        }));

        that.mapControls();

        var events = {};
        events['click ' + '.types .btn'] = 'onTypesClick';

        that.delegateEvents(events);

        that.sites.on('sync add', that.renderSites.bind(that));
        that.sites.on('remove', that.onSiteRemove.bind(that));
        that.sites.on('change', that.onSiteChange.bind(that));
        //that.statuses.on('sync', that.renderStatus.bind(that));
        //that.stats.on('sync', that.renderStats.bind(that));

        that.on('search', that.performSearch.bind(that));
        that.layout.nav.on('search', that.performSearch.bind(that));

        B.resolve(that.sites.fetch()).
            then(function() {
                that.mapModuleNames(that.sites);
            });

        //keep updating airlines
        return B.resolve(that.types.fetch())
            .then(function() {
                return that.fetch();
            })
            .then(function() {
                that.children.types = new TypeWidget({
                    el: that.$el.find('.types'),
                    types: that.types
                });
                that.children.types.render();
                that.children.types.on('change', that.onTypesChange.bind(that));
                return Super.prototype.render.call(that);
            });
    };

    Page.prototype.onTypesChange = function(event) {
        this.trigger('search', {
            selectedType: event.selectedTypes
        });
    };

    Page.prototype.onSiteChange = function() {
        this.updateUI();
    };
    Page.prototype.updateUI = function() {
        var that = this;
        if (that.sites.every(function(site) {
                if (_.contains([ExecutionStatus.ID_RUNNING, ExecutionStatus.ID_SCHEDULED], site.get('status'))) {
                    return false;
                }
                return true;
            })) {
            //that.controls.runAll.prop('disabled', false);
        }
    }

    Page.prototype.onSiteRemove = function(removedSite) {
        //TODO: why the heck I'm not getting this event
        removedSite.view.remove();
    };

    Page.prototype.addSiteToCollection = function(site) {
        this.sites.add(site);
    }

    Page.prototype.renderSites = function() {
        var that = this;

        B.all(_.map(that.sites.filter(function(site) {
            return !site.isRendered;
        }), function(site) {
            site.view = new SiteWidget({
                model: site,
                types: that.types
            });
            site.isRendered = true;

            site.view.on('cloned', function(clonedModel) {
                that.addSiteToCollection(clonedModel);
            });

            return site.view.render()
                .then(function() {
                    that.controls.sites.append(site.view.$el);
                    site.view.on('schedule', that.onSiteScheduled.bind(that));
                });
        }));

        that.updateUI();
    };

    Page.prototype.mapModuleNames = function(sites) {
        var that = this;
        sites.each(function (site) {
            _.each(site.get('modules'), function (module) {
                if (module.name !== '' && module.abbreviation !== '') {
                    that.moduleNamesMap[module.abbreviation] = module.name;
                }
            });
        });

        _.each(that.moduleNamesMap, function(name, abbreviation) {
            var formattedName = name;
            if (name.length > 20) {
                formattedName = formattedName.substr(0,20) + '...';
            }
            var $label = $('<span>').addClass('label').text(abbreviation + ' - ' + formattedName);
            that.controls.moduleLabels.append($label);
            that.controls.moduleLabels.append('\n');
        });
    };

    Page.prototype.performSearch = function(options) {
        var that = this;
        var query = options.query ? options.query : (that.controls.query ? that.controls.query.val().trim() : '');
        var visibleSites = that.sites.models;
        var selectedTypes = options.selectedType || that.children.types.val();

        if (!_.isEmpty(selectedTypes)) {
            var typeIds = _.pluck(selectedTypes, 'id');

            if (!_.isEmpty(query)) {
                var re = new RegExp(query, 'i');
                visibleSites = _.filter(visibleSites, function(site) {
                    return _.contains(typeIds, site.get('typeId')) &&
                            re.test(site.get('tags') + ',' + site.get('name'));
                });
            } else {
                visibleSites = _.filter(visibleSites, function(site) {
                    return _.contains(typeIds, site.get('typeId'));
                });
            }
        } else {
            if (!_.isEmpty(query)) {
                var re = new RegExp(query, 'i');
                visibleSites = _.filter(visibleSites, function(site) {
                    return re.test(site.get('tags') + ',' + site.get('name'));
                });
            }
        }

        that.sites.forEach(function(site) {
            if (site.view) {
                var visible = _.find(visibleSites, function(vs){
                    return site.id === vs.id;
                });
                site.view.$el.toggleClass('hidden', !visible);
            }
        });
    };

    Page.prototype.onSiteScheduled = function() {
        var that = this;
        that.toast.success('Job has been scheduled to start in 10 seconds.');
    };

    Page.prototype.onRunAllCompleted = function() {
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };

    Page.prototype.onRunAllTerminated = function() {
        this.controls.runAll.removeClass('hidden');
        this.controls.new.removeClass('hidden');
        this.controls.stop.addClass('hidden');
    };

    Page.prototype.onRunAllStarted = function() {
        this.controls.runAll.addClass('hidden');
        this.controls.new.addClass('hidden');
        this.controls.stop.removeClass('hidden');
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

    Page.prototype.fetch = function() {
        var that = this;
        return B.all([that.sites.fetch(), that.statuses.fetch(), this.stats.fetch()]);
    };

    return Page;
});