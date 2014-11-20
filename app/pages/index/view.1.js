/*global _, saveAs*/
define(function(require) {
    var Super = require('views/page'),
        BaseCollection = require('collections/base'),
        _ = require('underscore'),
        B = require('bluebird'),
        S = require('underscore.string'),
        NProgress = require('nprogress'),
        Dialog = require('views/controls/dialog'),
        BootstrapSwitch = require('bootstrapSwitch'),
        Model = require('models/job'),
        Box = require('models/box'),
        Script = require('models/script'),
        Device = require('models/device'),
        Ladda = require('ladda'),
        Template = require('hbs!./view.tpl'),
        resemble = require('resemble'),
        accounting = require('accounting'),
        JSZip = require('jszip'),
        FileSaver = require('FileSaver'),
        ResultRowTemplate = require('hbs!./view/result-row.tpl');

    var Page = Super.extend({});

    Page.prototype.initialize = function(options) {
        //super(options)
        Super.prototype.initialize.call(this, options);

        this.model = new Model({
            id: options.params.id
        });
        this.backoffCounter = 0;
        this.screenshots = new BaseCollection();
    };


    Page.prototype.render = function() {
        var that = this;
        B.resolve(that.model.fetch())
            .then(function() {
                that.oldBox = new Box({
                    id: that.model.get('oldBoxId')
                });
                that.newBox = new Box({
                    id: that.model.get('newBoxId')
                });
                that.script = new Script({
                    id: that.model.get('scriptId')
                });
                that.device = new Device({
                    id: that.model.get('deviceId')
                });

                return B.all([
                that.oldBox.fetch(),
                that.newBox.fetch(),
                that.script.fetch(),
                that.device.fetch()
            ]);
            })
            .then(function() {

                that.$el.html(Template({
                    id: that.id,
                    data: _.extend(that.model.toJSON(), {
                        statusName: that.model.getStatusName(),
                        isRunning: that.model.get('status') == Model.STATUS_RUNNING
                    }),
                    oldBox: that.oldBox.toJSON(),
                    newBox: that.newBox.toJSON(),
                    script: that.script.toJSON(),
                    device: that.device.toJSON()
                }));

                that.mapControls()

                if (that.model.get('status') == Model.STATUS_RUNNING) {
                    that.refreshStatus();
                }
                else if (that.model.get('status') == Model.STATUS_COMPLETED) {
                    that.renderScreenshots();
                }

                var events = {};

                events['click ' + that.toId('run')] = 'runButtonClickHandler';
                events['click ' + that.toId('delete')] = 'deleteButtonClickHandler';
                events['click ' + that.toId('back')] = 'backButtonClickHandler';
                events['click ' + that.toId('download-all')] = 'downloadAllButtonClickHandler';
                events['click ' + that.toClass('download')] = 'downloadButtonClickHandler';
                events['click ' + that.toId('different-only')] = 'differentOnlyClickHandler';
                events['click ' + that.toClass('screenshot')] = 'onScreenshotClickHandler';

                that.delegateEvents(events);
            })
            .then(function() {
                that.ready();
            });
    };
    
    Page.prototype.onScreenshotClickHandler = function(event){
        var e = $(event.currentTarget);
        
        if( e.data('loaded') ){
            window.open(e.attr('src'));
        }
    };


    Page.prototype.downloadAllButtonClickHandler = function(event) {
        var that = this,
            e = $(event.currentTarget),
            fileName = S.slugify(_.now() + '-' + S.prune('job-' + that.model.id, 200, '')),
            zip = new JSZip(),
            root = zip.folder(fileName),
            differentOnly = that.find(that.toId('different-only')).is(':checked');


        that.screenshots.forEach(function(screenshot, index) {
            var included = (!differentOnly) || (differentOnly && screenshot.get('misMatchPercentage') > 0)
            if (included) {
                var oldImg = that.find(that.toId('old-img-' + index)),
                    newImg = that.find(that.toId('new-img-' + index)),
                    diffImg = that.find(that.toId('diff-img-' + index)),
                    folder = root.folder(S.pad(index + '', 4, '0') + '-' + S.slugify(screenshot.get('caption')));


                if (screenshot.get('misMatchPercentage') > 0) {
                    folder.file("result.txt", 'The new image is ' + accounting.formatNumber(screenshot.get('misMatchPercentage'), 2) + '% different compared to the old.' + "\n");
                }
                else {
                    folder.file("result.txt", 'New image and old image are identical.' + "\n");
                }

                folder.file("old.png", that.getBase64ImageData(oldImg), {
                    base64: true
                });
                folder.file("new.png", that.getBase64ImageData(newImg), {
                    base64: true
                });
                folder.file("diff.png", diffImg.attr('src').replace(/^data:image\/(png|jpg);base64,/, ""), {
                    base64: true
                });
            }
        });

        var content = zip.generate({
            type: "blob"
        });
        saveAs(content, fileName + '.zip');
    };

    Page.prototype.downloadButtonClickHandler = function(event) {
        var that = this;
        var e = $(event.currentTarget),
            index = e.data("index"),
            oldImg = that.find(that.toId('old-img-' + index)),
            newImg = that.find(that.toId('new-img-' + index)),
            diffImg = that.find(that.toId('diff-img-' + index));

        var screenshot = that.screenshots.at(e.data('index'));
        var fileName = S.slugify(_.now() + '-' + S.prune(screenshot.get('caption'), 200, ''));


        var zip = new JSZip(),
            root = zip.folder(fileName);
        if (screenshot.get('misMatchPercentage') > 0) {
            root.file("result.txt", 'The new image is ' + accounting.formatNumber(screenshot.get('misMatchPercentage'), 2) + '% different compared to the old.' + "\n");
        }
        else {
            root.file("result.txt", 'New image and old image are identical.' + "\n");
        }

        root.file("old.png", that.getBase64ImageData(oldImg), {
            base64: true
        });
        root.file("new.png", that.getBase64ImageData(newImg), {
            base64: true
        });
        root.file("diff.png", diffImg.attr('src').replace(/^data:image\/(png|jpg);base64,/, ""), {
            base64: true
        });

        var content = zip.generate({
            type: "blob"
        });

        saveAs(content, fileName + '.zip');
    };

    Page.prototype.getBase64ImageData = function(img) {
        var that = this;
        // Create an empty canvas element
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(that.device.get('width'), img.width());
        canvas.height = Math.max(that.device.get('height', img.height()));

        // Copy the image contents to the canvas
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img.get(0), 0, 0);

        // Get the data-URL formatted image
        // Firefox supports PNG and JPEG. You could check img.src to
        // guess the original format, but be aware the using "image/jpg"
        // will re-encode the image.
        var dataURL = canvas.toDataURL("image/png");

        return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
    };

    Page.prototype.differentOnlyClickHandler = function(event) {
        var that = this;
        if (that.find(that.toId('different-only')).is(':checked')) {
            that.screenshots.forEach(function(s, index) {
                if (!s.get('misMatchPercentage') || s.get('misMatchPercentage') === 0) {
                    that.find(that.toId('head-row-' + index)).addClass('hidden');
                    that.find(that.toId('row-' + index)).addClass('hidden');
                }
            });
        }
        else {
            that.screenshots.forEach(function(s, index) {
                that.find(that.toId('head-row-' + index)).removeClass('hidden');
                that.find(that.toId('row-' + index)).removeClass('hidden');

            });
        }
    };
    

    Page.prototype.refreshStatus = function() {
        var that = this;
        //console.log('start fetching');
        B.resolve(that.model.fetch())
            .then(function() {
                //console.log('finish fetching', that.model.toJSON());
                that.backoffCounter = 0;
                if (that.model.get('status') == Model.STATUS_RUNNING) {
                    //console.log('Scheduling to refresh the status in next ' + (Math.pow(2, that.backoffCounter) * 10000) + 'milis');
                    that.timeoutHandler = setTimeout(that.refreshStatus.bind(that), Math.pow(2, that.backoffCounter) * 10000);

                }
                else if (that.model.get('status') == Model.STATUS_COMPLETED) {
                    //console.log('Execution completed.');
                    //update status to completed
                    that.controls.status.text(that.model.getStatusName());
                    that.controls.run.removeClass('hidden');
                    that.controls.delete.removeClass('hidden');
                }

                that.renderScreenshots();
            })
            .catch(function(e) {
                that.backoffCounter++;
                //console.log('Error! Scheduling to refresh the status in next ' + (Math.pow(2, that.backoffCounter) * 10000) + 'milis');
                that.timeoutHandler = setTimeout(that.refreshStatus.bind(that), Math.pow(2, that.backoffCounter) * 10000);
            });
    };

    Page.prototype.compare = function(index) {
        var that = this,
            screenshot = that.screenshots.at(index),
            oldImg = that.find(that.toId('old-img-' + index)),
            newImg = that.find(that.toId('new-img-' + index)),
            diffImg = that.find(that.toId('diff-img-' + index)),
            toolbox = that.find(that.toId('toolbox-' + index)),
            row = that.find(that.toId('row-' + index)),
            resultToolbar = that.find(that.toId('result-toolbar')),
            downloadBtn = that.find(that.toId('download-' + index)),
            diffCaption = that.find(that.toId('diff-caption-' + index));

        if (oldImg.data('loaded') && newImg.data('loaded')) {
            if (!diffImg.data('in-progress') && !diffImg.data('loaded')) {
                diffImg.data('in-progress', true);
                toolbox.removeClass('hidden');
                row.data('resemble', resemble(oldImg.attr('src')).compareTo(newImg.attr('src')).onComplete(function(data) {
                    //enable download button
                    downloadBtn.removeAttr('disabled');


                    diffImg.data('loaded', true);
                    screenshot.set('misMatchPercentage', data.misMatchPercentage);
                    screenshot.set('compared', true);

                    if (data.misMatchPercentage > 0) {
                        diffCaption.html('<i class="fa fa-exclamation-circle"></i> The new image is ' + accounting.formatNumber(data.misMatchPercentage, 2) + '% different compared to the old.').removeClass('hidden').addClass('text-warning').removeClass('text-success');
                    }
                    else {
                        diffCaption.html('<i class="fa fa-check-circle"></i> New image and old image are identical.').removeClass('hidden').addClass('text-success').removeClass('text-warning');
                    }
                    diffImg.attr('src', data.getImageDataUrl());


                    if (that.screenshots.every(function(s) {
                        return s.get('compared');
                    })) {
                        resultToolbar.removeClass('hidden');
                    }

                }));
            }
        }
    };

    Page.prototype.renderScreenshots = function() {
        var that = this;

        return B.resolve(that.model.getScreenshots())
            .then(function(screenshots) {
                that.screenshots.reset(screenshots);
                
                if( that.screenshots.length >0 ){
                    that.controls.result.removeClass('hidden');
                    that.controls.resultSubtitle.text(accounting.formatNumber(that.screenshots.length) + ' screenshot sets have been taken.');
                }else{
                    that.controls.result.addClass('hidden');
                }
                
                
                that.screenshots.forEach(function(u, index) {
                    var row = that.find(that.toId('head-row-' + index));
                    if (row.size() === 0) {
                        row = $(ResultRowTemplate({
                            id: that.id,
                            index: index,
                            device: that.device.toJSON(),
                            data: u.toJSON()
                        }));
                        that.controls.screenshots.append(row);
                    }

                    var oldImg = that.find(that.toId('old-img-' + index)),
                        newImg = that.find(that.toId('new-img-' + index));

                    if (u.get('oldScreenshot')) {
                        if (!oldImg.data('loaded')) {
                            oldImg.bind('load', function() {
                                oldImg.data('loaded', true);
                                oldImg.unbind('load');
                                // //console.log('old ' + index + ' is loaded');
                                _.defer(function(){
                                    that.compare(index);    
                                });
                                
                            });
                            oldImg.attr('src', u.get('oldScreenshot'));
                        }
                    }

                    if (u.get('newScreenshot')) {
                        if (!newImg.data('loaded')) {
                            newImg.bind('load', function() {
                                newImg.data('loaded', true);
                                newImg.unbind('load');
                                // //console.log('new ' + index + ' is loaded');
                                _.defer(function(){
                                    that.compare(index);    
                                });
                            });
                            newImg.attr('src', u.get('newScreenshot'));
                        }
                    }
                });
            });

    };


    Page.prototype.backButtonClickHandler = function(event) {
        var that = this;
        event.preventDefault();
        that.goTo('index/index');
    };
    
    Page.prototype.deleteButtonClickHandler = function(event){
        var that = this; 
        
        var confirmDlg = new Dialog({
            body: 'Are you sure you want to delete this job?',
            buttons: [{
                id: 'yes',
                label: "Yes. I'm sure.",
                iconClass: 'fa fa-check',
                buttonClass: 'btn-danger'
        }, {
                id: 'no',
                label: 'Nope!',
                iconClass: 'fa fa-times',
                buttonClass: 'btn-default',
                autoClose: true
        }]
        });
        confirmDlg.on('yes', function() {
            B.resolve()
                .then(function() {
                    NProgress.start();
                })
                .then(function() {
                    return that.model.destroy();
                })
                .then(function() {
                    that.toast.success('Job has been deleted successfully.');
                    confirmDlg.close();
                    that.goTo('index/index');
                })
                .catch(that.error.bind(that))
                .finally(function() {
                    NProgress.done();
                });
        });
};

    Page.prototype.runButtonClickHandler = function(event) {
        this.run(event);
    };

    Page.prototype.run = function(event) {
        var that = this;
        event.preventDefault();

        NProgress.start();
        _.delay(that.refreshStatus.bind(that), 10000);

        that.controls.status.html('<i class="fa fa-spinner fa-spin"></i> ' + Model.getStatusName(Model.STATUS_RUNNING));
        that.controls.run.addClass("hidden");
        
        that.controls.result.addClass('hidden');
        that.controls.delete.addClass('hidden');
        that.controls.screenshots.empty();
        //console.log('about to rerun');
        B.resolve(that.model.run())
            .then(function() {
            })
            .finally(function() {
                NProgress.done();
            });

        return false;
    };

    Page.prototype.cleanUp = function () {
        if( this.timeoutHandler ){
            window.clearTimeout(this.timeoutHandler);
        }
    };

    return Page;


});