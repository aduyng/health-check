/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatDateForDateInput', ['hbs/handlebars', 'moment'], function (Handlebars, moment) {
    var f = function (input) {
        var format = 'YYYY-MM-DD';
        if( /\d+/.test(input)){
            return moment.unix(input).format(format);
        }
        return moment(input).format(format);

    };
    Handlebars.registerHelper('formatDateForDateInput', f);

    return f;
});