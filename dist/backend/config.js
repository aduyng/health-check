var path = require('path'),
    pkg = require('./package.json'),
    env = process.env.NODE_ENV || 'development';

var config = {};
config.development = {
    rootPath: __dirname,
    app: {
        name: pkg.name,
        fullName: 'Health Check',
        version: pkg.version
        //frontend: '//health-check.divshot.io'
    },
    mail: {
        port: 25,
        host: 'smtp.mailgun.org',
        auth: {
            user: 'postmaster@sandbox6b182246ef0f454c9a739cdcba2ba9e0.mailgun.org',
            pass: '0adb4032d268d74f2a50c22800c01bb6'
        }
    },
    mongo: {
        url: 'mongodb://localhost/healthcheck',
        options: {
            debug: false
        }
    },
    casper: {
        absolutePath: '/usr/bin/casperjs'
    }
};

module.exports = config;