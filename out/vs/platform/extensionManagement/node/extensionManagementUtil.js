/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/node/zip", "vs/nls"], function (require, exports, zip_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getManifest(vsix) {
        return zip_1.buffer(vsix, 'extension/package.json')
            .then(buffer => {
            try {
                return JSON.parse(buffer.toString('utf8'));
            }
            catch (err) {
                throw new Error(nls_1.localize('invalidManifest', "VSIX invalid: package.json is not a JSON file."));
            }
        });
    }
    exports.getManifest = getManifest;
});
//# sourceMappingURL=extensionManagementUtil.js.map