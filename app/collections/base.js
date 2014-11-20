/* global Backbone, _*/
define(function (require) {
    var Super = Backbone.Collection,
        Model = require('../models/base'),
        Collection = Super.extend({
                                      model: Model
                                  });
                                  
    Collection.prototype.initialize = function(options){
        var url;
        Super.prototype.initialize.call(this, options);
        if( _.isEmpty(_.result(this, 'url')) ){
            url = _.result(this.model.prototype, 'url');
            if( !_.isEmpty(url) ){
                this.url = url;
            }else{
                this.url = '/rest' + (this.name || this.model.prototype.name)
            }
        }
    };
    
    
    Collection.prototype.fetch = function(options){
        
        var that = this;
        var name = that.name || that.model.prototype.name;
        
        
        var opts = {
            distinct: [],
            columns: [],
            selection: {},
            groupBy: [],
            having: [],
            orderBy:{},
            limit: undefined,
            offset: undefined
        };
        options = options || {};
        options.data = _.extend({}, opts, options.data);

        return Super.prototype.fetch.call(this, options);    
    };
    
    
    return Collection;
});