define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/airline');

    var Collection = Super.extend({
        model: Model,
        comparator: 'abbr'
    });

    // Collection.prototype.toDropdown = function(target, options) {
    //     var that = this;
    //     var formatResult = function(object, container, query) {
    //         var model = that.get(object.id);
    //         return [model.get('name'), ' - ', model.get('url')].join('');
    //     };
    //     var formatSelection = function(object, container) {
    //         var model = that.get(object.id);
    //         return [model.get('name'), ' - ', model.get('url')].join('');
    //     };

    //     var createSearchChoice = function(url) {
    //         return that.add({
    //             id: that.max(function(model) {
    //                 return model.id;
    //             }) + 1,
    //             name: 'New URL',
    //             url: url
    //         });
    //     };

    //     var opts = _.extend({}, {
    //         placeholder: "Select a box or enter a new URL",
    //         allowClear: false,
    //         formatResult: formatResult,
    //         formatSelection: formatSelection,
    //         data: that.toJSON()
    //     }, options);

    //     if (opts.allowNew && !opts.createSearchChoice) {
    //         opts.createSearchChoice = createSearchChoice;
    //     }

    //     return target.select2(opts);
    // };



    return Collection;
});