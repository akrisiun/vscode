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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/browser/composite", "vs/workbench/browser/actions/layoutActions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, nls, DOM, platform_1, actions_1, viewlet_1, composite_1, layoutActions_1, layoutService_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Viewlet extends composite_1.Composite {
        constructor(id, configurationService, layoutService, telemetryService, themeService, storageService) {
            super(id, telemetryService, themeService, storageService);
            this.configurationService = configurationService;
            this.layoutService = layoutService;
        }
        getOptimalWidth() {
            return null;
        }
        getContextMenuActions() {
            const toggleSidebarPositionAction = new layoutActions_1.ToggleSidebarPositionAction(layoutActions_1.ToggleSidebarPositionAction.ID, layoutActions_1.ToggleSidebarPositionAction.getLabel(this.layoutService), this.layoutService, this.configurationService);
            return [toggleSidebarPositionAction,
                {
                    id: layoutActions_1.ToggleSidebarVisibilityAction.ID,
                    label: nls.localize('compositePart.hideSideBarLabel', "Hide Side Bar"),
                    enabled: true,
                    run: () => this.layoutService.setSideBarHidden(true)
                }];
        }
    }
    exports.Viewlet = Viewlet;
    /**
     * A viewlet descriptor is a leightweight descriptor of a viewlet in the workbench.
     */
    class ViewletDescriptor extends composite_1.CompositeDescriptor {
        constructor(ctor, id, name, cssClass, order, _iconUrl) {
            super(ctor, id, name, cssClass, order, id);
            this._iconUrl = _iconUrl;
        }
        get iconUrl() {
            return this._iconUrl;
        }
    }
    exports.ViewletDescriptor = ViewletDescriptor;
    exports.Extensions = {
        Viewlets: 'workbench.contributions.viewlets'
    };
    class ViewletRegistry extends composite_1.CompositeRegistry {
        /**
         * Registers a viewlet to the platform.
         */
        registerViewlet(descriptor) {
            super.registerComposite(descriptor);
        }
        /**
         * Deregisters a viewlet to the platform.
         */
        deregisterViewlet(id) {
            if (id === this.defaultViewletId) {
                throw new Error('Cannot deregister default viewlet');
            }
            super.deregisterComposite(id);
        }
        /**
         * Returns the viewlet descriptor for the given id or null if none.
         */
        getViewlet(id) {
            return this.getComposite(id);
        }
        /**
         * Returns an array of registered viewlets known to the platform.
         */
        getViewlets() {
            return this.getComposites();
        }
        /**
         * Sets the id of the viewlet that should open on startup by default.
         */
        setDefaultViewletId(id) {
            this.defaultViewletId = id;
        }
        /**
         * Gets the id of the viewlet that should open on startup by default.
         */
        getDefaultViewletId() {
            return this.defaultViewletId;
        }
    }
    exports.ViewletRegistry = ViewletRegistry;
    platform_1.Registry.add(exports.Extensions.Viewlets, new ViewletRegistry());
    /**
     * A reusable action to show a viewlet with a specific id.
     */
    let ShowViewletAction = class ShowViewletAction extends actions_1.Action {
        constructor(id, name, viewletId, viewletService, editorGroupService, layoutService) {
            super(id, name);
            this.viewletId = viewletId;
            this.viewletService = viewletService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.enabled = !!this.viewletService && !!this.editorGroupService;
        }
        run() {
            // Pass focus to viewlet if not open or focused
            if (this.otherViewletShowing() || !this.sidebarHasFocus()) {
                return this.viewletService.openViewlet(this.viewletId, true);
            }
            // Otherwise pass focus to editor group
            this.editorGroupService.activeGroup.focus();
            return Promise.resolve(true);
        }
        otherViewletShowing() {
            const activeViewlet = this.viewletService.getActiveViewlet();
            return !activeViewlet || activeViewlet.getId() !== this.viewletId;
        }
        sidebarHasFocus() {
            const activeViewlet = this.viewletService.getActiveViewlet();
            const activeElement = document.activeElement;
            return !!(activeViewlet && activeElement && DOM.isAncestor(activeElement, this.layoutService.getContainer("workbench.parts.sidebar" /* SIDEBAR_PART */)));
        }
    };
    ShowViewletAction = __decorate([
        __param(3, viewlet_1.IViewletService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, layoutService_1.IWorkbenchLayoutService)
    ], ShowViewletAction);
    exports.ShowViewletAction = ShowViewletAction;
    class CollapseAction extends actions_1.Action {
        constructor(tree, enabled, clazz) {
            super('workbench.action.collapse', nls.localize('collapse', "Collapse All"), clazz, enabled, () => {
                tree.collapseAll();
                return Promise.resolve(undefined);
            });
        }
    }
    exports.CollapseAction = CollapseAction;
});
//# sourceMappingURL=viewlet.js.map