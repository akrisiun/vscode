/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/notification/common/notification", "vs/base/common/event"], function (require, exports, aria_1, nls_1, lifecycle_1, errorMessage_1, notification_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NotificationsAlerts extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            // Alert initial notifications if any
            model.notifications.forEach(n => this.triggerAriaAlert(n));
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidNotificationChange(e => this.onDidNotificationChange(e)));
        }
        onDidNotificationChange(e) {
            if (e.kind === 0 /* ADD */) {
                // ARIA alert for screen readers
                this.triggerAriaAlert(e.item);
                // Always log errors to console with full details
                if (e.item.severity === notification_1.Severity.Error) {
                    if (e.item.message.original instanceof Error) {
                        console.error(e.item.message.original);
                    }
                    else {
                        console.error(errorMessage_1.toErrorMessage(e.item.message.value, true));
                    }
                }
            }
        }
        triggerAriaAlert(notifiation) {
            // Trigger the alert again whenever the label changes
            const listener = notifiation.onDidLabelChange(e => {
                if (e.kind === 1 /* MESSAGE */) {
                    this.doTriggerAriaAlert(notifiation);
                }
            });
            event_1.Event.once(notifiation.onDidClose)(() => listener.dispose());
            this.doTriggerAriaAlert(notifiation);
        }
        doTriggerAriaAlert(notifiation) {
            let alertText;
            if (notifiation.severity === notification_1.Severity.Error) {
                alertText = nls_1.localize('alertErrorMessage', "Error: {0}", notifiation.message.value);
            }
            else if (notifiation.severity === notification_1.Severity.Warning) {
                alertText = nls_1.localize('alertWarningMessage', "Warning: {0}", notifiation.message.value);
            }
            else {
                alertText = nls_1.localize('alertInfoMessage', "Info: {0}", notifiation.message.value);
            }
            aria_1.alert(alertText);
        }
    }
    exports.NotificationsAlerts = NotificationsAlerts;
});
//# sourceMappingURL=notificationsAlerts.js.map