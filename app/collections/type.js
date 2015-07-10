define(function(require) {
  var _ = require('underscore'),
    Super = require('./base'),
    Model = require('../models/type');

  var Collection = Super.extend({
    model: Model,
    comparator: 'priority'
  });


  return Collection;
});