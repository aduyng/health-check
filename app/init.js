/*global requirejs*/

requirejs.config({
    //    urlArgs: 'v=' + [config.app.version.major, config.app.version.minor, config.app.version.patch].join('.'),
    baseUrl: './',
    locale: "en-us",
    waitSeconds: 30,
    paths: {
        backbone: '//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.1.2/backbone-min',
        bootstrap: '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
        'bootstrap-switch': '//cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.0.0/js/bootstrap-switch.min',
        text: 'vendors/requirejs-text/text',
        goog: 'vendors/requirejs-plugins/src/goog',
        async: 'vendors/requirejs-plugins/src/async',
        propertyParser: 'vendors/requirejs-plugins/src/propertyParser',
        image: 'vendors/requirejs-plugins/src/image',
        json: 'vendors/requirejs-plugins/src/json',
        hbs: 'vendors/require-handlebars-plugin/hbs',
        i18nprecompile: 'vendors/require-handlebars-plugin/hbs/i18nprecompile',
        json2: 'vendors/require-handlebars-plugin/hbs/json2',
        jquery: 'vendors/jquery/dist/jquery',
        bootstrapValidator: '//cdnjs.cloudflare.com/ajax/libs/jquery.bootstrapvalidator/0.5.0/js/bootstrapValidator.min',
        toastr: '//cdnjs.cloudflare.com/ajax/libs/toastr.js/2.0.0/js/toastr.min',
        ladda: '//cdnjs.cloudflare.com/ajax/libs/ladda-bootstrap/0.1.0/ladda.min',
        spin: '//cdnjs.cloudflare.com/ajax/libs/spin.js/2.0.0/spin.min',
        moment: "//cdnjs.cloudflare.com/ajax/libs/moment.js/2.6.0/moment.min",
        nprogress: "//cdnjs.cloudflare.com/ajax/libs/nprogress/0.1.2/nprogress.min",
        'underscore.string': '//cdnjs.cloudflare.com/ajax/libs/underscore.string/2.3.3/underscore.string.min',
        accounting: '//cdnjs.cloudflare.com/ajax/libs/accounting.js/0.3.2/accounting.min',
        bluebird: '//cdnjs.cloudflare.com/ajax/libs/bluebird/1.2.2/bluebird',
        scrollTo: '//cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/1.4.11/jquery.scrollTo.min',
        underscore: '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore-min',
        select2: '//cdnjs.cloudflare.com/ajax/libs/select2/3.5.0/select2.min',
        bootstrapSwitch: '//cdnjs.cloudflare.com/ajax/libs/bootstrap-switch/3.0.2/js/bootstrap-switch.min',
        resemble: 'vendors/resemblejs/resemble',
        jszip: '//cdnjs.cloudflare.com/ajax/libs/jszip/2.4.0/jszip.min',
        FileSaver: '//cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.0.0/FileSaver.min',
        ace: '//cdnjs.cloudflare.com/ajax/libs/ace/1.1.3/ace'
    },
    hbs: {
        helpers: true,
        i18n: true,
        templateExtension: 'hbs',
        partialsUrl: '',
        disableI18n: false
    },
    shim: {
        ace:{
            exports: 'ace'  
        },
        FileSaver: {
            exports: 'saveAs'  
        },
        underscore: {
            exports: '_'
        },
        resemble:{
            exports: 'resemble'
        },
        select2: {
            deps: ['jquery'],
            exports: '$.fn.select2'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        toastr: {
            deps: ['jquery']
        },
        scrollTo: {
            deps: ['jquery']
        },
        nprogress: {
            deps: ['jquery'],
            exports: 'NProgress'
        },
        bootstrap: {
            deps: ["jquery"]
        },
        ladda: {
            deps: ["spin"],
            exports: 'Ladda'
        },
        'jquery.cookie': {
            deps: ['jquery']
        },
        'bootstrapValidator': {
            deps: ['jquery', 'bootstrap'],
            exports: '$.fn.bootstrapValidator'
        },
        'bootstrapSwitch': {
            deps: ['jquery', 'bootstrap'],
            exports: '$.fn.bootstrapSwitch'
        },
        'bootstrap-switch': {
            deps: ['jquery']
        },
        socket: {
            deps: ['backbone']  
        },
        app: {
            deps: [
                'jquery',
                'underscore',
                'backbone',
                'bootstrap',
                'toastr',
                'accounting',
                'moment',
                'nprogress',
                'scrollTo',
                'select2'
            ]
        }
    }
});

if (!Function.prototype.bind) {
    Function.prototype.bind = function(bind) {
        var self = this;
        return function() {
            var args = Array.prototype.slice.call(arguments);
            return self.apply(bind || null, args);
        };
    };
}



require(['app'], function(Application) {
    window.app = new Application({});
    window.app.run();
});
