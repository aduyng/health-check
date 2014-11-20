var db = require('../db'),
    Super = db.Model,
    _ = require('underscore'),
    _s = require('underscore.string'),
    checkit = require('checkit');

var Model = Super.extend({
    tableName: 'Base',
    hasTimestamps: ['createdAt', 'updatedAt'],
    initialize: function() {
        Super.prototype.initialize.apply(this, arguments);
        this.on('saving', this.validate);

    },
    validate: function() {
        if (!this.validators || this.validators.length === 0) {
            return true;
        }
        return checkit(this.validators).run(this.attributes);
    },
    export: function(viewer, columns) {
        var data = db.Model.prototype.toJSON.call(this);
        if( !_.isEmpty(columns) && _.isArray(columns)){
            return _.pick(data, columns);
        }
        return data;
    },

    // Sets the timestamps before saving the model.
    timestamp: function(options) {
        var d = _.now();

        var keys = (_.isArray(this.hasTimestamps) ? this.hasTimestamps : ['createdAt', 'updatedAt']);
        var vals = {};
        if (keys[1]) vals[keys[1]] = d;
        if (this.isNew(options) && keys[0] && (!options || options.method !== 'update')) vals[keys[0]] = d;
        return vals;
    },
});



module.exports = Model;
