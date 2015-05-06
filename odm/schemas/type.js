'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
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
    }
});


module.exports = Schema;