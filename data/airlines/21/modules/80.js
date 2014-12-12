var utils = require('utils'),
casper = require('casper').create({
	logLevel: 'info',
	waitTimeout: 18000,
	pageSettings: {
		webSecurityEnabled: false,
		loadImages: true,
		loadPlugins: false
	}
}),
startUrl = casper.cli.options.url;
casper.start(startUrl);
casper.waitFor(function() {
	return casper.evaluate(function() {
		return !$('#loading').is(':visible') 
    && !$('#overlay').is(':visible');
	});
}, undefined, function(){
	casper.exit(260);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return ($('#input[name=reservationCode]').length ?  ($('#input[name=reservationCode]').size() > 0) :  true) &&
($('#input[name=lastName]').length ?  ($('#input[name=lastName]').size() > 0) :  true) &&
($('#find-flight').length ?  ($('#find-flight').is(':visible')) :  true);
	});
}, undefined, function(){
	casper.exit(261);});casper.run(function() {
	casper.exit(0);
});