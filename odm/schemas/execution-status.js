'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config'),
    B = require('bluebird'),
    odm = require('../../odm'),
    L = require('./../../logger'),
    moment = require('moment'),
    _ = require('underscore');


var Schema = new odm.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    }
});

module.exports = Schema;