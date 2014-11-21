var casper = require('casper').create({
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
        return !$('#loading').is(':visible') && !$('#overlay').is(':visible') && $('#search-flights').is(':visible') && $('#departure-airport>option').size() > 0;
    });
}, undefined, function(){
    casper.exit(1);
});

casper.waitFor(function() {
    return casper.evaluate(function() {
        return $('#arrival-airport').size() > 0;
    });
}, undefined, function(){
    casper.exit(2);
});

casper.run(function() {
    casper.exit();
});
