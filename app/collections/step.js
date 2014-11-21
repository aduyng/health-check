define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/step');

    var Collection = Super.extend({
        model: Model,
        comparator: 'priority'
    });


    // Collection.prototype.toDropdown = function(target, options) {
    //     var that = this;
    //     var format = function(object, container, query) {
    //         var model = that.get(object.id);
    //         return model.get('name');
    //     };


    //     var opts = _.extend({}, {
    //         placeholder: "Select a script",
    //         allowClear: false,
    //         formatResult: format,
    //         formatSelection: format,
    //         data: that.toJSON(),
    //         createSearchChoice: undefined
    //     }, options);

    //     return target.select2(opts);
    // };

    Collection.prototype.getNextPriority = function() {
        var v = this.max(function(model) {
            return (model.get('priority') || 0);
        });
        if (v instanceof Model) {
            return (v.get('priority') || 0) + 1;
        }
        return 1;
    };

    return Collection;
});