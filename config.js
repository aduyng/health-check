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
        port: '587',
        host: 'smtp.mailgun.org',
        auth: {
          user: 'postmaster@app6eeb7a690d6d4e20841c11a7309dba70.mailgun.org',
          pass: '3e65ce17cccc7f87cf41f7ed9b939e0a'
        },
        apiUrl: 'https://api.mailgun.net/v3',
        publicKey: 'pubkey-a52a29672b2e6d9c0cbfe44cadc07133'
      },
    mongo: {
        url: 'mongodb://heroku_app35515501:ck2jd4t6mq9dgsapr4saau66r4@ds059651.mongolab.com:59651/heroku_app35515501',
        options: {
            debug: false
        }
    },
    casper: {
        absolutePath: 'casperjs'
    },
    session: {
        secret: '8Kh862PMMabR'
    }
};

module.exports = config;
