/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/severity", "vs/platform/instantiation/common/instantiation", "vs/base/common/event"], function (require, exports, severity_1, instantiation_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Severity = severity_1.default;
    exports.INotificationService = instantiation_1.createDecorator('notificationService');
    var NeverShowAgainScope;
    (function (NeverShowAgainScope) {
        /**
         * Will never show this notification on the current workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["WORKSPACE"] = 0] = "WORKSPACE";
        /**
         * Will never show this notification on any workspace again.
         */
        NeverShowAgainScope[NeverShowAgainScope["GLOBAL"] = 1] = "GLOBAL";
    })(NeverShowAgainScope = exports.NeverShowAgainScope || (exports.NeverShowAgainScope = {}));
    class NoOpNotification {
        constructor() {
            this.progress = new NoOpProgress();
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
        }
        updateSeverity(severity) { }
        updateMessage(message) { }
        updateActions(actions) { }
        close() {
            this._onDidClose.dispose();
        }
    }
    exports.NoOpNotification = NoOpNotification;
    class NoOpProgress {
        infinite() { }
        done() { }
        total(value) { }
        worked(value) { }
    }
    exports.NoOpProgress = NoOpProgress;
});
//# sourceMappingURL=notification.js.map