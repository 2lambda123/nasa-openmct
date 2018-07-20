/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

 define([
     'zepto',
     '../../../platform/core/src/capabilities/ContextualDomainObject',
     '../../selection/ContextManager',
     '../../selection/Selection',
     '../../selection/SelectGesture'
 ], function (
     $,
     ContextualDomainObject,
     ContextManager,
     Selection,
     SelectGesture
 ) {
     /**
      * Allows support for common user actions to be attached to views.
      * @interface GestureAPI
      * @memberof module:openmct
      */
     function GestureAPI(openmct, objectUtils) {
         this.openmct = openmct;
         this.objectUtils = objectUtils;
     }

     /**
      * Designate an HTML element as selectable, and associated with a
      * particular object.
      *
      * @param {HTMLElement} htmlElement the element to make selectable
      * @param {*} item the object which should become selected when this
      *        element is clicked.
      * @returns {Function} a function to remove selectability from this
      *          HTML element.
      * @method selectable
      * @memberof module:openmct.GestureAPI#
      */
     GestureAPI.prototype.selectable = function (htmlElement, item) {
         //TODO: implement selectable
     };


     /**
      * Designate an HTML element as having a context menu associated with
      * the provided item.
      *
      //TODO: should this really be private?
      * @private
      * @param {HTMLElement} htmlElement the element containing the context menu
      * @param {*} childObject the object for which a context menu should appear
      * @param {*} parentObject the object which has the context required for
      *        showing the context menu
      * @returns {Function} a function to remove this gesture from this
      *          HTML element.
      * @method contextMenu
      * @memberof module:openmct.GestureAPI#
      */
     GestureAPI.prototype.contextMenu = function (htmlElement, childObject, parentObject) {
         var gestureService = this.openmct.$injector.get('gestureService');
         if (childObject.hasOwnProperty('identifier')) {
             childObject = this.convertAndInstantiateDomainObject(childObject);
         }
         if (parentObject.hasOwnProperty('identifier')) {
             parentObject = this.convertAndInstantiateDomainObject(parentObject);
         }

         var contextObject = new ContextualDomainObject(childObject, parentObject);

         return gestureService.attachGestures($(htmlElement), contextObject, ['menu']);
     };

     /**
      * Designate an HTML element as having a info popover associated with
      * the provided item.
      *
      //
      * @private
      * @param {HTMLElement} htmlElement the element to make selectable
      * @param {*} childObject the object for which a info popover should appear
      * @param {*} parentObject the object which has the context required for
      *        showing the info popover
      * @returns {Function} a function to remove this gesture from this
      *          HTML element.
      * @method info
      * @memberof module:openmct.GestureAPI#
      */
     GestureAPI.prototype.info = function (htmlElement, childObject, parentObject) {
         var gestureService = this.openmct.$injector.get('gestureService');

         //Check if the objects have an identifier property
         if (childObject.hasOwnProperty('identifier')) {
             //If they don't convert them into the old object
             childObject = this.convertAndInstantiateDomainObject(childObject);
         }
         if (parentObject.hasOwnProperty('identifier')) {
             parentObject = this.convertAndInstantiateDomainObject(parentObject);
         }

         var contextObject = new ContextualDomainObject(childObject, parentObject);


         return gestureService.attachGestures($(htmlElement), contextObject, ['info']);
     };

     //Converts a new domain object(nDomainObject) to an old domain object(oDomainObject) and instantiates it.
     GestureAPI.prototype.convertAndInstantiateDomainObject = function (nDomainObject) {
         var instantiate = this.openmct.$injector.get('instantiate');

         var keystring = this.objectUtils.makeKeyString(nDomainObject.identifier);

         var oDomainObject = this.objectUtils.toOldFormat(nDomainObject);

         return instantiate(oDomainObject, keystring);
     };

     return GestureAPI;
 });
