/*global _, _s, Backbone*/
define(function(require) {
    var Super = require('views/base'),
        B = require('bluebird'),
        Chart = require('vendors/Chart.js/Chart.min'),
        Template = require('hbs!./graph.tpl');


    var View = Super.extend({});

    View.prototype.initialize = function(options) {
        Super.prototype.initialize.call(this, options);

        
    };

    View.prototype.render = function() {
        var that = this;
        return B.resolve()
            .then(function() {
                

                that.$el.html(Template({
                    id: that.id
                }));
                
                var ctx = document.getElementById("status-graph-canvas").getContext("2d");
                
                var data = {
                    labels: ["January", "February", "March", "April", "May", "June", "July"],
                    datasets: [
                        {
                            label: "Errors",
                            fillColor: "rgba(220,220,220,0.2)",
                            strokeColor: "rgba(255, 84, 81, 1)",
                            pointColor: "rgba(220,220,220,1)",
                            pointStrokeColor: "#fff",
                            pointHighlightFill: "#fff",
                            pointHighlightStroke: "rgba(220,220,220,1)",
                            data: [65, 59, 80, 81, 56, 55, 40]
                        }
                    ]
                };
                
                var chart = new Chart(ctx).Line(data);
                
                $("#status-graph-canvas").width('100%');

                that.mapControls();

                var events = {};
                that.delegateEvents(events);
            });

    };

    return View;
});