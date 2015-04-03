var env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    _ = require('underscore'),
    L = require('../logger'),
    B = require('bluebird'),
    ExecutionStatus = require('../odm/models/execution-status');

module.exports = function(connection) {
    var name = 'module',
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

                res.send(doc);

            });
    });

    resource.use('update', 'patch', function(req, res) {
        L.infoAsync(__filename + ' ::update(%s, %s)', name, req.data.id);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                _.extend(doc, _.omit(req.data, 'id'));
                return doc.saveAsync()
                    .spread(function(doc) {

                        res.send(doc);

                    });
            });
    });

    resource.use('delete', function(req, res) {
        L.infoAsync(__filename + ' ::delete(%s, %s)', name, req.data.id);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                return doc.removeAsync();
            })
            .then(function(doc) {
                res.send(200);
            });
    });

    resource.use('read', function(req, res) {
        L.infoAsync(__filename + ' ::read(%s, %s)', name, req.data.id);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                res.send(doc);
            });
    });

    resource.use('list', function(req, res) {
        L.infoAsync(__filename + ' ::list(%s)', name, req.data);
        Model.findAsync(req.data, {

            })
            .then(function(docs) {
                res.send(docs);
            });
    });

    resource.use('status', function(req, res) {
        L.infoAsync(__filename + ' ::status(%s)', name, req.data);
        Model.findOneAsync({
                _id: req.data.id
            })
            .then(function(doc) {
                _.extend(doc, _.pick(req.data, 'status', 'logs'));
                return doc.saveAsync()
                    .spread(function(doc) {
                        res.send(doc);
                    });
            });
    });
    return resource;
};
