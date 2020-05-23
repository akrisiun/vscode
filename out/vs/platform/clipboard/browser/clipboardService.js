/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserClipboardService = void 0;
    class BrowserClipboardService {
        async writeText(text, type) {
            if (type) {
                return; // TODO@sbatten support for writing a specific type into clipboard is unsupported
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.writeText(text);
            }
            catch (error) {
                console.error(error);
            }
            // Fallback to textarea and execCommand solution
            const activeElement = document.activeElement;
            const textArea = document.body.appendChild(dom_1.$('textarea', { 'aria-hidden': true }));
            textArea.style.height = '1px';
            textArea.style.width = '1px';
            textArea.style.position = 'absolute';
            textArea.value = text;
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            if (activeElement instanceof HTMLElement) {
                activeElement.focus();
            }
            document.body.removeChild(textArea);
            return;
        }
        async readText(type) {
            if (type) {
                return ''; // TODO@sbatten support for reading a specific type from clipboard is unsupported
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.readText();
            }
            catch (error) {
                console.error(error);
                return '';
            }
        }
        readTextSync() {
            return undefined;
        }
        readFindText() {
            // @ts-expect-error
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
});
//# sourceMappingURL=clipboardService.js.map