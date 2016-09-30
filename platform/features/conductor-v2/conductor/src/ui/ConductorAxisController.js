/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [
        "d3"
    ],
    function (d3) {
        var PADDING = 1;

        /**
         * The mct-conductor-axis renders a horizontal axis with regular
         * labelled 'ticks'. It requires 'start' and 'end' integer values to
         * be specified as attributes.
         */
        function ConductorAxisController(conductor, formatService, conductorViewService) {
            // Dependencies
            this.d3 = d3;
            this.formatService = formatService;
            this.conductor = conductor;
            this.conductorViewService = conductorViewService;

            // Runtime properties (set by 'link' function)
            this.target = undefined;
            this.xScale = undefined;
            this.xAxis = undefined;
            this.axisElement = undefined;
            this.initialized = false;
            this.msPerPixel = undefined;

            this.bounds = conductor.bounds();
            this.timeSystem = conductor.timeSystem();

            //Bind all class functions to 'this'
            Object.keys(ConductorAxisController.prototype).filter(function (key) {
                return typeof ConductorAxisController.prototype[key] === 'function';
            }).forEach(function (key) {
                this[key] = ConductorAxisController.prototype[key].bind(this);
            }.bind(this));
        }

        ConductorAxisController.prototype.destroy = function () {
            this.conductor.off('timeSystem', this.changeTimeSystem);
            this.conductor.off('bounds', this.setScale);
        };

        ConductorAxisController.prototype.changeBounds = function (bounds) {
            this.bounds = bounds;
            if (this.initialized) {
                this.setScale();
            }
        };

        ConductorAxisController.prototype.setScale = function () {
            var width = this.target.offsetWidth;
            var timeSystem = this.conductor.timeSystem();
            var bounds = this.bounds;

            if (timeSystem.isUTCBased()) {
                this.xScale = this.xScale || this.d3.scaleUtc();
                this.xScale.domain([new Date(bounds.start), new Date(bounds.end)]);
            } else {
                this.xScale = this.xScale || this.d3.scaleLinear();
                this.xScale.domain([bounds.start, bounds.end]);
            }

            this.xScale.range([PADDING, width - PADDING * 2]);
            this.axisElement.call(this.xAxis);

            this.msPerPixel = (bounds.end - bounds.start) / width;
        };

        ConductorAxisController.prototype.changeTimeSystem = function (timeSystem) {
            this.timeSystem = timeSystem;

            var key = timeSystem.formats()[0];
            if (this.initialized && key !== undefined) {
                var format = this.formatService.getFormat(key);
                var bounds = this.conductor.bounds();

                if (timeSystem.isUTCBased()) {
                    this.xScale = this.d3.scaleUtc();
                } else {
                    this.xScale = this.d3.scaleLinear();
                }

                this.xAxis.scale(this.xScale);
                //Define a custom format function
                this.xAxis.tickFormat(function (tickValue) {
                    // Normalize date representations to numbers
                    if (tickValue instanceof Date) {
                        tickValue = tickValue.getTime();
                    }
                    return format.format(tickValue, {
                        min: bounds.start,
                        max: bounds.end
                    });
                });
                this.axisElement.call(this.xAxis);
            }
        };

        ConductorAxisController.prototype.link = function (scope, element) {
            this.target = element[0].firstChild;
            this.scope = scope;
            var height = this.target.offsetHeight;
            var vis = this.d3.select(this.target)
                        .append("svg:svg")
                        .attr("width", "100%")
                        .attr("height", height);

            this.xAxis = this.d3.axisTop();

            // draw x axis with labels and move to the bottom of the chart area
            this.axisElement = vis.append("g")
                .attr("transform", "translate(0," + (height - PADDING) + ")");

            this.initialized = true;

            if (this.timeSystem !== undefined) {
                this.changeTimeSystem(this.timeSystem);
                this.setScale();
            }

            //Respond to changes in conductor
            this.conductor.on("timeSystem", this.changeTimeSystem);
            this.conductor.on("bounds", this.changeBounds);

            this.scope.$on("$destroy", this.destroy);

            this.conductorViewService.on("zoom", this.zoom);
        };

        ConductorAxisController.prototype.panStop = function () {
            //resync view bounds with time conductor bounds
            this.conductor.bounds(this.bounds);
            this.conductorViewService.emit("pan-stop");
        };

        ConductorAxisController.prototype.zoom = function (bounds) {
            this.changeBounds(bounds);
        };

        ConductorAxisController.prototype.pan = function (delta) {
            if (!this.conductor.follow()) {
                var deltaInMs = delta[0] * this.msPerPixel;
                var bounds = this.conductor.bounds();
                var start = Math.floor((bounds.start - deltaInMs) / 1000) * 1000;
                var end = Math.floor((bounds.end - deltaInMs) / 1000) * 1000;
                this.bounds = {
                    start: start,
                    end: end
                };
                this.setScale();
                this.conductorViewService.emit("pan", this.bounds);
            }
        };

        ConductorAxisController.prototype.resize = function () {
            if (this.initialized) {
                this.setScale();
            }
        };

        return ConductorAxisController;
    }
);
