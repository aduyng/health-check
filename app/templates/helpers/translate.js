/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/translate', ['hbs/handlebars'], function (Handlebars, moment) {
    window.translate = function (input) {
        return window.app.session.i18n[input] || input;
    };
    Handlebars.registerHelper('translate', window.translate);

    return window.translate;
});