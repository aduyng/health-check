'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    _ = require('underscore');


var Schema = new odm.Schema({
    lastLoginAt: {
        type: Number,
        default: _.now()
    },
    username: {
        type: String, 
        required: true,
        trim: true
    },
    password: {
        type: String, 
        required: true,
        trim: true
    },
    stats: {
        type: Object,
        error: {
            type: Object,
            days: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            weeks: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            months: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            total: Number
        },
        success: {
            type: Object,
            days: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            weeks: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            months: {
                type: Object,
                dates: [{
                    type: Object,
                    date: String,
                    total: Number
                }]
            },
            total: Number
        }
    }
});


module.exports = Schema;