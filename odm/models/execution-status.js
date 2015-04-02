var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    odm = require('../../odm'),
    Schema = require('../schemas/execution-status'),
    L = require('./../../logger'),
    _ = require('underscore');

var Model = odm.model('ExecutionStatus', Schema);
B.promisifyAll(Model);
B.promisifyAll(Model.prototype);

Model.ID_SCHEDULED = -1;
Model.ID_NOT_STARTED = 1;
Model.ID_RUNNING = 2;
Model.ID_OK = 3;
Model.ID_ERROR = 4;
Model.ID_TERMINATED = 5;

module.exports = Model;