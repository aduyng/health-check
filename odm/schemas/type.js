'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config'),
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    _ = require('underscore');


var Schema = new odm.Schema({
    username: {
        type: String,
        trim: true,
        required: true
    },
    password: {
        type: String
    }
});


module.exports = Schema;