var Super = require('./base'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    logger = require('../logger'),

    Model = Super.extend({
        tableName: 'Airline'
    });


Model.prototype.run = function() {
    var that = this;
    var ModuleCollection = require('../collections/module');
    var modules;

    return ModuleCollection.forge()
        .query(function(qb) {
            qb.where('airlineId', that.id);
            qb.where('isEnabled', 1);
            qb.whereNotNull('url');
        })
        .fetch()
        .then(function(m){
            modules = m;
            return modules.map(function(module){
                return module.run(that);
            });
        })
        .then(function(){
            return that.save({
                executedAt: _.now()
            });
        });
};

module.exports = Model;
