define(function(require) {
    var Super = require('./base'),
        B = require('bluebird'),
        ExecutionStatus = require('./execution-status'),
        Model = Super.extend({
            name: 'site'
        });

    Model.prototype.run = function() {
        var that = this;
        that.set('status', ExecutionStatus.ID_SCHEDULED);
        return that.save();
    };

    // Model.prototype.duplicate = function() {
    //     var that = this;
    //     return B.resolve(window.app.socket.request({
    //             type: 'POST',
    //             url: '/index/clone/' + that.id
    //         }));
    // };

    return Model;
});