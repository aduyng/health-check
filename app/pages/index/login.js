/*global _, _s*/
define(function(require) {
    var Super = require('views/page'),
        B = require('bluebird'),
        MAIN = require('hbs!./login.tpl'),
        User = require('models/user');

    var Page = Super.extend({});

    Page.prototype.initialize = function(options) {
        var that = this;
        //super(options)
        that.user = new User();
        Super.prototype.initialize.call(that, options);
    };

    Page.prototype.render = function() {
        var that = this;


        that.$el.html(MAIN({
            id: that.id
        }));
        that.mapControls();

        var events = {};
        events['click ' + that.toId('submit')] = 'onSubmitClick';
        that.delegateEvents(events);


        return Super.prototype.render.call(that);

    };
    
    Page.prototype.onSubmitClick = function(event) {
        event.preventDefault();
        
        var that = this;
        
        B.resolve(this.app.socket.request({
            url: '/login',
            data: {
                username: that.controls.username.val().trim(),
                password: that.controls.password.val().trim()
            },
            type: 'POST'
        }))
        .then(function(user){
            that.app.user = new User(user);
            that.goTo('index/index', {trigger: true, replace: true});
            that.toast.success('You have successfully logged in.');
        })
        .catch(function(){
            that.toast.error('Incorrect username or password!');
        });
    };



    return Page;


});