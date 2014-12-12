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
    && $('#departure-airport>option').size() > 0;
	});
}, undefined, function(){
	casper.exit(126);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#arrival-airport').size() > 0;
	});
}, undefined, function(){
	casper.exit(127);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('label[for="date-Today"] span:eq(1)').text().length > 0;
	});
}, undefined, function(){
	casper.exit(128);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('label[for="date-Tomorrow"] span:eq(1)').text().length > 0;
	});
}, undefined, function(){
	casper.exit(129);});casper.run(function() {
	casper.exit(0);
});