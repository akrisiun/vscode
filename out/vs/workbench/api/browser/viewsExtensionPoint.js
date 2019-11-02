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
define(["require", "exports", "vs/nls", "vs/base/common/collections", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/common/views", "vs/workbench/browser/parts/views/customView", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/scm/common/scm", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/remote/common/remote.contribution", "vs/platform/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/browser/viewlet", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/base/browser/dom"], function (require, exports, nls_1, collections_1, resources, extensionsRegistry_1, views_1, customView_1, contextkey_1, arrays_1, contributions_1, platform_1, instantiation_1, files_1, scm_1, debug_1, remote_contribution_1, extensions_1, uri_1, viewlet_1, extensions_2, viewsViewlet_1, configuration_1, layoutService_1, telemetry_1, workspace_1, storage_1, editorService_1, themeService_1, contextView_1, viewlet_2, editorGroupsService_1, actions_1, actions_2, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const viewsContainerSchema = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize({ key: 'vscode.extension.contributes.views.containers.id', comment: ['Contribution refers to those that an extension contributes to VS Code through an extension/contribution point. '] }, "Unique id used to identify the container in which views can be contributed using 'views' contribution point"),
                type: 'string',
                pattern: '^[a-zA-Z0-9_-]+$'
            },
            title: {
                description: nls_1.localize('vscode.extension.contributes.views.containers.title', 'Human readable string used to render the container'),
                type: 'string'
            },
            icon: {
                description: nls_1.localize('vscode.extension.contributes.views.containers.icon', "Path to the container icon. Icons are 24x24 centered on a 50x40 block and have a fill color of 'rgb(215, 218, 224)' or '#d7dae0'. It is recommended that icons be in SVG, though any image file type is accepted."),
                type: 'string'
            }
        }
    };
    exports.viewsContainersContribution = {
        description: nls_1.localize('vscode.extension.contributes.viewsContainers', 'Contributes views containers to the editor'),
        type: 'object',
        properties: {
            'activitybar': {
                description: nls_1.localize('views.container.activitybar', "Contribute views containers to Activity Bar"),
                type: 'array',
                items: viewsContainerSchema
            }
        }
    };
    const viewDescriptor = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize('vscode.extension.contributes.view.id', 'Identifier of the view. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: nls_1.localize('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: nls_1.localize('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
        }
    };
    const remoteViewDescriptor = {
        type: 'object',
        properties: {
            id: {
                description: nls_1.localize('vscode.extension.contributes.view.id', 'Identifier of the view. Use this to register a data provider through `vscode.window.registerTreeDataProviderForView` API. Also to trigger activating your extension by registering `onView:${id}` event to `activationEvents`.'),
                type: 'string'
            },
            name: {
                description: nls_1.localize('vscode.extension.contributes.view.name', 'The human-readable name of the view. Will be shown'),
                type: 'string'
            },
            when: {
                description: nls_1.localize('vscode.extension.contributes.view.when', 'Condition which must be true to show this view'),
                type: 'string'
            },
            group: {
                description: nls_1.localize('vscode.extension.contributes.view.group', 'Nested group in the viewlet'),
                type: 'string'
            },
            remoteName: {
                description: nls_1.localize('vscode.extension.contributes.view.remoteName', 'The name of the remote type associated with this view'),
                type: ['string', 'array'],
                items: {
                    type: 'string'
                }
            }
        }
    };
    const viewsContribution = {
        description: nls_1.localize('vscode.extension.contributes.views', "Contributes views to the editor"),
        type: 'object',
        properties: {
            'explorer': {
                description: nls_1.localize('views.explorer', "Contributes views to Explorer container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'debug': {
                description: nls_1.localize('views.debug', "Contributes views to Debug container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'scm': {
                description: nls_1.localize('views.scm', "Contributes views to SCM container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'test': {
                description: nls_1.localize('views.test', "Contributes views to Test container in the Activity bar"),
                type: 'array',
                items: viewDescriptor,
                default: []
            },
            'remote': {
                description: nls_1.localize('views.remote', "Contributes views to Remote container in the Activity bar. To contribute to this container, enableProposedApi needs to be turned on"),
                type: 'array',
                items: remoteViewDescriptor,
                default: []
            }
        },
        additionalProperties: {
            description: nls_1.localize('views.contributed', "Contributes views to contributed views container"),
            type: 'array',
            items: viewDescriptor,
            default: []
        }
    };
    const viewsContainersExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'viewsContainers',
        jsonSchema: exports.viewsContainersContribution
    });
    const viewsExtensionPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'views',
        deps: [viewsContainersExtensionPoint],
        jsonSchema: viewsContribution
    });
    const TEST_VIEW_CONTAINER_ORDER = 6;
    let ViewsExtensionHandler = class ViewsExtensionHandler {
        constructor(instantiationService) {
            this.instantiationService = instantiationService;
            this.viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            this.viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            this.handleAndRegisterCustomViewContainers();
            this.handleAndRegisterCustomViews();
        }
        handleAndRegisterCustomViewContainers() {
            this.registerTestViewContainer();
            viewsContainersExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeCustomViewContainers(removed);
                }
                if (added.length) {
                    this.addCustomViewContainers(added, this.viewContainersRegistry.all);
                }
            });
        }
        addCustomViewContainers(extensionPoints, existingViewContainers) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            let order = TEST_VIEW_CONTAINER_ORDER + viewContainersRegistry.all.filter(v => !!v.extensionId).length + 1;
            for (let { value, collector, description } of extensionPoints) {
                collections_1.forEach(value, entry => {
                    if (!this.isValidViewsContainer(entry.value, collector)) {
                        return;
                    }
                    switch (entry.key) {
                        case 'activitybar':
                            order = this.registerCustomViewContainers(entry.value, description, order, existingViewContainers);
                            break;
                    }
                });
            }
        }
        removeCustomViewContainers(extensionPoints) {
            const viewContainersRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            const removedExtensions = extensionPoints.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of viewContainersRegistry.all) {
                if (viewContainer.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(viewContainer.extensionId))) {
                    // move only those views that do not belong to the removed extension
                    const views = this.viewsRegistry.getViews(viewContainer).filter((view) => !removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(view.extensionId)));
                    if (views.length) {
                        this.viewsRegistry.moveViews(views, this.getDefaultViewContainer());
                    }
                    this.deregisterCustomViewContainer(viewContainer);
                }
            }
        }
        registerTestViewContainer() {
            const title = nls_1.localize('test', "Test");
            const cssClass = `extensionViewlet-test`;
            const icon = uri_1.URI.parse(require.toUrl('./media/test.svg'));
            this.registerCustomViewContainer(views_1.TEST_VIEW_CONTAINER_ID, title, icon, TEST_VIEW_CONTAINER_ORDER, cssClass, undefined);
        }
        isValidViewsContainer(viewsContainersDescriptors, collector) {
            if (!Array.isArray(viewsContainersDescriptors)) {
                collector.error(nls_1.localize('viewcontainer requirearray', "views containers must be an array"));
                return false;
            }
            for (let descriptor of viewsContainersDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error(nls_1.localize('requireidstring', "property `{0}` is mandatory and must be of type `string`. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (!(/^[a-z0-9_-]+$/i.test(descriptor.id))) {
                    collector.error(nls_1.localize('requireidstring', "property `{0}` is mandatory and must be of type `string`. Only alphanumeric characters, '_', and '-' are allowed.", 'id'));
                    return false;
                }
                if (typeof descriptor.title !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'title'));
                    return false;
                }
                if (typeof descriptor.icon !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'icon'));
                    return false;
                }
            }
            return true;
        }
        registerCustomViewContainers(containers, extension, order, existingViewContainers) {
            containers.forEach(descriptor => {
                const cssClass = `extensionViewlet-${descriptor.id}`;
                const icon = resources.joinPath(extension.extensionLocation, descriptor.icon);
                const id = `workbench.view.extension.${descriptor.id}`;
                const viewContainer = this.registerCustomViewContainer(id, descriptor.title, icon, order++, cssClass, extension.identifier);
                // Move those views that belongs to this container
                if (existingViewContainers.length) {
                    const viewsToMove = [];
                    for (const existingViewContainer of existingViewContainers) {
                        if (viewContainer !== existingViewContainer) {
                            viewsToMove.push(...this.viewsRegistry.getViews(existingViewContainer).filter((view) => view.originalContainerId === descriptor.id));
                        }
                    }
                    if (viewsToMove.length) {
                        this.viewsRegistry.moveViews(viewsToMove, viewContainer);
                    }
                }
            });
            return order;
        }
        registerCustomViewContainer(id, title, icon, order, cssClass, extensionId) {
            let viewContainer = this.viewContainersRegistry.get(id);
            if (!viewContainer) {
                viewContainer = this.viewContainersRegistry.registerViewContainer(id, true, extensionId);
                // Register as viewlet
                let CustomViewlet = class CustomViewlet extends viewsViewlet_1.ViewContainerViewlet {
                    constructor(configurationService, layoutService, telemetryService, contextService, storageService, editorService, instantiationService, themeService, contextMenuService, extensionService) {
                        super(id, `${id}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
                    }
                };
                CustomViewlet = __decorate([
                    __param(0, configuration_1.IConfigurationService),
                    __param(1, layoutService_1.IWorkbenchLayoutService),
                    __param(2, telemetry_1.ITelemetryService),
                    __param(3, workspace_1.IWorkspaceContextService),
                    __param(4, storage_1.IStorageService),
                    __param(5, editorService_1.IEditorService),
                    __param(6, instantiation_1.IInstantiationService),
                    __param(7, themeService_1.IThemeService),
                    __param(8, contextView_1.IContextMenuService),
                    __param(9, extensions_2.IExtensionService)
                ], CustomViewlet);
                const viewletDescriptor = new viewlet_1.ViewletDescriptor(CustomViewlet, id, title, cssClass, order, icon);
                platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(viewletDescriptor);
                // Register Action to Open Viewlet
                let OpenCustomViewletAction = class OpenCustomViewletAction extends viewlet_1.ShowViewletAction {
                    constructor(id, label, viewletService, editorGroupService, layoutService) {
                        super(id, label, id, viewletService, editorGroupService, layoutService);
                    }
                };
                OpenCustomViewletAction = __decorate([
                    __param(2, viewlet_2.IViewletService),
                    __param(3, editorGroupsService_1.IEditorGroupsService),
                    __param(4, layoutService_1.IWorkbenchLayoutService)
                ], OpenCustomViewletAction);
                const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
                registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(OpenCustomViewletAction, id, nls_1.localize('showViewlet', "Show {0}", title)), `View: Show ${title}`, nls_1.localize('view', "View"));
                // Generate CSS to show the icon in the activity bar
                const iconClass = `.monaco-workbench .activitybar .monaco-action-bar .action-label.${cssClass}`;
                dom_1.createCSSRule(iconClass, `
				mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				mask-size: 24px;
				-webkit-mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				-webkit-mask-size: 24px;`);
            }
            return viewContainer;
        }
        deregisterCustomViewContainer(viewContainer) {
            this.viewContainersRegistry.deregisterViewContainer(viewContainer);
            platform_1.Registry.as(viewlet_1.Extensions.Viewlets).deregisterViewlet(viewContainer.id);
        }
        handleAndRegisterCustomViews() {
            viewsExtensionPoint.setHandler((extensions, { added, removed }) => {
                if (removed.length) {
                    this.removeViews(removed);
                }
                if (added.length) {
                    this.addViews(added);
                }
            });
        }
        addViews(extensions) {
            for (const extension of extensions) {
                const { value, collector } = extension;
                collections_1.forEach(value, entry => {
                    if (!this.isValidViewDescriptors(entry.value, collector)) {
                        return;
                    }
                    if (entry.key === 'remote' && !extension.description.enableProposedApi) {
                        collector.warn(nls_1.localize('ViewContainerRequiresProposedAPI', "View container '{0}' requires 'enableProposedApi' turned on to be added to 'Remote'.", entry.key));
                        return;
                    }
                    const viewContainer = this.getViewContainer(entry.key);
                    if (!viewContainer) {
                        collector.warn(nls_1.localize('ViewContainerDoesnotExist', "View container '{0}' does not exist and all views registered to it will be added to 'Explorer'.", entry.key));
                    }
                    const container = viewContainer || this.getDefaultViewContainer();
                    const registeredViews = this.viewsRegistry.getViews(container);
                    const viewIds = [];
                    const viewDescriptors = arrays_1.coalesce(entry.value.map((item, index) => {
                        // validate
                        if (viewIds.indexOf(item.id) !== -1) {
                            collector.error(nls_1.localize('duplicateView1', "Cannot register multiple views with same id `{0}` in the view container `{1}`", item.id, container.id));
                            return null;
                        }
                        if (registeredViews.some(v => v.id === item.id)) {
                            collector.error(nls_1.localize('duplicateView2', "A view with id `{0}` is already registered in the view container `{1}`", item.id, container.id));
                            return null;
                        }
                        const order = extensions_1.ExtensionIdentifier.equals(extension.description.identifier, container.extensionId)
                            ? index + 1
                            : container.orderDelegate
                                ? container.orderDelegate.getOrder(item.group)
                                : undefined;
                        const viewDescriptor = {
                            id: item.id,
                            name: item.name,
                            ctorDescriptor: { ctor: customView_1.CustomTreeViewPanel },
                            when: contextkey_1.ContextKeyExpr.deserialize(item.when),
                            canToggleVisibility: true,
                            collapsed: this.showCollapsed(container),
                            treeView: this.instantiationService.createInstance(customView_1.CustomTreeView, item.id, item.name, container),
                            order: order,
                            extensionId: extension.description.identifier,
                            originalContainerId: entry.key,
                            group: item.group,
                            remoteAuthority: item.remoteName || item.remoteAuthority // TODO@roblou - delete after remote extensions are updated
                        };
                        viewIds.push(viewDescriptor.id);
                        return viewDescriptor;
                    }));
                    this.viewsRegistry.registerViews(viewDescriptors, container);
                });
            }
        }
        getDefaultViewContainer() {
            return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
        }
        removeViews(extensions) {
            const removedExtensions = extensions.reduce((result, e) => { result.add(extensions_1.ExtensionIdentifier.toKey(e.description.identifier)); return result; }, new Set());
            for (const viewContainer of this.viewContainersRegistry.all) {
                const removedViews = this.viewsRegistry.getViews(viewContainer).filter((v) => v.extensionId && removedExtensions.has(extensions_1.ExtensionIdentifier.toKey(v.extensionId)));
                if (removedViews.length) {
                    this.viewsRegistry.deregisterViews(removedViews, viewContainer);
                }
            }
        }
        isValidViewDescriptors(viewDescriptors, collector) {
            if (!Array.isArray(viewDescriptors)) {
                collector.error(nls_1.localize('requirearray', "views must be an array"));
                return false;
            }
            for (let descriptor of viewDescriptors) {
                if (typeof descriptor.id !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'id'));
                    return false;
                }
                if (typeof descriptor.name !== 'string') {
                    collector.error(nls_1.localize('requirestring', "property `{0}` is mandatory and must be of type `string`", 'name'));
                    return false;
                }
                if (descriptor.when && typeof descriptor.when !== 'string') {
                    collector.error(nls_1.localize('optstring', "property `{0}` can be omitted or must be of type `string`", 'when'));
                    return false;
                }
            }
            return true;
        }
        getViewContainer(value) {
            switch (value) {
                case 'explorer': return this.viewContainersRegistry.get(files_1.VIEWLET_ID);
                case 'debug': return this.viewContainersRegistry.get(debug_1.VIEWLET_ID);
                case 'scm': return this.viewContainersRegistry.get(scm_1.VIEWLET_ID);
                case 'remote': return this.viewContainersRegistry.get(remote_contribution_1.VIEWLET_ID);
                default: return this.viewContainersRegistry.get(`workbench.view.extension.${value}`);
            }
        }
        showCollapsed(container) {
            switch (container.id) {
                case files_1.VIEWLET_ID:
                case scm_1.VIEWLET_ID:
                case debug_1.VIEWLET_ID:
                    return true;
            }
            return false;
        }
    };
    ViewsExtensionHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ViewsExtensionHandler);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(ViewsExtensionHandler, 1 /* Starting */);
});
//# sourceMappingURL=viewsExtensionPoint.js.map