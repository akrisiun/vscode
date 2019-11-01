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
define(["require", "exports", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/event", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/workbench/browser/parts/notifications/notificationsList", "vs/platform/instantiation/common/instantiation", "vs/base/browser/dom", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/notifications/notificationsActions", "vs/platform/keybinding/common/keybinding", "vs/css!./media/notificationsCenter", "vs/css!./media/notificationsActions"], function (require, exports, theme_1, themeService_1, layoutService_1, event_1, contextkey_1, notificationsCommands_1, notificationsList_1, instantiation_1, dom_1, colorRegistry_1, editorGroupsService_1, nls_1, actionbar_1, notificationsActions_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotificationsCenter = class NotificationsCenter extends theme_1.Themable {
        constructor(container, model, themeService, instantiationService, layoutService, contextKeyService, editorGroupService, keybindingService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.keybindingService = keybindingService;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.notificationsCenterVisibleContextKey = notificationsCommands_1.NotificationsCenterVisibleContext.bindTo(contextKeyService);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidNotificationChange(e => this.onDidNotificationChange(e)));
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
        }
        get isVisible() {
            return this._isVisible;
        }
        show() {
            if (this._isVisible) {
                this.notificationsList.show(true /* focus */);
                return; // already visible
            }
            // Lazily create if showing for the first time
            if (!this.notificationsCenterContainer) {
                this.create();
            }
            // Title
            this.updateTitle();
            // Make visible
            this._isVisible = true;
            dom_1.addClass(this.notificationsCenterContainer, 'visible');
            this.notificationsList.show();
            // Layout
            this.layout(this.workbenchDimensions);
            // Show all notifications that are present now
            this.notificationsList.updateNotificationsList(0, 0, this.model.notifications);
            // Focus first
            this.notificationsList.focusFirst();
            // Theming
            this.updateStyles();
            // Context Key
            this.notificationsCenterVisibleContextKey.set(true);
            // Event
            this._onDidChangeVisibility.fire();
        }
        updateTitle() {
            if (this.model.notifications.length === 0) {
                this.notificationsCenterTitle.textContent = nls_1.localize('notificationsEmpty', "No new notifications");
            }
            else {
                this.notificationsCenterTitle.textContent = nls_1.localize('notifications', "Notifications");
            }
        }
        create() {
            // Container
            this.notificationsCenterContainer = document.createElement('div');
            dom_1.addClass(this.notificationsCenterContainer, 'notifications-center');
            // Header
            this.notificationsCenterHeader = document.createElement('div');
            dom_1.addClass(this.notificationsCenterHeader, 'notifications-center-header');
            this.notificationsCenterContainer.appendChild(this.notificationsCenterHeader);
            // Header Title
            this.notificationsCenterTitle = document.createElement('span');
            dom_1.addClass(this.notificationsCenterTitle, 'notifications-center-header-title');
            this.notificationsCenterHeader.appendChild(this.notificationsCenterTitle);
            // Header Toolbar
            const toolbarContainer = document.createElement('div');
            dom_1.addClass(toolbarContainer, 'notifications-center-header-toolbar');
            this.notificationsCenterHeader.appendChild(toolbarContainer);
            const actionRunner = this._register(this.instantiationService.createInstance(notificationsActions_1.NotificationActionRunner));
            const notificationsToolBar = this._register(new actionbar_1.ActionBar(toolbarContainer, {
                ariaLabel: nls_1.localize('notificationsToolbar', "Notification Center Actions"),
                actionRunner
            }));
            const hideAllAction = this._register(this.instantiationService.createInstance(notificationsActions_1.HideNotificationsCenterAction, notificationsActions_1.HideNotificationsCenterAction.ID, notificationsActions_1.HideNotificationsCenterAction.LABEL));
            notificationsToolBar.push(hideAllAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(hideAllAction) });
            const clearAllAction = this._register(this.instantiationService.createInstance(notificationsActions_1.ClearAllNotificationsAction, notificationsActions_1.ClearAllNotificationsAction.ID, notificationsActions_1.ClearAllNotificationsAction.LABEL));
            notificationsToolBar.push(clearAllAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(clearAllAction) });
            // Notifications List
            this.notificationsList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, this.notificationsCenterContainer, {
                ariaLabel: nls_1.localize('notificationsList', "Notifications List")
            });
            this.container.appendChild(this.notificationsCenterContainer);
        }
        getKeybindingLabel(action) {
            const keybinding = this.keybindingService.lookupKeybinding(action.id);
            return keybinding ? keybinding.getLabel() : null;
        }
        onDidNotificationChange(e) {
            if (!this._isVisible) {
                return; // only if visible
            }
            let focusGroup = false;
            // Update notifications list based on event
            switch (e.kind) {
                case 0 /* ADD */:
                    this.notificationsList.updateNotificationsList(e.index, 0, [e.item]);
                    break;
                case 1 /* CHANGE */:
                    this.notificationsList.updateNotificationsList(e.index, 1, [e.item]);
                    break;
                case 2 /* REMOVE */:
                    focusGroup = dom_1.isAncestor(document.activeElement, this.notificationsCenterContainer);
                    this.notificationsList.updateNotificationsList(e.index, 1);
                    break;
            }
            // Update title
            this.updateTitle();
            // Hide if no more notifications to show
            if (this.model.notifications.length === 0) {
                this.hide();
                // Restore focus to editor group if we had focus
                if (focusGroup) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        hide() {
            if (!this._isVisible || !this.notificationsCenterContainer) {
                return; // already hidden
            }
            const focusGroup = dom_1.isAncestor(document.activeElement, this.notificationsCenterContainer);
            // Hide
            this._isVisible = false;
            dom_1.removeClass(this.notificationsCenterContainer, 'visible');
            this.notificationsList.hide();
            // Context Key
            this.notificationsCenterVisibleContextKey.set(false);
            // Event
            this._onDidChangeVisibility.fire();
            // Restore focus to editor group if we had focus
            if (focusGroup) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        updateStyles() {
            if (this.notificationsCenterContainer) {
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.notificationsCenterContainer.style.boxShadow = widgetShadowColor ? `0 0px 8px ${widgetShadowColor}` : null;
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_CENTER_BORDER);
                this.notificationsCenterContainer.style.border = borderColor ? `1px solid ${borderColor}` : null;
                const headerForeground = this.getColor(theme_1.NOTIFICATIONS_CENTER_HEADER_FOREGROUND);
                this.notificationsCenterHeader.style.color = headerForeground ? headerForeground.toString() : null;
                const headerBackground = this.getColor(theme_1.NOTIFICATIONS_CENTER_HEADER_BACKGROUND);
                this.notificationsCenterHeader.style.background = headerBackground ? headerBackground.toString() : null;
            }
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            if (this._isVisible && this.notificationsCenterContainer) {
                let maxWidth = NotificationsCenter.MAX_DIMENSIONS.width;
                let maxHeight = NotificationsCenter.MAX_DIMENSIONS.height;
                let availableWidth = maxWidth;
                let availableHeight = maxHeight;
                if (this.workbenchDimensions) {
                    // Make sure notifications are not exceding available width
                    availableWidth = this.workbenchDimensions.width;
                    availableWidth -= (2 * 8); // adjust for paddings left and right
                    // Make sure notifications are not exceeding available height
                    availableHeight = this.workbenchDimensions.height - 35 /* header */;
                    if (this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */)) {
                        availableHeight -= 22; // adjust for status bar
                    }
                    if (this.layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                        availableHeight -= 22; // adjust for title bar
                    }
                    availableHeight -= (2 * 12); // adjust for paddings top and bottom
                }
                // Apply to list
                this.notificationsList.layout(Math.min(maxWidth, availableWidth), Math.min(maxHeight, availableHeight));
            }
        }
        clearAll() {
            // Hide notifications center first
            this.hide();
            // Close all
            while (this.model.notifications.length) {
                this.model.notifications[0].close();
            }
        }
    };
    NotificationsCenter.MAX_DIMENSIONS = new dom_1.Dimension(450, 400);
    NotificationsCenter = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, keybinding_1.IKeybindingService)
    ], NotificationsCenter);
    exports.NotificationsCenter = NotificationsCenter;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const notificationBorderColor = theme.getColor(theme_1.NOTIFICATIONS_BORDER);
        if (notificationBorderColor) {
            collector.addRule(`.monaco-workbench > .notifications-center .notifications-list-container .monaco-list-row[data-last-element="false"] > .notification-list-item { border-bottom: 1px solid ${notificationBorderColor}; }`);
        }
    });
});
//# sourceMappingURL=notificationsCenter.js.map