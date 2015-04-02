'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    moment = require('moment'),
    _ = require('underscore');


var Schema = new odm.Schema({
    name: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    isEnabled: {
        type: Boolean,
        required: true,
        'default': false
    },
    lastExecutedAt: {
        type: Number
    },
    status: {
        type: Number,
        default: 1
    },
    logs: {
        type: String
    },
    lastExecutionCompletedAt: {
        type: Number
    },
    script: {
        type: String
    }
});

Schema.virtual('basic').get(function() {
    return _.pick(this, '_id', 'name', 'url', 'isEnabled', 'lastExecutedAt', 'status', 'lastExecutionCompletedAt');
});


module.exports = Schema;