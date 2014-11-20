/*global _, _s*/
define(function(require) {
    var Super = require('views/controls/table'),
        ActionTemplate = require('hbs!./action.tpl'),
        B = require('bluebird');


    var View = Super.extend();

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);

    };


    View.prototype.getColumns = function() {
        var that = this;
        return new View.Columns([{
            id: 'id',
            name: '#',
            type: 'number',
            sortable: true
        }, {
            id: 'name',
            name: 'Name',
            sortable: true,
            renderer: function(model, column, rowIndex, columnIndex) {
                return model.get('name');
            }
        }, {
            id: 'path',
            name: 'Path',
            sortable: true,
            renderer: function(model, column, rowIndex, columnIndex) {
                return model.get('path');
            }
        }, {
            id: 'action',
            renderer: function(model, column, rowIndex, columnIndex) {
                return ActionTemplate({
                    id: model.id
                });
            }
        }]);
    };


    return View;


});