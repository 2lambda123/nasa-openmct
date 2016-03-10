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
/*global define,Promise*/

/**
 * This bundle implements the directives for representing domain objects
 * as Angular-managed HTML.
 * @namespace platform/representation
 */
define(
    ["./OneWayBinder"],
    function (OneWayBinder) {
        "use strict";

        /**
         * Defines the mct-representation directive. This may be used to
         * present domain objects as HTML (with event wiring), with the
         * specific representation being mapped to a defined extension
         * (as defined in either the `representations` category-of-extension,
         * or the `views` category-of-extension.)
         *
         * This directive uses two-way binding for three attributes:
         *
         * * `mct-object`, populated as `domainObject` in the loaded
         *   template's scope. This is the domain object being
         *   represented as HTML by this directive.
         * * `key`: An Angular expression, matched against the key of a
         *   defined representation or view extension in order to determine
         *   which actual template to include.
         * * `mct-model`: An Angular expression; its value is watched
         *   and passed into the template's scope as property `mctModel`.
         * * `parameters`: An Angular expression; its value is watched
         *   and passed into the template's scope as property `parameters`.
         *
         * The difference between `parameters` and `mct-model` is intent;
         * `parameters` should be used for display-time parameters which
         * are not meant to be changed, whereas `mct-model` should be
         * used to pass in objects whose properties will (or may) be
         * modified by the included representation.
         *
         * (For backwards compatibility, `ng-model` is treated identically
         * to `mct-model`, and the property `ngModel` will be provided
         * in scope with the same value as `mctModel`. This usage is
         * deprecated and should be avoided.)
         *
         * @memberof platform/representation
         * @constructor
         * @param {RepresentationDefinition[]} representations an array of
         *        representation extensions
         * @param {ViewDefinition[]} views an array of view extensions
         */
        function MCTRepresentation(representations, views, representers, $q, templateLinker, $log) {
            var representationMap = {},
                gestureMap = {};

            // Assemble all representations and views
            // The distinction between views and representations is
            // not important here (view is-a representation)
            representations.concat(views).forEach(function (representation) {
                var key = representation.key;

                // Store the representation
                representationMap[key] = representationMap[key] || [];
                representationMap[representation.key].push(representation);
            });

            // Look up a matching representation for this domain object
            function lookup(key, domainObject) {
                var candidates = representationMap[key] || [],
                    type,
                    i;
                // Filter candidates by object type
                for (i = 0; i < candidates.length; i += 1) {
                    type = candidates[i].type;
                    if (!type || !domainObject ||
                            domainObject.getCapability('type').instanceOf(type)) {
                        return candidates[i];
                    }
                }
            }

            function link($scope, element, attrs, ctrl, transclude) {
                var activeRepresenters = representers.map(function (Representer) {
                        return new Representer($scope, element, attrs);
                    }),
                    toClear = [], // Properties to clear out of scope on change
                    counter = 0,
                    couldRepresent = false,
                    couldEdit = false,
                    lastIdPath = [],
                    lastKey,
                    changeTemplate = templateLinker.link($scope, element),
                    binder = new OneWayBinder($scope, attrs);

                // Populate scope with any capabilities indicated by the
                // representation's extension definition
                function refreshCapabilities() {
                    var domainObject = $scope.domainObject,
                        representation = lookup($scope.key, domainObject),
                        uses = ((representation || {}).uses || []),
                        myCounter = counter;

                    if (domainObject) {
                        // Update model
                        $scope.model = domainObject.getModel();

                        // Provide any of the capabilities requested
                        uses.forEach(function (used) {
                            $log.debug([
                                "Requesting capability ",
                                used,
                                " for representation ",
                                $scope.key
                            ].join(""));

                            $q.when(
                                domainObject.useCapability(used)
                            ).then(function (c) {
                                // Avoid clobbering capabilities from
                                // subsequent representations;
                                // Angular reuses scopes.
                                if (counter === myCounter) {
                                    $scope[used] = c;
                                }
                            });
                        });
                    }
                }

                // Destroy (deallocate any resources associated with) any
                // active representers.
                function destroyRepresenters() {
                    activeRepresenters.forEach(function (activeRepresenter) {
                        activeRepresenter.destroy();
                    });
                }

                function unchanged(canRepresent, canEdit, idPath, key) {
                    return canRepresent &&
                        couldRepresent &&
                        key === lastKey &&
                        idPath.length === lastIdPath.length &&
                        idPath.every(function (id, i) {
                            return id === lastIdPath[i];
                        }) &&
                        canEdit &&
                        couldEdit;
                }

                function getIdPath(domainObject) {
                    if (!domainObject) {
                        return [];
                    }
                    if (!domainObject.hasCapability('context')) {
                        return [domainObject.getId()];
                    }
                    return domainObject.getCapability('context')
                        .getPath().map(function (pathObject) {
                            return pathObject.getId();
                        });
                }

                // General-purpose refresh mechanism; should set up the scope
                // as appropriate for current representation key and
                // domain object.
                function refresh() {
                    var domainObject = $scope.domainObject,
                        representation = lookup($scope.key, domainObject),
                        uses = ((representation || {}).uses || []),
                        canRepresent = !!(representation && domainObject),
                        canEdit = !!(domainObject && domainObject.hasCapability('editor')),
                        idPath = getIdPath(domainObject),
                        key = $scope.key;

                    if (unchanged(canRepresent, canEdit, idPath, key)) {
                        return;
                    }

                    // Create an empty object named "representation", for this
                    // representation to store local variables into.
                    $scope.representation = {};

                    // Change templates (passing in undefined to clear
                    // if we don't have enough info to show a template.)
                    changeTemplate(canRepresent ? representation : undefined);

                    // Any existing representers are no longer valid; release them.
                    destroyRepresenters();

                    // Log if a key was given, but no matching representation
                    // was found.
                    if (!representation && $scope.key) {
                        $log.warn("No representation found for " + $scope.key);
                    }

                    // Clear out the scope from the last representation
                    toClear.forEach(function (property) {
                        delete $scope[property];
                    });

                    // To allow simplified change detection next time around
                    couldRepresent = canRepresent;
                    lastIdPath = idPath;
                    couldEdit = canEdit;
                    lastKey = key;

                    // Populate scope with fields associated with the current
                    // domain object (if one has been passed in)
                    if (canRepresent) {
                        // Track how many representations we've made in this scope,
                        // to ensure that the correct representations are matched to
                        // the correct object/key pairs.
                        counter += 1;

                        // Initialize any capabilities
                        refreshCapabilities();

                        // Also provide the view configuration,
                        // for the specific view
                        $scope.configuration =
                            ($scope.model.configuration || {})[$scope.key] || {};

                        // Finally, wire up any additional behavior (such as
                        // gestures) associated with this representation.
                        activeRepresenters.forEach(function (representer) {
                            representer.represent(representation, domainObject);
                        });

                        // Track which properties we want to clear from scope
                        // next change object/key pair changes
                        toClear = uses.concat(['model']);
                    }
                }

                binder.bind('parameters');
                binder.bind('mctModel');
                binder.bind('ngModel');

                binder.alias('ngModel', 'mctModel');
                binder.alias('mctModel', 'ngModel');

                // Update the representation when the key changes (e.g. if a
                // different representation has been selected)
                binder.bind('key', refresh);

                // Also update when the represented domain object changes
                // (to a different object)
                binder.alias('mctObject', 'domainObject', refresh);

                // Finally, also update when there is a new version of that
                // same domain object; these changes should be tracked in the
                // model's "modified" field, by the mutation capability.
                $scope.$watch("domainObject.getModel().modified", refreshCapabilities);

                // Make sure any resources allocated by representers also get
                // released.
                $scope.$on("$destroy", destroyRepresenters);

                // Do one initial refresh, so that we don't need another
                // digest iteration just to populate the scope. Failure to
                // do this can result in unstable digest cycles, which
                // Angular will detect, and throw an Error about.
                refresh();
            }

            return {
                // Only applicable at the element level
                restrict: "E",

                // Handle Angular's linking step
                link: link,

                // May hide the element, so let other directives act first
                priority: -1000,

                // Isolate this scope
                scope: {}
            };
        }

        /**
         * A representer participates in the process of instantiating a
         * representation of a domain object.
         *
         * @interface Representer
         * @augments {Destroyable}
         */
        /**
         * Set the current representation in use, and the domain
         * object being represented.
         *
         * @method Representer#represent
         * @param {RepresentationDefinition} representation the
         *        definition of the representation in use
         * @param {DomainObject} domainObject the domain object
         *        being represented
         */


        return MCTRepresentation;
    }
);

