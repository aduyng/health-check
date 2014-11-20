/*global _, _s, ace*/
define(function(require) {
    var Super = require('views/page/edit'),
        B = require('bluebird'),
        TypeCollection = require('collections/job-type'),
        FIELDS = require('hbs!./edit/fields.tpl'),
        Model = require('models/script'),
        Select2 = require('select2'),
        Ace = require('ace');


    var Page = Super.extend({});

    Page.prototype.getPageName = function() {
        return 'Script';
    };

    Page.prototype.getModelClass = function() {
        return Model;
    };

    Page.prototype.getFieldsTemplate = function() {
        return FIELDS;
    };

    Page.prototype.preRender = function() {
        var that = this;
        that.types = new TypeCollection();
        return B.all([that.types.fetch({
            data: {
                columns: ['id', 'name', 'scriptTemplate']
            }
        })]);
    };

    Page.prototype.postRender = function() {
        var that = this;

        that.editor = ace.edit(that.controls.code.get(0));
        that.editor.setTheme("ace/theme/monokai");
        that.editor.getSession().setMode("ace/mode/javascript");

        that.types.toDropdown(that.controls.typeId);

    };

    Page.prototype.serialize = function() {
        var data = Super.prototype.serialize.call(this);
        data.code = this.editor.getValue();
        return data;
    };

    Page.prototype.prepareForOutput = function() {
        var that = this;
        var data = that.model.toJSON();
        if (!data.typeId) {
            data.typeId = that.types.at(0).id;
        }
        return data;
    };

    return Page;


});