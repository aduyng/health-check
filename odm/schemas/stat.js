'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    Schema = require('mongoose').Schema,
    odm = require('../../odm'),
    L = require('./../../logger'),
    _ = require('underscore');


var Schema = new odm.Schema({
    site: Object,
    data: {
        type: Object,
        error: {
            type: Object,
            days: Number,
            weeks: Number,
            months: Number,
            total: Number
        },
        success: {
            type: Object,
            days: Number,
            weeks: Number,
            months: Number,
            total: Number
        }
    }
});


module.exports = Schema;