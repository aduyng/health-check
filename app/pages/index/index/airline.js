/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Module = require('models/module'),
        MODULES = require('hbs!./modules.tpl'),
        TEMPLATE = require('hbs!./airline.tpl');


    var View = Super.extend({
    });

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
        
        that.airline = options.airline;
        that.statusCollection = options.statusCollection;
        that.modules = options.modules;
        
        // console.log(that.modules);
    };


    View.prototype.render = function(){
        var that = this;
        return B.resolve()  
            .then(function(){
                that.$el.html(TEMPLATE({
                    id: that.id,
                    data: that.model.toJSON()
                }));
                that.mapControls();
                that.renderModules();
                
                
            })
            .then(function(){
                var events = {};
                events['click ' + that.toId('new')] = 'newButtonClickHandler';
                that.delegateEvents(events);
                that.modules.on('add remove', that.renderModules.bind(that)); 
            });
    };
    
    
    View.prototype.newButtonClickHandler = function(){
        var that = this;
        var model = new Module({
            airlineId: that.model.id
        });
        
        that.modules.add(model);
    };
    
    View.prototype.renderModules = function(){
        console.log('renderModules()');
        var that = this;
        that.controls.modules.html(MODULES({
            id: that.id,
            modules: that.modules.toJSON()
        }));
    };

    return View;
});