var db = require('../db'),
    Super = db.Collection,
    Model = require('../models/base'),
    B = require('bluebird'),
    _ = require('underscore'),
    _s = require('underscore.string');

var Collection = Super.extend({
    model: Model
});

Collection.prototype.export = function(viewer, columns) {
    return this.map(function(model) {
        return model.export(viewer, columns);
    });
};

Collection.prototype.readColumnInfo = function() {
    var that = this;
    //TODO: move this into redis server
    if (!that.columnInfo) {
        return db.knex(_.result(that, 'tableName')).columnInfo()
            .then(function(data) {
                that.columnInfo = data;
            });
    }
    return B.resolve();
}


Collection.prototype.fetchMany = function(query) {
    var that = this;

    return that.readColumnInfo()
        .then(function() {
            return that.query(function(qb) {
                    var availableColumns = _.keys(that.columnInfo);
                    var columns = _.intersection(query.columns, availableColumns);
                    var extraColumns = _.difference(query.columns, columns);
                    var orderColumns = [],
                        extraOrderColumns = [];

                    if (query.distinct) {
                        if (!_.isEmpty(columns) && _.isArray(columns)) {
                            qb.distinct(columns);
                        }
                    }

                    // else {
                    //     if (!_.isEmpty(columns) && _.isArray(columns)) {
                    //         qb.column(columns);
                    //     }
                    // }

                    if (!_.isEmpty(query.selection) && _.isArray(query.selection)) {
                        var allowedOperands = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 's', 'ls', 'rs', 'in', 'nin', 'between', 'nbetween', 'null', 'nnull'];
                        _.forEach(query.selection, function(clause) {
                            var field = clause.field,
                                operand = clause.operand || 'eq',
                                value = clause.value;
                            if (_.isEmpty(field) || !_.contains(allowedOperands, operand)) {
                                return false;
                            }

                            switch (operand) {
                                case 'in':
                                    if (!_.isEmpty(value) && _.isArray(value)) {
                                        qb.whereIn(field, value);
                                    }
                                    break;
                                case 'nin':
                                    if (!_.isEmpty(value) && _.isArray(value)) {
                                        qb.whereNotIn(field, value);
                                    }
                                    break;
                                case 'between':
                                    if (!_.isEmpty(value) && _.isArray(value) && value.length === 2) {
                                        qb.whereBetween(field, value);
                                    }
                                    break;
                                case 'nbetween':
                                    if (!_.isEmpty(value) && _.isArray(value) && value.length === 2) {
                                        qb.whereNotBetween(field, value);
                                    }
                                    break;
                                case 'null':
                                    qb.whereNull(field);
                                    break;
                                case 'nnull':
                                    qb.whereNotNull(field);
                                    break;
                                case 's':
                                    if (!_.isEmpty(value) && _.isString(value)) {
                                        qb.where(field, 'like', '%' + value + '%');
                                    }
                                    break;
                                case 'ls':
                                    if (!_.isEmpty(value) && _.isString(value)) {
                                        qb.where(field, 'like', '%' + value);
                                    }
                                    break;
                                case 'rs':
                                    if (!_.isEmpty(value) && _.isString(value)) {
                                        qb.where(field, 'like', value + '%');
                                    }
                                    break;
                                case 'eq':
                                    if (!_.isEmpty(value)) {
                                        qb.where(field, '=', value);
                                    }
                                    break;
                                case 'neq':
                                    if (!_.isEmpty(value)) {
                                        qb.where(field, '<>', value);
                                    }
                                    break;
                                case 'gt':
                                    if (!_.isEmpty(value) && _.isNumber(value)) {
                                        qb.where(field, '>', value);
                                    }
                                    break;
                                case 'gte':
                                    if (!_.isEmpty(value) && _.isNumber(value)) {
                                        qb.where(field, '>=', value);
                                    }
                                    break;
                                case 'lt':
                                    if (!_.isEmpty(value) && _.isNumber(value)) {
                                        qb.where(field, '<', value);
                                    }
                                    break;
                                case 'lte':
                                    if (!_.isEmpty(value) && _.isNumber(value)) {
                                        qb.where(field, '<=', value);
                                    }
                                    break;
                                default:
                                    that.handleUnsupportedOperand(qb, field, operand, value);
                                    break;
                            }
                        });
                    }

                    if (!_.isEmpty(query.limit) && _.isNumber(query.limit)) {
                        var limit = parseInt(query.limit, 10);
                        if (!isNaN(limit) && limit >= 0) {
                            qb.limit(limit);
                        }
                    }

                    if (!_.isEmpty(query.offset) && _.isNumber(query.offset)) {
                        var offset = parseInt(query.offset, 10);
                        if (!isNaN(offset) && offset >= 0) {
                            qb.offset(offset);
                        }
                    }

                    if (!_.isEmpty(query.groupBy) && _.isArray(query.groupBy)) {
                        qb.groupBy(query.groupBy);
                    }


                    //TODO: having support



                    if (!_.isEmpty(query.orderBy) && _.isObject(query.orderBy)) {
                        orderColumns = _.intersection(_.keys(query.orderBy), availableColumns);
                        extraOrderColumns = _.difference(_.keys(query.orderBy), orderColumns);

                        _.forEach(orderColumns, function(field) {
                            var direction = query.orderBy[field] === 'asc' ? 'asc' : 'desc';

                            if (_.isEmpty(field)) {
                                return false;
                            }
                            qb.orderBy(field, direction);
                        });
                    }

                    if (extraColumns.length > 0 || extraOrderColumns.length > 0) {
                        that.handleExtraColumns(qb, extraColumns, _.reduce(extraOrderColumns, function(memo, field) {
                            memo[field] = query.orderBy[field] === 'asc' ? 'asc' : 'desc';
                            return memo;
                        }, {}));
                    }
                })
                .fetch();
        });

};


Collection.prototype.handleUnsupportedOperand = function(qb, field, operand, value) {

};

Collection.prototype.handleExtraColumns = function(qb, extraColumns, extraOrderColumns) {

};

Collection.prototype.create = function(data, options) {
    var that = this;
    return that.readColumnInfo()
        .then(function() {
            var attributes = _.pick(data, _.keys(that.columnInfo));
            return Super.prototype.create.call(that, attributes, options);
        });
};

module.exports = Collection;
