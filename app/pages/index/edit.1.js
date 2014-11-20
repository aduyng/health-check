/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        NProgress = require('nprogress'),
        BoxCollection = require('collections/box'),
        ScriptCollection = require('collections/script'),
        DeviceCollection = require('collections/device'),
        BootstrapValidator = require('bootstrapValidator'),
        BootstrapSwitch = require('bootstrapSwitch'),
        Execution = require('models/execution'),
        Ladda = require('ladda'),
        Select2 = require('select2'),
        Template = require('hbs!./edit.tpl');

    var Page = Super.extend({});

    Page.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);

        this.boxCollection = new BoxCollection();
        this.scriptCollection = new ScriptCollection();
        this.deviceCollection = new DeviceCollection();
        this.model = new Execution({
            id: options.params.id
        });
                
        
    };

    Page.prototype.render = function() {
        var that = this;

        B.all([
            (function(){
                if( !that.model.isNew() ){
                    return that.model.fetch();
                }
                return B.resolve();
            })(),
            that.boxCollection.fetch(),
            that.scriptCollection.fetch(),
            that.deviceCollection.fetch()
            ])
            .then(function() {
                that.$el.html(Template({
                    id: that.id,
                    data: that.model.toJSON(),
                    boxCollection: that.boxCollection.toJSON(),
                    scriptCollection: that.scriptCollection.toJSON()
                }));

                that.mapControls()


                that.boxCollection.toDropdown(that.controls.oldUrl);
                that.boxCollection.toDropdown(that.controls.newUrl);
                that.scriptCollection.toDropdown(that.controls.script);
                that.deviceCollection.toDropdown(that.controls.device);

                var events = {};

                events['click ' + that.toId('save')] = 'saveButtonClickHandler';
                events['click ' + that.toId('cancel')] = 'cancelButtonClickHandler';
                // events['change ' + that.toId('old-url')] = 'onOldUrlChangeHandler';

                that.delegateEvents(events);
            })
            .then(function() {
                that.ready();
            });

    };
    
    // Page.prototype.onOldUrlChangeHandler = function(event){
    //     var that = this;
    //     that.controls.form.bootstrapValidator('revalidateField', 'oldUrl');    
    // };
    Page.prototype.cancelButtonClickHandler = function(event) {
        var that = this;
        event.preventDefault();
        if( that.model.isNew() ){
            that.goTo('index/index');
        }else{
            that.goTo('index/view/id/' + that.model.id);
        }
    };
    
    Page.prototype.saveButtonClickHandler = function(event) {
        this.save(event);
    };
    
    Page.prototype.save = function(event) {
        var that = this;
        event.preventDefault();
        var params = _.extend(that.serialize(), {
            oldBoxId: that.controls.oldUrl.val(),
            newBoxId: that.controls.newUrl.val(),
            scriptId: that.controls.script.val(),
            deviceId: that.controls.device.val()
        });
        
        var l = Ladda.create(event.currentTarget);
        l.start();
        NProgress.start();

        B.resolve(that.model.save(params))
            .then(function() {
                that.goTo('index/view/id/' + that.model.id );
            })
            .finally(function() {
                l.stop();
                NProgress.done();
            });

        return false;
    };


    return Page;


});