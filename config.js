var path = require('path'),
    pkg = require('./package.json'),
    env = process.env.NODE_ENV || 'development';

var config = {};
config.development = {
    rootPath: __dirname,
    app: {
        name: pkg.name,
        fullName: 'Health Check',
        version: pkg.version,
        frontend: '//health-check.divshot.io'
    },
    mail: {
        port: 25,
        host: 'smtp.mailgun.org',
        auth: {
            user: '<mailgun user>',
            pass: '<mailgun password>'
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
