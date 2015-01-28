/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        SettingCollection = require('collections/setting'),
        Setting = require('models/setting'),
        TEMPLATE = require('hbs!./setting.tpl'),
        Ace = require('ace');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
        that.collection = new SettingCollection();
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve(that.fetch())
            .then(function() {
                return that.renderSettings();
            })
            .then(function() {
                that.collection.on('reset add remove sort', that.renderSettings.bind(that));
                var events = {};
                events['click ' + that.toId('new')] = 'onNewButtonClick';
                events['click ' + that.toClass('remove')] = 'onRemoveButtonClick';
                events['input ' + that.toClass('value')] = 'onValueInput';
                events['input ' + that.toClass('key')] = 'onKeyInput';
                that.delegateEvents(events);
            });
    };
    View.prototype.onKeyInput = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        that.saveScript(model, {
            key: e.val().trim()
        });
    }

    View.prototype.onValueInput = function(event) {
        var that = this;

        var e = $(event.currentTarget),
            key = e.closest("tr").find('[class*=key]').val();
        if(key.length > 0){
            var model = that.collection.get(e.data('id'));
            that.saveScript(model, {
                value: e.val().trim()
            });
        } else {
            e.val("");
        }
        
    };

    View.prototype.saveScript = _.debounce(function(model, params) {
        return model.save(params, {
            patch: true,
            wait: true
        });
    }, 300);

    View.prototype.onRemoveButtonClick = function(event) {
        var that = this;
        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        return model.destroy({
            wait: true
        });
    };

    View.prototype.onNewButtonClick = function() {
        var that = this;
        var model = new Setting({
            moduleId: that.model.id,
            name: 'Setting '
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.collection.add(model);
            });
    };

    View.prototype.renderSettings = function() {
        var that = this;

        //destroy all ace editor instances
        _.forEach(that.findByClass('script'), function(s) {
            var script = $(s);
            var editor = script.data('editor');
            if (editor) {
                editor.destroy();
            }
        });

        that.$el.html(TEMPLATE({
            id: that.id,
            data: that.model.toJSON(),
            settings: that.collection.toJSON()
        }));

    };

    View.prototype.fetch = function() {
        var that = this;
        return that.collection.fetch({
            data: {
                selection: [{
                    field: 'moduleId',
                    value: that.model.id
                }]
            }
        });
    };


    return View;
});