var Super = require('./base'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    logger = require('../logger'),

    Model = Super.extend({
        tableName: 'ExecutionStatus'
    });
    
    Model.ID_NOT_STARTED = 1;
    Model.ID_RUNNING = 2;
    Model.ID_OK = 3;
    Model.ID_ERROR = 4;

module.exports = Model;
