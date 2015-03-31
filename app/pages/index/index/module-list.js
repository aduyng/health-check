/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        ExecutionStatus = require('models/execution-status'),
        TEMPLATE = require('hbs!./module-list.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
    };


    View.prototype.render = function() {
        var that = this;


        var events = {};

        that.delegateEvents(events);
        that.collection.on('all', that.renderModules.bind(that));
    };



    View.prototype.renderModules = function() {
        var that = this;
        
        that.$el.html(TEMPLATE({
            id: that.id,
            modules: _.map(_.sortBy(that.collection.where({
                isEnabled: true
            }), function(module) {
                return module.get('name');
            }), function(module) {
                return _.extend(module.toJSON(), {
                    iconClass: (function() {
                        switch (module.get('status')) {
                            case ExecutionStatus.ID_RUNNING:
                                return 'fa-spinner fa-spin text-warning';
                            case ExecutionStatus.ID_OK:
                                return 'fa-check text-success';
                            case ExecutionStatus.ID_ERROR:
                                return 'fa-exclamation-circle text-danger';
                            default:
                                return 'fa-square-o';
                        }
                    })()
                });
            })
        }));
    };

    return View;
});