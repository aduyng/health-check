var B = require('bluebird'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    Status = require('../odm/models/stat'),
    U = require('../utils'),
    _ = require('underscore');



exports.list = function(req, res, next) {

    B.resolve(new B(function(resolve, reject) {
            var qb = Status.find();

            // if (req.query.query) {
            //     qb.where({
            //         name: new RegExp(req.query.query, 'i')
            //     });

            // }

            qb.limit(req.query.limit || 10)
                .skip(req.query.offset || 0)
                .select('boxType data')
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

    new Status(_.pick(req.body, 'boxType', 'data'))
        .saveAsync()
        .spread(function(status) {
            res.send(status);
        })

    .catch(function(e) {
        U.sendError(e, req, res, next);
    });

};