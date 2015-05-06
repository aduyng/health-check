var env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    _ = require('underscore'),
    L = require('../logger'),
    B = require('bluebird');

module.exports = function(connection) {
    var name = 'type',
        Model = require('../odm/models/' + name),
        resource = connection.resource(name);

    resource.on('connection', function(client) {
        L.infoAsync(__filename + ' ::connection(%s)', client.id);
    });


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

    return resource;
};
