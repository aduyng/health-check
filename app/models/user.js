define(function(require) {
    var Super = require('./base');

    var Model = Super.extend({
        urlRoot: '/rest/model/user'
    });
    
    /**
     * class member
     **/
    Model.getAvatarUrl = function(orgUrl, size){
        if( size ){
            return orgUrl.replace(/sz=\d+$/, 'sz=' + size);
        }
        return orgUrl;
    };
    
    /**
     * instance member 
     */
    Model.prototype.getAvatarUrl = function(size){
        if( size ){
            return Model.getAvatarUrl(this.get('avatarUrl'), size);
        }
        return this.get('avatarUrl');
    };
    


    return Model;
});