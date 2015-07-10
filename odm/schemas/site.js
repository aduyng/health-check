'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config'),
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    moment = require('moment'),
    agenda = require('../../agenda'),
    ModuleSchema = require('./module'),
    ExecutionStatus = require('../models/execution-status'),
    _ = require('underscore');


var Schema = new odm.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    notificationReceiverEmails: {
        type: String
    },
    lastExecutedAt: {
        type: Number
    },
    lastExecutionCompletedAt: {
        type: Number
    },
    status: {
        type: Number,
        default: 1
    },
    schedule: {
        type: String
    },
    tags: {
        type: String
    },
    modules: {
        type: [ModuleSchema]
    },
    isEnabled: {
        type: Boolean,
        'default': false
    },
    typeId: {
        type: odm.Schema.Types.ObjectId,
        required: true
    },
    sendEmailWhenModuleFails: {
        type: Boolean,
        'default': false
    },
    userId: {
        type: odm.Schema.Types.ObjectId,
        required: true
    }
});


Schema.methods.stop = function() {
    var that = this;
    that.status = ExecutionStatus.ID_TERMINATED;
    that.modules = _.map(that.modules || [], function(m){
        m.status = ExecutionStatus.ID_TERMINATED;
        return m;
    });
    that.markModified('modules');
    return B.all([that.saveAsync(),
        new B(function(resolve, reject) {
            agenda.jobs({
                name: 'run-site',
                'data.siteId': that._id,
                'data.type': 'ON_DEMAND'
            }, function(err, jobs) {
                var job;
                if (err) {
                    reject(err);
                    return;
                }

                if (jobs && jobs.length > 0) {
                    job = jobs[0];
                    return new B(function(res, rej) {
                        job.remove(function(err) {
                            if (err) {
                                L.errorAsync(__filename + ' ::updateBackgroundJobs() removing job %s failed: %s', job._id, err);
                                rej(err);
                                return;
                            }
                            L.infoAsync(__filename + ' ::updateBackgroundJobs() job %s has been removed.', job._id);
                            res();
                        });
                    })
                    .then(resolve)
                    .catch(reject);
                }
                return resolve();
            });
        })
    ]);
};

Schema.methods.run = function() {
    var that = this;
    that.status = ExecutionStatus.ID_SCHEDULED;
    that.modules = _.map(that.modules || [], function(m){
        m.status = ExecutionStatus.ID_SCHEDULED;
        return m;
    });
    return B.all([
        that.saveAsync(), new B(function(resolve, reject) {
            agenda.jobs({
                name: 'run-site',
                'data.siteId': that._id,
                'data.type': 'ON_DEMAND'
            }, function(err, jobs) {
                var job;
                if (err) {
                    reject(err);
                    return;
                }

                if (jobs && jobs.length > 0) {
                    job = jobs[0];
                }
                else {
                    job = agenda.create('run-site', {
                        siteId: that._id,
                        type: 'ON_DEMAND'
                    });
                }

                job.schedule('in 1 second');
                job.save(function(err) {
                    if (err) {
                        L.errorAsync(__filename + ' ::runOnDemandJob() scheduling ON_DEMAND failed: %s', err);
                        reject(err);
                        return;
                    }
                    L.infoAsync(__filename + ' ::runOnDemandJob() ON_DEMAND job scheduled');
                    resolve(job);
                });
            })
        })
    ]);
};

Schema.methods.updateBackgroundJobs = function() {
    var that = this,
        job;
    return new B(function(resolve, reject) {
        agenda.jobs({
            name: 'run-site',
            'data.siteId': that._id,
            'data.type': 'ON_SCHEDULE'
        }, function(err, jobs) {
            if (err) {
                reject(err);
                return;
            }
            L.infoAsync(__filename + ' ::updateBackgroundJobs() got ' + jobs.length + ' jobs to remove.');

            var removeExistingJob = function(job) {
                if (job) {
                    return new B(function(res, rej) {
                        job.remove(function(err) {
                            if (err) {
                                L.errorAsync(__filename + ' ::updateBackgroundJobs() removing job %s failed: %s', job._id, err);
                                rej(err);
                                return;
                            }
                            L.infoAsync(__filename + ' ::updateBackgroundJobs() job %s has been removed.', job._id);
                            res();
                        });
                    });
                }
                return B.resolve();
            }

            if (jobs && jobs.length > 0) {
                job = jobs[0];
            }
            return removeExistingJob(job)
                .then(function() {
                    L.infoAsync(__filename + ' ::updateBackgroundJobs() creating new ON_SCHEDULE job.');
                    if (that.schedule) {
                        //creating an on-demand job
                        job = agenda.create('run-site', {
                            siteId: that._id,
                            type: 'ON_SCHEDULE'
                        });

                        job.schedule(that.schedule);

                        return new B(function(res, rej) {
                                job.save(function(err) {
                                    if (err) {
                                        L.errorAsync(__filename + ' ::updateBackgroundJobs() creating ON_SCHEDULE failed: %s', err);
                                        rej(err);
                                        return;
                                    }
                                    L.infoAsync(__filename + ' ::updateBackgroundJobs() ON_SCHEDULE created');
                                    res(job);
                                });
                            })
                            .then(resolve)
                            .catch(reject);
                    }
                    L.infoAsync(__filename + ' ::updateBackgroundJobs() schedule is not set, ignore creating new ON_SCHEDULE job.');
                    resolve();
                });
        });
    });
};

Schema.methods.removeBackgroundJobs = function() {
    var that = this;
    return new B(function(resolve, reject) {
        agenda.jobs({
            name: 'run-site',
            'data.siteId': that._id
        }, function(err, jobs) {
            if (err) {
                reject(err);
                return
            }
            jobs = jobs || [];
            return B.all(_.map(jobs, function(job) {
                    return new B(function(resolve, reject) {
                        job.remove(function(err) {
                            if (err) {
                                L.errorAsync(__filename + ' ::post_remove() removing job %s failed: %s', job._id, err);
                                reject(err);
                                return;
                            }
                            L.infoAsync(__filename + ' ::post_remove() job %s has been removed.', job._id);
                            resolve();
                        });
                    });
                }))
                .then(resolve)
                .catch(reject);
        });
    });
};


Schema.virtual('basic').get(function() {
    return _.pick(this, '_id', 'name', 'notificationReceiverEmails', 'lastExecutedAt', 'lastExecutionCompletedAt', 'status', 'schedule');
});

module.exports = Schema;