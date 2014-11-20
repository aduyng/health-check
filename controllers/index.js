var Bluebird = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    _ = require('underscore');


exports.config = function(req, res, next) {
    var data = {

    };
    res.send(200, data);

};
