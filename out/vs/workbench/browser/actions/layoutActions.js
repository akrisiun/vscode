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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/workbench/browser/contextkeys", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/editor", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/viewlet", "vs/platform/environment/common/environment", "vs/css!./media/actions"], function (require, exports, nls, platform_1, actions_1, actions_2, actions_3, configuration_1, layoutService_1, editorGroupsService_1, keyCodes_1, lifecycle_1, windows_1, platform_2, contextkeys_1, keybindingsRegistry_1, editor_1, contextkey_1, viewlet_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    const viewCategory = nls.localize('view', "View");
    // --- Toggle Activity Bar
    let ToggleActivityBarVisibilityAction = class ToggleActivityBarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService;
        }
        run() {
            const visibility = this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleActivityBarVisibilityAction.activityBarVisibleKey, newVisibilityValue, 1 /* USER */);
        }
    };
    ToggleActivityBarVisibilityAction.ID = 'workbench.action.toggleActivityBarVisibility';
    ToggleActivityBarVisibilityAction.LABEL = nls.localize('toggleActivityBar', "Toggle Activity Bar Visibility");
    ToggleActivityBarVisibilityAction.activityBarVisibleKey = 'workbench.activityBar.visible';
    ToggleActivityBarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleActivityBarVisibilityAction);
    exports.ToggleActivityBarVisibilityAction = ToggleActivityBarVisibilityAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleActivityBarVisibilityAction, ToggleActivityBarVisibilityAction.ID, ToggleActivityBarVisibilityAction.LABEL), 'View: Toggle Activity Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: ToggleActivityBarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowActivityBar', comment: ['&& denotes a mnemonic'] }, "Show &&Activity Bar"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.activityBar.visible', true)
        },
        order: 4
    });
    // --- Toggle Centered Layout
    let ToggleCenteredLayout = class ToggleCenteredLayout extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        run() {
            this.layoutService.centerEditorLayout(!this.layoutService.isEditorLayoutCentered());
            return Promise.resolve();
        }
    };
    ToggleCenteredLayout.ID = 'workbench.action.toggleCenteredLayout';
    ToggleCenteredLayout.LABEL = nls.localize('toggleCenteredLayout', "Toggle Centered Layout");
    ToggleCenteredLayout = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleCenteredLayout);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleCenteredLayout, ToggleCenteredLayout.ID, ToggleCenteredLayout.LABEL), 'View: Toggle Centered Layout', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '1_toggle_view',
        command: {
            id: ToggleCenteredLayout.ID,
            title: nls.localize('miToggleCenteredLayout', "Centered Layout"),
            toggled: editor_1.IsCenteredLayoutContext
        },
        order: 3
    });
    // --- Toggle Editor Layout
    let ToggleEditorLayoutAction = class ToggleEditorLayoutAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.class = 'codicon-editor-layout';
            this.updateEnablement();
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.add(this.editorGroupService.onDidAddGroup(() => this.updateEnablement()));
            this.toDispose.add(this.editorGroupService.onDidRemoveGroup(() => this.updateEnablement()));
        }
        updateEnablement() {
            this.enabled = this.editorGroupService.count > 1;
        }
        run() {
            const newOrientation = (this.editorGroupService.orientation === 1 /* VERTICAL */) ? 0 /* HORIZONTAL */ : 1 /* VERTICAL */;
            this.editorGroupService.setGroupOrientation(newOrientation);
            return Promise.resolve();
        }
    };
    ToggleEditorLayoutAction.ID = 'workbench.action.toggleEditorGroupLayout';
    ToggleEditorLayoutAction.LABEL = nls.localize('flipLayout', "Toggle Vertical/Horizontal Editor Layout");
    ToggleEditorLayoutAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ToggleEditorLayoutAction);
    exports.ToggleEditorLayoutAction = ToggleEditorLayoutAction;
    const group = viewCategory;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleEditorLayoutAction, ToggleEditorLayoutAction.ID, ToggleEditorLayoutAction.LABEL, { primary: 1024 /* Shift */ | 512 /* Alt */ | 21 /* KEY_0 */, mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 21 /* KEY_0 */ } }), 'View: Toggle Vertical/Horizontal Editor Layout', group);
    actions_2.MenuRegistry.appendMenuItem(18 /* MenubarLayoutMenu */, {
        group: 'z_flip',
        command: {
            id: ToggleEditorLayoutAction.ID,
            title: nls.localize({ key: 'miToggleEditorLayout', comment: ['&& denotes a mnemonic'] }, "Flip &&Layout")
        },
        order: 1
    });
    // --- Toggle Sidebar Position
    let ToggleSidebarPositionAction = class ToggleSidebarPositionAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService && !!this.configurationService;
        }
        run() {
            const position = this.layoutService.getSideBarPosition();
            const newPositionValue = (position === 0 /* LEFT */) ? 'right' : 'left';
            return this.configurationService.updateValue(ToggleSidebarPositionAction.sidebarPositionConfigurationKey, newPositionValue, 1 /* USER */);
        }
        static getLabel(layoutService) {
            return layoutService.getSideBarPosition() === 0 /* LEFT */ ? nls.localize('moveSidebarRight', "Move Side Bar Right") : nls.localize('moveSidebarLeft', "Move Side Bar Left");
        }
    };
    ToggleSidebarPositionAction.ID = 'workbench.action.toggleSidebarPosition';
    ToggleSidebarPositionAction.LABEL = nls.localize('toggleSidebarPosition', "Toggle Side Bar Position");
    ToggleSidebarPositionAction.sidebarPositionConfigurationKey = 'workbench.sideBar.location';
    ToggleSidebarPositionAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleSidebarPositionAction);
    exports.ToggleSidebarPositionAction = ToggleSidebarPositionAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleSidebarPositionAction, ToggleSidebarPositionAction.ID, ToggleSidebarPositionAction.LABEL), 'View: Toggle Side Bar Position', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: nls.localize({ key: 'miMoveSidebarRight', comment: ['&& denotes a mnemonic'] }, "&&Move Side Bar Right")
        },
        when: contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: nls.localize({ key: 'miMoveSidebarLeft', comment: ['&& denotes a mnemonic'] }, "&&Move Side Bar Left")
        },
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    // --- Toggle Sidebar Visibility
    let ToggleEditorVisibilityAction = class ToggleEditorVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        run() {
            this.layoutService.toggleMaximizedPanel();
            return Promise.resolve();
        }
    };
    ToggleEditorVisibilityAction.ID = 'workbench.action.toggleEditorVisibility';
    ToggleEditorVisibilityAction.LABEL = nls.localize('toggleEditor', "Toggle Editor Area");
    ToggleEditorVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleEditorVisibilityAction);
    exports.ToggleEditorVisibilityAction = ToggleEditorVisibilityAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleEditorVisibilityAction, ToggleEditorVisibilityAction.ID, ToggleEditorVisibilityAction.LABEL), 'View: Toggle Editor Area Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: ToggleEditorVisibilityAction.ID,
            title: nls.localize({ key: 'miShowEditorArea', comment: ['&& denotes a mnemonic'] }, "Show &&Editor Area"),
            toggled: editor_1.EditorAreaVisibleContext
        },
        order: 5
    });
    let ToggleSidebarVisibilityAction = class ToggleSidebarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        run() {
            const hideSidebar = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            this.layoutService.setSideBarHidden(hideSidebar);
            return Promise.resolve();
        }
    };
    ToggleSidebarVisibilityAction.ID = 'workbench.action.toggleSidebarVisibility';
    ToggleSidebarVisibilityAction.LABEL = nls.localize('toggleSidebar', "Toggle Side Bar Visibility");
    ToggleSidebarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleSidebarVisibilityAction);
    exports.ToggleSidebarVisibilityAction = ToggleSidebarVisibilityAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleSidebarVisibilityAction, ToggleSidebarVisibilityAction.ID, ToggleSidebarVisibilityAction.LABEL, { primary: 2048 /* CtrlCmd */ | 32 /* KEY_B */ }), 'View: Toggle Side Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '2_appearance',
        title: nls.localize({ key: 'miAppearance', comment: ['&& denotes a mnemonic'] }, "&&Appearance"),
        submenu: 12 /* MenubarAppearanceMenu */,
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: ToggleSidebarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowSidebar', comment: ['&& denotes a mnemonic'] }, "Show &&Side Bar"),
            toggled: viewlet_1.SideBarVisibleContext
        },
        order: 1
    });
    // --- Toggle Statusbar Visibility
    let ToggleStatusbarVisibilityAction = class ToggleStatusbarVisibilityAction extends actions_1.Action {
        constructor(id, label, layoutService, configurationService) {
            super(id, label);
            this.layoutService = layoutService;
            this.configurationService = configurationService;
            this.enabled = !!this.layoutService;
        }
        run() {
            const visibility = this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleStatusbarVisibilityAction.statusbarVisibleKey, newVisibilityValue, 1 /* USER */);
        }
    };
    ToggleStatusbarVisibilityAction.ID = 'workbench.action.toggleStatusbarVisibility';
    ToggleStatusbarVisibilityAction.LABEL = nls.localize('toggleStatusbar', "Toggle Status Bar Visibility");
    ToggleStatusbarVisibilityAction.statusbarVisibleKey = 'workbench.statusBar.visible';
    ToggleStatusbarVisibilityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, configuration_1.IConfigurationService)
    ], ToggleStatusbarVisibilityAction);
    exports.ToggleStatusbarVisibilityAction = ToggleStatusbarVisibilityAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleStatusbarVisibilityAction, ToggleStatusbarVisibilityAction.ID, ToggleStatusbarVisibilityAction.LABEL), 'View: Toggle Status Bar Visibility', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: ToggleStatusbarVisibilityAction.ID,
            title: nls.localize({ key: 'miShowStatusbar', comment: ['&& denotes a mnemonic'] }, "Show S&&tatus Bar"),
            toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true)
        },
        order: 3
    });
    // --- Toggle Tabs Visibility
    let ToggleTabsVisibilityAction = class ToggleTabsVisibilityAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const visibility = this.configurationService.getValue(ToggleTabsVisibilityAction.tabsVisibleKey);
            const newVisibilityValue = !visibility;
            return this.configurationService.updateValue(ToggleTabsVisibilityAction.tabsVisibleKey, newVisibilityValue);
        }
    };
    ToggleTabsVisibilityAction.ID = 'workbench.action.toggleTabsVisibility';
    ToggleTabsVisibilityAction.LABEL = nls.localize('toggleTabs', "Toggle Tab Visibility");
    ToggleTabsVisibilityAction.tabsVisibleKey = 'workbench.editor.showTabs';
    ToggleTabsVisibilityAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleTabsVisibilityAction);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleTabsVisibilityAction, ToggleTabsVisibilityAction.ID, ToggleTabsVisibilityAction.LABEL, {
        primary: undefined,
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 53 /* KEY_W */, },
        linux: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 53 /* KEY_W */, }
    }), 'View: Toggle Tab Visibility', viewCategory);
    // --- Toggle Zen Mode
    let ToggleZenMode = class ToggleZenMode extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
            this.enabled = !!this.layoutService;
        }
        run() {
            this.layoutService.toggleZenMode();
            return Promise.resolve();
        }
    };
    ToggleZenMode.ID = 'workbench.action.toggleZenMode';
    ToggleZenMode.LABEL = nls.localize('toggleZenMode', "Toggle Zen Mode");
    ToggleZenMode = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleZenMode);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleZenMode, ToggleZenMode.ID, ToggleZenMode.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 56 /* KEY_Z */) }), 'View: Toggle Zen Mode', viewCategory);
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '1_toggle_view',
        command: {
            id: ToggleZenMode.ID,
            title: nls.localize('miToggleZenMode', "Zen Mode"),
            toggled: editor_1.InEditorZenModeContext
        },
        order: 2
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.exitZenMode',
        weight: 100 /* EditorContrib */ - 1000,
        handler(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.toggleZenMode();
        },
        when: editor_1.InEditorZenModeContext,
        primary: keyCodes_1.KeyChord(9 /* Escape */, 9 /* Escape */)
    });
    // --- Toggle Menu Bar
    let ToggleMenuBarAction = class ToggleMenuBarAction extends actions_1.Action {
        constructor(id, label, configurationService, environmentService) {
            super(id, label);
            this.configurationService = configurationService;
            this.environmentService = environmentService;
        }
        run() {
            let currentVisibilityValue = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
            if (typeof currentVisibilityValue !== 'string') {
                currentVisibilityValue = 'default';
            }
            let newVisibilityValue;
            if (currentVisibilityValue === 'visible' || currentVisibilityValue === 'default') {
                newVisibilityValue = 'toggle';
            }
            else if (currentVisibilityValue === 'compact') {
                newVisibilityValue = 'hidden';
            }
            else {
                newVisibilityValue = (platform_2.isWeb && currentVisibilityValue === 'hidden') ? 'compact' : 'default';
            }
            this.configurationService.updateValue(ToggleMenuBarAction.menuBarVisibilityKey, newVisibilityValue, 1 /* USER */);
            return Promise.resolve();
        }
    };
    ToggleMenuBarAction.ID = 'workbench.action.toggleMenuBar';
    ToggleMenuBarAction.LABEL = nls.localize('toggleMenuBar', "Toggle Menu Bar");
    ToggleMenuBarAction.menuBarVisibilityKey = 'window.menuBarVisibility';
    ToggleMenuBarAction = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, environment_1.IEnvironmentService)
    ], ToggleMenuBarAction);
    exports.ToggleMenuBarAction = ToggleMenuBarAction;
    if (platform_2.isWindows || platform_2.isLinux || platform_2.isWeb) {
        registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleMenuBarAction, ToggleMenuBarAction.ID, ToggleMenuBarAction.LABEL), 'View: Toggle Menu Bar', viewCategory);
    }
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: ToggleMenuBarAction.ID,
            title: nls.localize({ key: 'miShowMenuBar', comment: ['&& denotes a mnemonic'] }, "Show Menu &&Bar"),
            toggled: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'))
        },
        when: contextkeys_1.IsMacNativeContext.toNegated(),
        order: 0
    });
    // --- Resize View
    let BaseResizeViewAction = class BaseResizeViewAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        resizePart(sizeChange) {
            const isEditorFocus = this.layoutService.hasFocus("workbench.parts.editor" /* EDITOR_PART */);
            const isSidebarFocus = this.layoutService.hasFocus("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const isPanelFocus = this.layoutService.hasFocus("workbench.parts.panel" /* PANEL_PART */);
            let part;
            if (isSidebarFocus) {
                part = "workbench.parts.sidebar" /* SIDEBAR_PART */;
            }
            else if (isPanelFocus) {
                part = "workbench.parts.panel" /* PANEL_PART */;
            }
            else if (isEditorFocus) {
                part = "workbench.parts.editor" /* EDITOR_PART */;
            }
            if (part) {
                this.layoutService.resizePart(part, sizeChange);
            }
        }
    };
    BaseResizeViewAction.RESIZE_INCREMENT = 6.5; // This is a media-size percentage
    BaseResizeViewAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], BaseResizeViewAction);
    exports.BaseResizeViewAction = BaseResizeViewAction;
    let IncreaseViewSizeAction = class IncreaseViewSizeAction extends BaseResizeViewAction {
        constructor(id, label, layoutService) {
            super(id, label, layoutService);
        }
        run() {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT);
            return Promise.resolve(true);
        }
    };
    IncreaseViewSizeAction.ID = 'workbench.action.increaseViewSize';
    IncreaseViewSizeAction.LABEL = nls.localize('increaseViewSize', "Increase Current View Size");
    IncreaseViewSizeAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], IncreaseViewSizeAction);
    exports.IncreaseViewSizeAction = IncreaseViewSizeAction;
    let DecreaseViewSizeAction = class DecreaseViewSizeAction extends BaseResizeViewAction {
        constructor(id, label, layoutService) {
            super(id, label, layoutService);
        }
        run() {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT);
            return Promise.resolve(true);
        }
    };
    DecreaseViewSizeAction.ID = 'workbench.action.decreaseViewSize';
    DecreaseViewSizeAction.LABEL = nls.localize('decreaseViewSize', "Decrease Current View Size");
    DecreaseViewSizeAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], DecreaseViewSizeAction);
    exports.DecreaseViewSizeAction = DecreaseViewSizeAction;
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(IncreaseViewSizeAction, IncreaseViewSizeAction.ID, IncreaseViewSizeAction.LABEL, undefined), 'View: Increase Current View Size', viewCategory);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(DecreaseViewSizeAction, DecreaseViewSizeAction.ID, DecreaseViewSizeAction.LABEL, undefined), 'View: Decrease Current View Size', viewCategory);
});
//# sourceMappingURL=layoutActions.js.map