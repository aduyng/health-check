/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Backbone = require('backbone'),
        TEMPLATE = require('hbs!./code.tpl'),
        SCRIPT_TEMPLATE = '',//require('text!./code.script-template.tpl.hbs'),
        Libraries = require('./library'),
        Ace = require('ace');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
        that.moduleIndex = options.moduleIndex;
        that.module = options.module;

    };

    View.prototype.render = function() {
        var that = this;
        B.resolve(
                that.$el.html(TEMPLATE({
                    id: that.id,
                    data: _.extend(that.module, {
                        script: that.module.script || SCRIPT_TEMPLATE
                    })
                }))
            ).then(function() {
                that.mapControls();
                that.libraries = new Backbone.Collection(that.module.libraries || []);

                that.children.libraries = new Libraries({
                    el: that.controls.libraries,
                    collection: that.libraries
                });
                that.libraries.on('add remove change', that.onLibrariesChanged.bind(that));
                return that.children.libraries.render();
            })
            .then(function() {
                _.defer(function() {
                    that.children.editor = ace.edit(that.controls.script.attr('id'));
                    that.children.editor.setTheme("ace/theme/monokai");
                    that.children.editor.getSession().setMode("ace/mode/javascript");
                    that.children.editor.on('change', function(e) {
                        that.save({
                            script: that.children.editor.getValue()
                        });
                    });
                });

                var events = {};
                that.delegateEvents(events);
            });

    };

    View.prototype.onLibrariesChanged = function(){
        this.save({
            libraries: this.libraries.toJSON(),
        });    
    };
    
    View.prototype.save = _.debounce(function(params) {
        var that = this;
        that.controls.message.html('<i class="fa fa-spinner fa-spin"></i> Saving...')
            .removeClass('text-success')
            .addClass('text-warning');
        var modules = that.model.get('modules') || [];
        _.extend(modules[that.moduleIndex], params);

        return B.resolve(that.model.save())
            .then(function() {
                that.controls.message.html('<i class="fa fa-check"></i> Saved.')
                    .removeClass('text-warning')
                    .addClass('text-success');
            });
    }, 300);


    return View;
});