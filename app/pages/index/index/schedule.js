/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Schedule = require('models/schedule'),
        ScheduleCollection = require('collections/schedule'),
        TEMPLATE = require('hbs!./schedule.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);

        that.collection = new ScheduleCollection();
    };


    View.prototype.render = function() {
        var that = this;
        return B.resolve(that.fetch())
            .then(function() {
                that.renderSchedules();
                that.mapControls();
            })
            .then(function() {
                var events = {};
                events['click ' + that.toId('new')] = 'newButtonClickHandler';
                events['click ' + that.toClass('remove')] = 'removeButtonClickHandler';
                events['input ' + that.toClass('field')] = 'onFieldInput';
                that.delegateEvents(events);

                that.collection.on('reset add remove sort', that.renderSchedules.bind(that));
            });
    };

    View.prototype.save = _.debounce(function(model, params) {
        return model.save(params, {
            patch: true,
            wait: true
        });
    }, 300);

    View.prototype.onFieldInput = function(event) {
        var that = this;


        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        var params = {};
        params[e.attr('name')] = e.val();
        that.save(model, params);
    };




    View.prototype.removeButtonClickHandler = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var module = that.collection.get(e.data('id'));
        B.resolve(module.destroy({
                wait: true
            }))
            .then(function() {
                that.renderSchedules();
            })
    };

    View.prototype.newButtonClickHandler = function() {
        var that = this;
        var model = new Schedule({
            airlineId: that.model.id,
            minute: 0,
            second: 0,
            hour: 0,
            date: 1,
            month: '*',
            dayOfWeek: '*'
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.collection.add(model);
            });
    };



    View.prototype.renderSchedules = function() {
        var that = this;
        that.$el.html(TEMPLATE({
            id: that.id,
            schedules: that.collection.toJSON(),
            data: that.model.toJSON()
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