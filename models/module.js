var Super = require('./base'),
    _ = require('underscore'),
    _s = require('underscore.string'),
    env = process.env.NODE_ENV || 'development',
    config = require('../config')[env],
    B = require('bluebird'),
    logger = require('../logger'),
    nexpect = require('nexpect'),
    fs = require('fs'),
    path = require('path'),
    Model = Super.extend({
        tableName: 'Module'
    });

Model.prototype.run = function(airline) {
    var that = this,
        // readFile = B.promisify(fs.readFile),
        writeFile = B.promisify(fs.writeFile),
        mkdir = B.promisify(fs.mkdir),
        StepCollection = require('../collections/step'),
        SettingCollection = require('../collections/setting'),
        ExecutionStatus = require('./execution-status'),
        settingContent = '',
        steps,
        settings;

    //take all steps and generate scripts
    var absPath = [config.rootPath, 'data', 'airlines', airline.id, 'modules', that.id + '.js'].join('/');

    var content =
        "var utils = require('utils'),\n" +
        "casper = require('casper').create({\n" +
        "\tlogLevel: 'info',\n" +
        "\twaitTimeout: 18000,\n" +
        "\tpageSettings: {\n" +
        "\t\twebSecurityEnabled: false,\n" +
        "\t\tloadImages: true,\n" +
        "\t\tloadPlugins: false\n" +
        "\t}\n" +
        "}),\n" +
        "startUrl = casper.cli.options.url;\n" +
        "casper.start(startUrl);\n";


    //read all steps
    return StepCollection.forge()
        .query(function(qb) {
            qb.where('moduleId', that.id);
            qb.whereNotNull('script');
            qb.orderBy('priority', 'asc');
        })
        .fetch()
        .then(function(s) {
            steps = s;
            //update Step.isFailed = 0
            return B.all(steps.map(function(step) {
                return step.save({
                    isFailed: 0
                }, {
                    patch: true
                });
            }));
            logger.info('steps');
            logger.info(steps);
        })
        .then(function() {
            return mkdir([config.rootPath, 'data', 'airlines', airline.id].join('/'))
                .catch(function(e) {})
                .then(function() {
                    return mkdir([config.rootPath, 'data', 'airlines', airline.id, 'modules'].join('/'));
                })
                .catch(function(e) {
                })
        })
        .then(function(){
            return SettingCollection.forge()
            .query(function(qb) {
                qb.where('moduleId', that.id);
                qb.whereNotNull('key');
                qb.whereNotNull('value');
            })
            .fetch();
            
        })
        .then(function(s) {
            settings = s;
            logger.info(JSON.stringify(s));
            settingContent = settings.reduce(function(memo, setting) {
                settingContent += "window."+ setting.get('key') + "='" + setting.get('value') + "';\n";
                return settingContent;
            }, settingContent);
            logger.info(settingContent);
        })
        .then(function() {
            logger.info('about to save content');
            
            content += "casper.waitFor(function() {\n" +
                    "\treturn casper.evaluate(function() {\n" +
                    "\t\t" + settingContent + "\n" +
                    "\t\treturn true;\n" + 
                    "\t});\n" +
                    "}, undefined, function(){\n" +
                    "\tcasper.exit(" + 0 + ");" +
                    "});";
            
            content = steps.reduce(function(memo, step) {
                content += "casper.waitFor(function() {\n" +
                    "\treturn casper.evaluate(function() {\n" +
                    "\t\t" + step.get('script') + "\n" +
                    "\t});\n" +
                    "}, undefined, function(){\n" +
                    "\tcasper.exit(" + step.id + ");" +
                    "});";
                return content;
            }, content);
            content += "casper.run(function() {\n" +
                "\tcasper.exit(0);\n" +
                "});";
            // logger.info('write to file ', absPath, content);
            //write content to a file
            return writeFile(absPath, content, {
                flags: 'w'
            });
        })
        .then(function() {
            logger.info('wrote to a file');
            return that.save({
                executionStatusId: ExecutionStatus.ID_RUNNING,
                lastExecutedAt: new Date().getTime()
            }, {
                patch: true
            });
        })
        .then(function() {
            //execute the script
            var cmd = [config.casper.absolutePath, absPath, '--url=' + that.get('url')].join(' ');
            logger.info('command to execute: ' + cmd);
            return new B(function(resolve, reject) {
                nexpect.spawn(cmd)
                    .run(function(err, stdout, exitcode) {
                        if (exitcode !== 0) {
                            logger.error('error ', stdout);
                            logger.error('exit code', exitcode);
                            
                            reject({
                                err: err,
                                stdout: stdout,
                                exitCode: exitcode
                            });
                            return;
                        }

                        resolve({
                            err: err,
                            stdout: stdout,
                            exitCode: exitcode
                        });
                    });
            });
        })
        .then(function(output) {
            return that.save({
                executionStatusId: ExecutionStatus.ID_OK,
                log: (output.stdout || []).join("\n"),
                lastExecutionCompletedAt: new Date().getTime()
            }, {
                patch: true
            });
        })
        .catch(function(output) {
            if (output.exitCode) {
                return B.all([that.save({
                    executionStatusId: ExecutionStatus.ID_ERROR,
                    log: (output.stdout || []).join("\n")
                }, {
                    patch: true
                }), steps.get(output.exitCode).save({
                    isFailed: 1
                }, {
                    patch: true
                })]);
            }
            else {
                logger.error(output);
            }
        });

};
module.exports = Model;
