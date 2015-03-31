var B = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    Module = require('../odm/models/module'),
    U = require('../utils'),
    _ = require('underscore');



exports.list = function(req, res, next) {
    B.resolve(new B(function(resolve, reject) {
            var qb = Module.find();

            if (req.query.siteId) {
                qb.where({
                    siteId: req.query.siteId
                });
            }

            qb.select('name url isEnabled lastExecutedAt status lastExecutionCompletedAt')
                .exec(function(error, result) {
                    if (error) {
                        reject(error);
                    }
                    resolve(result);
                });

        }))
        .then(function(result) {
            res.send(result);
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};

exports.post = function(req, res, next) {

    new Module(_.pick(req.body, 'name', 'url', 'isEnabled', 'siteId'))
        .saveAsync()
        .spread(function(module) {
            res.send(module.basic);
        })

    .catch(function(e) {
        U.sendError(e, req, res, next);
    });

};

exports.put = function(req, res, next) {
    Module.findOneAndUpdateAsync({
            _id: req.params.id
        }, _.pick(req.body, 'name', 'isEnabled', 'script'), {
            update: true
        })
        .then(function(doc) {
            res.send(doc.basic);
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};

exports.get = function(req, res, next) {
    Module.findOneAsync({
            _id: req.params.id
        }, req.query.detailed ? {
            script: 1
        } : undefined)
        .then(function(doc) {
            if (req.query.detailed) {
                res.send(doc);
            }
            else {
                res.send(doc.basic);
            }
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};


exports.delete = function(req, res, next) {
    Module.findOneAndRemoveAsync({
            _id: req.params.id
        })
        .then(function(doc) {
            res.send({
                count: 1
            });

        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};