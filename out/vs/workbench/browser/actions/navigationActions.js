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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/actions/common/actions", "vs/workbench/common/actions"], function (require, exports, nls, platform_1, actions_1, editorGroupsService_1, panelService_1, layoutService_1, viewlet_1, actions_2, actions_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BaseNavigationAction = class BaseNavigationAction extends actions_1.Action {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.panelService = panelService;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
        }
        run() {
            const isEditorFocus = this.layoutService.hasFocus("workbench.parts.editor" /* EDITOR_PART */);
            const isPanelFocus = this.layoutService.hasFocus("workbench.parts.panel" /* PANEL_PART */);
            const isSidebarFocus = this.layoutService.hasFocus("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const isSidebarPositionLeft = this.layoutService.getSideBarPosition() === 0 /* LEFT */;
            const isPanelPositionDown = this.layoutService.getPanelPosition() === 2 /* BOTTOM */;
            if (isEditorFocus) {
                return this.navigateOnEditorFocus(isSidebarPositionLeft, isPanelPositionDown);
            }
            if (isPanelFocus) {
                return this.navigateOnPanelFocus(isSidebarPositionLeft, isPanelPositionDown);
            }
            if (isSidebarFocus) {
                return Promise.resolve(this.navigateOnSidebarFocus(isSidebarPositionLeft, isPanelPositionDown));
            }
            return Promise.resolve(false);
        }
        navigateOnEditorFocus(_isSidebarPositionLeft, _isPanelPositionDown) {
            return Promise.resolve(true);
        }
        navigateOnPanelFocus(_isSidebarPositionLeft, _isPanelPositionDown) {
            return Promise.resolve(true);
        }
        navigateOnSidebarFocus(_isSidebarPositionLeft, _isPanelPositionDown) {
            return true;
        }
        navigateToPanel() {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                return false;
            }
            const activePanel = this.panelService.getActivePanel();
            if (!activePanel) {
                return false;
            }
            const activePanelId = activePanel.getId();
            const res = this.panelService.openPanel(activePanelId, true);
            if (!res) {
                return false;
            }
            return res;
        }
        async navigateToSidebar() {
            if (!this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                return Promise.resolve(false);
            }
            const activeViewlet = this.viewletService.getActiveViewlet();
            if (!activeViewlet) {
                return Promise.resolve(false);
            }
            const activeViewletId = activeViewlet.getId();
            const viewlet = await this.viewletService.openViewlet(activeViewletId, true);
            return !!viewlet;
        }
        navigateAcrossEditorGroup(direction) {
            return this.doNavigateToEditorGroup({ direction });
        }
        navigateToEditorGroup(location) {
            return this.doNavigateToEditorGroup({ location });
        }
        doNavigateToEditorGroup(scope) {
            const targetGroup = this.editorGroupService.findGroup(scope, this.editorGroupService.activeGroup);
            if (targetGroup) {
                targetGroup.focus();
                return true;
            }
            return false;
        }
    };
    BaseNavigationAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], BaseNavigationAction);
    let NavigateLeftAction = class NavigateLeftAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, editorGroupService, panelService, layoutService, viewletService);
        }
        navigateOnEditorFocus(isSidebarPositionLeft, _isPanelPositionDown) {
            const didNavigate = this.navigateAcrossEditorGroup(2 /* LEFT */);
            if (didNavigate) {
                return Promise.resolve(true);
            }
            if (isSidebarPositionLeft) {
                return this.navigateToSidebar();
            }
            return Promise.resolve(false);
        }
        navigateOnPanelFocus(isSidebarPositionLeft, isPanelPositionDown) {
            if (isPanelPositionDown && isSidebarPositionLeft) {
                return this.navigateToSidebar();
            }
            if (!isPanelPositionDown) {
                return Promise.resolve(this.navigateToEditorGroup(1 /* LAST */));
            }
            return Promise.resolve(false);
        }
        navigateOnSidebarFocus(isSidebarPositionLeft, _isPanelPositionDown) {
            if (!isSidebarPositionLeft) {
                return this.navigateToEditorGroup(1 /* LAST */);
            }
            return false;
        }
    };
    NavigateLeftAction.ID = 'workbench.action.navigateLeft';
    NavigateLeftAction.LABEL = nls.localize('navigateLeft', "Navigate to the View on the Left");
    NavigateLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateLeftAction);
    let NavigateRightAction = class NavigateRightAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, editorGroupService, panelService, layoutService, viewletService);
        }
        navigateOnEditorFocus(isSidebarPositionLeft, isPanelPositionDown) {
            const didNavigate = this.navigateAcrossEditorGroup(3 /* RIGHT */);
            if (didNavigate) {
                return Promise.resolve(true);
            }
            if (!isPanelPositionDown) {
                return Promise.resolve(this.navigateToPanel());
            }
            if (!isSidebarPositionLeft) {
                return this.navigateToSidebar();
            }
            return Promise.resolve(false);
        }
        navigateOnPanelFocus(isSidebarPositionLeft, _isPanelPositionDown) {
            if (!isSidebarPositionLeft) {
                return this.navigateToSidebar();
            }
            return Promise.resolve(false);
        }
        navigateOnSidebarFocus(isSidebarPositionLeft, _isPanelPositionDown) {
            if (isSidebarPositionLeft) {
                return this.navigateToEditorGroup(0 /* FIRST */);
            }
            return false;
        }
    };
    NavigateRightAction.ID = 'workbench.action.navigateRight';
    NavigateRightAction.LABEL = nls.localize('navigateRight', "Navigate to the View on the Right");
    NavigateRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateRightAction);
    let NavigateUpAction = class NavigateUpAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, editorGroupService, panelService, layoutService, viewletService);
        }
        navigateOnEditorFocus(_isSidebarPositionLeft, _isPanelPositionDown) {
            return Promise.resolve(this.navigateAcrossEditorGroup(0 /* UP */));
        }
        navigateOnPanelFocus(_isSidebarPositionLeft, isPanelPositionDown) {
            if (isPanelPositionDown) {
                return Promise.resolve(this.navigateToEditorGroup(1 /* LAST */));
            }
            return Promise.resolve(false);
        }
    };
    NavigateUpAction.ID = 'workbench.action.navigateUp';
    NavigateUpAction.LABEL = nls.localize('navigateUp', "Navigate to the View Above");
    NavigateUpAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateUpAction);
    let NavigateDownAction = class NavigateDownAction extends BaseNavigationAction {
        constructor(id, label, editorGroupService, panelService, layoutService, viewletService) {
            super(id, label, editorGroupService, panelService, layoutService, viewletService);
        }
        navigateOnEditorFocus(_isSidebarPositionLeft, isPanelPositionDown) {
            const didNavigate = this.navigateAcrossEditorGroup(1 /* DOWN */);
            if (didNavigate) {
                return Promise.resolve(true);
            }
            if (isPanelPositionDown) {
                return Promise.resolve(this.navigateToPanel());
            }
            return Promise.resolve(false);
        }
    };
    NavigateDownAction.ID = 'workbench.action.navigateDown';
    NavigateDownAction.LABEL = nls.localize('navigateDown', "Navigate to the View Below");
    NavigateDownAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, panelService_1.IPanelService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, viewlet_1.IViewletService)
    ], NavigateDownAction);
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    const viewCategory = nls.localize('view', "View");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateUpAction, NavigateUpAction.ID, NavigateUpAction.LABEL, undefined), 'View: Navigate to the View Above', viewCategory);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateDownAction, NavigateDownAction.ID, NavigateDownAction.LABEL, undefined), 'View: Navigate to the View Below', viewCategory);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateLeftAction, NavigateLeftAction.ID, NavigateLeftAction.LABEL, undefined), 'View: Navigate to the View on the Left', viewCategory);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(NavigateRightAction, NavigateRightAction.ID, NavigateRightAction.LABEL, undefined), 'View: Navigate to the View on the Right', viewCategory);
});
//# sourceMappingURL=navigationActions.js.map