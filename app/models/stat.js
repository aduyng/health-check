define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        _ = require('underscore'),
        Model = Super.extend({
            name: 'stat'
        });

    Model.prototype.duplicate = function() {
        var clonedModel = new Model(_.omit(this.toJSON(), 'id', '_id'));
        clonedModel.set('name', 'Copy of ' + clonedModel.get('name'));
        return B.resolve(clonedModel.save())
            .then(function() {
                return clonedModel;
            });
    };



    return Model;
});
