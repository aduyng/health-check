'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    L = require('../logger'),
    fs = B.promisifyAll(require('fs')),
    Socket = require('socket.io-client'),
    dataIO = require('data.io'),
    nexpect = require('nexpect'),

    _ = require('underscore');

function loop(promise, fn) {
    return promise.then(fn)
        .then(function(wrapper) {
            if (!wrapper.done) {
                return loop(B.resolve(wrapper), fn);
            }
            return wrapper;
        });
}

module.exports = function(agenda) {
    agenda.define('run-site', function(job, done) {
        var Site = require('../odm/models/site'),
            Module = require('../odm/models/module');
        L.infoAsync('[' + __filename + ':run-site] started', JSON.stringify(job.attrs.data));
        var siteId = job.attrs.data.siteId;

        var letTheServerKnow = function(resourceName, resourceObj) {
            var socket = Socket.connect('http://127.0.0.1:' + process.env.PORT);
            var conn = require('data.io').client(socket);
            var resource = conn.resource(resourceName);

            return new B(function(resolve, reject) {
                var dataToSend = resourceObj.toJSON();
                dataToSend.id = resourceObj._id.toHexString();
               
                L.infoAsync(__filename + ' ::run-site reports status=%d of %s:%s via client web-socket: %s', resourceObj.status, resourceObj.name, resourceObj._id.toHexString(), JSON.stringify(dataToSend));
                resource.sync('patch', dataToSend,
                    function(err, result) {
                        if (err) {
                            L.errorAsync(__filename + ' ::run-site failed to report the status of %s:%s via client web-socket.', resourceName, resourceObj._id.toHexString());
                            reject(err);
                            return;
                        }
                        resolve(result);
                        L.infoAsync(__filename + ' ::run-site reporting status of %s:%s via client web-socket succeeded: %s.', resourceName, resourceObj._id.toHexString(), JSON.stringify(result));
                    });
            });
        };


        B.all([
                Site.findOneAsync({
                    _id: siteId
                }),
                Module.findAsync({
                    siteId: siteId,
                    script: {
                        $exists: true,
                        $ne: ''
                    },
                    isEnabled: true
                })
            ])
            .spread(function(site, modules) {
                L.infoAsync(__filename + ' ::run-site about to run health check for %s:%s', site._id, site.name);

                site.status = 2;
                var failure = false;
                return letTheServerKnow('site', site)
                    .then(function() {
                        return B.all(_.map(modules, function(module) {
                                module.status = 2;
                                var absPath = [config.rootPath, 'data', 'modules', module._id + '.js'].join('/');

                                return letTheServerKnow('module', module)
                                    .then(function() {
                                        //write the script to a file
                                        return fs.writeFileAsync(absPath, module.script, {
                                            flags: 'w'
                                        });
                                    })
                                    .then(function() {
                                        var cmd = [config.casper.absolutePath, '--web-security=false', absPath].join(' ');
                                        L.infoAsync(__filename + ' ::run-site command to execute: ' + cmd);
                                        return new B(function(resolve, reject) {
                                            nexpect.spawn(cmd, {
                                                    stripColors: true,
                                                    verbose: true,
                                                    stream: 'stdout'
                                                })
                                                .run(function(err, stdout, exitcode) {
                                                    if (exitcode !== 0) {
                                                        reject({
                                                            err: err,
                                                            stdout: stdout,
                                                            exitCode: exitcode
                                                        });
                                                        return;
                                                    }

                                                    resolve({
                                                        err: err,
                                                        stdout: stdout,
                                                        exitCode: exitcode
                                                    });
                                                });
                                        });
                                    })
                                    .then(function(result) {
                                        L.infoAsync(__filename + ' ::run-site module %s succeeded.', module._id.toHexString());
                                        module.status = 3;
                                        module.logs = (result.stdout || []).join("\n");
                                    })
                                    .catch(function(e) {
                                        L.errorAsync(__filename + ' ::run-site module %s FAILED.', module._id.toHexString());
                                        module.status = 4;
                                        module.logs = (e.stdout || []).join("\n");
                                        failure = true;
                                    })
                                    .finally(function() {
                                        letTheServerKnow('module', module);
                                    });
                            }))
                            .then(function() {
                                done();
                            });
                    })
                    .then(function(result) {
                        site.status = failure ? 4 : 3;
                        L.infoAsync(__filename + ' ::run-site site %s:%s %s.', site._id.toHexString(), site.name, failure ? 'FAILED' : 'succeeded');
                    })
                    .catch(function(e) {
                        site.status = 4;
                        L.errorAsync(__filename + ' ::run-site site %s:%s FAILED.', site._id.toHexString(), site.name);

                    })
                    .finally(function() {
                        return letTheServerKnow('site', site);
                    });
            });
    });
};
