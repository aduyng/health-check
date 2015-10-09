/*global Backbone, _*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Template = require('hbs!./nav.tpl');

    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);
    }

    View.prototype.render = function() {
        var that = this;

        var params = {
            id: this.id,
            appFullName: window.app.config.get('fullName'),
            path: window.app.config.get('baseUrl')
        };

        this.$el.html(Template(params));
        this.mapControls();

        var events = {};
        events['keyup ' + that.toId('query')] = 'onQueryKeyup';
        events['click ' + that.toId('new')] = 'onNewClick';
        events['click ' + that.toId('run-all')] = 'onRunAllClick';
        events['click ' + that.toId('stop')] = 'onStopClick';

        this.delegateEvents(events);
    };

    View.prototype.onQueryKeyup = _.debounce(function(event) {
        this.trigger('search', {
            query: this.controls.query.val().trim()
        });
    }, 300);

    View.prototype.onNewClick = function(event) {
        event.preventDefault();
        var that = this;
        var model = new Site({
            name: 'New Site'
        });

        that.openSiteDialog(model, that.types);
    };

    View.prototype.openSiteDialog = function(model, types) {
        var that = this,
            isNew = model.isNew();

        var view = new SiteEdit({
            model: model,
            types: types
        });

        var dlg = new Dialog({
            title: isNew ? 'New Site' : 'Edit: ' + model.get('name'),
            body: view,
            buttons: [{
                id: 'save',
                label: 'Save',
                iconClass: 'fa fa-save',
                buttonClass: 'btn-primary',
                align: 'left'
            }, {
                id: 'cancel',
                label: 'Cancel',
                iconClass: 'fa fa-times',
                buttonClass: 'btn-default',
                align: 'left',
                autoClose: true
            }]
        })

        dlg.on('save', function() {
            B.resolve(model.save(view.val()))
                .then(function() {
                    if (isNew) {
                        that.sites.add(model);
                    }
                    that.toast.success('New site has been added.');
                    dlg.close();
                });
        });
    };

    View.prototype.onRunAllClick = function(event) {
        var that = this;
        that.controls.runAll.prop('disabled', true);
        B.all(_.map(that.sites.filter(function(site) {
                return site.view && !site.view.$el.hasClass('hidden');
            }), function(site) {
                return site.run();
            }))
            .then(function() {
                that.toast.success('All matched sites have been scheduled to run.');
            });
    };

    View.prototype.onStopClick = function(event) {
        var that = this;
        that.runAllStopRequested = true;
    };

    return View;
});