/*
 * GET home page.
 */

module.exports = function (app) {
    var controller = app.controllers.site;

    app.post('/site/:id/run', controller.run);

    app.get('/rest/site', controller.list);
    
    app.post('/rest/site', controller.post);
    app.patch('/rest/site/:id', controller.put);
    app.put('/rest/site/:id', controller.put);
    app.delete('/rest/site/:id', controller.delete);
    

};