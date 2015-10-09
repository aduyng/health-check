module.exports = function (app) {
    var controller = app.controllers.stats;

    app.get('/rest/stats', controller.list);
    
    app.post('/rest/stats', controller.post);
};