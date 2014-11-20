/*global _, _s*/
define(function(require) {
    var Super = require('views/page/list'),
        B = require('bluebird'),
        Filter = require('./index/filter'),
        Result = require('./index/result'),
        BoxCollection = require('collections/box'),
        ScriptCollection = require('collections/script'),
        DeviceCollection = require('collections/device'),
        TypeCollection = require('collections/job-type'),
        StatusCollection = require('collections/execution-status'),
        Collection = require('collections/job'),
        Select2 = require('select2');

    var Page = Super.extend({
        className: 'list'
    });


    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);

        that.boxCollection = new BoxCollection();
        that.typeCollection = new TypeCollection();
        that.scriptCollection = new ScriptCollection();
        that.deviceCollection = new DeviceCollection();
        that.statusCollection = new StatusCollection();
    };

    Page.prototype.getCollection = function() {
        return new Collection();
    };

    Page.prototype.getRenderOptions = function() {
        return {
            pageName: 'Jobs'
        };
    };

    Page.prototype.preRender = function() {
        var that = this;
        return B.all([
                that.boxCollection.fetch(),
                that.scriptCollection.fetch(),
                that.deviceCollection.fetch(),
                that.typeCollection.fetch(),
                that.statusCollection.fetch()
                ]);
    };



    Page.prototype.getFilterOptions = function() {
        var that = this;

        return {
            boxCollection: that.boxCollection,
            scriptCollection: that.scriptCollection,
            deviceCollection: that.deviceCollection,
            statusCollection: that.statusCollection,
            typeCollection: that.typeCollection
        };
    };

    Page.prototype.getResultOptions = function() {
        var that = this;
        return {
            boxCollection: that.boxCollection,
            scriptCollection: that.scriptCollection,
            deviceCollection: that.deviceCollection,
            statusCollection: that.statusCollection,
            typeCollection: that.typeCollection
        }
    };

    Page.prototype.getFilterClass = function() {
        return Filter;
    };

    Page.prototype.getResultClass = function() {
        return Result;
    };

    Page.prototype.fetch = function() {
        var that = this;
        var data = that.children.filter.serialize();
        var parseValue = function(value) {
            return _.reduce(value.split(','), function(memo, v) {
                var parseValue = parseInt(v);
                if (!isNaN(parseValue)) {
                    memo.push(parseValue);
                }
                return memo;
            }, []);
        };
        
        var selection = _.reduce(_.omit(data, 'perPage', 'page', 'orderBy'), function(memo, value, key) {
            if (value) {
                switch (key) {
                    case 'boxIds':
                        memo.push({
                            field: 'oldBoxId',
                            value: parseValue(value),
                            operand: 'in'
                        });
                        break;
                    case 'scriptIds':
                        memo.push({
                            field: 'scriptId',
                            value: parseValue(value),
                            operand: 'in'
                        });
                        break;
                    case 'deviceIds':
                        memo.push({
                            field: 'deviceId',
                            value: parseValue(value),
                            operand: 'in'
                        });
                        break;
                    case 'statusIds':
                        memo.push({
                            field: 'statusId',
                            value: parseValue(value),
                            operand: 'in'
                        });
                        break;
                }
            }
            return memo;
        }, []);

        var column = that.children.result.getTable().getSortedColumn();
        var orderBy = {};
        if (column) {
            orderBy[column.id] = column.get('direction');
        }
        var page = data.page || 1;
        var perPage = data.perPage || 20;

        return that.collection.fetch({
            data: {
                selection: selection,
                orderBy: orderBy,
                limit: perPage,
                offset: (page - 1) * perPage
            }
        });
    };
    return Page;


});