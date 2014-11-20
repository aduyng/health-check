define(function(require) {
    var _ = require('underscore'),
        Super = require('./base'),
        Model = require('../models/schedule');

    var Collection = Super.extend({
        model: Model
    });


    return Collection;
});