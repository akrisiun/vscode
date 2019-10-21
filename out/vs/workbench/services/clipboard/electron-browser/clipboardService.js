/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/clipboard/common/clipboardService", "electron", "vs/base/common/uri", "vs/base/common/platform", "vs/platform/instantiation/common/extensions"], function (require, exports, clipboardService_1, electron_1, uri_1, platform_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NativeClipboardService {
        async writeText(text, type) {
            electron_1.clipboard.writeText(text, type);
        }
        async readText(type) {
            return electron_1.clipboard.readText(type);
        }
        readTextSync() {
            return electron_1.clipboard.readText();
        }
        readFindText() {
            if (platform_1.isMacintosh) {
                return electron_1.clipboard.readFindText();
            }
            return '';
        }
        writeFindText(text) {
            if (platform_1.isMacintosh) {
                electron_1.clipboard.writeFindText(text);
            }
        }
        writeResources(resources) {
            if (resources.length) {
                electron_1.clipboard.writeBuffer(NativeClipboardService.FILE_FORMAT, this.resourcesToBuffer(resources));
            }
        }
        readResources() {
            return this.bufferToResources(electron_1.clipboard.readBuffer(NativeClipboardService.FILE_FORMAT));
        }
        hasResources() {
            return electron_1.clipboard.has(NativeClipboardService.FILE_FORMAT);
        }
        resourcesToBuffer(resources) {
            return Buffer.from(resources.map(r => r.toString()).join('\n'));
        }
        bufferToResources(buffer) {
            if (!buffer) {
                return [];
            }
            const bufferValue = buffer.toString();
            if (!bufferValue) {
                return [];
            }
            try {
                return bufferValue.split('\n').map(f => uri_1.URI.parse(f));
            }
            catch (error) {
                return []; // do not trust clipboard data
            }
        }
    }
    exports.NativeClipboardService = NativeClipboardService;
    NativeClipboardService.FILE_FORMAT = 'code/file-list'; // Clipboard format for files
    extensions_1.registerSingleton(clipboardService_1.IClipboardService, NativeClipboardService, true);
});
//# sourceMappingURL=clipboardService.js.map