var path = require('path'),
  pkg = require('./package.json'),
  env = process.env.NODE_ENV || 'development';

var config = {
  rootPath: __dirname,
  port: process.env.PORT || 5000,
  sharedKey: '',
  app: {
    name: pkg.name,
    fullName: 'Health Check',
    version: pkg.version,
    frontend: '//localhost:5000'
  },
  mail: {
    port: 25,
    host: '',
    auth: {
      user: '',
      pass: ''
    }
  },
  mongo: {
    url: '<mongodb URL>',
    options: {
      debug: true
    }
  },
  casper: {
    absolutePath: '/usr/local/bin/casperjs'
  },
  session: {
    name: 'hcsid',
    secret: ''
  }
};

module.exports = config;
