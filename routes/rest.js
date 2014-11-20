/*
 * GET home page.
 */

module.exports = function (app) {
    var controller = app.controllers.rest;

    app.get('/rest/:name', controller.fetchMany);
    app.get('/rest/:name/:id', controller.fetchOne);
    app.post('/rest/:name', controller.create);
    app.put('/rest/:name/:id', controller.update);
    app.patch('/rest/:name/:id', controller.update);
    app.delete('/rest/:name/:id', controller.delete);
    
};