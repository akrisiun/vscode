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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/arrays", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextview/browser/contextView", "vs/workbench/common/views", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/contextkey/common/contextkey", "vs/base/browser/mouseEvent", "vs/workbench/browser/parts/views/panelViewlet", "vs/base/browser/ui/splitview/panelview", "vs/platform/list/browser/listService", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/nls", "vs/workbench/browser/parts/views/views", "vs/platform/registry/common/platform"], function (require, exports, DOM, lifecycle_1, actionbar_1, arrays_1, extensions_1, contextView_1, views_1, telemetry_1, themeService_1, instantiation_1, storage_1, workspace_1, contextkey_1, mouseEvent_1, panelViewlet_1, panelview_1, listService_1, event_1, configuration_1, layoutService_1, nls_1, views_2, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ViewContainerViewlet = class ViewContainerViewlet extends panelViewlet_1.PanelViewlet {
        constructor(id, viewletStateStorageId, showHeaderInTitleWhenSingleView, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService) {
            super(id, { showHeaderInTitleWhenSingleView, dnd: new panelview_1.DefaultPanelDndController() }, configurationService, layoutService, contextMenuService, telemetryService, themeService, storageService);
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.contextMenuService = contextMenuService;
            this.extensionService = extensionService;
            this.contextService = contextService;
            this.didLayout = false;
            this.areExtensionsReady = false;
            this.viewDisposables = [];
            const container = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).get(id);
            if (!container) {
                throw new Error('Could not find container');
            }
            this.viewsModel = this._register(this.instantiationService.createInstance(views_2.PersistentContributableViewsModel, container, viewletStateStorageId));
            this.viewletState = this.getMemento(1 /* WORKSPACE */);
            this.visibleViewsStorageId = `${id}.numberOfVisibleViews`;
            this.visibleViewsCountFromCache = this.storageService.getNumber(this.visibleViewsStorageId, 1 /* WORKSPACE */, undefined);
            this._register(lifecycle_1.toDisposable(() => this.viewDisposables = lifecycle_1.dispose(this.viewDisposables)));
        }
        create(parent) {
            super.create(parent);
            this._register(this.onDidSashChange(() => this.saveViewSizes()));
            this.viewsModel.onDidAdd(added => this.onDidAddViews(added));
            this.viewsModel.onDidRemove(removed => this.onDidRemoveViews(removed));
            const addedViews = this.viewsModel.visibleViewDescriptors.map((viewDescriptor, index) => {
                const size = this.viewsModel.getSize(viewDescriptor.id);
                const collapsed = this.viewsModel.isCollapsed(viewDescriptor.id);
                return ({ viewDescriptor, index, size, collapsed });
            });
            if (addedViews.length) {
                this.onDidAddViews(addedViews);
            }
            // Update headers after and title contributed views after available, since we read from cache in the beginning to know if the viewlet has single view or not. Ref #29609
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.areExtensionsReady = true;
                if (this.panels.length) {
                    this.updateTitleArea();
                    this.updateViewHeaders();
                }
            });
            this.focus();
        }
        getContextMenuActions() {
            const result = [];
            const viewToggleActions = this.viewsModel.viewDescriptors.map(viewDescriptor => ({
                id: `${viewDescriptor.id}.toggleVisibility`,
                label: viewDescriptor.name,
                checked: this.viewsModel.isVisible(viewDescriptor.id),
                enabled: viewDescriptor.canToggleVisibility,
                run: () => this.toggleViewVisibility(viewDescriptor.id)
            }));
            result.push(...viewToggleActions);
            const parentActions = super.getContextMenuActions();
            if (viewToggleActions.length && parentActions.length) {
                result.push(new actionbar_1.Separator());
            }
            result.push(...parentActions);
            return result;
        }
        setVisible(visible) {
            super.setVisible(visible);
            this.panels.filter(view => view.isVisible() !== visible)
                .map((view) => view.setVisible(visible));
        }
        openView(id, focus) {
            if (focus) {
                this.focus();
            }
            let view = this.getView(id);
            if (!view) {
                this.toggleViewVisibility(id);
            }
            view = this.getView(id);
            view.setExpanded(true);
            if (focus) {
                view.focus();
            }
            return view;
        }
        movePanel(from, to) {
            const fromIndex = arrays_1.firstIndex(this.panels, panel => panel === from);
            const toIndex = arrays_1.firstIndex(this.panels, panel => panel === to);
            const fromViewDescriptor = this.viewsModel.visibleViewDescriptors[fromIndex];
            const toViewDescriptor = this.viewsModel.visibleViewDescriptors[toIndex];
            super.movePanel(from, to);
            this.viewsModel.move(fromViewDescriptor.id, toViewDescriptor.id);
        }
        layout(dimension) {
            super.layout(dimension);
            this.dimension = dimension;
            if (this.didLayout) {
                this.saveViewSizes();
            }
            else {
                this.didLayout = true;
                this.restoreViewSizes();
            }
        }
        getOptimalWidth() {
            const additionalMargin = 16;
            const optimalWidth = Math.max(...this.panels.map(view => view.getOptimalWidth() || 0));
            return optimalWidth + additionalMargin;
        }
        isSingleView() {
            if (!super.isSingleView()) {
                return false;
            }
            if (!this.areExtensionsReady) {
                if (this.visibleViewsCountFromCache === undefined) {
                    return false;
                }
                // Check in cache so that view do not jump. See #29609
                return this.visibleViewsCountFromCache === 1;
            }
            return true;
        }
        createView(viewDescriptor, options) {
            return this.instantiationService.createInstance(viewDescriptor.ctorDescriptor.ctor, ...(viewDescriptor.ctorDescriptor.arguments || []), options);
        }
        getView(id) {
            return this.panels.filter(view => view.id === id)[0];
        }
        onDidAddViews(added) {
            const panelsToAdd = [];
            for (const { viewDescriptor, collapsed, index, size } of added) {
                const panel = this.createView(viewDescriptor, {
                    id: viewDescriptor.id,
                    title: viewDescriptor.name,
                    actionRunner: this.getActionRunner(),
                    expanded: !collapsed,
                    viewletState: this.viewletState
                });
                panel.render();
                const contextMenuDisposable = DOM.addDisposableListener(panel.draggableElement, 'contextmenu', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onContextMenu(new mouseEvent_1.StandardMouseEvent(e), viewDescriptor);
                });
                const collapseDisposable = event_1.Event.latch(event_1.Event.map(panel.onDidChange, () => !panel.isExpanded()))(collapsed => {
                    this.viewsModel.setCollapsed(viewDescriptor.id, collapsed);
                });
                this.viewDisposables.splice(index, 0, lifecycle_1.combinedDisposable(contextMenuDisposable, collapseDisposable));
                panelsToAdd.push({ panel, size: size || panel.minimumSize, index });
            }
            this.addPanels(panelsToAdd);
            this.restoreViewSizes();
            const panels = [];
            for (const { panel } of panelsToAdd) {
                panel.setVisible(this.isVisible());
                panels.push(panel);
            }
            return panels;
        }
        onDidRemoveViews(removed) {
            removed = removed.sort((a, b) => b.index - a.index);
            const panelsToRemove = [];
            for (const { index } of removed) {
                const [disposable] = this.viewDisposables.splice(index, 1);
                disposable.dispose();
                panelsToRemove.push(this.panels[index]);
            }
            this.removePanels(panelsToRemove);
            lifecycle_1.dispose(panelsToRemove);
        }
        onContextMenu(event, viewDescriptor) {
            event.stopPropagation();
            event.preventDefault();
            const actions = [];
            actions.push({
                id: `${viewDescriptor.id}.removeView`,
                label: nls_1.localize('hideView', "Hide"),
                enabled: viewDescriptor.canToggleVisibility,
                run: () => this.toggleViewVisibility(viewDescriptor.id)
            });
            const otherActions = this.getContextMenuActions();
            if (otherActions.length) {
                actions.push(...[new actionbar_1.Separator(), ...otherActions]);
            }
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions
            });
        }
        toggleViewVisibility(viewId) {
            const visible = !this.viewsModel.isVisible(viewId);
            this.telemetryService.publicLog2('views.toggleVisibility', { viewId, visible });
            this.viewsModel.setVisible(viewId, visible);
        }
        saveViewSizes() {
            // Save size only when the layout has happened
            if (this.didLayout) {
                for (const view of this.panels) {
                    this.viewsModel.setSize(view.id, this.getPanelSize(view));
                }
            }
        }
        restoreViewSizes() {
            // Restore sizes only when the layout has happened
            if (this.didLayout) {
                let initialSizes;
                for (let i = 0; i < this.viewsModel.visibleViewDescriptors.length; i++) {
                    const panel = this.panels[i];
                    const viewDescriptor = this.viewsModel.visibleViewDescriptors[i];
                    const size = this.viewsModel.getSize(viewDescriptor.id);
                    if (typeof size === 'number') {
                        this.resizePanel(panel, size);
                    }
                    else {
                        initialSizes = initialSizes ? initialSizes : this.computeInitialSizes();
                        this.resizePanel(panel, initialSizes.get(panel.id) || 200);
                    }
                }
            }
        }
        computeInitialSizes() {
            const sizes = new Map();
            if (this.dimension) {
                const totalWeight = this.viewsModel.visibleViewDescriptors.reduce((totalWeight, { weight }) => totalWeight + (weight || 20), 0);
                for (const viewDescriptor of this.viewsModel.visibleViewDescriptors) {
                    sizes.set(viewDescriptor.id, this.dimension.height * (viewDescriptor.weight || 20) / totalWeight);
                }
            }
            return sizes;
        }
        saveState() {
            this.panels.forEach((view) => view.saveState());
            this.storageService.store(this.visibleViewsStorageId, this.length, 1 /* WORKSPACE */);
            super.saveState();
        }
    };
    ViewContainerViewlet = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, themeService_1.IThemeService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, extensions_1.IExtensionService),
        __param(11, workspace_1.IWorkspaceContextService)
    ], ViewContainerViewlet);
    exports.ViewContainerViewlet = ViewContainerViewlet;
    let FileIconThemableWorkbenchTree = class FileIconThemableWorkbenchTree extends listService_1.WorkbenchTree {
        constructor(container, configuration, options, contextKeyService, listService, themeService, configurationService, instantiationService) {
            super(container, configuration, Object.assign(Object.assign({}, options), { showTwistie: false, twistiePixels: 12 }), contextKeyService, listService, themeService, instantiationService, configurationService);
            DOM.addClass(container, 'file-icon-themable-tree');
            DOM.addClass(container, 'show-file-icons');
            const onFileIconThemeChange = (fileIconTheme) => {
                DOM.toggleClass(container, 'align-icons-and-twisties', fileIconTheme.hasFileIcons && !fileIconTheme.hasFolderIcons);
                DOM.toggleClass(container, 'hide-arrows', fileIconTheme.hidesExplorerArrows === true);
            };
            this.disposables.push(themeService.onDidFileIconThemeChange(onFileIconThemeChange));
            onFileIconThemeChange(themeService.getFileIconTheme());
        }
    };
    FileIconThemableWorkbenchTree = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, instantiation_1.IInstantiationService)
    ], FileIconThemableWorkbenchTree);
    exports.FileIconThemableWorkbenchTree = FileIconThemableWorkbenchTree;
});
//# sourceMappingURL=viewsViewlet.js.map