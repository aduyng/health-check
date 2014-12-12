/*
 * GET home page.
 */

module.exports = function (app) {
    var controller = app.controllers.index;

    app.get('/index/config', controller.config);
    app.post('/index/run/:id', controller.run);
    app.post('/index/clone/:id', controller.clone);

};