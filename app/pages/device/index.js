/*global _, _s*/
define(function(require) {
    var Super = require('views/page/list'),
        B = require('bluebird'),
        Filter = require('./index/filter'),
        Result = require('./index/result'),
        Collection = require('collections/device');

    var Page = Super.extend({
    });

    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(that, options);
    };
    Page.prototype.getCollection = function(){
        
        return new Collection();
    };
    
    Page.prototype.getRenderOptions = function() {
        return {
            pageName: 'Devices'
        };
    };


    Page.prototype.getFilterOptions = function() {
        var that = this;
        
        return {
        };
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
        var selection = _.reduce(_.omit(data, 'perPage', 'page', 'orderBy'), function(memo, value, key) {
            if (value) {
                switch (key) {
                    case 'name':
                        memo.push({
                            field: 'name',
                            value: value.trim(),
                            operand: 's'
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