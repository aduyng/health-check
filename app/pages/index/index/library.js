/*global _, _s*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        ITEM = require('hbs!./library.item.tpl'),
        TEMPLATE = require('hbs!./library.tpl');


    var View = Super.extend({});
    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
    };


    View.prototype.render = function() {
        var that = this;

        that.$el.html(TEMPLATE({
            id: this.id
        }));
        that.mapControls();
        
        this.collection.on('all', this.onCollectionChange.bind(this));

        var events = {};
        events['change ' + this.toClass('input')] = 'onInputChange';
        events['click ' + this.toClass('delete')] = 'onDeleteClick';
        that.delegateEvents(events);
        
        if( this.collection.length === 0){
            this.collection.add({
                path: ''
            });
        } else {
            this.draw();
        }
        
    };
    
    View.prototype.onCollectionChange = function(){
        this.draw();  
    };
    
    View.prototype.onDeleteClick = function(event){
        event.preventDefault();
        var e = $(event.currentTarget);
        var model = this.collection.get(e.data('cid'));
        model.destroy();
    };
    
    View.prototype.draw = function(){
        var that = this;
        this.controls.list.html(this.collection.map(function(model){
            return ITEM({
                id: that.id,
                data: _.extend(model.toJSON(), {cid: model.cid})
            });
        }));  
    };
    
    View.prototype.onInputChange = function(event) { 
        var e = $(event.currentTarget);
        
        var library = this.collection.get(e.data('cid'));
        library.set('path', e.val().trim());
        
        if( !_.isEmpty(this.collection.last().get('path'))){
            this.collection.add({
                path: ''
            });
        } 
    };
    
    return View;
});