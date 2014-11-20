/*global _, _s*/
define(function(require) {
    var Super = require('views/page/list/filter'),
        B = require('bluebird'),
        Execution = require('models/execution'),
        Template = require('hbs!./filter.tpl');


    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);
    };



    View.prototype.postRender = function() {
        var that = this;

        that.options.boxCollection.toDropdown(that.controls.boxIds, {
            placeholder: "Select one or multiple boxes",
            multiple: true,
            allowNew: false,
            allowClear: true
        });
        that.options.scriptCollection.toDropdown(that.controls.scriptIds, {
            placeholder: "Select one or multiple scripts",
            multiple: true,
            allowNew: false,
            allowClear: true
        });
        that.options.deviceCollection.toDropdown(that.controls.deviceIds, {
            placeholder: "Select one or multiple devices",
            multiple: true,
            allowNew: false,
            allowClear: true
        });
        
         that.options.statusCollection.toDropdown(that.controls.statusIds, {
            placeholder: "Select one or multiple status",
            multiple: true,
            allowNew: false,
            allowClear: true
        });
        
         that.options.typeCollection.toDropdown(that.controls.typeIds, {
            placeholder: "Select one or multiple types",
            multiple: true,
            allowNew: false,
            allowClear: true
        });
    };

    View.prototype.serialize = function() {
        var that = this;
        var data = Super.prototype.serialize.call(that);
        data.boxIds = that.controls.boxIds.val();
        data.scriptIds = that.controls.scriptIds.val();
        data.deviceIds = that.controls.deviceIds.val();
        data.statusIds = that.controls.statusIds.val();
        data.typeIds = that.controls.typeIds.val();
        return data;
    };
    
    View.prototype.clearFields = function() {
        var that = this;
        that.controls.boxIds.select2('data', null);
        that.controls.scriptIds.select2('data', null);
        that.controls.deviceIds.select2('data', null);
        that.controls.statusIds.select2('data', null);
        that.controls.typeIds.select2('data', null);
    };


    View.prototype.getFieldTemplate = function(){
        return Template;
    };
    

    return View;
});