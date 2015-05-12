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
        that.delegateEvents(events);



        return B.resolve();
    };


    View.prototype.onButtonClick = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        e.toggleClass('active');


        this.trigger('change', {
            selectedTypes: that.val()
        });
    };


    View.prototype.val = function(values) {
        var that = this;
        if (values === undefined) {
            return _.reduce(this.find(this.toClass('button')) || [], function(memo, btn) {
                var button = $(btn);
                if (button.hasClass('active')) {
                    memo.push(that.types.get(button.data('id')));
                }
                return memo;
            }, []);

        }
    };

    return View;
});
