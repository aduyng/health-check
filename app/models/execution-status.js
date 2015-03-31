define(function(require) {
    var Super = require('./base'),
        HTML = require('hbs!./execution-status/html.tpl');

    var Model = Super.extend({
        name: 'execution-status'
    });

    Model.ID_SCHEDULED = -1;
    Model.ID_NOT_STARTED = 1;
    Model.ID_RUNNING = 2;
    Model.ID_OK = 3;
    Model.ID_ERROR = 4;


    // Model.prototype.toHTML = function() {
    //     var that = this;
    //     switch (that.id) {
    //         case Model.ID_SCHEDULED:
    //             return HTML({
    //                 text: that.get('name'),
    //                 iconClassName: 'fa-calendar'
    //             });
    //         case Model.ID_RUNNING:
    //             return HTML({
    //                 className: 'text-info',
    //                 text: that.get('name'),
    //                 iconClassName: 'fa-spin fa-spinner'
    //             });

    //         case Model.ID_COMPLETED:
    //             return HTML({
    //                 className: 'text-success',
    //                 text: that.get('name'),
    //                 iconClassName: 'fa-smile-o'
    //             });

    //         case Model.ID_ERROR:
    //             return HTML({
    //                 className: 'text-danger',
    //                 text: that.get('name'),
    //                 iconClassName: 'fa-frown-o'
    //             });

    //         case Model.ID_TERMINATED:
    //             return HTML({
    //                 className: 'text-warning',
    //                 text: that.get('name'),
    //                 iconClassName: 'fa-exclamation-triangle'
    //             });


    //     }
    // };
    return Model;
});