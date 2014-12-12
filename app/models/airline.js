define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        Model = Super.extend({
            name: 'airline'
        });

    Model.prototype.run = function() {
        var that = this;
        return B.resolve(window.app.socket.request({
                type: 'POST',
                url: '/index/run/' + that.id
            }));
    };
    
    Model.prototype.duplicate = function() {
        var that = this;
        return B.resolve(window.app.socket.request({
                type: 'POST',
                url: '/index/clone/' + that.id
            }));
    };

    return Model;
});