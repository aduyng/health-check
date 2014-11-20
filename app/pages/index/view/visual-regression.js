/*global Backbone, _, saveAs*/
define(function(require) {

    var Super = require('views/base'),
        B = require('bluebird'),
        BaseCollection = require('collections/base'),
        ExecutionStatus = require('models/execution-status'),
        accounting = require('accounting'),
        resemble = require('resemble'),
        ROW = require('hbs!./visual-regression/row.tpl'),
        JSZip = require('jszip'),
        S = require('underscore.string'),
        FileSaver = require('FileSaver'),
        TEMPLATE = require('hbs!./visual-regression.tpl');

    var View = Super.extend({

    });

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);

        this.backoffCounter = 0;
        this.screenshots = new BaseCollection();

        this.device = this.options.device;
    };

    View.prototype.render = function() {
        var that = this;

        var params = {
            id: this.id
        };

        this.$el.html(TEMPLATE(params));
        this.mapControls();

        var events = {};
        events['click ' + that.toId('download-all')] = 'downloadAllButtonClickHandler';
        events['click ' + that.toClass('download')] = 'downloadButtonClickHandler';
        events['click ' + that.toId('different-only')] = 'differentOnlyClickHandler';
        events['click ' + that.toClass('screenshot')] = 'onScreenshotClickHandler';
        this.delegateEvents(events);

        that.draw();

    };

    View.prototype.draw = function() {
        var that = this;
        if (that.delayHandler) {
            window.clearTimeout(that.delayHandler);
        }

        if (_.contains([ExecutionStatus.ID_COMPLETED, ExecutionStatus.ID_ERROR, ExecutionStatus.ID_TERMINATED], parseInt(that.model.get('statusId'), 10))) {
            _.defer(that.renderScreenshots.bind(that));
        }
        else if (_.contains([ExecutionStatus.ID_RUNNING], parseInt(that.model.get('statusId'), 10))) {
            that.renderScreenshots()
                .then(function() {
                    that.delayHandler = _.delay(that.draw.bind(that), 5000);
                });
        }
        else if (_.contains([ExecutionStatus.ID_SCHEDULED], parseInt(that.model.get('statusId'), 10))) {
            that.controls.screenshots.empty();
            that.controls.result.addClass('hidden');
        }
    };

    View.prototype.renderScreenshots = function() {
        var that = this;

        return B.resolve(that.model.getScreenshots())
            .then(function(screenshots) {
                that.screenshots.reset(screenshots);

                if (that.screenshots.length > 0) {
                    that.controls.result.removeClass('hidden');
                    that.controls.subtitle.text(accounting.formatNumber(that.screenshots.reduce(function(memo, s){
                        return memo + (s.get('oldScreenshot') ? 1 : 0) + (s.get('newScreenshot') ? 1 : 0);
                    }, 0)) + ' screenshots have been taken.');
                }
                else {
                    that.controls.result.addClass('hidden');
                }


                that.screenshots.forEach(function(u, index) {
                    var row = that.find(that.toId('head-row-' + index));
                    if (row.size() === 0) {
                        row = ROW({
                            id: that.id,
                            index: index,
                            device: that.device.toJSON(),
                            data: u.toJSON()
                        });
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
                                _.defer(function() {
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
                                _.defer(function() {
                                    that.compare(index);
                                });
                            });
                            newImg.attr('src', u.get('newScreenshot'));
                        }
                    }
                });
            });

    };

    View.prototype.onScreenshotClickHandler = function(event) {
        var e = $(event.currentTarget);

        if (e.data('loaded')) {
            window.open(e.attr('src'));
        }
    };


    View.prototype.downloadAllButtonClickHandler = function(event) {
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

    View.prototype.downloadButtonClickHandler = function(event) {
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

    View.prototype.getBase64ImageData = function(img) {
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

    View.prototype.differentOnlyClickHandler = function(event) {
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

    View.prototype.compare = function(index) {
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

    return View;
});