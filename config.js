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
        frontend: '/app'
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
        url: 'mongodb://localhost/heroku_app35515501',
        options: {
            debug: false
        }
    },
    casper: {
        absolutePath: 'C:/Users/sg0945919/AppData/Roaming/npm/node_modules/casperjs/bin/casperjs'
    },
    session: {
        secret: '8Kh862PMMabR'
    }
};

module.exports = config;
