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
 * The fixtures in this file are to be used to consolidate common actions performed by the
 * various test suites. The goal is only to avoid duplication of code across test suites and not to abstract
 * away the underlying functionality of the application. For more about the App Action pattern, see /e2e/README.md)
 *
 * For example, if two functions are nearly identical in
 * timer.e2e.spec.js and notebook.e2e.spec.js, that function should be generalized and moved into this file.
 */

/**
 * @typedef {Object} CreateObjectOptions
 * @property {string} type the type of object to create
 * @property {string} name the name of the object to create
 * @property {string} parent the identifier (uuid) of the parent object
 */

/**
 * @typedef {Object} CreatedObjectInfo
 * @property {string} name the name of the object
 * @property {string} uuid the uuid of the object
 * @property {string} url the url of the object
 */

/**
 * This common function creates a `domainObject` with default options. It is the preferred way of creating objects
 * in the e2e suite when uninterested in properties of the objects themselves.
 *
 * @param {import('@playwright/test').Page} page
 * @param {CreateObjectOptions} options
 * @returns {Promise<CreatedObjectInfo>} objectInfo
 */
async function createDomainObjectWithDefaults(page, { type, name, parent = 'mine' }) {
    const parentUrl = await getHashUrlToDomainObject(page, parent);

    // Navigate to the parent object. This is necessary to create the object
    // in the correct location, such as a folder, layout, or plot.
    await page.goto(`${parentUrl}?hideTree=true`);
    await page.waitForLoadState('networkidle');

    //Click the Create button
    await page.click('button:has-text("Create")');

    // Click the object specified by 'type'
    await page.click(`li:text("${type}")`);

    // Modify the name input field of the domain object to accept 'name'
    if (name) {
        const nameInput = page.locator('input[type="text"]').nth(2);
        await nameInput.fill("");
        await nameInput.fill(name);
    }

    // Click OK button and wait for Navigate event
    await Promise.all([
        page.waitForLoadState(),
        page.click('[aria-label="Save"]'),
        // Wait for Save Banner to appear
        page.waitForSelector('.c-message-banner__message')
    ]);

    // Wait until the URL is updated
    await page.waitForNavigation('networkidle');
    const uuid = await getFocusedObjectUuid(page);
    const objectUrl = await getHashUrlToDomainObject(page, uuid);

    return {
        name: name || `Unnamed ${type}`,
        uuid: uuid,
        url: objectUrl
    };
}

/**
* Open the given `domainObject`'s context menu from the object tree.
* Expands the 'My Items' folder if it is not already expanded.
*
* @param {import('@playwright/test').Page} page
* @param {string} myItemsFolderName the name of the "My Items" folder
* @param {string} domainObjectName the display name of the `domainObject`
*/
async function openObjectTreeContextMenu(page, myItemsFolderName, domainObjectName) {
    const myItemsFolder = page.locator(`text=Open MCT ${myItemsFolderName} >> span`).nth(3);
    const className = await myItemsFolder.getAttribute('class');
    if (!className.includes('c-disclosure-triangle--expanded')) {
        await myItemsFolder.click();
    }

    await page.locator(`a:has-text("${domainObjectName}")`).click({
        button: 'right'
    });
}

/**
 * Gets the UUID of the currently focused object by parsing the current URL
 * and returning the last UUID in the path.
 * @param {import('@playwright/test').Page} page
 * @returns {string} the uuid of the focused object
 */
async function getFocusedObjectUuid(page) {
    const UUIDv4Regexp = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
    const focusedObjectUuid = await page.evaluate((regexp) => {
        return window.location.href.match(regexp).at(-1);
    }, UUIDv4Regexp);

    return focusedObjectUuid;
}

/**
 * Returns the hashUrl to the domainObject given its uuid.
 * Useful for directly navigating to the given domainObject.
 *
 * URLs returned will be of the form `'./browse/#/mine/<uuid0>/<uuid1>/...'`
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} uuid the uuid of the object to get the url for
 * @returns {string} the url of the object
 */
async function getHashUrlToDomainObject(page, uuid) {
    const hashUrl = await page.evaluate(async (objectUuid) => {
        const path = await window.openmct.objects.getOriginalPath(objectUuid);
        let url = './#/browse/' + [...path].reverse()
            .map((object) => window.openmct.objects.makeKeyString(object.identifier))
            .join('/');

        // Drop the vestigial '/ROOT' if it exists
        if (url.includes('/ROOT')) {
            url = url.split('/ROOT').join('');
        }

        return url;
    }, uuid);

    return hashUrl;
}

// eslint-disable-next-line no-undef
module.exports = {
    createDomainObjectWithDefaults,
    openObjectTreeContextMenu,
    getHashUrlToDomainObject,
    getFocusedObjectUuid
};
