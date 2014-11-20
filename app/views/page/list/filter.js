/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Template = require('hbs!./filter.tpl');


    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {

                that.$el.html(that.getTemplate()({
                    id: that.id,
                    data: that.options.params
                }));
            })
            .then(function() {
                that.renderFields();
            })
            .then(function() {
                that.mapControls();

                var events = {};
                events['click ' + that.toId('search')] = 'searchButtonClickHandler';
                events['click ' + that.toId('clear')] = 'clearButtonClickHandler';
                that.delegateEvents(events);
            })
            .then(function() {
                that.postRender();
            });
    };

    View.prototype.renderFields = function() {
        var that = this;
        
        that.find(that.toId('fields')).html(that.getFieldTemplate()({
            id: that.id,
            data: that.options.params
        }));

        return B.resolve();
    };

    View.prototype.getFieldTemplate = function() {
        return function(){};
    };
    View.prototype.postRender = function() {

    };

    View.prototype.setOrder = function(field, direction){
        var that = this;
        that.controls.orderBy.val(field);
        that.controls.orderDirection.val(direction);
    };

    
    View.prototype.getTemplate = function() {
        return Template;
    };

    View.prototype.searchButtonClickHandler = function(event) {
        event.preventDefault();
        this.controls.page.val(1);
        this.trigger('search');
    };
    
    View.prototype.clearButtonClickHandler = function(event) {
        event.preventDefault();
        this.controls.page.val(1);
        this.clearFields();
        this.trigger('search');
    };



    return View;


});