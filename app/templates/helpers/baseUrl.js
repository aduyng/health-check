/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/baseUrl', ['hbs/handlebars'], function (Handlebars, moment) {
    if( !window.baseUrl ){
        window.baseUrl = function (input) {
            return window.config.baseUrl + '/' + window.config.version + input;
        };
    }
    Handlebars.registerHelper('baseUrl', window.baseUrl);

    return window.baseUrl;
});