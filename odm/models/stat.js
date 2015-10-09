var env    = process.env.NODE_ENV || 'development',
    config = require('./../../config')[env],
    B      = require('bluebird'),
    odm    = require('../../odm'),
    Schema = require('../schemas/stat'),
    L      = require('./../../logger'),
    _      = require('underscore');

var Model = odm.model('Stat', Schema);
B.promisifyAll(Model);
B.promisifyAll(Model.prototype);
module.exports = Model;