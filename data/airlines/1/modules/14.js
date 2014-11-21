var utils = require('utils'),
casper = require('casper').create({
	logLevel: 'info',
	waitTimeout: 30000,
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
    && $('#search-btn').is(':visible'); 
	});
}, undefined, function(){
	casper.exit(11);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#departure-airport').size()>0
    && $('#arrival-airport').size()>0
    && $('#departure-airport>option').size()>0
    && $('#arrival-airport>option').size()>0;
    
	});
}, undefined, function(){
	casper.exit(12);});casper.waitFor(function() {
	return casper.evaluate(function() {
		$('#departure-airport').val('AUH');
return $('#departure-airport').val() === 'AUH';
	});
}, undefined, function(){
	casper.exit(13);});casper.waitFor(function() {
	return casper.evaluate(function() {
		var d = new Date();
var str = [d.getDate(), d.getMonth()+1, d.getFullYear()].join('/');
return $('#date-Today').val() == str;
	});
}, undefined, function(){
	casper.exit(14);});casper.run(function() {
	casper.exit(0);
});