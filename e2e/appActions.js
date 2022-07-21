/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

/**
 * @type {Map<string, string>}
 */
const createdObjects = new Map();

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} domainObjectName
 * @returns {Promise<string>} uuid of the domain object
 */
async function getOrCreateDomainObject(page, domainObjectName) {
    if (createdObjects.has(domainObjectName)) {
        return createdObjects.get(domainObjectName);
    }

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object
    await page.click(`text=${domainObjectName}`);

    // Click text=OK
    await Promise.all([
        page.waitForNavigation({waitUntil: 'networkidle'}),
        page.click('text=OK')
    ]);

    const uuid = await page.evaluate(() => {
        return window.location.href.match(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)[0];
    });

    createdObjects.set(domainObjectName, uuid);

    return uuid;
}

// eslint-disable-next-line no-undef
exports.getOrCreateDomainObject = getOrCreateDomainObject;
