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
            console.log('got sites');
            this.sites = options.sites;
        }
    };

    View.prototype.getWeek = function(startDay) {
        var days = [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ];

        var startDayIndex = days.indexOf(startDay);
        var week, abbrWeek = [];

        if (startDayIndex === 0) {
            _.each(days, function(day, i) {
                abbrWeek.push(day);
            });
        }
        else {
            week = days.slice(startDayIndex + 1, days.length).concat(days.slice(0, startDayIndex + 1));
            _.each(week, function(day, i) {
                abbrWeek.push(day);
            });
        }

        return abbrWeek;
    };

    View.prototype.getMonths = function(month) {
        var months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];

        var startMonthIndex = months.indexOf(month);
        var tempMonth, monthArr = [];

        if (startMonthIndex === 0) {
            _.each(months, function(mon) {
                monthArr.push(mon);
            });
        }
        else {
            tempMonth = months.slice(startMonthIndex + 1, months.length).concat(months.slice(0, startMonthIndex + 1));

            _.each(tempMonth, function(month) {
                monthArr.push(month);
            });
        }

        return monthArr;
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

                if (that.sites) {

                    if (that.type === 'days') {
                        var daysData = [];
                        var daysLabels = [];

                        _.each(that.sites, function(site) {

                            _.each(site.get('stats').error.days.dates, function(day) {
                                if (daysLabels.indexOf(moment().dayOfYear(day.date).toString().substr(0, 3)) > -1) {

                                    daysData[daysLabels.indexOf(moment().dayOfYear(day.date).toString().substr(0, 3))] += 1;
                                }
                                else {
                                    daysLabels.push(moment().dayOfYear(day.date).toString().substr(0, 3));
                                    daysData.push(day.total);
                                }
                            });
                        });

                        if (!daysData.length) {
                            daysData = [0, 0, 0, 0, 0, 0, 0];
                            daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        else if (daysData.length < 7) {
                            var newLabels = that.getWeek(daysLabels[0]);
                            var newData = [0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(daysLabels, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(daysData[daysLabels.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = daysData[daysLabels.indexOf(label)]
                                 }
                            });
                            
                            daysData = newData;
                            daysLabels = newLabels;
                        }


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
                        
                        function getWeek(weeks) {
                            console.log('weeks num', weeks);
                            var lastDay = weeks[weeks.length - 1];
                            var firstDay = lastDay - 9;
                            
                            var returnArr = [];
                            
                            for (var i = 0; i < 9; i++) {
                                returnArr.push(firstDay++);
                            }
                            
                            returnArr.push(lastDay);
                            
                            console.log(lastDay)
                            
                            return returnArr;
                        }

                        _.each(that.sites, function(site) {
                            _.each(site.get('stats').error.weeks.dates, function(week) {

                                if (weeksLabels.indexOf(moment().week(week.date).week().toString()) > -1) {
                                    weeksData[weeksLabels.indexOf(moment().week(week.date).week().toString())] += 1;
                                }
                                else {
                                    weeksLabels.push(moment().week(week.date).week().toString());
                                    weeksData.push(week.total);
                                }
                            });
                        });
                        
                        if (!weeksData.length) {
                            weeksData = [0, 0, 0, 0, 0, 0, 0];
                            //weeksLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        else if (weeksData.length < 10) {
                            var newLabels = getWeek(weeksLabels);
                            var newData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(weeksLabels, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(weeksData[weeksLabels.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = weeksData[weeksLabels.indexOf(label)]
                                 }
                            });
                            
                            weeksData = newData;
                            weeksLabels = newLabels;
                        }

                        // if (!weeksData.length) {
                        //     weeksData = [0, 0, 0, 0, 0, 0, 0];
                        //     //weeksLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        // }
                        // else if (weeksData.length < 10) {
                        //     //weeksLabels = that.getWeek(weeksLabels[0]);
                        // }



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

                        _.each(that.sites, function(site) {
                            _.each(site.get('stats').error.months.dates, function(month) {
                                if (monthsLabel.indexOf(moment().month(month.date).format('MMM').toString()) > -1) {
                                    monthssData[monthsLabel.indexOf(moment().month(month.date).format('MMM').toString())] += 1;
                                }
                                else {
                                    monthsLabel.push(moment().month(month.date).format('MMM').toString());
                                    monthssData.push(month.total);
                                }
                            });
                        });

                        if (!monthssData.length) {
                            monthssData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            //weeksLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        if (monthssData.length < 12) {
                            var newLabels = that.getMonths(moment().month(monthsLabel[0]).format('MMM'));
                            var newData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(monthsLabel, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(monthssData[monthsLabel.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = monthssData[monthsLabel.indexOf(label)]
                                 }
                            });
                            
                            monthssData = newData;
                            monthsLabel = newLabels;
                            
                        }


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

                        if (!daysData.length) {
                            daysData = [0, 0, 0, 0, 0, 0, 0];
                            daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        else if (daysData.length < 7) {
                            var newLabels = that.getWeek(daysLabels[0]);
                            var newData = [0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(daysLabels, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(daysData[daysLabels.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = daysData[daysLabels.indexOf(label)]
                                 }
                            });
                            
                            daysData = newData;
                            daysLabels = newLabels;
                        }

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
                        
                        function getWeek(weeks) {
                            console.log('weeks num', weeks);
                            var lastDay = weeks[weeks.length - 1];
                            var firstDay = lastDay - 9;
                            
                            var returnArr = [];
                            
                            for (var i = 0; i < 9; i++) {
                                returnArr.push(firstDay++);
                            }
                            
                            returnArr.push(lastDay);
                            
                            console.log(lastDay)
                            
                            return returnArr;
                        }

                        _.each(window.app.user.get('stats').error.weeks.dates, function(week) {
                            weeksLabels.push(moment().week(week.date).week());
                            weeksData.push(week.total);
                        });
                        
                        if (!weeksData.length) {
                            weeksData = [0, 0, 0, 0, 0, 0, 0];
                            //weeksLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        else if (weeksData.length < 10) {
                            var newLabels = getWeek(weeksLabels);
                            var newData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(weeksLabels, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(weeksData[weeksLabels.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = weeksData[weeksLabels.indexOf(label)]
                                 }
                            });
                            
                            weeksData = newData;
                            weeksLabels = newLabels;
                        }

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

                        if (!monthssData.length) {
                            monthssData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            //weeksLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        }
                        if (monthssData.length < 12) {
                            var newLabels = that.getMonths(moment().month(monthsLabel[0]).format('MMM'));
                            var newData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                            
                            _.each(monthsLabel, function(label, i) {
                                 if (newLabels.indexOf(label) > -1) {
                                     console.log(monthssData[monthsLabel.indexOf(label)])
                                     newData[newLabels.indexOf(label)] = monthssData[monthsLabel.indexOf(label)]
                                 }
                            });
                            
                            monthssData = newData;
                            monthsLabel = newLabels;
                            
                        }

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
                            scaleBeginAtZero: true,

                            //Boolean - Whether grid lines are shown across the chart
                            scaleShowGridLines: true,

                            //String - Colour of the grid lines
                            scaleGridLineColor: "rgba(0,0,0,.05)",

                            //Number - Width of the grid lines
                            scaleGridLineWidth: 1,

                            //Boolean - Whether to show horizontal lines (except X axis)
                            scaleShowHorizontalLines: true,

                            //Boolean - Whether to show vertical lines (except Y axis)
                            scaleShowVerticalLines: true,

                            //Boolean - If there is a stroke on each bar
                            barShowStroke: true,

                            //Number - Pixel width of the bar stroke
                            barStrokeWidth: 2,

                            //Number - Spacing between each of the X value sets
                            barValueSpacing: 5,

                            //Number - Spacing between data sets within X values
                            barDatasetSpacing: 1,
                            responsive: true,

                            //String - A legend template
                            legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"

                        };

                        var chart = new Chart(ctx).Line(data, options);
                    }
                }

                $("#status-graph-canvas").css({
                    'margin-left': '-1.2em',
                    'width': '100%'
                });

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