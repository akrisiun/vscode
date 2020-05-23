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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/treeView", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/userDataSync", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/base/common/uri", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/base/common/date", "vs/base/common/strings", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/base/common/codicons"], function (require, exports, platform_1, views_1, nls_1, descriptors_1, treeView_1, instantiation_1, userDataSync_1, actions_1, contextkey_1, uri_1, editorService_1, themeService_1, date_1, strings_1, viewPaneContainer_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncViewContribution = void 0;
    let UserDataSyncViewContribution = /** @class */ (() => {
        let UserDataSyncViewContribution = class UserDataSyncViewContribution {
            constructor(instantiationService, contextKeyService, userDataSyncService) {
                this.instantiationService = instantiationService;
                this.contextKeyService = contextKeyService;
                this.userDataSyncService = userDataSyncService;
                const container = this.registerSyncViewContainer();
                this.registerBackupView(container, true);
                this.registerBackupView(container, false);
            }
            registerSyncViewContainer() {
                return platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                    id: 'workbench.view.sync',
                    name: nls_1.localize('sync preferences', "Preferences Sync"),
                    ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, ['workbench.view.sync', { mergeViewWithContainerWhenSingleView: true }]),
                    icon: codicons_1.Codicon.sync.classNames,
                    hideIfEmpty: true,
                }, views_1.ViewContainerLocation.Sidebar);
            }
            registerBackupView(container, remote) {
                const id = `workbench.views.sync.${remote ? 'remote' : 'local'}BackupView`;
                const name = remote ? nls_1.localize('remote title', "Remote Backup") : nls_1.localize('local title', "Local Backup");
                const contextKey = new contextkey_1.RawContextKey(`showUserDataSync${remote ? 'Remote' : 'Local'}BackupView`, false);
                const viewEnablementContext = contextKey.bindTo(this.contextKeyService);
                const treeView = this.instantiationService.createInstance(treeView_1.TreeView, id, name);
                treeView.showCollapseAllAction = true;
                treeView.showRefreshAction = true;
                const disposable = treeView.onDidChangeVisibility(visible => {
                    if (visible && !treeView.dataProvider) {
                        disposable.dispose();
                        treeView.dataProvider = new UserDataSyncHistoryViewDataProvider(remote, this.userDataSyncService);
                    }
                });
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                viewsRegistry.registerViews([{
                        id,
                        name,
                        ctorDescriptor: new descriptors_1.SyncDescriptor(treeView_1.TreeViewPane),
                        when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_ENABLEMENT, contextKey),
                        canToggleVisibility: true,
                        canMoveView: true,
                        treeView,
                        collapsed: false,
                        order: 100,
                    }], container);
                actions_1.registerAction2(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.actions.showSync${remote ? 'Remote' : 'Local'}BackupView`,
                            title: remote ?
                                { value: nls_1.localize('workbench.action.showSyncRemoteBackup', "Show Remote Backup"), original: `Show Remote Backup` }
                                : { value: nls_1.localize('workbench.action.showSyncLocalBackup', "Show Local Backup"), original: `Show Local Backup` },
                            category: { value: nls_1.localize('sync preferences', "Preferences Sync"), original: `Preferences Sync` },
                            menu: {
                                id: actions_1.MenuId.CommandPalette,
                                when: userDataSync_1.CONTEXT_SYNC_ENABLEMENT
                            },
                        });
                    }
                    async run(accessor) {
                        const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
                        const viewsService = accessor.get(views_1.IViewsService);
                        viewEnablementContext.set(true);
                        const viewContainer = viewDescriptorService.getViewContainerByViewId(id);
                        if (viewContainer) {
                            const model = viewDescriptorService.getViewContainerModel(viewContainer);
                            if (model.activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === id)) {
                                viewsService.openView(id, true);
                            }
                            else {
                                const disposable = model.onDidChangeActiveViewDescriptors(e => {
                                    if (e.added.some(viewDescriptor => viewDescriptor.id === id)) {
                                        disposable.dispose();
                                        viewsService.openView(id, true);
                                    }
                                });
                            }
                        }
                    }
                });
                this.registerActions(id);
            }
            registerActions(viewId) {
                actions_1.registerAction2(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.actions.sync.resolveResource`,
                            title: nls_1.localize('workbench.actions.sync.resolveResourceRef', "Show raw JSON sync data"),
                            menu: {
                                id: actions_1.MenuId.ViewItemContext,
                                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyEqualsExpr.create('view', viewId), contextkey_1.ContextKeyExpr.regex('viewItem', /sync-resource-.*/i))
                            },
                        });
                    }
                    async run(accessor, handle) {
                        const editorService = accessor.get(editorService_1.IEditorService);
                        await editorService.openEditor({ resource: uri_1.URI.parse(handle.$treeItemHandle) });
                    }
                });
                actions_1.registerAction2(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.actions.sync.commpareWithLocal`,
                            title: nls_1.localize('workbench.actions.sync.commpareWithLocal', "Open Changes"),
                        });
                    }
                    async run(accessor, handle) {
                        const editorService = accessor.get(editorService_1.IEditorService);
                        const { resource, comparableResource } = JSON.parse(handle.$treeItemHandle);
                        if (comparableResource) {
                            await editorService.openEditor({
                                leftResource: uri_1.URI.parse(resource),
                                rightResource: uri_1.URI.parse(comparableResource),
                                options: {
                                    preserveFocus: true,
                                    revealIfVisible: true,
                                },
                            });
                        }
                        else {
                            await editorService.openEditor({ resource: uri_1.URI.parse(resource) });
                        }
                    }
                });
            }
        };
        UserDataSyncViewContribution = __decorate([
            __param(0, instantiation_1.IInstantiationService),
            __param(1, contextkey_1.IContextKeyService),
            __param(2, userDataSync_1.IUserDataSyncService)
        ], UserDataSyncViewContribution);
        return UserDataSyncViewContribution;
    })();
    exports.UserDataSyncViewContribution = UserDataSyncViewContribution;
    class UserDataSyncHistoryViewDataProvider {
        constructor(remote, userDataSyncService) {
            this.remote = remote;
            this.userDataSyncService = userDataSyncService;
        }
        async getChildren(element) {
            if (!element) {
                return userDataSync_1.ALL_SYNC_RESOURCES.map(resourceKey => ({
                    handle: resourceKey,
                    collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                    label: { label: strings_1.uppercaseFirstLetter(resourceKey) },
                    themeIcon: themeService_1.FolderThemeIcon,
                }));
            }
            const resourceKey = userDataSync_1.ALL_SYNC_RESOURCES.filter(key => key === element.handle)[0];
            if (resourceKey) {
                const refHandles = this.remote ? await this.userDataSyncService.getRemoteSyncResourceHandles(resourceKey) : await this.userDataSyncService.getLocalSyncResourceHandles(resourceKey);
                return refHandles.map(({ uri, created }) => {
                    return {
                        handle: uri.toString(),
                        collapsibleState: views_1.TreeItemCollapsibleState.Collapsed,
                        label: { label: label(new Date(created)) },
                        description: date_1.fromNow(created, true),
                        resourceUri: uri,
                        resource: resourceKey,
                        resourceHandle: { uri, created },
                        contextValue: `sync-resource-${resourceKey}`
                    };
                });
            }
            if (element.resourceHandle) {
                const associatedResources = await this.userDataSyncService.getAssociatedResources(element.resource, element.resourceHandle);
                return associatedResources.map(({ resource, comparableResource }) => {
                    const handle = JSON.stringify({ resource: resource.toString(), comparableResource: comparableResource === null || comparableResource === void 0 ? void 0 : comparableResource.toString() });
                    return {
                        handle,
                        collapsibleState: views_1.TreeItemCollapsibleState.None,
                        resourceUri: resource,
                        command: { id: `workbench.actions.sync.commpareWithLocal`, title: '', arguments: [{ $treeViewId: '', $treeItemHandle: handle }] },
                        contextValue: `sync-associatedResource-${element.resource}`
                    };
                });
            }
            return [];
        }
    }
    function label(date) {
        return date.toLocaleDateString() +
            ' ' + strings_1.pad(date.getHours(), 2) +
            ':' + strings_1.pad(date.getMinutes(), 2) +
            ':' + strings_1.pad(date.getSeconds(), 2);
    }
});
//# sourceMappingURL=userDataSyncView.js.map