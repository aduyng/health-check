/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        StepCollection = require('collections/step'),
        Step = require('models/step'),
        TEMPLATE = require('hbs!./code.tpl'),
        Ace = require('ace');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
        that.collection = new StepCollection();
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve(that.fetch())
            .then(function() {
                return that.renderSteps();
            })
            .then(function() {
                that.collection.on('reset add remove sort', that.renderSteps.bind(that));
                var events = {};
                events['click ' + that.toId('new')] = 'onNewButtonClick';
                events['click ' + that.toClass('remove')] = 'onRemoveButtonClick';
                events['input ' + that.toClass('name')] = 'onNameInput';
                events['click ' + that.toClass('move')] = 'onMoveButtonClick';
                that.delegateEvents(events);
            });
    };

    View.prototype.onMoveButtonClick = function(event) {
        var that = this;

        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        var newPriority = 1;

        switch (e.data('direction')) {
            case 'first':
                newPriority = 1;
                break;
            case 'up':
                newPriority = e.data('index');
                break;
            case 'down':
                newPriority = e.data('index') + 2;
                break;
            case 'last':
                newPriority = that.collection.length;
                break;

        }

        return B.all([
                    model.save({
                    priority: newPriority
                }, {
                    patch: true,
                    wait: true
                }),
                    that.collection.at(newPriority - 1).save({
                    priority: e.data('index') + 1
                }, {
                    patch: true,
                    wait: true
                })
            ])
            .then(function() {
                that.collection.sort();
            });
    };


    View.prototype.onNameInput = function(event) {
        var that = this;

        var e = $(event.currentTarget);
        var model = that.collection.get(e.data('id'));
        that.saveScript(model, {
            name: e.val().trim()
        });
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
        var model = new Step({
            moduleId: that.model.id,
            name: 'Step ' + that.collection.getNextPriority(),
            priority: that.collection.getNextPriority()
        });

        B.resolve(model.save(null, {
                wait: true
            }))
            .then(function() {
                that.collection.add(model);
            });
    };

    View.prototype.renderSteps = function() {
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
            steps: that.collection.toJSON()
        }));

        //initialize all editors
        _.forEach(that.findByClass('script'), function(s) {
            var script = $(s);
            var model = that.collection.get(script.data('id'));
            var editor = ace.edit(that.id + '-script-' + model.id);
            editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/javascript");
            editor.on('change', function(e) {
                that.saveScript(model, {
                    script: editor.getValue()
                });
            })
            script.data('editor');
        });

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