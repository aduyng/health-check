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
    && !$('#overlay').is(':visible') 
    && $('#search').size() > 0  ;
	});
}, undefined, function(){
	casper.exit(185);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('input[name=pnr]').size() > 0 && $('input[name=lastName]').size() > 0; 
	});
}, undefined, function(){
	casper.exit(186);});casper.run(function() {
	casper.exit(0);
});