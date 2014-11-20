define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/script');

    var Collection = Super.extend({
        model: Model
    });
    
    
    Collection.prototype.toDropdown = function(target, options) {
        var that = this;
        var format = function(object, container, query) {
            var model = that.get(object.id);
            return model.get('name');
        };
      

        var opts = _.extend({}, {
            placeholder: "Select a script",
            allowClear: false,
            formatResult: format,
            formatSelection: format,
            data: that.toJSON(),
            createSearchChoice: undefined
        }, options);
        
        return target.select2(opts);
    };
    

    return Collection;
});