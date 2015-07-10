var env = process.env.NODE_ENV || 'development',
    config = require('./config'),
    B = require('bluebird'),
    winston = require('winston');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            colorize: true
        })
    ]
});
module.exports = B.promisifyAll(logger);