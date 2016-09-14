'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env],
    B = require('bluebird'),
    L = require('./logger'),
    _ = require('underscore'),
    odm = require('./odm'),
    Agenda = require('agenda');


var agenda = new Agenda({
    db: {
        address: config.mongo.url,
        collection: 'jobs'
    }
}, function () {
    var jobs = ['health-check'];
    _.forEach(jobs, function(module) {
        require('./jobs/' + module)(agenda);
    });

    if (jobs.length) {
        B.all([odm.initialize()])
            .then(function() {
                agenda.start();
            });
    }
});


module.exports = agenda;
