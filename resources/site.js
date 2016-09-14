var env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    _ = require('underscore'),
    L = require('../logger'),
    B = require('bluebird'),
    ExecutionStatus = require('../odm/models/execution-status');

module.exports = function(connection) {
    var name = 'site',
        Model = require('../odm/models/' + name),
        resource = connection.resource(name);

    resource.on('connection', function(client) {
        L.infoAsync(__filename + ' ::connection(%s)', client.id);
        client.join('room:' + name);
    });

    resource.on('sync', function(sync) {
        // Prevent sync event from being broadcast to connected clients
        sync.stop();

        if (!_.contains(['read', 'list'], sync.action)) {
            L.infoAsync(__filename + ' ::sync() notify room:%s', name);
            sync.notify(sync.client.broadcast.to('room:' + name));
        }
    });

    resource.use('create', function(req, res) {
       
        L.infoAsync(__filename + ' ::create(%s)', name, req.data);
        new Model(req.data)
            .saveAsync()
            .spread(function(doc) {
                return B.resolve(doc.updateBackgroundJobs())
                    .then(function() {
                        L.infoAsync(__filename + ' ::create() sending back newly created model');
                        res.send(doc);
                    });
            })
            .catch(function(e) {
                L.errorAsync(e);
            });

    });

    resource.use('update', 'patch', function(req, res) {
        L.infoAsync(__filename + ' ::update(%s, %s)', name, req.data.id);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                switch (req.data.requestType) {
                    case 'status-report':
                        _.extend(doc, _.pick(req.data, 'status'));
                        if (req.data.modules) {
                            var modules = doc.modules || [];
                            _.forEach(modules, function(module, index) {
                                _.every(req.data.modules, function(m) {
                                    if (m._id === module._id.toHexString()) {
                                        modules[index].logs = m.logs;
                                        modules[index].status = m.status;
                                        return false;
                                    }
                                    return true;
                                });
                            })
                            
                            doc.modules = modules;
                            doc.markModified("modules");
                        }
                        
                        if (req.data.status === 3) {
                            doc.lastExecutedAt = doc.lastExecutionCompletedAt = new Date();
                        }
                        return doc.saveAsync()
                            .spread(function(d) {
                                res.send(d);
                            });
                    case 'run':
                        _.extend(doc, _.pick(req.data, 'userId'));
                        return doc.run()
                            .then(function() {
                                res.send(doc);
                            });
                    case 'stop':
                        return doc.stop()
                            .then(function() {
                                L.error('responded');
                                res.send(doc);
                            });
                    default:
                        _.extend(doc, _.pick(req.data, 'name', 'tags', 'notificationReceiverEmails', 'schedule', 'status', 'modules', 'isEnabled', 'sendEmailWhenModuleFails', 'typeId', 'userId'));
                        if (req.data.modules) {
                            doc.markModified("modules");
                        }
                        return doc.saveAsync()
                            .then(function(d) {
                                return doc.updateBackgroundJobs()
                                    .then(function() {
                                        res.send(d);
                                    });
                            });
                }
            })
            .catch(function(e) {
                L.errorAsync(e);
            });
    });

    resource.use('delete', function(req, res) {
        L.infoAsync(__filename + ' ::delete(%s, %s)', name, req.data.id);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                return B.all([
                    doc.removeBackgroundJobs(),
                    doc.removeAsync()
                ]);
            })
            .then(function(doc) {
                res.send(200);
            })
            .catch(function(e) {
                L.errorAsync(e);
            });
    });

    // resource.use('read', function(req, res) {
    //     L.infoAsync(__filename + ' ::read(%s, %s)', name, req.data.id);
    //     Model.findOneAsync({
    //             _id: req.data.id
    //         })
    //         .then(function(doc) {
    //             res.send(doc);
    //         });
    // });

    resource.use('list', function(req, res) {
        L.infoAsync(__filename + ' ::list(%s)', name, req.data);
        Model.findAsync(req.data)
            .then(function(docs) {
                res.send(docs);
            })
            .catch(function(e) {
                L.errorAsync(e);
            });
    });

    // resource.use('run', function(req, res) {
    //     L.infoAsync(__filename + ' ::run(%s)', name, req.data);
    //     Model.findOneAsync({
    //             _id: req.data.id
    //         })
    //         .then(function(doc) {
    //             return doc.run()
    //                 .then(function(doc) {
    //                     res.send(doc);
    //                 });
    //         });
    // });

    // resource.use('stop', function(req, res) {
    //     L.infoAsync(__filename + ' ::stop(%s)', name, req.data);
    //     Model.findOneAsync({
    //             _id: req.data.id
    //         })
    //         .then(function(doc) {
    //             return doc.stop()
    //                 .then(function(doc) {
    //                     res.send(doc);
    //                 });
    //         });
    // });


    return resource;
};
