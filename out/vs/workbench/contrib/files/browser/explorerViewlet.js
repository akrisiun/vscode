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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/parts/views/viewsViewlet", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/files/browser/views/explorerView", "vs/workbench/contrib/files/browser/views/emptyView", "vs/workbench/contrib/files/browser/views/openEditorsView", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/serviceCollection", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/progress/common/progress", "vs/base/common/types", "vs/css!./media/explorerviewlet"], function (require, exports, nls_1, DOM, files_1, viewsViewlet_1, configuration_1, explorerView_1, emptyView_1, openEditorsView_1, storage_1, instantiation_1, extensions_1, workspace_1, telemetry_1, serviceCollection_1, contextkey_1, themeService_1, views_1, contextView_1, lifecycle_1, layoutService_1, editorService_1, editorGroupsService_1, editorService_2, keyCodes_1, platform_1, progress_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExplorerViewletViewsContribution = class ExplorerViewletViewsContribution extends lifecycle_1.Disposable {
        constructor(workspaceContextService, configurationService, contextKeyService, progressService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.configurationService = configurationService;
            progressService.withProgress({ location: 1 /* Explorer */ }, () => workspaceContextService.getCompleteWorkspace()).finally(() => {
                this.registerViews();
                this.openEditorsVisibleContextKey = files_1.OpenEditorsVisibleContext.bindTo(contextKeyService);
                this.updateOpenEditorsVisibility();
                this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.registerViews()));
                this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.registerViews()));
                this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            });
        }
        registerViews() {
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            const viewDescriptors = viewsRegistry.getViews(files_1.VIEW_CONTAINER);
            let viewDescriptorsToRegister = [];
            let viewDescriptorsToDeregister = [];
            const openEditorsViewDescriptor = this.createOpenEditorsViewDescriptor();
            if (!viewDescriptors.some(v => v.id === openEditorsViewDescriptor.id)) {
                viewDescriptorsToRegister.push(openEditorsViewDescriptor);
            }
            const explorerViewDescriptor = this.createExplorerViewDescriptor();
            const registeredExplorerViewDescriptor = viewDescriptors.filter(v => v.id === explorerViewDescriptor.id)[0];
            const emptyViewDescriptor = this.createEmptyViewDescriptor();
            const registeredEmptyViewDescriptor = viewDescriptors.filter(v => v.id === emptyViewDescriptor.id)[0];
            if (this.workspaceContextService.getWorkbenchState() === 1 /* EMPTY */ || this.workspaceContextService.getWorkspace().folders.length === 0) {
                if (registeredExplorerViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredExplorerViewDescriptor);
                }
                if (!registeredEmptyViewDescriptor) {
                    viewDescriptorsToRegister.push(emptyViewDescriptor);
                }
            }
            else {
                if (registeredEmptyViewDescriptor) {
                    viewDescriptorsToDeregister.push(registeredEmptyViewDescriptor);
                }
                if (!registeredExplorerViewDescriptor) {
                    viewDescriptorsToRegister.push(explorerViewDescriptor);
                }
            }
            if (viewDescriptorsToRegister.length) {
                viewsRegistry.registerViews(viewDescriptorsToRegister, files_1.VIEW_CONTAINER);
            }
            if (viewDescriptorsToDeregister.length) {
                viewsRegistry.deregisterViews(viewDescriptorsToDeregister, files_1.VIEW_CONTAINER);
            }
        }
        createOpenEditorsViewDescriptor() {
            return {
                id: openEditorsView_1.OpenEditorsView.ID,
                name: openEditorsView_1.OpenEditorsView.NAME,
                ctorDescriptor: { ctor: openEditorsView_1.OpenEditorsView },
                order: 0,
                when: files_1.OpenEditorsVisibleContext,
                canToggleVisibility: true,
                focusCommand: {
                    id: 'workbench.files.action.focusOpenEditorsView',
                    keybindings: { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 35 /* KEY_E */) }
                }
            };
        }
        createEmptyViewDescriptor() {
            return {
                id: emptyView_1.EmptyView.ID,
                name: emptyView_1.EmptyView.NAME,
                ctorDescriptor: { ctor: emptyView_1.EmptyView },
                order: 1,
                canToggleVisibility: true,
            };
        }
        createExplorerViewDescriptor() {
            return {
                id: explorerView_1.ExplorerView.ID,
                name: nls_1.localize('folders', "Folders"),
                ctorDescriptor: { ctor: explorerView_1.ExplorerView },
                order: 1,
                canToggleVisibility: false
            };
        }
        onConfigurationUpdated(e) {
            if (e.affectsConfiguration('explorer.openEditors.visible')) {
                this.updateOpenEditorsVisibility();
            }
        }
        updateOpenEditorsVisibility() {
            this.openEditorsVisibleContextKey.set(this.workspaceContextService.getWorkbenchState() === 1 /* EMPTY */ || this.configurationService.getValue('explorer.openEditors.visible') !== 0);
        }
    };
    ExplorerViewletViewsContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, progress_1.IProgressService)
    ], ExplorerViewletViewsContribution);
    exports.ExplorerViewletViewsContribution = ExplorerViewletViewsContribution;
    let ExplorerViewlet = class ExplorerViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, contextService, storageService, editorGroupService, configurationService, instantiationService, contextKeyService, themeService, contextMenuService, extensionService) {
            super(files_1.VIEWLET_ID, ExplorerViewlet.EXPLORER_VIEWS_STATE, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.contextService = contextService;
            this.storageService = storageService;
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.viewletVisibleContextKey = files_1.ExplorerViewletVisibleContext.bindTo(contextKeyService);
            this._register(this.contextService.onDidChangeWorkspaceName(e => this.updateTitleArea()));
        }
        create(parent) {
            super.create(parent);
            DOM.addClass(parent, 'explorer-viewlet');
        }
        createView(viewDescriptor, options) {
            if (viewDescriptor.id === explorerView_1.ExplorerView.ID) {
                // Create a delegating editor service for the explorer to be able to delay the refresh in the opened
                // editors view above. This is a workaround for being able to double click on a file to make it pinned
                // without causing the animation in the opened editors view to kick in and change scroll position.
                // We try to be smart and only use the delay if we recognize that the user action is likely to cause
                // a new entry in the opened editors view.
                const delegatingEditorService = this.instantiationService.createInstance(editorService_1.DelegatingEditorService);
                delegatingEditorService.setEditorOpenHandler(async (delegate, group, editor, options) => {
                    let openEditorsView = this.getOpenEditorsView();
                    if (openEditorsView) {
                        let delay = 0;
                        const config = this.configurationService.getValue();
                        const delayEditorOpeningInOpenedEditors = !!config.workbench.editor.enablePreview; // No need to delay if preview is disabled
                        const activeGroup = this.editorGroupService.activeGroup;
                        if (delayEditorOpeningInOpenedEditors && group === activeGroup && !activeGroup.previewEditor) {
                            delay = 250; // a new editor entry is likely because there is either no group or no preview in group
                        }
                        openEditorsView.setStructuralRefreshDelay(delay);
                    }
                    let openedEditor;
                    try {
                        openedEditor = await delegate(group, editor, options);
                    }
                    catch (error) {
                        // ignore
                    }
                    finally {
                        const openEditorsView = this.getOpenEditorsView();
                        if (openEditorsView) {
                            openEditorsView.setStructuralRefreshDelay(0);
                        }
                    }
                    return types_1.withUndefinedAsNull(openedEditor);
                });
                const explorerInstantiator = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([editorService_2.IEditorService, delegatingEditorService]));
                return explorerInstantiator.createInstance(explorerView_1.ExplorerView, options);
            }
            return super.createView(viewDescriptor, options);
        }
        getExplorerView() {
            return this.getView(explorerView_1.ExplorerView.ID);
        }
        getOpenEditorsView() {
            return this.getView(openEditorsView_1.OpenEditorsView.ID);
        }
        getEmptyView() {
            return this.getView(emptyView_1.EmptyView.ID);
        }
        setVisible(visible) {
            this.viewletVisibleContextKey.set(visible);
            super.setVisible(visible);
        }
        focus() {
            var _a;
            const explorerView = this.getView(explorerView_1.ExplorerView.ID);
            if ((_a = explorerView) === null || _a === void 0 ? void 0 : _a.isExpanded()) {
                explorerView.focus();
            }
            else {
                super.focus();
            }
        }
    };
    ExplorerViewlet.EXPLORER_VIEWS_STATE = 'workbench.explorer.views.state';
    ExplorerViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, themeService_1.IThemeService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, extensions_1.IExtensionService)
    ], ExplorerViewlet);
    exports.ExplorerViewlet = ExplorerViewlet;
});
//# sourceMappingURL=explorerViewlet.js.map