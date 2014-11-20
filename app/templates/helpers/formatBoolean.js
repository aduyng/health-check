/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatBoolean', ['hbs/handlebars'], function (Handlebars) {
    window.formatBoolean = function (input) {
        if (input) {
            return '<i class="fa fa-bold fa-check-square"> ' + translate('Yes');
        }
        return '<i class="fa fa-square-o"> ' + translate('No');
    };
    Handlebars.registerHelper('formatBoolean', window.formatBoolean);
    return window.formatBoolean;
});