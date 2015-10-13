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
    moment = require('moment'),
    Status = require('../odm/models/status'),
    Stat = require('../odm/models/stat'),
    User = require('../odm/models/user'),

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
                            console.log('Module: ', module);
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
                                            .catch(function(e) {
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
                        // Status.create({status: failure ? 0 : 1, date: moment(new Date()).unix(), origin: site}, function(err, data) {
                        //     if (err) {
                        //         console.log('err ', err);
                        //         return;
                        //     }
                        //     Stat.create({}, function(err, data) {
                        //         if (err) {
                        //             console.log('err ', err);
                        //             return;
                        //         }
                        //         return updateSiteStatus();
                        //     });

                        // });
                        // Status.create({
                        //         days: {
                        //             dates: [moment().unix()],
                        //             total: 0
                        //         },
                        //         months: {
                        //             dates: [moment().unix()],
                        //             total: 0
                        //         }
                        //     }, function(err, data) {
                        //     if (err) {
                        //         console.log('err ', err);
                        //         return;
                        //     }
                        //     Stat.create({}, function(err, data) {
                        //         if (err) {
                        //             console.log('err ', err);
                        //             return;
                        //         }
                        //         return updateSiteStatus();
                        //     });

                        // });

                        // Status.find({}, function(err, statuses) {
                        //     if (err) {
                        //         console.log(err);
                        //     }
                        //     console.log('Got Statuses::::');
                        //     var status = statuses[0];

                        //     status.days.dates.push(moment().unix());
                        //     status.days.total++;
                        //     status.months.dates.push(moment().unix());
                        //     status.months.total++;

                        //     status.save(function(err) {
                        //         if (err) {
                        //             console.log(err);
                        //         }
                        //     });
                        // });

                        function handleDate(dateArr, type) {
                            
                            if (type === 'days') {
                                if (!dateArr.length) {
                                    return [{
                                        date: moment().dayOfYear(),
                                        total: 1
                                    }];
                                }
                                var found = false;
                                console.log('Day comp==========================> ', dateArr[0].date + ' ' + moment().dayOfYear())
                                for (var i = 0; i < dateArr.length; i++) {
                                        if (dateArr[i].date === moment().dayOfYear()) {
                                            dateArr[i].total++;
                                            found = true;
                                            break;
                                        }
                                    }
                                    //dateArr[dateArr.indexOf(moment().dayOfYear())].total = dateArr[dateArr.indexOf(moment().dayOfYear())].total + 1;
                                    if (found) {
                                        console.log('Days: exists: =====================================', dateArr);
                                        return dateArr;
                                    }
                                if (dateArr.length < 7) {
                                    dateArr.push({
                                        date: moment().dayOfYear(),
                                        total: 1
                                    });
                                    console.log('Days: >7: =====================================', dateArr);
                                    return dateArr;
                                }
                                console.log('Days: shift: =====================================', dateArr);
                                dateArr.shift();
                                dateArr.push({
                                    date: moment().dayOfYear(),
                                    total: 1
                                });
                                return dateArr;
                            }
                            if (type === 'weeks') {
                                if (!dateArr.length) {
                                    return [{
                                        date: moment().week(),
                                        total: 1
                                    }];
                                }
                                var found = false;
                                
                                for (var i = 0; i < dateArr.length; i++) {
                                        if (dateArr[i].date === moment().week()) {
                                            dateArr[i].total++;
                                            found = true;
                                            break;
                                        }
                                    }
                                    //dateArr[dateArr.indexOf(moment().dayOfYear())].total = dateArr[dateArr.indexOf(moment().dayOfYear())].total + 1;
                                    if (found) {
                                        console.log('Days: exists: =====================================', dateArr);
                                        return dateArr;
                                    }
                                if (dateArr.indexOf(moment().week()) > -1) {
                                    dateArr[dateArr.indexOf(moment().week())].total = dateArr[dateArr.indexOf(moment().week())].total + 1;
                                    return dateArr;
                                }
                                if (dateArr.length < 10) {
                                    dateArr.push({
                                        date: moment().week(),
                                        total: 1
                                    });
                                    return dateArr;
                                }
                                dateArr.shift();
                                dateArr.push({
                                    date: moment().week(),
                                    total: 1
                                });
                                return dateArr;
                            }
                            if (type === 'months') {
                                if (!dateArr.length) {
                                    return [{
                                        date: moment().month(),
                                        total: 1
                                    }];
                                }
                                var found = false;
                                
                                for (var i = 0; i < dateArr.length; i++) {
                                        if (dateArr[i].date === moment().month()) {
                                            dateArr[i].total++;
                                            found = true;
                                            break;
                                        }
                                    }
                                    //dateArr[dateArr.indexOf(moment().dayOfYear())].total = dateArr[dateArr.indexOf(moment().dayOfYear())].total + 1;
                                    if (found) {
                                        console.log('Days: exists: =====================================', dateArr);
                                        return dateArr;
                                    }
                                if (dateArr.indexOf(moment().month()) > -1) {
                                    dateArr[dateArr.indexOf(moment().month())].total = dateArr[dateArr.indexOf(moment().month())].total + 1;
                                    return dateArr;
                                }
                                if (dateArr.length < 12) {
                                    dateArr.push({
                                        date: moment().month(),
                                        total: 1
                                    });
                                    return dateArr;
                                }
                                dateArr.shift();
                                dateArr.push({
                                    date: moment().month(),
                                    total: 1
                                });
                                return dateArr;
                            }
                        }

                        var updateDocWIthInc;
                        var updateDocWithSetForData;
                        var updateDocWithSetForUser;


                        Site.findById(site._id, function(err, data) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            User.findById(job.attrs.data.userId, function(err, user) {
                                if (err) {
                                    console.log(err);
                                    return;
                                }

                                if (data && !data.stats) {
                                    data.stats = {
                                        error: {
                                            days: {
                                                dates: [],
                                                total: 0
                                            },
                                            weeks: {
                                                dates: [],
                                                total: 0
                                            },
                                            months: {
                                                dates: [],
                                                total: 0
                                            },
                                            total: 0
                                        },
                                        success: {
                                            days: {
                                                dates: [],
                                                total: 0
                                            },
                                            weeks: {
                                                dates: [],
                                                total: 0
                                            },
                                            months: {
                                                dates: [],
                                                total: 0
                                            },
                                            total: 0
                                        },
                                        total: 0
                                    }
                                }
                                if (user && !user.stats) {
                                    user.stats = {
                                        error: {
                                            days: {
                                                dates: [],
                                                total: 0
                                            },
                                            weeks: {
                                                dates: [],
                                                total: 0
                                            },
                                            months: {
                                                dates: [],
                                                total: 0
                                            },
                                            total: 0
                                        },
                                        success: {
                                            days: {
                                                dates: [],
                                                total: 0
                                            },
                                            weeks: {
                                                dates: [],
                                                total: 0
                                            },
                                            months: {
                                                dates: [],
                                                total: 0
                                            },
                                            total: 0
                                        },
                                        total: 0
                                    }
                                }
                                if (failure) {
                                    updateDocWIthInc = {
                                        'stats.total': 1,
                                        'stats.error.total': 1,
                                        'stats.error.days.total': 1,
                                        'stats.error.weeks.total': 1,
                                        'stats.error.months.total': 1
                                    };
                                    updateDocWithSetForData = {
                                        'stats.error.days.dates': handleDate(data.stats.error.days.dates, 'days'),
                                        'stats.error.weeks.dates': handleDate(data.stats.error.weeks.dates, 'weeks'),
                                        'stats.error.months.dates': handleDate(data.stats.error.months.dates, 'months'),
                                    };
                                    updateDocWithSetForUser = {
                                        'stats.error.days.dates': handleDate(user.stats.error.days.dates, 'days'),
                                        'stats.error.weeks.dates': handleDate(user.stats.error.weeks.dates, 'weeks'),
                                        'stats.error.months.dates': handleDate(user.stats.error.months.dates, 'months'),
                                    };
                                }
                                else {
                                    updateDocWIthInc = {
                                        'stats.total': 1,
                                        'stats.success.total': 1,
                                        'stats.success.days.total': 1,
                                        'stats.success.weeks.total': 1,
                                        'stats.success.months.total': 1
                                    };
                                    updateDocWithSetForData = {
                                        'stats.success.days.dates': handleDate(data.stats.success.days.dates, 'days'),
                                        'stats.success.weeks.dates': handleDate(data.stats.success.weeks.dates, 'weeks'),
                                        'stats.success.months.dates': handleDate(data.stats.success.months.dates, 'months'),
                                    };
                                    updateDocWithSetForUser = {
                                        'stats.success.days.dates': handleDate(user.stats.success.days.dates, 'days'),
                                        'stats.success.weeks.dates': handleDate(user.stats.success.weeks.dates, 'weeks'),
                                        'stats.success.months.dates': handleDate(user.stats.success.months.dates, 'months'),
                                    };
                                }
                                Site.findOneAndUpdate({
                                    _id: site._id
                                }, {
                                    $inc: updateDocWIthInc,
                                    $set: updateDocWithSetForData
                                }, {
                                    'new': true
                                }, function(err, doc) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    console.log('DOC**********************', doc);

                                    User.findOneAndUpdate({
                                        _id: job.attrs.data.userId
                                    }, {
                                        $inc: updateDocWIthInc,
                                        $set: updateDocWithSetForUser
                                    }, {
                                        'new': true
                                    }, function(err, user) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }
                                        console.log('user&&&&&&&&&&&&&& : ', user);
                                    });
                                });
                            });

                        });

                        // Site.findOneAndUpdate({_id: site._id}, {
                        //     $inc: updateDocWIthInc
                        // }, {'new': true}, function(err, doc) {
                        //     if (err) {
                        //         console.log(err);
                        //         return;
                        //     }
                        //     console.log('DOC**********************', doc);
                        //     User.findOneAndUpdate({_id: job.attrs.data.userId}, {
                        //     $inc: updateDocWIthInc
                        // }, {'new': true}, function(err, user) {
                        //         if (err) {
                        //             console.log(err);
                        //             return;
                        //         }
                        //         console.log('user&&&&&&&&&&&&&& : ', user);
                        //     });
                        // });


                        // Site.findById(site._id, function(err, data) {
                        //     if (err) {
                        //         console.log(err);
                        //         return;
                        //     }


                        //     var userId = job.attrs.data.userId;

                        //     if (data && !data.stats) {
                        //         data.stats = {
                        //             error: {
                        //                 days: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 weeks: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 months: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 total: 0
                        //             },
                        //             success: {
                        //                 days: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 weeks: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 months: {
                        //                     dates: [],
                        //                     total: 0
                        //                 },
                        //                 total: 0
                        //             },
                        //             total: 0
                        //         }
                        //     }

                        //     function handleDate(dateArr, type) {
                        //         if (!dateArr.length) {
                        //             return [{
                        //                 date: moment().unix(),
                        //                 total: 1
                        //             }];
                        //         }
                        //         if (type === 'days') {
                        //             if (dateArr.indexOf(moment.unix()) > -1) {
                        //                 dateArr[dateArr.indexOf(moment.unix())].total = dateArr[dateArr.indexOf(moment.unix())].total + 1;
                        //                 console.log('Days: exists: =====================================', dateArr);
                        //                 return dateArr;
                        //             }
                        //             if (dateArr.length < 7) {
                        //                 dateArr.push({
                        //                     date: moment().unix(),
                        //                     total: 1
                        //                 });
                        //                 console.log('Days: >7: =====================================', dateArr);
                        //                 return dateArr;
                        //             }
                        //             console.log('Days: shift: =====================================', dateArr);
                        //             dateArr.shift();
                        //             dateArr.push({
                        //                 date: moment().unix(),
                        //                 total: 1
                        //             });
                        //             return dateArr;
                        //         }
                        //         if (type === 'weeks') {
                        //             if (dateArr.indexOf(moment().week()) > -1) {
                        //                 dateArr[dateArr.indexOf(moment().week())].total = dateArr[dateArr.indexOf(moment().week())].total + 1;
                        //                 return dateArr;
                        //             }
                        //             if (dateArr.length < 10) {
                        //                 dateArr.push({
                        //                     date: moment().week(),
                        //                     total: 1
                        //                 });
                        //                 return dateArr;
                        //             }
                        //             dateArr.shift();
                        //             dateArr.push({
                        //                 date: moment().week(),
                        //                 total: 1
                        //             });
                        //             return dateArr;
                        //         }
                        //         if (type === 'months') {
                        //             if (dateArr.indexOf(moment().week()) > -1) {
                        //                 dateArr[dateArr.indexOf(moment().week())].total = dateArr[dateArr.indexOf(moment().week())].total + 1;
                        //                 return dateArr;
                        //             }
                        //             if (dateArr.length < 12) {
                        //                 dateArr.push({
                        //                     date: moment().month(),
                        //                     total: 1
                        //                 });
                        //                 return dateArr;
                        //             }
                        //             dateArr.shift();
                        //             dateArr.push({
                        //                 date: moment().month(),
                        //                 total: 1
                        //             });
                        //             return dateArr;
                        //         }
                        //     }

                        //     if (failure) {
                        //         console.log('DAYS: %%%%%%%%%%%%%%%%%%%% :', handleDate(data.stats.error.days.dates, 'days'));
                        //         data.stats.error.days.dates = handleDate(data.stats.error.days.dates, 'days');
                        //         data.stats.error.days.total = 2;//data.stats.error.days.total + 1;
                        //         data.stats.error.weeks.dates = handleDate(data.stats.error.weeks.dates, 'weeks');
                        //         data.stats.error.weeks.total = 2;//data.stats.error.weeks.total + 1;
                        //         data.stats.error.months.dates = handleDate(data.stats.error.months.dates, 'months');
                        //         data.stats.error.months.total = 2;//data.stats.error.months.total + 1;
                        //         //data.stats.error.total.$inc() = 2;//data.stats.error.total === 0 ? 1 : data.stats.error.total + 1;
                        //         data.stats.error.total === 0 ? 1 : data.stats.error.total.$inc();
                        //         data.stats.total = data.stats.total === 0 ? 1 : data.stats.total + 1;
                        //     }
                        //     else {
                        //         data.stats.success.days.dates = handleDate(data.stats.success.days.dates, 'days');
                        //         data.stats.success.days.total = data.stats.success.days.total + 1;
                        //         data.stats.success.weeks.dates = handleDate(data.stats.success.weeks.dates, 'weeks');
                        //         data.stats.success.weeks.total = data.stats.success.weeks.total + 1;
                        //         data.stats.success.months.dates = handleDate(data.stats.success.months.dates, 'months');
                        //         data.stats.success.months.total = data.stats.success.months.total + 1;
                        //         data.stats.success.total = data.stats.success.total === 0 ? 1 : data.stats.success.total + 1;
                        //         data.stats.total = data.stats.total === 0 ? 1 : data.stats.total + 1;
                        //     }

                        //     console.log('DATA::::::::::::::::::::::::::::::::', data.stats);

                        //     data.save(function(err, newData) {
                        //         if (err) {
                        //             console.log(err);
                        //             return;
                        //         }

                        //         console.log('Data Saved%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%', newData);

                        //         User.findById(userId, function(err, user) {
                        //             if (err) {
                        //                 console.log(err);
                        //                 return;
                        //             }

                        //             if (user && !user.stats) {
                        //                 user.stats = {
                        //                     error: {
                        //                         days: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         weeks: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         months: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         total: 0
                        //                     },
                        //                     success: {
                        //                         days: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         weeks: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         months: {
                        //                             dates: [],
                        //                             total: 0
                        //                         },
                        //                         total: 0
                        //                     },
                        //                     total: 0
                        //                 }
                        //             }

                        //             if (failure) {
                        //                 user.stats.error.days.dates = handleDate(user.stats.error.days.dates, 'days');
                        //                 user.stats.error.days.total = user.stats.error.days.total + 1;
                        //                 user.stats.error.weeks.dates = handleDate(user.stats.error.weeks.dates, 'weeks');
                        //                 user.stats.error.weeks.total = user.stats.error.weeks.total + 1;
                        //                 user.stats.error.months.dates = handleDate(user.stats.error.months.dates, 'months');
                        //                 user.stats.error.months.total = user.stats.error.months.total + 1;
                        //                 user.stats.error.total = user.stats.error.total === 0 ? 1 : user.stats.error.total + 1;
                        //                 user.stats.total = user.stats.total === 0 ? 1 : user.stats.total + 1;
                        //             }
                        //             else {
                        //                 user.stats.success.days.dates = handleDate(user.stats.success.days.dates, 'days');
                        //                 user.stats.success.days.total = user.stats.success.days.total + 1;
                        //                 user.stats.success.weeks.dates = handleDate(user.stats.success.weeks.dates, 'weeks');
                        //                 user.stats.success.weeks.total = user.stats.success.weeks.total + 1;
                        //                 user.stats.success.months.dates = handleDate(user.stats.success.months.dates, 'months');
                        //                 user.stats.success.months.total = user.stats.success.months.total + 1;
                        //                 user.stats.success.total = user.stats.success.total === 0 ? 1 : user.stats.success.total + 1;
                        //                 user.stats.total = user.stats.total === 0 ? 1 : user.stats.total + 1;
                        //             }

                        //             user.save(function(err) {
                        //                 if (err) {
                        //                     console.log(err);
                        //                     return;
                        //                 }
                        //             });
                        //         });
                        //     });
                        // });
                    })
                    .catch(function(e) {
                        site.status = ExecutionStatus.ID_ERROR;
                        L.errorAsync(__filename + ' ::run-site SITE %s:%s FAILED. Reason: %s', site._id.toHexString(), site.name, e);
                        return updateSiteStatus();
                    })
                    .finally(function() {
                        if (!_.isEmpty(site.notificationReceiverEmails) && job.attrs.data.type === 'ON_SCHEDULE') {
                            if (site.sendEmailWhenModuleFails) {
                                if (site.status === ExecutionStatus.ID_ERROR) {
                                    sendEmail();
                                }
                            }
                            else {
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
