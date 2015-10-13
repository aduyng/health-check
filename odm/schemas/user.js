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
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            weeks: {
                type: Object,
                dates: [{
                    type: Object,
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            months: {
                type: Object,
                dates: [{
                    type: Object,
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            total: {
                        type: Number,
                        default: 0
                    }
        },
        success: {
            type: Object,
            days: {
                type: Object,
                dates: [{
                    type: Object,
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            weeks: {
                type: Object,
                dates: [{
                    type: Object,
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            months: {
                type: Object,
                dates: [{
                    type: Object,
                    date: Number,
                    total: {
                        type: Number,
                        default: 0
                    }
                }]
            },
            total: {
                        type: Number,
                        default: 0
                    }
        }
    }
});


module.exports = Schema;