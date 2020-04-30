/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

/* Retired lodash methods */

// keyBy for array only
export const keyBy = (array, key) => (array || []).reduce((acc, curr) => {
    return { ...acc, [curr[key]]: curr };
}, {});

// flattens array a single level deep.
export const flatten = array => array.reduce((acc, curr) => {
    return acc.concat(curr);
}, []);

// recursively flatten deeper arrays
export const flattenDeep = array => {
    return array.reduce((acc, curr) => {
        return Array.isArray(curr) ? acc.concat(flattenDeep(curr)) : acc.concat(curr);
    }, []);
};

// checks if value is an empty object or collection - does not support evaluating a Set or a Map
export const isEmpty = (obj => {
    return [Object, Array].includes((obj || {}).constructor)
        && !Object.entries((obj || {})).length;
});
