/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/clipboard/common/clipboardService"], function (require, exports, extensions_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserClipboardService {
        async writeText(text, type) {
            if (type) {
                return; // TODO@sbatten
            }
            return navigator.clipboard.writeText(text);
        }
        async readText(type) {
            if (type) {
                return ''; // TODO@sbatten
            }
            return navigator.clipboard.readText();
        }
        readTextSync() {
            return undefined;
        }
        readFindText() {
            // @ts-ignore
            return undefined;
        }
        writeFindText(text) { }
        writeResources(resources) {
            this._internalResourcesClipboard = resources;
        }
        readResources() {
            return this._internalResourcesClipboard || [];
        }
        hasResources() {
            return this._internalResourcesClipboard !== undefined && this._internalResourcesClipboard.length > 0;
        }
    }
    exports.BrowserClipboardService = BrowserClipboardService;
    extensions_1.registerSingleton(clipboardService_1.IClipboardService, BrowserClipboardService, true);
});
//# sourceMappingURL=clipboardService.js.map