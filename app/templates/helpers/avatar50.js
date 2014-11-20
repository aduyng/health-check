/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/avatar50', ['hbs/handlebars', 'models/user'], function (Handlebars, User) {
    if( !window.avatar50 ){
        window.avatar50 = function (input) {
            return '<img src="'+(input? User.getAvatarUrl(input, 50):'http://lh3.googleusercontent.com/-NZUz1TgH178/AAAAAAAAAAI/AAAAAAAAAAA/ecyN-pV8NGs/s50-c/photo.jpg')+'" class="img-circle" width="50"/>' ;
        };
    }
    Handlebars.registerHelper('avatar50', window.avatar50);

    return window.avatar50;
});