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
    && $('#search-flights').is(':visible') 
    && $('#departure-airport>option').size() > 0; 
	});
}, undefined, function(){
	casper.exit(115);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#arrival-airport').size() > 0;
	});
}, undefined, function(){
	casper.exit(116);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#flight-type-return-trip').val() === 'ROUND_TRIP' && $('#flight-type-return-trip').is(':checked')
&& $('#flight-type-one-way-trip').val() === 'ONE_WAY' &&  $('#flight-type-one-way-trip').is(':not(:checked)');
	});
}, undefined, function(){
	casper.exit(117);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $('#departure-date').size() > 0 && $('#return-date').size() > 0 ;
	});
}, undefined, function(){
	casper.exit(118);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return $("#ADT_passengers").val() == 1 && 
		$("#CHD_passengers").val() == 0  &&
		($('#INF_passengers').length ?  ($('#INF_passengers').val() == 0) :  true);
	});
}, undefined, function(){
	casper.exit(119);});casper.waitFor(function() {
	return casper.evaluate(function() {
		return ($('#promo-code').length ?  ($('#promo-code').size() > 0) :  true);
	});
}, undefined, function(){
	casper.exit(120);});casper.run(function() {
	casper.exit(0);
});