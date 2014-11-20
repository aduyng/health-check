/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatShortTime', ['hbs/handlebars', 'moment'], function (Handlebars, moment) {
    var f = function (input) {
        if( /\d+/.test(input)){
            return moment.unix(input).format('hh:mm A');
        }
        return moment(input).format('hh:mm A');

    };
    Handlebars.registerHelper('formatShortTime', f);

    return f;
});