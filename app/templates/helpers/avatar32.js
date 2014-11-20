/**
 * Created by Duy A. Nguyen on 3/30/2014.
 */
define('templates/helpers/avatar32', ['hbs/handlebars', 'models/user'], function (Handlebars, User) {
    if( !window.avatar32 ){
        window.avatar32 = function (input) {
            return '<img src="'+(input? User.getAvatarUrl(input, 32):'http://lh3.googleusercontent.com/-NZUz1TgH178/AAAAAAAAAAI/AAAAAAAAAAA/ecyN-pV8NGs/s32-c/photo.jpg')+'" class="img-circle" width="32"/>' ;
        };
    }
    Handlebars.registerHelper('avatar32', window.avatar32);

    return window.avatar32;
});