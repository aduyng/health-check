/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        TEMPLATE = require('hbs!./code.tpl'),
        SCRIPT_TEMPLATE = require('text!./code.script-template.tpl.hbs'),
        Ace = require('ace');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        Super.prototype.initialize.call(this, options);
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve(that.fetch())
            .then(function() {
                that.$el.html(TEMPLATE({
                    id: that.id,
                    data: _.extend(that.model.toJSON(), {
                        script: that.model.get('script') || SCRIPT_TEMPLATE
                    })
                }));
                that.mapControls();


                that.children.editor = ace.edit(that.controls.script.attr('id'));
                that.children.editor.setTheme("ace/theme/monokai");
                that.children.editor.getSession().setMode("ace/mode/javascript");
                that.children.editor.on('change', function(e) {
                    that.save({
                        script: that.children.editor.getValue()
                    });
                });
                var events = {};

                that.delegateEvents(events);
            });
    };

    View.prototype.save = _.debounce(function(params) {
        var that = this;
        that.controls.message.html('<i class="fa fa-spinner fa-spin"></i> Saving...')
            .removeClass('text-success')
            .addClass('text-warning');

        return B.resolve(that.model.save(params, {
                wait: true
            }))
            .then(function() {
                that.controls.message.html('<i class="fa fa-check"></i> Saved.')
                    .removeClass('text-warning')
                    .addClass('text-success');
            });
    }, 300);



    View.prototype.fetch = function() {
        var that = this;



        return B.resolve(that.model.fetch({
            data: {
                detailed: true
            }
        }));
    };


    return View;
});