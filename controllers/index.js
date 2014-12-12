var Bluebird = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    Airline = require('../models/airline'),
    ModuleCollection = require('../collections/module'),
    StepCollection = require('../collections/step'),
    Module = require('../models/module'),
    Step = require('../models/step'),
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
        .then(function() {
            res.send(200);
        });

};

exports.clone = function(req, res, next) {
    var id = req.params.id,
        airline, newAirline, modules;
    Airline.forge({
            id: id
        })
        .fetch()
        .then(function(doc) {
            airline = doc;
            newAirline = Airline.forge(airline.omit('id'));
            return newAirline.save();
        })
        .then(function() {
            //fetch all modules and create it
            return ModuleCollection.forge()
                .query(function(qb) {
                    qb.where('airlineId', airline.id)
                })
                .fetch();
        })
        .then(function(docs) {
            modules = docs;
            if (modules) {
                return Bluebird.all(modules.map(function(module) {
                    var newModule = Module.forge(_.extend(module.omit('id'), {
                        airlineId: newAirline.id
                    }));

                    return newModule.save()
                        .then(function() {
                            return StepCollection.forge()
                                .query(function(qb) {
                                    qb.where('moduleId', module.id);
                                })
                                .fetch();
                        })
                        .then(function(steps) {
                            if (steps) {
                                return Bluebird.all(steps.map(function(step) {
                                    return Step.forge(_.extend(step.omit('id'), {
                                            moduleId: newModule.id
                                        }))
                                        .save();
                                }));
                            }
                            return Bluebird.resolve();
                        });
                }));
            }
            return Bluebird.resolve();
        })

    .then(function() {
        res.send(newAirline.toJSON());
    });

};