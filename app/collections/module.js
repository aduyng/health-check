define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/module');

    var Collection = Super.extend({
        model: Model,
        comparator: 'name'
    });
    
    
    // Collection.prototype.toDropdown = function(target, options) {
    //     var that = this;
        
    //     var formatResult = function(object, container, query) {
    //         var model = that.get(object.id);
    //         return [model.get('name'), ' - ', model.get('width'), 'x', model.get('height')].join('');
    //     };
    //     var formatSelection = function(object, container) {
    //         var model = that.get(object.id);
    //         return [model.get('name'), ' - ', model.get('width'), 'x', model.get('height')].join('');
    //     };

    //     var opts = _.extend({}, {
    //         placeholder: "Select a device",
    //         allowClear: false,
    //         formatResult: formatResult,
    //         formatSelection: formatSelection,
    //         data: that.toJSON(),
    //         createSearchChoice: undefined
    //     }, options);
        
    //     return target.select2(opts);
    // };
    

    return Collection;
});