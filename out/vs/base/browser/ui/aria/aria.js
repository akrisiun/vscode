/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/browser/dom", "vs/css!./aria"], function (require, exports, nls, platform_1, dom) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
        statusContainer.setAttribute('role', 'status');
        statusContainer.setAttribute('aria-atomic', 'true');
        ariaContainer.appendChild(statusContainer);
        parent.appendChild(ariaContainer);
    }
    exports.setARIAContainer = setARIAContainer;
    /**
     * Given the provided message, will make sure that it is read as alert to screen readers.
     */
    function alert(msg, disableRepeat) {
        insertMessage(alertContainer, msg, disableRepeat);
    }
    exports.alert = alert;
    /**
     * Given the provided message, will make sure that it is read as status to screen readers.
     */
    function status(msg, disableRepeat) {
        if (platform_1.isMacintosh) {
            alert(msg, disableRepeat); // VoiceOver does not seem to support status role
        }
        else {
            insertMessage(statusContainer, msg, disableRepeat);
        }
    }
    exports.status = status;
    let repeatedTimes = 0;
    let prevText = undefined;
    function insertMessage(target, msg, disableRepeat) {
        if (!ariaContainer) {
            return;
        }
        // If the same message should be inserted that is already present, a screen reader would
        // not announce this message because it matches the previous one. As a workaround, we
        // alter the message with the number of occurences unless this is explicitly disabled
        // via the disableRepeat flag.
        if (!disableRepeat) {
            if (prevText === msg) {
                repeatedTimes++;
            }
            else {
                prevText = msg;
                repeatedTimes = 0;
            }
            switch (repeatedTimes) {
                case 0: break;
                case 1:
                    msg = nls.localize('repeated', "{0} (occurred again)", msg);
                    break;
                default:
                    msg = nls.localize('repeatedNtimes', "{0} (occurred {1} times)", msg, repeatedTimes);
                    break;
            }
        }
        dom.clearNode(target);
        target.textContent = msg;
        // See https://www.paciellogroup.com/blog/2012/06/html5-accessibility-chops-aria-rolealert-browser-support/
        target.style.visibility = 'hidden';
        target.style.visibility = 'visible';
    }
});
//# sourceMappingURL=aria.js.map