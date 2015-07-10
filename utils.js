var env = process.env.NODE_ENV || 'development',
    config = require('./config'),
    Promise = require('bluebird'),
    Checkit = require('checkit'),
    _ = require('underscore'),
    moment = require('moment'),
    logger = require('./logger'),
    _s = require('underscore.string');



exports.sendError = function(e, req, res, next) {
    var data = {
        message: 'Unknown Error'
    };


    if (e instanceof Checkit.Error) {
        res.send(400, {
            type: 'ValidationError',
            message: e.message,
            data: e.toJSON()
        });
        return;
    }

    if (_.isString(e)) {
        data.message = e;
    }
    if( e instanceof Error){
        data.message = e.message;
    }
    
    logger.error(e, data);
    res.send(400, data);
};