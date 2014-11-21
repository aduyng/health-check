define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        Model = Super.extend({
            name: 'airline'
        });

    Model.prototype.run = function() {
        var that = this;
        B.resolve(window.app.socket.request({
                type: 'POST',
                url: '/index/run/' + that.id
            }));
    };

    return Model;
});