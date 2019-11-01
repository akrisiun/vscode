/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri"], function (require, exports, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getPathFromAmdModule(requirefn, relativePath) {
        return uri_1.URI.parse(requirefn.toUrl(relativePath)).fsPath;
    }
    exports.getPathFromAmdModule = getPathFromAmdModule;
    /**
     * Reference a resource that might be inlined.
     * Do not inline icons that will be used by the native mac touchbar.
     * Do not rename this method unless you adopt the build scripts.
     */
    function registerAndGetAmdImageURL(absolutePath) {
        return require.toUrl(absolutePath);
    }
    exports.registerAndGetAmdImageURL = registerAndGetAmdImageURL;
});
//# sourceMappingURL=amd.js.map