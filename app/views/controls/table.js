/*global _, _s, Backbone*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        THEAD = require('hbs!./table/thead.tpl'),
        TBODY = require('hbs!./table/tbody.tpl'),
        TD = require('hbs!./table/td.tpl'),
        TR = require('hbs!./table/tr.tpl'),
        Template = require('hbs!./table.tpl');


    var View = Super.extend({});

    View.Columns = Backbone.Collection.extend();

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
        this.columns = this.getColumns();
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {

                that.$el.html(Template({
                    id: that.id
                }));

                that.mapControls();
                that.renderHead();
                that.renderBody();

                var events = {};
                events['click th.sortable'] = 'sortableColumnClickHandler';
                that.delegateEvents(events);

                that.collection.on('sync add remove', that.renderBody.bind(that));
                that.on('sort', that.sortHandler.bind(that));
            });

    };
    View.prototype.sortableColumnClickHandler = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var field = e.data('id');
        var column = that.columns.get(field);
        var direction = '';


        that.columns.forEach(function(column) {
            if (column.id !== field) {
                column.set('direction', '');
            }
        });

        switch (column.get('direction')) {
            case 'asc':
                direction = 'desc';
                break;
            case 'desc':
                direction = '';
                break;
            default:
                direction = 'asc';
        }
        column.set('direction', direction);
        that.trigger('sort');

    };

    View.prototype.sortHandler = function(event) {
        var that = this;
        that.renderHead();
    };

    View.prototype.renderHead = function() {
        var that = this;
        // console.log('renderHead()', that.columns.toJSON());
        that.controls.thead.html(THEAD({
            id: that.id,
            columns: that.columns.map(function(column, index) {
                return that.tranformColumn(column, index);
            })
        }));
    };

    View.prototype.getColumns = function() {
        return new View.Columns();
    };


    View.prototype.tranformColumn = function(column, index) {
        return _.extend(column.toJSON(), {
            sortIcon: (function() {
                if (column.get('sortable')) {
                    if (column.get('direction') === 'asc') {
                        if (column.get('type') === 'number') {
                            return 'fa-sort-numeric-asc text-success';
                        }
                        else {
                            return 'fa-sort-alpha-asc text-success';
                        }
                    }
                    else if (column.get('direction') === 'desc') {
                        if (column.get('type') === 'number') {
                            return 'fa-sort-numeric-desc text-warning';
                        }
                        else {
                            return 'fa-sort-alpha-desc text-warning';
                        }
                    }
                    else {
                        return 'fa-sort';
                    }
                }
                else {
                    return '';
                }
            })()
        });
    };


    View.prototype.renderBody = function() {
        var that = this;
        that.controls.tbody.html(TBODY({
            id: that.id,
            rows: that.collection.map(function(model, index) {
                return that.tranformRow(model, index);
            }),
            columns: that.columns.toJSON()
        }));
    };

    View.prototype.tranformRow = function(model, index) {
        var that = this;
        var DefaultRenderer = that.getDefaultRenderer();
        var cells = that.columns.map(function(column, columnIndex) {
            var value = '&nbsp;';
            var renderer = column.get('renderer') || DefaultRenderer;
            var td = column.get('td') || TD;


            if (typeof renderer === 'function') {
                try {
                    value = renderer(model, column, index, columnIndex);
                }
                catch (e) {
                    console.error(e);
                }
            }
            if (typeof td === 'function') {
                return td({
                    value: value,
                    field: column.id,
                    data: model.toJSON(),
                    column: column.toJSON(),
                    rowIndex: index,
                    columnIndex: columnIndex,
                    className: column.get('className')
                });
            }
        });

        return TR({
            data: model.toJSON(),
            cells: cells.join('')
        });

    };

    View.prototype.getDefaultRenderer = function() {
        return function(model, column, rowIndex, columnIndex) {
            return model.get(column.id);
        };
    };

    View.prototype.getSortedColumn = function() {
        var that = this;

        return that.columns.find(function(column) {
            return column.get('direction') === 'asc' || column.get('direction') === 'desc';

        });
    };

    return View;


});