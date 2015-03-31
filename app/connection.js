define(function(require) {
    var io = require('socket.io'),
        data = require('data.io');

    var Me = data(io.connect());

    return Me;
});