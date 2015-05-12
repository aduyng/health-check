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
    }
});


module.exports = Schema;