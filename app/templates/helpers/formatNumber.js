/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatNumber', ['hbs/handlebars', 'accounting'], function (Handlebars, accounting) {
    var formatNumber = function (number) {
        return accounting.formatNumber(number, 0);
    };
    Handlebars.registerHelper('formatNumber', formatNumber);
    return formatNumber;
});