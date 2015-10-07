'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B = require('bluebird'),
    Schema = require('mongoose').Schema,
    odm = require('../../odm'),
    L = require('./../../logger'),
    _ = require('underscore');
    
var OriginSchema = new odm.Schema({
    name: String,
    jobId: Schema.Types.ObjectId,
    moduleId: Schema.Types.ObjectId,
    url: String
});


var Schema = new odm.Schema({
    status: String,
    dateCreated: {
        type: Date,
        default: Date.now()
    },
    origin: Object
});


module.exports = Schema;