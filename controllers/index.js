var Bluebird = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    Airline = require('../models/airline'),
    _ = require('underscore');


exports.config = function(req, res, next) {
    var data = {

    };
    res.send(200, data);

};



exports.run = function(req, res, next) {
    var id = req.params.id;
    return Airline.forge({
            id: id
        })
        .fetch({
            required: true
        })
        .then(function(airline) {
            return airline.run();
        })
        .then(function(){
            res.send(200);
        });

};
