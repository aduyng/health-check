/*
 * GET home page.
 */

module.exports = function (app) {
    var controller = app.controllers.index;

    app.get('/index/config', controller.config);

};