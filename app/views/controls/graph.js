/*global _, _s, Backbone*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Chart = require('vendors/Chart.js/Chart.min'),
        Template = require('hbs!./graph.tpl'),
        moment = require('moment');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);

        this.type = options.type;
        if (options.sites) {
            this.sites = options.sites;
        }
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {


                that.$el.html(Template({
                    id: that.id
                }));
                $('#graph-select').val(that.type);

                var ctx = document.getElementById("status-graph-canvas").getContext("2d");

                if (this.sites) {

                    if (that.type === 'days') {
                        var daysData = [];
                        var daysLabels = [];

                        that.sites.each(function(site) {
                            _.each(site.get('stats').error.days.dates, function(day) {
                                daysLabels.push(moment().dayOfYear(day.date).toString().substr(0, 3));
                                daysData.push(day.total);
                            });
                        });



                        var data = {
                            labels: daysLabels,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: daysData
                            }]
                        };

                        var chart = new Chart(ctx).Line(data);
                    }
                    else if (that.type === 'weeks') {
                        var weeksData = [];
                        var weeksLabels = [];

                        that.sites.each(function(site) {
                            _.each(site.get('stats').error.weeks.dates, function(week) {
                                weeksLabels.push(moment().week(week.date).week());
                                weeksData.push(week.total);
                            });
                        });



                        var data = {
                            labels: weeksLabels,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: weeksData
                            }]
                        };

                        var chart = new Chart(ctx).Line(data);
                    }
                    else if (that.type === 'months') {
                        var monthssData = [];
                        var monthsLabel = [];
                        that.sites.each(function(site) {
                            _.each(site.get('stats').error.months.dates, function(month) {
                                monthsLabel.push(moment().month(month.date).format('MMM'));
                                monthssData.push(month.total);
                            });
                        });


                        var data = {
                            labels: monthsLabel,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: monthssData
                            }]
                        };

                        var chart = new Chart(ctx).Line(data);
                    }
                }
                else {
                    var daysData = [];
                    var daysLabels = [];

                    if (that.type === 'days') {
                        var daysData = [];
                        _.each(window.app.user.get('stats').error.days.dates, function(day) {
                            daysLabels.push(moment().dayOfYear(day.date).toString().substr(0, 3));
                            daysData.push(day.total);
                        });

                        var data = {
                            labels: daysLabels,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: daysData
                            }]
                        };

                        var chart = new Chart(ctx).Line(data);
                    }
                    else if (that.type === 'weeks') {
                        var weeksData = [];
                        var weeksLabels = [];

                        _.each(window.app.user.get('stats').error.weeks.dates, function(week) {
                            weeksLabels.push(moment().week(week.date).week());
                            weeksData.push(week.total);
                        });

                        var data = {
                            labels: weeksLabels,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: weeksData
                            }]
                        };

                        var chart = new Chart(ctx).Line(data);
                    }
                    else if (that.type === 'months') {
                        var monthssData = [];
                        var monthsLabel = [];
                        _.each(window.app.user.get('stats').error.months.dates, function(month) {
                            monthsLabel.push(moment().month(month.date).format('MMM'));
                            monthssData.push(month.total);
                        });

                        var data = {
                            labels: monthsLabel,
                            datasets: [{
                                label: "Errors",
                                fillColor: "rgba(220,220,220,0.2)",
                                strokeColor: "rgba(255, 84, 81, 1)",
                                pointColor: "rgba(220,220,220,1)",
                                pointStrokeColor: "#fff",
                                pointHighlightFill: "#fff",
                                pointHighlightStroke: "rgba(220,220,220,1)",
                                data: monthssData
                            }]
                        };
                        
                        var options = {
        //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
        scaleBeginAtZero : true,

        //Boolean - Whether grid lines are shown across the chart
        scaleShowGridLines : true,

        //String - Colour of the grid lines
        scaleGridLineColor : "rgba(0,0,0,.05)",

        //Number - Width of the grid lines
        scaleGridLineWidth : 1,

        //Boolean - Whether to show horizontal lines (except X axis)
        scaleShowHorizontalLines: true,

        //Boolean - Whether to show vertical lines (except Y axis)
        scaleShowVerticalLines: true,

        //Boolean - If there is a stroke on each bar
        barShowStroke : true,

        //Number - Pixel width of the bar stroke
        barStrokeWidth : 2,

        //Number - Spacing between each of the X value sets
        barValueSpacing : 5,

        //Number - Spacing between data sets within X values
        barDatasetSpacing : 1,
        responsive: true,

        //String - A legend template
        legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

    };

                        var chart = new Chart(ctx).Line(data, options);
                    }
                }

                //$("#status-graph-canvas").width('50%');

                that.mapControls();

                // $('#graph-select').change(that.handleSelect.bind(this))

                var events = {};
                events['change #graph-select'] = that.handleSelect.bind(that);
                that.delegateEvents(events);
            });

    };

    View.prototype.handleSelect = function(e) {
        console.log(this);
        this.type = $(e.currentTarget).val();
        this.render();
    };

    return View;
});