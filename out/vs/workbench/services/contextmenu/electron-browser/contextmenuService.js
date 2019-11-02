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
define(["require", "exports", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "electron", "vs/base/common/labels", "vs/base/common/event", "vs/platform/notification/common/notification", "vs/base/browser/contextmenu", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/parts/contextmenu/electron-browser/contextmenu", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/contextview/browser/contextMenuService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/extensions"], function (require, exports, actions_1, actionbar_1, dom, contextView_1, telemetry_1, keybinding_1, electron_1, labels_1, event_1, notification_1, contextmenu_1, functional_1, lifecycle_1, contextmenu_2, windows_1, platform_1, configuration_1, environment_1, contextMenuService_1, themeService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService, configurationService, environmentService, contextViewService, themeService) {
            super();
            // Custom context menu: Linux/Windows if custom title is enabled
            if (!platform_1.isMacintosh && windows_1.getTitleBarStyle(configurationService, environmentService) === 'custom') {
                this.impl = new contextMenuService_1.ContextMenuService(telemetryService, notificationService, contextViewService, keybindingService, themeService);
            }
            // Native context menu: otherwise
            else {
                this.impl = new NativeContextMenuService(notificationService, telemetryService, keybindingService);
            }
        }
        get onDidContextMenu() { return this.impl.onDidContextMenu; }
        showContextMenu(delegate) {
            this.impl.showContextMenu(delegate);
        }
    };
    ContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, contextView_1.IContextViewService),
        __param(6, themeService_1.IThemeService)
    ], ContextMenuService);
    exports.ContextMenuService = ContextMenuService;
    let NativeContextMenuService = class NativeContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService) {
            super();
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.keybindingService = keybindingService;
            this._onDidContextMenu = this._register(new event_1.Emitter());
            this.onDidContextMenu = this._onDidContextMenu.event;
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (actions.length) {
                const onHide = functional_1.once(() => {
                    if (delegate.onHide) {
                        delegate.onHide(false);
                    }
                    this._onDidContextMenu.fire();
                });
                const menu = this.createMenu(delegate, actions, onHide);
                const anchor = delegate.getAnchor();
                let x, y;
                if (dom.isHTMLElement(anchor)) {
                    let elementPosition = dom.getDomNodePagePosition(anchor);
                    x = elementPosition.left;
                    y = elementPosition.top + elementPosition.height;
                }
                else {
                    const pos = anchor;
                    x = pos.x + 1; /* prevent first item from being selected automatically under mouse */
                    y = pos.y;
                }
                let zoom = electron_1.webFrame.getZoomFactor();
                x *= zoom;
                y *= zoom;
                contextmenu_2.popup(menu, {
                    x: Math.floor(x),
                    y: Math.floor(y),
                    positioningItem: delegate.autoSelectFirstItem ? 0 : undefined,
                    onHide: () => onHide()
                });
            }
        }
        createMenu(delegate, entries, onHide) {
            const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
            return entries.map(entry => this.createMenuItem(delegate, entry, actionRunner, onHide));
        }
        createMenuItem(delegate, entry, actionRunner, onHide) {
            // Separator
            if (entry instanceof actionbar_1.Separator) {
                return { type: 'separator' };
            }
            // Submenu
            if (entry instanceof contextmenu_1.ContextSubMenu) {
                return {
                    label: labels_1.unmnemonicLabel(entry.label),
                    submenu: this.createMenu(delegate, entry.entries, onHide)
                };
            }
            // Normal Menu Item
            else {
                let type = undefined;
                if (!!entry.checked) {
                    if (typeof delegate.getCheckedActionsRepresentation === 'function') {
                        type = delegate.getCheckedActionsRepresentation(entry);
                    }
                    else {
                        type = 'checkbox';
                    }
                }
                const item = {
                    label: labels_1.unmnemonicLabel(entry.label),
                    checked: !!entry.checked,
                    type,
                    enabled: !!entry.enabled,
                    click: event => {
                        // To preserve pre-electron-2.x behaviour, we first trigger
                        // the onHide callback and then the action.
                        // Fixes https://github.com/Microsoft/vscode/issues/45601
                        onHide();
                        // Run action which will close the menu
                        this.runAction(actionRunner, entry, delegate, event);
                    }
                };
                const keybinding = !!delegate.getKeyBinding ? delegate.getKeyBinding(entry) : this.keybindingService.lookupKeybinding(entry.id);
                if (keybinding) {
                    const electronAccelerator = keybinding.getElectronAccelerator();
                    if (electronAccelerator) {
                        item.accelerator = electronAccelerator;
                    }
                    else {
                        const label = keybinding.getLabel();
                        if (label) {
                            item.label = `${item.label} [${label}]`;
                        }
                    }
                }
                return item;
            }
        }
        async runAction(actionRunner, actionToRun, delegate, event) {
            this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionToRun.id, from: 'contextMenu' });
            const context = delegate.getActionsContext ? delegate.getActionsContext(event) : event;
            const runnable = actionRunner.run(actionToRun, context);
            if (runnable) {
                try {
                    await runnable;
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            }
        }
    };
    NativeContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService)
    ], NativeContextMenuService);
    extensions_1.registerSingleton(contextView_1.IContextMenuService, ContextMenuService, true);
});
//# sourceMappingURL=contextmenuService.js.map