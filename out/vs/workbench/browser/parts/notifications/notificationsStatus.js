/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/workbench/services/statusbar/common/statusbar", "vs/base/common/lifecycle", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/nls"], function (require, exports, statusbar_1, lifecycle_1, notificationsCommands_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotificationsStatus = class NotificationsStatus extends lifecycle_1.Disposable {
        constructor(model, statusbarService) {
            super();
            this.model = model;
            this.statusbarService = statusbarService;
            this.currentNotifications = new Set();
            this.updateNotificationsCenterStatusItem();
            if (model.statusMessage) {
                this.doSetStatusMessage(model.statusMessage);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidNotificationChange(e => this.onDidNotificationChange(e)));
            this._register(this.model.onDidStatusMessageChange(e => this.onDidStatusMessageChange(e)));
        }
        onDidNotificationChange(e) {
            if (this.isNotificationsCenterVisible) {
                return; // no change if notification center is visible
            }
            // Notification got Added
            if (e.kind === 0 /* ADD */) {
                this.currentNotifications.add(e.item);
            }
            // Notification got Removed
            else if (e.kind === 2 /* REMOVE */) {
                this.currentNotifications.delete(e.item);
            }
            this.updateNotificationsCenterStatusItem();
        }
        updateNotificationsCenterStatusItem() {
            const statusProperties = {
                text: this.currentNotifications.size === 0 ? '$(bell)' : `$(bell) ${this.currentNotifications.size}`,
                command: this.isNotificationsCenterVisible ? notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER : notificationsCommands_1.SHOW_NOTIFICATIONS_CENTER,
                tooltip: this.getTooltip(),
                showBeak: this.isNotificationsCenterVisible
            };
            if (!this.notificationsCenterStatusItem) {
                this.notificationsCenterStatusItem = this.statusbarService.addEntry(statusProperties, 'status.notifications', nls_1.localize('status.notifications', "Notifications"), 1 /* RIGHT */, -Number.MAX_VALUE /* towards the far end of the right hand side */);
            }
            else {
                this.notificationsCenterStatusItem.update(statusProperties);
            }
        }
        getTooltip() {
            if (this.isNotificationsCenterVisible) {
                return nls_1.localize('hideNotifications', "Hide Notifications");
            }
            if (this.model.notifications.length === 0) {
                return nls_1.localize('zeroNotifications', "No Notifications");
            }
            if (this.currentNotifications.size === 0) {
                return nls_1.localize('noNotifications', "No New Notifications");
            }
            if (this.currentNotifications.size === 1) {
                return nls_1.localize('oneNotification', "1 New Notification");
            }
            return nls_1.localize('notifications', "{0} New Notifications", this.currentNotifications.size);
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Showing the notification center resets the counter to 0
                this.currentNotifications.clear();
                this.updateNotificationsCenterStatusItem();
            }
        }
        onDidStatusMessageChange(e) {
            const statusItem = e.item;
            switch (e.kind) {
                // Show status notification
                case 0 /* ADD */:
                    this.doSetStatusMessage(statusItem);
                    break;
                // Hide status notification (if its still the current one)
                case 1 /* REMOVE */:
                    if (this.currentStatusMessage && this.currentStatusMessage[0] === statusItem) {
                        lifecycle_1.dispose(this.currentStatusMessage[1]);
                        this.currentStatusMessage = undefined;
                    }
                    break;
            }
        }
        doSetStatusMessage(item) {
            const message = item.message;
            const showAfter = item.options && typeof item.options.showAfter === 'number' ? item.options.showAfter : 0;
            const hideAfter = item.options && typeof item.options.hideAfter === 'number' ? item.options.hideAfter : -1;
            // Dismiss any previous
            if (this.currentStatusMessage) {
                lifecycle_1.dispose(this.currentStatusMessage[1]);
            }
            // Create new
            let statusMessageEntry;
            let showHandle = setTimeout(() => {
                statusMessageEntry = this.statusbarService.addEntry({ text: message }, 'status.message', nls_1.localize('status.message', "Status Message"), 0 /* LEFT */, -Number.MAX_VALUE /* far right on left hand side */);
                showHandle = null;
            }, showAfter);
            // Dispose function takes care of timeouts and actual entry
            let hideHandle;
            const statusMessageDispose = {
                dispose: () => {
                    if (showHandle) {
                        clearTimeout(showHandle);
                    }
                    if (hideHandle) {
                        clearTimeout(hideHandle);
                    }
                    if (statusMessageEntry) {
                        statusMessageEntry.dispose();
                    }
                }
            };
            if (hideAfter > 0) {
                hideHandle = setTimeout(() => statusMessageDispose.dispose(), hideAfter);
            }
            // Remember as current status message
            this.currentStatusMessage = [item, statusMessageDispose];
        }
    };
    NotificationsStatus = __decorate([
        __param(1, statusbar_1.IStatusbarService)
    ], NotificationsStatus);
    exports.NotificationsStatus = NotificationsStatus;
});
//# sourceMappingURL=notificationsStatus.js.map