module.exports = function (app) {
    var controller = app.controllers.status;

    app.get('/rest/status', controller.list);
    
    app.post('/rest/status', controller.post);
};