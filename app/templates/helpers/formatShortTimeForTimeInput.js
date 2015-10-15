/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatShortTimeForTimeInput', ['hbs/handlebars', 'moment'], function (Handlebars, moment) {
    var f = function (input) {
        var format = 'HH:mm';
        if( /\d+/.test(input)){
            
            return moment.unix(input).format(format);
        }
        return moment(input).format(format);

    };
    Handlebars.registerHelper('formatShortTimeForTimeInput', f);

    return f;
});