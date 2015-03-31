define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/site');

    var Collection = Super.extend({
        model: Model,
        comparator: 'name'
    });



    return Collection;
});