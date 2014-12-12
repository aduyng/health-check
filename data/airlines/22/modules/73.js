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
    && $('#search-btn').is(':visible'); 
	});
}, undefined, function(){
	casper.exit(230);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#departure-airport>option').size()>0
&& $('#arrival-airport>option').size()>0;
	});
}, undefined, function(){
	casper.exit(231);});casper.waitFor(function() {
	return casper.evaluate(function() {
		var d = new Date();
var str = ((d.getDate()+'').length == 1 ? '0'+d.getDate() : d.getDate())  +'/'+(d.getMonth()+1)+'/'+d.getFullYear() ;
return $('#date').val() == str;
	});
}, undefined, function(){
	casper.exit(232);});casper.run(function() {
	casper.exit(0);
});