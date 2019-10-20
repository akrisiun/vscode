/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/mime", "vs/base/common/path"], function (require, exports, mime_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const webviewMimeTypes = new Map([
        ['.svg', 'image/svg+xml'],
        ['.txt', 'text/plain'],
        ['.css', 'text/css'],
        ['.js', 'application/javascript'],
        ['.json', 'application/json'],
        ['.html', 'text/html'],
        ['.htm', 'text/html'],
        ['.xhtml', 'application/xhtml+xml'],
        ['.oft', 'font/otf'],
        ['.xml', 'application/xml'],
    ]);
    function getWebviewContentMimeType(normalizedPath) {
        const ext = path_1.extname(normalizedPath.fsPath).toLowerCase();
        return webviewMimeTypes.get(ext) || mime_1.getMediaMime(normalizedPath.fsPath) || mime_1.MIME_UNKNOWN;
    }
    exports.getWebviewContentMimeType = getWebviewContentMimeType;
});
//# sourceMappingURL=mimeTypes.js.map