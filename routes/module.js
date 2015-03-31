/*
 * GET home page.
 */

module.exports = function (app) {
    var controller = app.controllers.module;

    app.get('/rest/module', controller.list);
    app.post('/rest/module', controller.post);
    app.get('/rest/module/:id', controller.get);
    app.put('/rest/module/:id', controller.put);
    app.delete('/rest/module/:id', controller.delete);
};
