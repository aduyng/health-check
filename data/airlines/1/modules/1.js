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
    && $('#search').size() > 0    ;
	});
}, undefined, function(){
	casper.exit(9);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return ($('#input[name=pnrFf]').length ?  ($('#input[name=pnrFf]').size() > 0) :  true) &&
($('#input[name=pnr]').length ?  ($('#input[name=pnr]').size() > 0) :  true) &&
($('#input[name=lastName]').length ?  ($('#input[name=lastName]').size() > 0) :  true) &&
($('#input[name=firstName]').length ?  ($('#input[name=firstName]').size() > 0) :  true);
	});
}, undefined, function(){
	casper.exit(10);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return ($('#input[name=flightNumber]').length ?  (!$('input[name=flightNumber]').is(':visible')) :  true);
	});
}, undefined, function(){
	casper.exit(252);});casper.run(function() {
	casper.exit(0);
});