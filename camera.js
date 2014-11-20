var require = patchRequire(require),
    S = require('underscore.string');

var Camera = function(casper, target) {
    var that = this;
    that.casper = casper;
    that.target = target;
    that.count = 0;

    that.capture = function(selector, name) {
        var targetFile = that.target + '/' + S.pad(that.count, 4, '0') + '-' + S.slugify(name || 'screenshot-' + that.count) + '.png';
        that.casper.captureSelector(targetFile, selector || 'body');
        that.count++;
    };
};


module.exports = Camera;