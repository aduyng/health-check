'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./config'),
    B = require('bluebird'),
    mongoose = B.promisifyAll(require('mongoose')),
    L = require('./logger');


mongoose.initialize = function() {

    var that = this;
    if (!that.initialized) {
        that.initialized = true;
        return new B(function(resolve, reject) {
            mongoose.set('debug', (config.mongo.options || {}).debug);
            mongoose.connect(config.mongo.url, config.mongo.options || {});

            mongoose.connection.on('error', function(e) {
                L.errorAsync('MongoDb connection failed!', e);
                reject(e);
            });

            mongoose.connection.once('open', function() {
                L.infoAsync('MongoDB connection established.');
                resolve();
            });
        });
    }
    return B.resolve();
};
module.exports = mongoose;
