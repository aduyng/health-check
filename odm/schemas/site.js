'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    Module = require('../models/module'),
    moment = require('moment'),
    agenda = require('../../agenda'),
    _ = require('underscore');


var Schema = new odm.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    notificationReceiverEmails: {
        type: [String]
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
    }
});

Schema.post('save', function(doc) {
    var that = this;
    L.infoAsync(__filename + ' ::post_save()');
    agenda.jobs({
        name: 'run-site',
        'data.siteId': that._id
    }, function(err, jobs) {
        var job;
        if (err) {
            throw err;
        }
        jobs = jobs || [];


        if (that.schedule) {
            L.infoAsync(__filename + ' ::post_save() schedule is set');
            if (!_.find(jobs, function(job) {
                    return job.attrs.data.type === 'ON_SCHEDULE';
                })) {
                L.infoAsync(__filename + ' ::post_save() no ON_SCHEDULE job, creating one.');
                //creating an on-demand job
                job = agenda.create('run-site', {
                    siteId: that._id,
                    type: 'ON_SCHEDULE'
                });
                job.schedule(that.schedule);
                job.save(function(err) {
                    if (err) {
                        L.errorAsync(__filename + ' ::post_save() creating ON_SCHEDULE failed: %s', err);
                        return;
                    }
                    L.infoAsync(__filename + ' ::post_save() ON_SCHEDULE created');
                });
            }
        }
        else {
            L.infoAsync(__filename + ' ::post_save() schedule is NOT set. Delete ON_SCHEDULE job if any.');
            job = _.find(jobs, function(job) {
                return job.attrs.data.type === 'ON_SCHEDULE';
            });

            if (job) {
                job.remove(function(err) {
                    if (err) {
                        L.errorAsync(__filename + ' ::post_save() remove ON_SCHEDULE failed: %s', err);
                        return;
                    }
                    L.infoAsync(__filename + ' ::post_save() ON_SCHEDULE removed');
                });
            }
        }
        //ID_SCHEDULED == -1
        L.infoAsync(__filename + ' ::post_save() status = %d', that.status);
        if (that.status === -1) {
            var job = _.find(jobs, function(job) {
                return job.attrs.data.type === 'ON_DEMAND';
            });

            if (job) {
                
                L.infoAsync(__filename + ' ::post_save() no ON_DEMAND job, creating one.');
                
                //creating an on-demand job
                job = agenda.create('run-site', {
                    siteId: that._id,
                    type: 'ON_DEMAND'
                });

            }
            L.infoAsync(__filename + ' ::post_save() schedule ON_DEMAND job to run in 10 seconds.');
            job.schedule('in 10 seconds');

            job.save(function(err) {
                if (err) {
                    L.errorAsync(__filename + ' ::post_save() saving ON_DEMAND failed: %s', err);
                    return;
                }
                L.infoAsync(__filename + ' ::post_save() ON_DEMAND saved');
            });
        }

    });


});

Schema.post('remove', function(doc) {
    var that = this;
    L.infoAsync(__filename + ' ::post_remove()');
    agenda.jobs({
        name: 'run-site',
        'data.siteId': that._id
    }, function(err, jobs) {
        if (err) {
            throw err;
        }
        jobs = jobs || [];
        _.forEach(jobs, function(job) {
            job.remove(function(err) {
                if (err) {
                    L.errorAsync(__filename + ' ::post_remove() removing job %s failed: %s', job._id, err);
                    return;
                }
                L.infoAsync(__filename + ' ::post_remove() job %s has been removed.', job._id);
            });
        });
    });
});



Schema.virtual('basic').get(function() {
    return _.pick(this, '_id', 'name', 'notificationReceiverEmails', 'lastExecutedAt', 'lastExecutionCompletedAt', 'status', 'schedule');
});

Schema.methods.run = function() {
    var job = agenda.create('run-site', {
        siteId: this._id
    });
    B.promisifyAll(job);
    job.unique({
        'data.siteId': this._id
    });
    job.schedule('in 5 seconds');
    return job.saveAsync();
};

Schema.methods.updateJobScheduler = function() {
    var that = this;
    return that.deleteJobScheduler()
        .then(function() {
            var job = agenda.create('run-site', {
                siteId: that._id,
                isSchedule: true
            });
            job.repeatAt(that.schedule);
            job.schedule(that.schedule);
            job.unique({
                'data.siteId': that._id,
                'data.isSchedule': true
            });
            return new B(function(resolve, reject) {
                job.save(function(err, j) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(j);
                })
            });
        });
};

Schema.methods.deleteJobScheduler = function() {
    var that = this;
    return new B(function(resolve, reject) {
        agenda.jobs({
            name: 'run-site',
            'data.siteId': that._id,
            'data.isSchedule': true
        }, function(err, jobs) {
            if (err) {
                reject(err);
                return;
            }

            if (jobs && jobs.length > 0) {
                return B.all(_.map(jobs, function(job) {
                        return new B(function(res, rej) {
                            job.remove(function(err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                resolve();
                            });
                        });
                    }))
                    .then(function() {
                        resolve();
                    });
            }
            resolve();
        });
    });


};

module.exports = Schema;