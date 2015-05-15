'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    L = require('../logger'),
    request = B.promisify(require('request')),
    fs = B.promisifyAll(require('fs')),
    Socket = require('socket.io-client'),
    dataIO = require('data.io'),
    Mailer = require('../mailer'),

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
        L.infoAsync(__filename + ' ::run-site STARTED ============================================');
        var Site = require('../odm/models/site'),
            Module = require('../odm/models/module'),
            ExecutionStatus = require('../odm/models/execution-status');
        L.infoAsync('[' + __filename + ':run-site] started', JSON.stringify(job.attrs.data));
        var siteId = job.attrs.data.siteId,
            site, modules;

        var updateSiteStatus = function(modules) {
            var socket = Socket.connect('http://127.0.0.1:' + process.env.PORT);
            var conn = require('data.io').client(socket);
            var resource = conn.resource('site');

            return new B(function(resolve, reject) {
                var dataToSend = {
                    id: siteId,
                    status: site.status,
                    modules: modules,
                    requestType: 'status-report'
                };


                // L.infoAsync(__filename + ' ::run-site reports status=%d of %s:%s via client web-socket: %s', site.status, siteId, site.name, JSON.stringify(dataToSend));
                resource.sync('patch', dataToSend,
                    function(err, result) {
                        if (err) {
                            // L.errorAsync(__filename + ' ::run-site failed to report the status of %s:%s via client web-socket.', siteId, site.name);
                            // reject(err);
                            // return;
                        }
                        resolve(result);
                        // L.infoAsync(__filename + ' ::run-site reporting status of %s:%s via client web-socket succeeded.', siteId, site.name);
                    });
            });
        };


        B.all([
                Site.findOneAsync({
                    _id: siteId
                })
            ])
            .spread(function(s) {
                site = s;
                modules = site.modules || [];
                L.infoAsync(__filename + ' ::run-site about to run health check for %s:%s. Number of modules is %d.', site._id, site.name, modules.length);
                site.status = ExecutionStatus.ID_RUNNING;
                var failure = false;
                return updateSiteStatus()
                    .then(function() {
                        return B.reduce(modules, function(memo, module) {
                            module.status = ExecutionStatus.ID_RUNNING;
                            module.logs = '';
                            var screenshotAbsPath = [config.rootPath, 'data', 'screenshots', module._id + '.png'].join('/');
                            var absPath = [config.rootPath, 'data', 'modules', module._id + '.js'].join('/');
                            L.infoAsync(__filename + ' ::run-site MODULE %s:%s is started.', module._id.toHexString(), module.name);
                            return updateSiteStatus([{
                                    _id: module._id,
                                    status: module.status,
                                    logs: module.logs
                                }])
                                .then(function() {
                                    //write the script to a file
                                    return fs.writeFileAsync(absPath, module.script, {
                                        flags: 'w'
                                    });
                                })
                                .then(function() {
                                    L.errorAsync(module.libraries);
                                    return B.settle(_.map(module.libraries || [], function(lib) {
                                        var dest = [config.rootPath, 'data', 'modules', 'libs', lib.path.split('/').pop()].join('/');
                                        return request(lib.path)
                                            .then(function(content) {
                                                return fs.writeFileAsync(dest, content, {
                                                    flags: 'w'
                                                });
                                            })
                                            .catch(function(e){
                                                L.warnAsync('Failed to download ' + lib.path);
                                            });
                                    }));
                                })
                                .then(function() {
                                    var cmd = [config.casper.absolutePath, 'test', '--web-security=false', absPath, '--screenshotPath=' + screenshotAbsPath].join(' ');
                                    L.infoAsync(__filename + ' ::run-site command to execute: ' + cmd);
                                    return new B(function(resolve, reject) {
                                        nexpect.spawn(cmd, {
                                                stripColors: true,
                                                verbose: true,
                                                stream: 'stdout'
                                            })
                                            .run(function(err, stdout, exitcode) {
                                                if (err || (exitcode !== 0)) {
                                                    failure = true;
                                                }
                                                L.infoAsync(__filename + ' ::run-site MODULE %s:%s is %s.', module._id.toHexString(), module.name, (exitcode !== 0) ? 'failed' : 'succeeded');
                                                module.status = (exitcode !== 0) ? ExecutionStatus.ID_ERROR : ExecutionStatus.ID_OK;
                                                module.logs = (stdout || []).join("\n");
                                                return updateSiteStatus([{
                                                        _id: module._id,
                                                        status: module.status,
                                                        logs: module.logs
                                                    }])
                                                    .finally(resolve);

                                            });
                                    });
                                });
                        }, false);
                    })
                    .then(function() {
                        site.status = failure ? ExecutionStatus.ID_ERROR : ExecutionStatus.ID_OK;
                        L.infoAsync(__filename + ' ::run-site SITE %s:%s %s.', site._id.toHexString(), site.name, failure ? 'FAILED' : 'succeeded');
                        return updateSiteStatus();
                    })
                    .catch(function(e) {
                        site.status = ExecutionStatus.ID_ERROR;
                        L.errorAsync(__filename + ' ::run-site SITE %s:%s FAILED. Reason: %s', site._id.toHexString(), site.name, e);
                        return updateSiteStatus();
                    })
                    .finally(function() {
                        if (!_.isEmpty(site.notificationReceiverEmails) && job.attrs.data.type === 'ON_SCHEDULE') {
                            if(site.sendEmailWhenModuleFails) {
                                if(site.status === ExecutionStatus.ID_ERROR) {
                                    sendEmail();
                                }
                            } else {
                                sendEmail();
                            }

                        }
                        if (job.attrs.data.type === 'ON_SCHEDULE' && site.schedule) {
                            L.infoAsync(__filename + ' ::run-site rescheduling the job.', site._id.toHexString(), site.name);
                            job.schedule(site.schedule);
                            job.save(function(err) {
                                if (err) {
                                    L.errorAsync(__filename + ' ::run-site rescheduling the job for %s:%s FAILED.', site._id.toHexString(), site.name);
                                    return;
                                }

                                L.infoAsync(__filename + ' ::run-site job rescheduled for %s:%s.', site._id.toHexString(), site.name);
                            });
                        }
                        L.infoAsync(__filename + ' ::run-site COMPLETED ============================================');
                        done();
                        
                        function sendEmail() {
                            var mailer = new Mailer();
                            mailer.send({
                                to: site.notificationReceiverEmails,
                                bcc: 'duyanh.nguyen.ctr@sabre.com',
                                subject: (site.status === ExecutionStatus.ID_ERROR ? 'FAILED' : 'SUCCESS') + ': Health Check Dashboard Report for ' + site.name,
                                html: '<h1>' + site.name + ' - ' + '<font color="' + (site.status === ExecutionStatus.ID_ERROR ? 'red' : 'green') + '">' + (site.status === ExecutionStatus.ID_ERROR ? 'FAILED' : 'SUCCESS') + '</font></h1>' +
                                    '<h3>Modules:</h3>' +
                                    '<ul>' + _.map(modules, function(module) {
                                        return '<li>' + module.name + ' - ' + '<font color="' + (module.status === ExecutionStatus.ID_ERROR ? 'red' : 'green') + '">' + (module.status === ExecutionStatus.ID_ERROR ? 'FAILED' : 'SUCCESS') + '</font></li>';
                                    }).join('') + '</ul>'
                            });
                        }

                    });
            });
    });
};
