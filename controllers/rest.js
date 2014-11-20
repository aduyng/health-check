var db = require('../db'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    logger = require('../logger'),
    _ = require('underscore'),
    utils = require('../utils'),
    _s = require('underscore.string');


function getCollection(req, res, next) {
    var Collection,
        name = _s.slugify(req.params.name);
    try {
        Collection = require('../collections/' + name);
    }
    catch (e) {
        // logger.warn('Client requested undefined collection ' + name, e.trace());
        logger.warn('Client requested undefined collection ' + name);
        // utils.sendError(e, req, res, next);
        res.send(404);
    }
    return Collection;
};

function fetchOne(req, res, next) {
    var Collection = getCollection(req, res, next);
    if (Collection) {
        return Collection.forge().fetchMany({
                selection: [{
                    field: 'id',
                    value: req.params.id
            }],
                limit: 1
            }, {
                user: req.user
            })
            .then(function(docs) {
                if (docs && docs.length > 0) {
                    return docs.at(0);
                }
                return undefined;
            });
    }
    return undefined;
}

exports.fetchMany = function(req, res, next) {
    var Collection = getCollection(req, res, next);
    if (Collection) {
        return Collection.forge().fetchMany(req.query, {
                user: req.user
            })
            .then(function(docs) {
                if (docs) {
                    res.send(docs.export(req.user, req.query.columns ));
                }
            })
            .catch(function(e) {
                utils.sendError(e, req, res, next);
            });
    }
    res.send(404);
};


exports.create = function(req, res, next) {
    var Collection = getCollection(req, res, next);

    if (Collection) {
        return Collection.forge().create(req.body, {
                user: req.user
            })
            .then(function(doc) {
                res.send(doc.export(req.user));
            })
            .catch(function(e) {
                utils.sendError(e, req, res, next);
            });
    };
    res.send(404);
}




exports.fetchOne = function(req, res, next) {
    var Model,
        name = req.params.name;
    try {
        Model = require('../models/' + _s.dasherize(name));
    }
    catch (e) {
        logger.warn('Client requested undefined model!');
        // utils.sendError(e, req, res, next);
        res.send(404);
        return;
    }

    Model.forge({
            id: req.params.id
        })
        .fetch()
        .then(function(doc) {
            res.send(doc.export(req.user));
        })
        .catch(function(e) {
            utils.sendError(e, req, res, next);
        });
};


exports.update = function(req, res, next) {
    var Model,
        name = req.params.name;
    try {
        Model = require('../models/' + _s.dasherize(name));
    }
    catch (e) {
        logger.warn('Client requested undefined model!');
        // utils.sendError(e, req, res, next);
        res.send(404);
    }
    Model.forge({
            id: req.params.id
        })
        .fetch({
            require: true
        })
        .then(function(doc) {
            // console.log(_.pick(req.body, _.without(_.keys(doc.toJSON()), 'id')));
            // console.log(_.without(_.keys(doc.toJSON()), 'id'));

            return doc.save(_.pick(req.body, _.without(_.keys(doc.toJSON()), 'id')), {
                patch: true,
                user: req.user
            });
        })
        .then(function(doc) {
            res.send(doc.export(req.user));
        })
        .catch(function(e) {
            utils.sendError(e, req, res, next);
        });
};


exports.delete = function(req, res, next) {
    B.resolve(fetchOne(req, res, next))
        .then(function(doc) {
            if (doc) {
                return doc.destroy({
                        user: req.user
                    })
                    .then(function() {
                        res.send({
                            count: 1
                        });
                    });
            }
            res.send(404);
        });

};


// exports.screenshots = function(req, res, next) {
//     Model.forge({
//             id: req.params.id
//         })
//         .fetch()
//         .then(function(model) {
//             return model.getScreenshots();
//         })
//         .then(function(results) {
//             res.send(results);
//         })
//         .catch(function(e) {
//             utils.sendError(e, req, res, next);
//         });
// };


// exports.delete = function(req, res, next) {
//     Model.forge({
//             id: req.params.id
//         })
//         .fetch()
//         .then(function(model) {
//             return model.destroy();
//         })
//         .then(function() {
//             res.send({
//                 count: 1
//             });
//         })
//         .catch(function(e) {
//             utils.sendError(e, req, res, next);
//         });
// };
