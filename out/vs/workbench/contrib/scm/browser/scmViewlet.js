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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/common/scm", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./menus", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/base/common/process", "vs/workbench/contrib/scm/browser/repositoryPanel", "vs/workbench/contrib/scm/browser/mainPanel", "vs/css!./media/scmViewlet"], function (require, exports, nls_1, event_1, dom_1, telemetry_1, scm_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, menuEntryActionViewItem_1, menus_1, themeService_1, storage_1, configuration_1, notification_1, layoutService_1, viewsViewlet_1, extensions_1, workspace_1, views_1, platform_1, process_1, repositoryPanel_1, mainPanel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SCMViewlet = class SCMViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, scmService, instantiationService, contextViewService, keybindingService, notificationService, contextMenuService, themeService, commandService, storageService, configurationService, extensionService, contextService, contextKeyService) {
            super(scm_1.VIEWLET_ID, SCMViewlet.STATE_KEY, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.scmService = scmService;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this.themeService = themeService;
            this.commandService = commandService;
            this.contextService = contextService;
            this._repositories = [];
            this.viewDescriptors = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this._height = undefined;
            this.menus = instantiationService.createInstance(menus_1.SCMMenus, undefined);
            this._register(this.menus.onDidChangeTitle(this.updateTitleArea, this));
            this.message = dom_1.$('.empty-message', { tabIndex: 0 }, nls_1.localize('no open repo', "No source control providers registered."));
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            viewsRegistry.registerViews([new mainPanel_1.MainPanelDescriptor(this)], scm_1.VIEW_CONTAINER);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.alwaysShowProviders') && configurationService.getValue('scm.alwaysShowProviders')) {
                    this.viewsModel.setVisible(mainPanel_1.MainPanel.ID, true);
                }
            }));
            this.repositoryCountKey = contextKeyService.createKey('scm.providerCount', 0);
            this._register(this.viewsModel.onDidRemove(this.onDidHideView, this));
        }
        get height() { return this._height; }
        get repositories() {
            return this._repositories;
        }
        get visibleRepositories() {
            return this.panels.filter(panel => panel instanceof repositoryPanel_1.RepositoryPanel)
                .map(panel => panel.repository);
        }
        get onDidChangeVisibleRepositories() {
            const modificationEvent = event_1.Event.debounce(event_1.Event.any(this.viewsModel.onDidAdd, this.viewsModel.onDidRemove), () => null, 0);
            return event_1.Event.map(modificationEvent, () => this.visibleRepositories);
        }
        create(parent) {
            super.create(parent);
            this.el = parent;
            dom_1.addClasses(parent, 'scm-viewlet', 'empty');
            dom_1.append(parent, this.message);
            this._register(this.scmService.onDidAddRepository(this.onDidAddRepository, this));
            this._register(this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this));
            this.scmService.repositories.forEach(r => this.onDidAddRepository(r));
        }
        onDidAddRepository(repository) {
            const index = this._repositories.length;
            this._repositories.push(repository);
            const viewDescriptor = new repositoryPanel_1.RepositoryViewDescriptor(repository, false);
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([viewDescriptor], scm_1.VIEW_CONTAINER);
            this.viewDescriptors.push(viewDescriptor);
            this._onDidSplice.fire({ index, deleteCount: 0, elements: [repository] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidRemoveRepository(repository) {
            const index = this._repositories.indexOf(repository);
            if (index === -1) {
                return;
            }
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).deregisterViews([this.viewDescriptors[index]], scm_1.VIEW_CONTAINER);
            this._repositories.splice(index, 1);
            this.viewDescriptors.splice(index, 1);
            this._onDidSplice.fire({ index, deleteCount: 1, elements: [] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidChangeRepositories() {
            const repositoryCount = this.repositories.length;
            dom_1.toggleClass(this.el, 'empty', repositoryCount === 0);
            this.repositoryCountKey.set(repositoryCount);
        }
        onDidHideView() {
            process_1.nextTick(() => {
                if (this.repositoryCountKey.get() > 0 && this.viewDescriptors.every(d => !this.viewsModel.isVisible(d.id))) {
                    this.viewsModel.setVisible(this.viewDescriptors[0].id, true);
                }
            });
        }
        focus() {
            if (this.repositoryCountKey.get() === 0) {
                this.message.focus();
            }
            else {
                const repository = this.visibleRepositories[0];
                if (repository) {
                    const panel = this.panels
                        .filter(panel => panel instanceof repositoryPanel_1.RepositoryPanel && panel.repository === repository)[0];
                    if (panel) {
                        panel.focus();
                    }
                    else {
                        super.focus();
                    }
                }
                else {
                    super.focus();
                }
            }
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            const title = nls_1.localize('source control', "Source Control");
            if (this.visibleRepositories.length === 1) {
                const [repository] = this.repositories;
                return nls_1.localize('viewletTitle', "{0}: {1}", title, repository.provider.label);
            }
            else {
                return title;
            }
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActions() {
            if (this.repositories.length > 0) {
                return super.getActions();
            }
            return this.menus.getTitleActions();
        }
        getSecondaryActions() {
            if (this.repositories.length > 0) {
                return super.getSecondaryActions();
            }
            return this.menus.getTitleSecondaryActions();
        }
        getActionsContext() {
            if (this.visibleRepositories.length === 1) {
                return this.repositories[0].provider;
            }
        }
        setVisibleRepositories(repositories) {
            const visibleViewDescriptors = this.viewsModel.visibleViewDescriptors;
            const toSetVisible = this.viewsModel.viewDescriptors
                .filter((d) => d instanceof repositoryPanel_1.RepositoryViewDescriptor && repositories.indexOf(d.repository) > -1 && visibleViewDescriptors.indexOf(d) === -1);
            const toSetInvisible = visibleViewDescriptors
                .filter((d) => d instanceof repositoryPanel_1.RepositoryViewDescriptor && repositories.indexOf(d.repository) === -1);
            let size;
            const oneToOne = toSetVisible.length === 1 && toSetInvisible.length === 1;
            for (const viewDescriptor of toSetInvisible) {
                if (oneToOne) {
                    const panel = this.panels.filter(panel => panel.id === viewDescriptor.id)[0];
                    if (panel) {
                        size = this.getPanelSize(panel);
                    }
                }
                viewDescriptor.repository.setSelected(false);
                this.viewsModel.setVisible(viewDescriptor.id, false);
            }
            for (const viewDescriptor of toSetVisible) {
                viewDescriptor.repository.setSelected(true);
                this.viewsModel.setVisible(viewDescriptor.id, true, size);
            }
        }
    };
    SCMViewlet.STATE_KEY = 'workbench.scm.views.state';
    SCMViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, scm_1.ISCMService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, themeService_1.IThemeService),
        __param(9, commands_1.ICommandService),
        __param(10, storage_1.IStorageService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, extensions_1.IExtensionService),
        __param(13, workspace_1.IWorkspaceContextService),
        __param(14, contextkey_1.IContextKeyService)
    ], SCMViewlet);
    exports.SCMViewlet = SCMViewlet;
});
//# sourceMappingURL=scmViewlet.js.map