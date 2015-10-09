define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        TEMPLATE = require('hbs!./type-widget.tpl');

    var View = Super.extend({});


    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
        this.types = options.types;
        this.sites = options.sites;
    };

    View.prototype.render = function() {
        var that = this;

        that.$el.html(TEMPLATE({
            id: this.id,
            types: this.types.toJSON()
        }));

        that.mapControls();

        var events = {};
        events['click ' + this.toClass('button')] = 'onButtonClick';
        events['click ' + this.toClass('show-all')] = 'onShowAllClick';
        that.delegateEvents(events);

        return B.resolve();
    };

    View.prototype.onShowAllClick = function() {
        var that = this;

        that.trigger('change', {
            selectedTypes: []
        });
    };

    View.prototype.onButtonClick = function(e) {
        var that = this;
        e.preventDefault();

        var $btn = $(e.currentTarget);

        this.trigger('change', {
            selectedTypes: [that.types.get($btn.data('id'))]
        });
    };


    View.prototype.val = function(values) {
        var that = this;
        if (values === undefined) {
            return _.reduce(this.find(this.toClass('button')) || [], function(memo, btn) {
                var $li = $(btn).parent();
                if ($li.hasClass('active')) {
                    memo.push(that.types.get($(btn).data('id')));
                }
                return memo;
            }, []);

        }
    };

    return View;
});
