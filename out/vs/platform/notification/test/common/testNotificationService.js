/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/notification/common/notification", "vs/base/common/lifecycle"], function (require, exports, notification_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestNotificationService {
        info(message) {
            return this.notify({ severity: notification_1.Severity.Info, message });
        }
        warn(message) {
            return this.notify({ severity: notification_1.Severity.Warning, message });
        }
        error(error) {
            return this.notify({ severity: notification_1.Severity.Error, message: error });
        }
        notify(notification) {
            return TestNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return TestNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter(filter) { }
    }
    exports.TestNotificationService = TestNotificationService;
    TestNotificationService.NO_OP = new notification_1.NoOpNotification();
});
//# sourceMappingURL=testNotificationService.js.map