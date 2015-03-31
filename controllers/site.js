var B = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    Site = require('../odm/models/site'),
    U = require('../utils'),
    _ = require('underscore');



exports.list = function(req, res, next) {

    B.resolve(new B(function(resolve, reject) {
            var qb = Site.find();

            if (req.query.query) {
                qb.where({
                    name: new RegExp(req.query.query, 'i')
                });

            }

            qb.limit(req.query.limit || 10)
                .skip(req.query.offset || 0)
                .select('name notificationReceiverEmails lastExecutedAt lastExecutionCompletedAt status schedule')
                .sort({
                    name: 'asc'
                })
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

    new Site(_.pick(req.body, 'name', 'notificationReceiverEmails', 'schedule', 'schedule'))
        .saveAsync()
        .spread(function(site) {
            return site.updateJobScheduler()
                .then(function() {
                    res.send(site.basic);
                });

        })

    .catch(function(e) {
        U.sendError(e, req, res, next);
    });

};

exports.put = function(req, res, next) {
    Site.findOneAndUpdateAsync({
            _id: req.params.id
        }, _.pick(req.body, 'name', 'notificationReceiverEmails', 'schedule'))
        .then(function(site) {
            site.updateJobScheduler().then(function() {
                res.send(site.basic);
            });
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};

exports.delete = function(req, res, next) {
    Site.findOneAndRemoveAsync({
            _id: req.params.id
        })
        .then(function(site) {
            site.deleteJobScheduler()
                .then(function() {
                    res.send({
                        count: 1
                    });
                });
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });

};


exports.run = function(req, res, next) {
    Site.findOneAsync({
            _id: req.params.id
        })
        .then(function(site) {
            return site.run()
                .then(function() {
                    res.send(site.basic);
                });
        })
        .catch(function(e) {
            U.sendError(e, req, res, next);
        });
};