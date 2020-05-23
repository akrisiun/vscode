/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification"], function (require, exports, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Logger = exports.Translations = void 0;
    var Translations;
    (function (Translations) {
        function equals(a, b) {
            if (a === b) {
                return true;
            }
            let aKeys = Object.keys(a);
            let bKeys = new Set();
            for (let key of Object.keys(b)) {
                bKeys.add(key);
            }
            if (aKeys.length !== bKeys.size) {
                return false;
            }
            for (let key of aKeys) {
                if (a[key] !== b[key]) {
                    return false;
                }
                bKeys.delete(key);
            }
            return bKeys.size === 0;
        }
        Translations.equals = equals;
    })(Translations = exports.Translations || (exports.Translations = {}));
    class Logger {
        constructor(messageHandler) {
            this._messageHandler = messageHandler;
        }
        error(source, message) {
            this._messageHandler(notification_1.Severity.Error, source, message);
        }
        warn(source, message) {
            this._messageHandler(notification_1.Severity.Warning, source, message);
        }
        info(source, message) {
            this._messageHandler(notification_1.Severity.Info, source, message);
        }
    }
    exports.Logger = Logger;
});
//# sourceMappingURL=extensionPoints.js.map