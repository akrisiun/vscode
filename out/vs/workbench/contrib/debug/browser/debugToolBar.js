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
define(["require", "exports", "vs/base/common/errors", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/notification/common/notification", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/debugActions", "vs/base/common/lifecycle", "vs/css!./media/debugToolBar"], function (require, exports, errors, browser, dom, arrays, mouseEvent_1, actionbar_1, layoutService_1, debug_1, debugActionViewItems_1, configuration_1, storage_1, telemetry_1, theme_1, themeService_1, colorRegistry_1, nls_1, keybinding_1, contextView_1, notification_1, async_1, instantiation_1, menuEntryActionViewItem_1, actions_1, contextkey_1, debugActions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEBUG_TOOLBAR_POSITION_KEY = 'debug.actionswidgetposition';
    const DEBUG_TOOLBAR_Y_KEY = 'debug.actionswidgety';
    exports.debugToolBarBackground = colorRegistry_1.registerColor('debugToolBar.background', {
        dark: '#333333',
        light: '#F3F3F3',
        hc: '#000000'
    }, nls_1.localize('debugToolBarBackground', "Debug toolbar background color."));
    exports.debugToolBarBorder = colorRegistry_1.registerColor('debugToolBar.border', {
        dark: null,
        light: null,
        hc: null
    }, nls_1.localize('debugToolBarBorder', "Debug toolbar border color."));
    let DebugToolBar = class DebugToolBar extends theme_1.Themable {
        constructor(notificationService, telemetryService, debugService, layoutService, storageService, configurationService, themeService, keybindingService, instantiationService, menuService, contextMenuService, contextKeyService) {
            super(themeService);
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.debugService = debugService;
            this.layoutService = layoutService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.isVisible = false;
            this.isBuilt = false;
            this.$el = dom.$('div.debug-toolbar');
            this.$el.style.top = `${layoutService.getTitleBarOffset()}px`;
            this.dragArea = dom.append(this.$el, dom.$('div.drag-area'));
            const actionBarContainer = dom.append(this.$el, dom.$('div.action-bar-container'));
            this.debugToolBarMenu = menuService.createMenu(6 /* DebugToolBar */, contextKeyService);
            this._register(this.debugToolBarMenu);
            this.activeActions = [];
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer, {
                orientation: 0 /* HORIZONTAL */,
                actionViewItemProvider: (action) => {
                    if (action.id === debugActions_1.FocusSessionAction.ID) {
                        return this.instantiationService.createInstance(debugActionViewItems_1.FocusSessionActionViewItem, action);
                    }
                    if (action instanceof actions_1.MenuItemAction) {
                        return new menuEntryActionViewItem_1.MenuEntryActionViewItem(action, this.keybindingService, this.notificationService, contextMenuService);
                    }
                    return undefined;
                }
            }));
            this.updateScheduler = this._register(new async_1.RunOnceScheduler(() => {
                const state = this.debugService.state;
                const toolBarLocation = this.configurationService.getValue('debug').toolBarLocation;
                if (state === 0 /* Inactive */ || toolBarLocation === 'docked' || toolBarLocation === 'hidden') {
                    return this.hide();
                }
                const { actions, disposable } = DebugToolBar.getActions(this.debugToolBarMenu, this.debugService, this.instantiationService);
                if (!arrays.equals(actions, this.activeActions, (first, second) => first.id === second.id)) {
                    this.actionBar.clear();
                    this.actionBar.push(actions, { icon: true, label: false });
                    this.activeActions = actions;
                }
                if (this.disposeOnUpdate) {
                    lifecycle_1.dispose(this.disposeOnUpdate);
                }
                this.disposeOnUpdate = disposable;
                this.show();
            }, 20));
            this.updateStyles();
            this.registerListeners();
            this.hide();
        }
        registerListeners() {
            this._register(this.debugService.onDidChangeState(() => this.updateScheduler.schedule()));
            this._register(this.debugService.getViewModel().onDidFocusSession(() => this.updateScheduler.schedule()));
            this._register(this.debugService.onDidNewSession(() => this.updateScheduler.schedule()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onDidConfigurationChange(e)));
            this._register(this.actionBar.actionRunner.onDidRun((e) => {
                // check for error
                if (e.error && !errors.isPromiseCanceledError(e.error)) {
                    this.notificationService.error(e.error);
                }
                // log in telemetry
                if (this.telemetryService) {
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'debugActionsWidget' });
                }
            }));
            this._register(dom.addDisposableListener(window, dom.EventType.RESIZE, () => this.setCoordinates()));
            this._register(dom.addDisposableListener(this.dragArea, dom.EventType.MOUSE_UP, (event) => {
                const mouseClickEvent = new mouseEvent_1.StandardMouseEvent(event);
                if (mouseClickEvent.detail === 2) {
                    // double click on debug bar centers it again #8250
                    const widgetWidth = this.$el.clientWidth;
                    this.setCoordinates(0.5 * window.innerWidth - 0.5 * widgetWidth, 0);
                    this.storePosition();
                }
            }));
            this._register(dom.addDisposableListener(this.dragArea, dom.EventType.MOUSE_DOWN, (event) => {
                dom.addClass(this.dragArea, 'dragged');
                const mouseMoveListener = dom.addDisposableListener(window, 'mousemove', (e) => {
                    const mouseMoveEvent = new mouseEvent_1.StandardMouseEvent(e);
                    // Prevent default to stop editor selecting text #8524
                    mouseMoveEvent.preventDefault();
                    // Reduce x by width of drag handle to reduce jarring #16604
                    this.setCoordinates(mouseMoveEvent.posx - 14, mouseMoveEvent.posy - this.layoutService.getTitleBarOffset());
                });
                const mouseUpListener = dom.addDisposableListener(window, 'mouseup', (e) => {
                    this.storePosition();
                    dom.removeClass(this.dragArea, 'dragged');
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register(this.layoutService.onTitleBarVisibilityChange(() => this.setYCoordinate()));
            this._register(browser.onDidChangeZoomLevel(() => this.setYCoordinate()));
        }
        storePosition() {
            const left = dom.getComputedStyle(this.$el).left;
            if (left) {
                const position = parseFloat(left) / window.innerWidth;
                this.storageService.store(DEBUG_TOOLBAR_POSITION_KEY, position, 0 /* GLOBAL */);
            }
        }
        updateStyles() {
            super.updateStyles();
            if (this.$el) {
                this.$el.style.backgroundColor = this.getColor(exports.debugToolBarBackground);
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.$el.style.boxShadow = widgetShadowColor ? `0 5px 8px ${widgetShadowColor}` : null;
                const contrastBorderColor = this.getColor(colorRegistry_1.contrastBorder);
                const borderColor = this.getColor(exports.debugToolBarBorder);
                if (contrastBorderColor) {
                    this.$el.style.border = `1px solid ${contrastBorderColor}`;
                }
                else {
                    this.$el.style.border = borderColor ? `solid ${borderColor}` : 'none';
                    this.$el.style.border = '1px 0';
                }
            }
        }
        setYCoordinate(y = 0) {
            const titlebarOffset = this.layoutService.getTitleBarOffset();
            this.$el.style.top = `${titlebarOffset + y}px`;
        }
        setCoordinates(x, y) {
            if (!this.isVisible) {
                return;
            }
            const widgetWidth = this.$el.clientWidth;
            if (x === undefined) {
                const positionPercentage = this.storageService.get(DEBUG_TOOLBAR_POSITION_KEY, 0 /* GLOBAL */);
                x = positionPercentage !== undefined ? parseFloat(positionPercentage) * window.innerWidth : (0.5 * window.innerWidth - 0.5 * widgetWidth);
            }
            x = Math.max(0, Math.min(x, window.innerWidth - widgetWidth)); // do not allow the widget to overflow on the right
            this.$el.style.left = `${x}px`;
            if (y === undefined) {
                y = this.storageService.getNumber(DEBUG_TOOLBAR_Y_KEY, 0 /* GLOBAL */, 0);
            }
            const titleAreaHeight = 35;
            if ((y < titleAreaHeight / 2) || (y > titleAreaHeight + titleAreaHeight / 2)) {
                const moveToTop = y < titleAreaHeight;
                this.setYCoordinate(moveToTop ? 0 : titleAreaHeight);
                this.storageService.store(DEBUG_TOOLBAR_Y_KEY, moveToTop ? 0 : 2 * titleAreaHeight, 0 /* GLOBAL */);
            }
        }
        onDidConfigurationChange(event) {
            if (event.affectsConfiguration('debug.hideActionBar') || event.affectsConfiguration('debug.toolBarLocation')) {
                this.updateScheduler.schedule();
            }
        }
        show() {
            if (this.isVisible) {
                this.setCoordinates();
                return;
            }
            if (!this.isBuilt) {
                this.isBuilt = true;
                this.layoutService.getWorkbenchElement().appendChild(this.$el);
            }
            this.isVisible = true;
            dom.show(this.$el);
            this.setCoordinates();
        }
        hide() {
            this.isVisible = false;
            dom.hide(this.$el);
        }
        static getActions(menu, debugService, instantiationService) {
            const actions = [];
            const disposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, undefined, actions, () => false);
            if (debugService.getViewModel().isMultiSessionView()) {
                actions.push(instantiationService.createInstance(debugActions_1.FocusSessionAction, debugActions_1.FocusSessionAction.ID, debugActions_1.FocusSessionAction.LABEL));
            }
            return {
                actions: actions.filter(a => !(a instanceof actionbar_1.Separator)),
                disposable
            };
        }
        dispose() {
            super.dispose();
            if (this.$el) {
                this.$el.remove();
                delete this.$el;
            }
            if (this.disposeOnUpdate) {
                lifecycle_1.dispose(this.disposeOnUpdate);
            }
        }
    };
    DebugToolBar = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, debug_1.IDebugService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, actions_1.IMenuService),
        __param(10, contextView_1.IContextMenuService),
        __param(11, contextkey_1.IContextKeyService)
    ], DebugToolBar);
    exports.DebugToolBar = DebugToolBar;
});
//# sourceMappingURL=debugToolBar.js.map