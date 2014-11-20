/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatDateTime', ['hbs/handlebars', 'moment'], function(Handlebars, moment) {
    if (!window.formatDateTime) {
        window.formatDateTime = function(input) {
            if( /\d+/.test(input)){
                return moment(parseInt(input, 10)).format('MM/DD/YYYY hh:mm:ss A');
            }
            return moment(input).format('MM/DD/YYYY hh:mm:ss A');
        };
    }

    Handlebars.registerHelper('formatDateTime', window.formatDateTime);

    return window.formatDateTime;
});