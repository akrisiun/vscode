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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/panel", "vs/css!./media/panelpart"], function (require, exports, nls, lifecycle_1, actions_1, platform_1, actions_2, actions_3, panelService_1, layoutService_1, compositeBarActions_1, editorGroupsService_1, panel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ClosePanelAction = class ClosePanelAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, 'codicon-close');
            this.layoutService = layoutService;
        }
        run() {
            this.layoutService.setPanelHidden(true);
            return Promise.resolve();
        }
    };
    ClosePanelAction.ID = 'workbench.action.closePanel';
    ClosePanelAction.LABEL = nls.localize('closePanel', "Close Panel");
    ClosePanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ClosePanelAction);
    exports.ClosePanelAction = ClosePanelAction;
    let TogglePanelAction = class TogglePanelAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */) ? 'panel expanded' : 'panel');
            this.layoutService = layoutService;
        }
        run() {
            this.layoutService.setPanelHidden(this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */));
            return Promise.resolve();
        }
    };
    TogglePanelAction.ID = 'workbench.action.togglePanel';
    TogglePanelAction.LABEL = nls.localize('togglePanel', "Toggle Panel");
    TogglePanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], TogglePanelAction);
    exports.TogglePanelAction = TogglePanelAction;
    let FocusPanelAction = class FocusPanelAction extends actions_1.Action {
        constructor(id, label, panelService, layoutService) {
            super(id, label);
            this.panelService = panelService;
            this.layoutService = layoutService;
        }
        run() {
            // Show panel
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(false);
                return Promise.resolve();
            }
            // Focus into active panel
            let panel = this.panelService.getActivePanel();
            if (panel) {
                panel.focus();
            }
            return Promise.resolve();
        }
    };
    FocusPanelAction.ID = 'workbench.action.focusPanel';
    FocusPanelAction.LABEL = nls.localize('focusPanel', "Focus into Panel");
    FocusPanelAction = __decorate([
        __param(2, panelService_1.IPanelService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], FocusPanelAction);
    let TogglePanelPositionAction = class TogglePanelPositionAction extends actions_1.Action {
        constructor(id, label, layoutService, editorGroupsService) {
            super(id, label, layoutService.getPanelPosition() === 1 /* RIGHT */ ? 'move-panel-to-bottom' : 'move-panel-to-right');
            this.layoutService = layoutService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            const setClassAndLabel = () => {
                const positionRight = this.layoutService.getPanelPosition() === 1 /* RIGHT */;
                this.class = positionRight ? 'move-panel-to-bottom' : 'move-panel-to-right';
                this.label = positionRight ? TogglePanelPositionAction.MOVE_TO_BOTTOM_LABEL : TogglePanelPositionAction.MOVE_TO_RIGHT_LABEL;
            };
            this.toDispose.add(editorGroupsService.onDidLayout(() => setClassAndLabel()));
            setClassAndLabel();
        }
        run() {
            const position = this.layoutService.getPanelPosition();
            this.layoutService.setPanelPosition(position === 2 /* BOTTOM */ ? 1 /* RIGHT */ : 2 /* BOTTOM */);
            return Promise.resolve();
        }
    };
    TogglePanelPositionAction.ID = 'workbench.action.togglePanelPosition';
    TogglePanelPositionAction.LABEL = nls.localize('toggledPanelPosition', "Toggle Panel Position");
    TogglePanelPositionAction.MOVE_TO_RIGHT_LABEL = nls.localize('moveToRight', "Move Panel Right");
    TogglePanelPositionAction.MOVE_TO_BOTTOM_LABEL = nls.localize('moveToBottom', "Move Panel to Bottom");
    TogglePanelPositionAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], TogglePanelPositionAction);
    exports.TogglePanelPositionAction = TogglePanelPositionAction;
    let ToggleMaximizedPanelAction = class ToggleMaximizedPanelAction extends actions_1.Action {
        constructor(id, label, layoutService, editorGroupsService) {
            super(id, label, layoutService.isPanelMaximized() ? 'codicon-chevron-down' : 'codicon-chevron-up');
            this.layoutService = layoutService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.toDispose.add(editorGroupsService.onDidLayout(() => {
                const maximized = this.layoutService.isPanelMaximized();
                this.class = maximized ? 'codicon-chevron-down' : 'codicon-chevron-up';
                this.label = maximized ? ToggleMaximizedPanelAction.RESTORE_LABEL : ToggleMaximizedPanelAction.MAXIMIZE_LABEL;
            }));
        }
        run() {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(false);
            }
            this.layoutService.toggleMaximizedPanel();
            return Promise.resolve();
        }
    };
    ToggleMaximizedPanelAction.ID = 'workbench.action.toggleMaximizedPanel';
    ToggleMaximizedPanelAction.LABEL = nls.localize('toggleMaximizedPanel', "Toggle Maximized Panel");
    ToggleMaximizedPanelAction.MAXIMIZE_LABEL = nls.localize('maximizePanel', "Maximize Panel Size");
    ToggleMaximizedPanelAction.RESTORE_LABEL = nls.localize('minimizePanel', "Restore Panel Size");
    ToggleMaximizedPanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], ToggleMaximizedPanelAction);
    exports.ToggleMaximizedPanelAction = ToggleMaximizedPanelAction;
    let PanelActivityAction = class PanelActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, panelService) {
            super(activity);
            this.panelService = panelService;
        }
        run(event) {
            this.panelService.openPanel(this.activity.id, true);
            this.activate();
            return Promise.resolve();
        }
    };
    PanelActivityAction = __decorate([
        __param(1, panelService_1.IPanelService)
    ], PanelActivityAction);
    exports.PanelActivityAction = PanelActivityAction;
    let SwitchPanelViewAction = class SwitchPanelViewAction extends actions_1.Action {
        constructor(id, name, panelService) {
            super(id, name);
            this.panelService = panelService;
        }
        run(offset) {
            const pinnedPanels = this.panelService.getPinnedPanels();
            const activePanel = this.panelService.getActivePanel();
            if (!activePanel) {
                return Promise.resolve();
            }
            let targetPanelId;
            for (let i = 0; i < pinnedPanels.length; i++) {
                if (pinnedPanels[i].id === activePanel.getId()) {
                    targetPanelId = pinnedPanels[(i + pinnedPanels.length + offset) % pinnedPanels.length].id;
                    break;
                }
            }
            if (typeof targetPanelId === 'string') {
                this.panelService.openPanel(targetPanelId, true);
            }
            return Promise.resolve();
        }
    };
    SwitchPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], SwitchPanelViewAction);
    exports.SwitchPanelViewAction = SwitchPanelViewAction;
    let PreviousPanelViewAction = class PreviousPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, panelService) {
            super(id, name, panelService);
        }
        run() {
            return super.run(-1);
        }
    };
    PreviousPanelViewAction.ID = 'workbench.action.previousPanelView';
    PreviousPanelViewAction.LABEL = nls.localize('previousPanelView', 'Previous Panel View');
    PreviousPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], PreviousPanelViewAction);
    exports.PreviousPanelViewAction = PreviousPanelViewAction;
    let NextPanelViewAction = class NextPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, panelService) {
            super(id, name, panelService);
        }
        run() {
            return super.run(1);
        }
    };
    NextPanelViewAction.ID = 'workbench.action.nextPanelView';
    NextPanelViewAction.LABEL = nls.localize('nextPanelView', 'Next Panel View');
    NextPanelViewAction = __decorate([
        __param(2, panelService_1.IPanelService)
    ], NextPanelViewAction);
    exports.NextPanelViewAction = NextPanelViewAction;
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(TogglePanelAction, TogglePanelAction.ID, TogglePanelAction.LABEL, { primary: 2048 /* CtrlCmd */ | 40 /* KEY_J */ }), 'View: Toggle Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(FocusPanelAction, FocusPanelAction.ID, FocusPanelAction.LABEL), 'View: Focus into Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleMaximizedPanelAction, ToggleMaximizedPanelAction.ID, ToggleMaximizedPanelAction.LABEL), 'View: Toggle Maximized Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ClosePanelAction, ClosePanelAction.ID, ClosePanelAction.LABEL), 'View: Close Panel', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(TogglePanelPositionAction, TogglePanelPositionAction.ID, TogglePanelPositionAction.LABEL), 'View: Toggle Panel Position', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(ToggleMaximizedPanelAction, ToggleMaximizedPanelAction.ID, undefined), 'View: Toggle Panel Position', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(PreviousPanelViewAction, PreviousPanelViewAction.ID, PreviousPanelViewAction.LABEL), 'View: Previous Panel View', nls.localize('view', "View"));
    actionRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NextPanelViewAction, NextPanelViewAction.ID, NextPanelViewAction.LABEL), 'View: Next Panel View', nls.localize('view', "View"));
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '2_workbench_layout',
        command: {
            id: TogglePanelAction.ID,
            title: nls.localize({ key: 'miShowPanel', comment: ['&& denotes a mnemonic'] }, "Show &&Panel"),
            toggled: panel_1.ActivePanelContext
        },
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '3_workbench_layout_move',
        command: {
            id: TogglePanelPositionAction.ID,
            title: TogglePanelPositionAction.MOVE_TO_RIGHT_LABEL
        },
        when: panel_1.PanelPositionContext.isEqualTo('bottom'),
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(12 /* MenubarAppearanceMenu */, {
        group: '3_workbench_layout_move',
        command: {
            id: TogglePanelPositionAction.ID,
            title: TogglePanelPositionAction.MOVE_TO_BOTTOM_LABEL
        },
        when: panel_1.PanelPositionContext.isEqualTo('right'),
        order: 5
    });
});
//# sourceMappingURL=panelActions.js.map