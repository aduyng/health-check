'use strict';
var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env],
    B = require('bluebird'),
    _ = require('underscore'),
    L = require('./logger'),
    S = require('underscore.string'),
    nodemailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-pool');

var Mailer = function (options) {
    var opts = _.extend({}, config.mail, options);
    this.transporter = B.promisifyAll(nodemailer.createTransport(smtpTransport(opts)));

};

Mailer.prototype.send = function (options) {
    var that = this;
    return that.transporter.sendMailAsync(options);
};

module.exports = Mailer;
