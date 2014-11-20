/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatMoney', ['hbs/handlebars', 'accounting'], function (Handlebars, accounting) {
    var formatNumber = function (number) {
        return accounting.formatMoney(number, '$', 0);
    };
    Handlebars.registerHelper('formatMoney', formatNumber);

    return formatNumber;
});