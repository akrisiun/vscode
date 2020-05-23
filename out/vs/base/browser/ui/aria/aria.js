/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/browser/dom", "vs/css!./aria"], function (require, exports, platform_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.status = exports.alert = exports.setARIAContainer = void 0;
    // Use a max length since we are inserting the whole msg in the DOM and that can cause browsers to freeze for long messages #94233
    const MAX_MESSAGE_LENGTH = 20000;
    let ariaContainer;
    let alertContainer;
    let statusContainer;
    function setARIAContainer(parent) {
        ariaContainer = document.createElement('div');
        ariaContainer.className = 'monaco-aria-container';
        alertContainer = document.createElement('div');
        alertContainer.className = 'monaco-alert';
        alertContainer.setAttribute('role', 'alert');
        alertContainer.setAttribute('aria-atomic', 'true');
        ariaContainer.appendChild(alertContainer);
        statusContainer = document.createElement('div');
        statusContainer.className = 'monaco-status';
        statusContainer.setAttribute('role', 'complementary');
        statusContainer.setAttribute('aria-live', 'polite');
        statusContainer.setAttribute('aria-atomic', 'true');
        ariaContainer.appendChild(statusContainer);
        parent.appendChild(ariaContainer);
    }
    exports.setARIAContainer = setARIAContainer;
    /**
     * Given the provided message, will make sure that it is read as alert to screen readers.
     */
    function alert(msg) {
        insertMessage(alertContainer, msg);
    }
    exports.alert = alert;
    /**
     * Given the provided message, will make sure that it is read as status to screen readers.
     */
    function status(msg) {
        if (platform_1.isMacintosh) {
            alert(msg); // VoiceOver does not seem to support status role
        }
        else {
            insertMessage(statusContainer, msg);
        }
    }
    exports.status = status;
    function insertMessage(target, msg) {
        if (!ariaContainer) {
            return;
        }
        dom.clearNode(target);
        if (msg.length > MAX_MESSAGE_LENGTH) {
            msg = msg.substr(0, MAX_MESSAGE_LENGTH);
        }
        target.textContent = msg;
        // See https://www.paciellogroup.com/blog/2012/06/html5-accessibility-chops-aria-rolealert-browser-support/
        target.style.visibility = 'hidden';
        target.style.visibility = 'visible';
    }
});
//# sourceMappingURL=aria.js.map