/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/email', ['hbs/handlebars', 'models/user'], function(Handlebars, User) {
    var email = function(input) {
        return '<a href="mailto:' + input + '">' + input + '</a>';
    };
    Handlebars.registerHelper('email', email);

    return email;
});