/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/fromNow', ['hbs/handlebars', 'moment'], function(Handlebars, moment) {
    if (!window.fromNow) {
        window.fromNow = function(input) {
            if (/\d+/.test(input)) {
                var m = moment(parseInt(input, 10));
                if( m.isValid() ){
                    return m.fromNow();
                }
                return '';    
            }
            
            if( !input ){
                return '';
            }
            
            return moment(input).fromNow();
        };
    }
    Handlebars.registerHelper('fromNow', window.fromNow);

    return window.fromNow;
});