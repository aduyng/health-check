/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/encodeUriComponent', ['hbs/handlebars'], function (Handlebars, moment) {
    var f = function (input) {
        return encodeURIComponent(input);
    };
    Handlebars.registerHelper('encodeUriComponent', f);

    return f;
});