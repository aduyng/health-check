/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/formatDate', ['hbs/handlebars', 'moment'], function(Handlebars, moment) {
    var f = function(input) {
        var m = moment(input);
        if( m.isValid() ){
            return m.format('MM/DD/YYYY');
        }
        return '';
    };
    
    Handlebars.registerHelper('formatDate', f);

    return f;
});