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
define(["require", "exports", "vs/nls", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/activity", "vs/workbench/browser/part", "vs/workbench/browser/parts/activitybar/activitybarActions", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/activity/common/activity", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/actions/layoutActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/instantiation/common/extensions", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/configuration/common/configuration", "vs/platform/windows/common/windows", "vs/base/common/platform", "vs/platform/userDataSync/common/storageKeys", "vs/platform/userDataSync/common/userDataSync", "vs/platform/product/common/productService", "vs/base/common/codicons", "vs/css!./media/activitybarpart"], function (require, exports, nls, actionbar_1, activity_1, part_1, activitybarActions_1, viewlet_1, activity_2, layoutService_1, instantiation_1, lifecycle_1, layoutActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, dom_1, storage_1, extensions_1, uri_1, compositeBarActions_1, views_1, contextkey_1, types_1, activityBarService_1, extensions_2, network_1, environmentService_1, menubarControl_1, configuration_1, windows_1, platform_1, storageKeys_1, userDataSync_1, productService_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivitybarPart = void 0;
    let ActivitybarPart = /** @class */ (() => {
        let ActivitybarPart = class ActivitybarPart extends part_1.Part {
            constructor(viewletService, instantiationService, layoutService, themeService, storageService, extensionService, viewDescriptorService, contextKeyService, configurationService, environmentService, storageKeysSyncRegistryService, productService) {
                super("workbench.parts.activitybar" /* ACTIVITYBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
                this.viewletService = viewletService;
                this.instantiationService = instantiationService;
                this.storageService = storageService;
                this.extensionService = extensionService;
                this.viewDescriptorService = viewDescriptorService;
                this.contextKeyService = contextKeyService;
                this.configurationService = configurationService;
                this.environmentService = environmentService;
                this.productService = productService;
                //#region IView
                this.minimumWidth = 48;
                this.maximumWidth = 48;
                this.minimumHeight = 0;
                this.maximumHeight = Number.POSITIVE_INFINITY;
                this.globalActivity = [];
                this.cachedViewlets = [];
                this.compositeActions = new Map();
                this.viewletDisposables = new Map();
                storageKeysSyncRegistryService.registerStorageKey({ key: ActivitybarPart.PINNED_VIEWLETS, version: 1 });
                this.migrateFromOldCachedViewletsValue();
                this.cachedViewlets = this.getCachedViewlets();
                for (const cachedViewlet of this.cachedViewlets) {
                    if (environmentService.configuration.remoteAuthority // In remote window, hide activity bar entries until registered.
                        || this.shouldBeHidden(cachedViewlet.id, cachedViewlet)) {
                        cachedViewlet.visible = false;
                    }
                }
                const cachedItems = this.cachedViewlets
                    .map(v => ({ id: v.id, name: v.name, visible: v.visible, order: v.order, pinned: v.pinned }));
                this.compositeBar = this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, cachedItems, {
                    icon: true,
                    orientation: 2 /* VERTICAL */,
                    openComposite: (compositeId) => this.viewletService.openViewlet(compositeId, true),
                    getActivityAction: (compositeId) => this.getCompositeActions(compositeId).activityAction,
                    getCompositePinnedAction: (compositeId) => this.getCompositeActions(compositeId).pinnedAction,
                    getOnCompositeClickAction: (compositeId) => this.instantiationService.createInstance(activitybarActions_1.ToggleViewletAction, types_1.assertIsDefined(this.viewletService.getViewlet(compositeId))),
                    getContextMenuActions: () => {
                        const menuBarVisibility = windows_1.getMenuBarVisibility(this.configurationService, this.environmentService);
                        const actions = [];
                        if (menuBarVisibility === 'compact' || (menuBarVisibility === 'hidden' && platform_1.isWeb)) {
                            actions.push(this.instantiationService.createInstance(layoutActions_1.ToggleMenuBarAction, layoutActions_1.ToggleMenuBarAction.ID, menuBarVisibility === 'compact' ? nls.localize('hideMenu', "Hide Menu") : nls.localize('showMenu', "Show Menu")));
                        }
                        actions.push(this.instantiationService.createInstance(layoutActions_1.ToggleActivityBarVisibilityAction, layoutActions_1.ToggleActivityBarVisibilityAction.ID, nls.localize('hideActivitBar', "Hide Activity Bar")));
                        return actions;
                    },
                    getContextMenuActionsForComposite: () => [],
                    getDefaultCompositeId: () => this.viewletService.getDefaultViewletId(),
                    hidePart: () => this.layoutService.setSideBarHidden(true),
                    dndHandler: new compositeBar_1.CompositeDragAndDrop(this.viewDescriptorService, views_1.ViewContainerLocation.Sidebar, (id, focus) => this.viewletService.openViewlet(id, focus), (from, to, before) => this.compositeBar.move(from, to, before === null || before === void 0 ? void 0 : before.verticallyBefore)),
                    compositeSize: 52,
                    colors: (theme) => this.getActivitybarItemColors(theme),
                    overflowActionSize: ActivitybarPart.ACTION_HEIGHT
                }));
                this.registerListeners();
                this.onDidRegisterViewlets(viewletService.getViewlets());
            }
            registerListeners() {
                // Viewlet registration
                this._register(this.viewletService.onDidViewletRegister(viewlet => this.onDidRegisterViewlets([viewlet])));
                this._register(this.viewletService.onDidViewletDeregister(({ id }) => this.onDidDeregisterViewlet(id)));
                // Activate viewlet action on opening of a viewlet
                this._register(this.viewletService.onDidViewletOpen(viewlet => this.onDidViewletOpen(viewlet)));
                // Deactivate viewlet action on close
                this._register(this.viewletService.onDidViewletClose(viewlet => this.compositeBar.deactivateComposite(viewlet.getId())));
                // Extension registration
                let disposables = this._register(new lifecycle_1.DisposableStore());
                this._register(this.extensionService.onDidRegisterExtensions(() => {
                    disposables.clear();
                    this.onDidRegisterExtensions();
                    this.compositeBar.onDidChange(() => this.saveCachedViewlets(), this, disposables);
                    this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e), this, disposables);
                }));
                // Register for configuration changes
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('window.menuBarVisibility')) {
                        if (windows_1.getMenuBarVisibility(this.configurationService, this.environmentService) === 'compact') {
                            this.installMenubar();
                        }
                        else {
                            this.uninstallMenubar();
                        }
                    }
                }));
            }
            onDidRegisterExtensions() {
                this.removeNotExistingComposites();
                this.saveCachedViewlets();
            }
            onDidViewletOpen(viewlet) {
                // Update the composite bar by adding
                const foundViewlet = this.viewletService.getViewlet(viewlet.getId());
                if (foundViewlet) {
                    this.compositeBar.addComposite(foundViewlet);
                }
                this.compositeBar.activateComposite(viewlet.getId());
                const viewletDescriptor = this.viewletService.getViewlet(viewlet.getId());
                if (viewletDescriptor) {
                    const viewContainer = this.getViewContainer(viewletDescriptor.id);
                    if (viewContainer === null || viewContainer === void 0 ? void 0 : viewContainer.hideIfEmpty) {
                        const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                        if (viewContainerModel.activeViewDescriptors.length === 0) {
                            this.hideComposite(viewletDescriptor.id); // Update the composite bar by hiding
                        }
                    }
                }
            }
            showActivity(viewletOrActionId, badge, clazz, priority) {
                if (this.viewletService.getViewlet(viewletOrActionId)) {
                    return this.compositeBar.showActivity(viewletOrActionId, badge, clazz, priority);
                }
                if (viewletOrActionId === activity_1.GLOBAL_ACTIVITY_ID) {
                    return this.showGlobalActivity(badge, clazz, priority);
                }
                return lifecycle_1.Disposable.None;
            }
            showGlobalActivity(badge, clazz, priority) {
                if (typeof priority !== 'number') {
                    priority = 0;
                }
                const activity = { badge, clazz, priority };
                for (let i = 0; i <= this.globalActivity.length; i++) {
                    if (i === this.globalActivity.length) {
                        this.globalActivity.push(activity);
                        break;
                    }
                    else if (this.globalActivity[i].priority <= priority) {
                        this.globalActivity.splice(i, 0, activity);
                        break;
                    }
                }
                this.updateGlobalActivity();
                return lifecycle_1.toDisposable(() => this.removeGlobalActivity(activity));
            }
            removeGlobalActivity(activity) {
                const index = this.globalActivity.indexOf(activity);
                if (index !== -1) {
                    this.globalActivity.splice(index, 1);
                    this.updateGlobalActivity();
                }
            }
            updateGlobalActivity() {
                const globalActivityAction = types_1.assertIsDefined(this.globalActivityAction);
                if (this.globalActivity.length) {
                    const [{ badge, clazz, priority }] = this.globalActivity;
                    if (badge instanceof activity_2.NumberBadge && this.globalActivity.length > 1) {
                        const cumulativeNumberBadge = this.getCumulativeNumberBadge(priority);
                        globalActivityAction.setBadge(cumulativeNumberBadge);
                    }
                    else {
                        globalActivityAction.setBadge(badge, clazz);
                    }
                }
                else {
                    globalActivityAction.setBadge(undefined);
                }
            }
            getCumulativeNumberBadge(priority) {
                const numberActivities = this.globalActivity.filter(activity => activity.badge instanceof activity_2.NumberBadge && activity.priority === priority);
                let number = numberActivities.reduce((result, activity) => { return result + activity.badge.number; }, 0);
                let descriptorFn = () => {
                    return numberActivities.reduce((result, activity, index) => {
                        result = result + activity.badge.getDescription();
                        if (index < numberActivities.length - 1) {
                            result = result + '\n';
                        }
                        return result;
                    }, '');
                };
                return new activity_2.NumberBadge(number, descriptorFn);
            }
            uninstallMenubar() {
                if (this.menuBar) {
                    this.menuBar.dispose();
                }
                if (this.menuBarContainer) {
                    dom_1.removeNode(this.menuBarContainer);
                }
            }
            installMenubar() {
                this.menuBarContainer = document.createElement('div');
                dom_1.addClass(this.menuBarContainer, 'menubar');
                const content = types_1.assertIsDefined(this.content);
                content.prepend(this.menuBarContainer);
                // Menubar: install a custom menu bar depending on configuration
                this.menuBar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
                this.menuBar.create(this.menuBarContainer);
            }
            createContentArea(parent) {
                var _a;
                this.element = parent;
                this.content = document.createElement('div');
                dom_1.addClass(this.content, 'content');
                parent.appendChild(this.content);
                // Home action bar
                const homeIndicator = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.homeIndicator;
                if (homeIndicator) {
                    let codicon = codicons_1.iconRegistry.get(homeIndicator.icon);
                    if (!codicon) {
                        console.warn(`Unknown home indicator icon ${homeIndicator.icon}`);
                        codicon = codicons_1.Codicon.code;
                    }
                    this.createHomeBar(homeIndicator.command, homeIndicator.title, codicon);
                }
                // Install menubar if compact
                if (windows_1.getMenuBarVisibility(this.configurationService, this.environmentService) === 'compact') {
                    this.installMenubar();
                }
                // Viewlets action bar
                this.compositeBar.create(this.content);
                // Global action bar
                const globalActivities = document.createElement('div');
                dom_1.addClass(globalActivities, 'global-activity');
                this.content.appendChild(globalActivities);
                this.createGlobalActivityActionBar(globalActivities);
                return this.content;
            }
            createHomeBar(command, title, icon) {
                this.homeBarContainer = document.createElement('div');
                this.homeBarContainer.setAttribute('aria-label', nls.localize('homeIndicator', "Home"));
                this.homeBarContainer.setAttribute('role', 'toolbar');
                dom_1.addClass(this.homeBarContainer, 'home-bar');
                this.homeBar = this._register(new actionbar_1.ActionBar(this.homeBarContainer, {
                    orientation: 2 /* VERTICAL */,
                    animated: false
                }));
                const homeBarIconBadge = document.createElement('div');
                dom_1.addClass(homeBarIconBadge, 'home-bar-icon-badge');
                this.homeBarContainer.appendChild(homeBarIconBadge);
                this.homeBar.push(this._register(this.instantiationService.createInstance(activitybarActions_1.HomeAction, command, title, icon)), { icon: true, label: false });
                const content = types_1.assertIsDefined(this.content);
                content.prepend(this.homeBarContainer);
            }
            updateStyles() {
                super.updateStyles();
                const container = types_1.assertIsDefined(this.getContainer());
                const background = this.getColor(theme_1.ACTIVITY_BAR_BACKGROUND) || '';
                container.style.backgroundColor = background;
                const borderColor = this.getColor(theme_1.ACTIVITY_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder) || '';
                const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* LEFT */;
                container.style.boxSizing = borderColor && isPositionLeft ? 'border-box' : '';
                container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : '';
                container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : '';
                container.style.borderRightColor = isPositionLeft ? borderColor : '';
                container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : '';
                container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : '';
                container.style.borderLeftColor = !isPositionLeft ? borderColor : '';
            }
            getActivitybarItemColors(theme) {
                return {
                    activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND),
                    activeBorderColor: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER),
                    activeBackground: theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND),
                    badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                    badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                    dragAndDropBackground: theme.getColor(theme_1.ACTIVITY_BAR_DRAG_AND_DROP_BACKGROUND),
                    activeBackgroundColor: undefined, inactiveBackgroundColor: undefined, activeBorderBottomColor: undefined,
                };
            }
            createGlobalActivityActionBar(container) {
                this.globalActivityActionBar = this._register(new actionbar_1.ActionBar(container, {
                    actionViewItemProvider: action => {
                        if (action.id === 'workbench.actions.manage') {
                            return this.instantiationService.createInstance(activitybarActions_1.GlobalActivityActionViewItem, action, (theme) => this.getActivitybarItemColors(theme));
                        }
                        if (action.id === 'workbench.actions.accounts') {
                            return this.instantiationService.createInstance(activitybarActions_1.AccountsActionViewItem, action, (theme) => this.getActivitybarItemColors(theme));
                        }
                        throw new Error(`No view item for action '${action.id}'`);
                    },
                    orientation: 2 /* VERTICAL */,
                    ariaLabel: nls.localize('manage', "Manage"),
                    animated: false
                }));
                this.globalActivityAction = new compositeBarActions_1.ActivityAction({
                    id: 'workbench.actions.manage',
                    name: nls.localize('manage', "Manage"),
                    cssClass: codicons_1.Codicon.settingsGear.classNames
                });
                if (userDataSync_1.getUserDataSyncStore(this.productService, this.configurationService)) {
                    const profileAction = new compositeBarActions_1.ActivityAction({
                        id: 'workbench.actions.accounts',
                        name: nls.localize('accounts', "Accounts"),
                        cssClass: codicons_1.Codicon.account.classNames
                    });
                    this.globalActivityActionBar.push(profileAction);
                }
                this.globalActivityActionBar.push(this.globalActivityAction);
            }
            getCompositeActions(compositeId) {
                let compositeActions = this.compositeActions.get(compositeId);
                if (!compositeActions) {
                    const viewlet = this.viewletService.getViewlet(compositeId);
                    if (viewlet) {
                        compositeActions = {
                            activityAction: this.instantiationService.createInstance(activitybarActions_1.ViewletActivityAction, viewlet),
                            pinnedAction: new compositeBarActions_1.ToggleCompositePinnedAction(viewlet, this.compositeBar)
                        };
                    }
                    else {
                        const cachedComposite = this.cachedViewlets.filter(c => c.id === compositeId)[0];
                        compositeActions = {
                            activityAction: this.instantiationService.createInstance(activitybarActions_1.PlaceHolderViewletActivityAction, compositeId, cachedComposite === null || cachedComposite === void 0 ? void 0 : cachedComposite.icon),
                            pinnedAction: new activitybarActions_1.PlaceHolderToggleCompositePinnedAction(compositeId, this.compositeBar)
                        };
                    }
                    this.compositeActions.set(compositeId, compositeActions);
                }
                return compositeActions;
            }
            onDidRegisterViewlets(viewlets) {
                for (const viewlet of viewlets) {
                    const cachedViewlet = this.cachedViewlets.filter(({ id }) => id === viewlet.id)[0];
                    const activeViewlet = this.viewletService.getActiveViewlet();
                    const isActive = (activeViewlet === null || activeViewlet === void 0 ? void 0 : activeViewlet.getId()) === viewlet.id;
                    if (isActive || !this.shouldBeHidden(viewlet.id, cachedViewlet)) {
                        this.compositeBar.addComposite(viewlet);
                        // Pin it by default if it is new
                        if (!cachedViewlet) {
                            this.compositeBar.pin(viewlet.id);
                        }
                        if (isActive) {
                            this.compositeBar.activateComposite(viewlet.id);
                        }
                    }
                }
                for (const viewlet of viewlets) {
                    const viewContainer = this.getViewContainer(viewlet.id);
                    const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                    this.updateActivity(viewContainer, viewContainerModel);
                    this.onDidChangeActiveViews(viewContainer, viewContainerModel);
                    const disposables = new lifecycle_1.DisposableStore();
                    disposables.add(viewContainerModel.onDidChangeContainerInfo(() => this.updateActivity(viewContainer, viewContainerModel)));
                    disposables.add(viewContainerModel.onDidChangeActiveViewDescriptors(() => this.onDidChangeActiveViews(viewContainer, viewContainerModel)));
                    this.viewletDisposables.set(viewlet.id, disposables);
                }
            }
            onDidDeregisterViewlet(viewletId) {
                const disposable = this.viewletDisposables.get(viewletId);
                if (disposable) {
                    disposable.dispose();
                }
                this.viewletDisposables.delete(viewletId);
                this.hideComposite(viewletId);
            }
            updateActivity(viewContainer, viewContainerModel) {
                var _a;
                const activity = {
                    id: viewContainer.id,
                    name: viewContainerModel.title,
                    iconUrl: uri_1.URI.isUri(viewContainerModel.icon) ? viewContainerModel.icon : undefined,
                    cssClass: types_1.isString(viewContainerModel.icon) ? viewContainerModel.icon : undefined,
                    keybindingId: ((_a = viewContainer.focusCommand) === null || _a === void 0 ? void 0 : _a.id) || viewContainer.id
                };
                const { activityAction, pinnedAction } = this.getCompositeActions(viewContainer.id);
                activityAction.setActivity(activity);
                if (pinnedAction instanceof activitybarActions_1.PlaceHolderToggleCompositePinnedAction) {
                    pinnedAction.setActivity(activity);
                }
                this.saveCachedViewlets();
            }
            onDidChangeActiveViews(viewContainer, viewContainerModel) {
                if (viewContainerModel.activeViewDescriptors.length) {
                    this.compositeBar.addComposite(viewContainer);
                }
                else if (viewContainer.hideIfEmpty) {
                    this.hideComposite(viewContainer.id);
                }
            }
            shouldBeHidden(viewletId, cachedViewlet) {
                const viewContainer = this.getViewContainer(viewletId);
                if (!viewContainer || !viewContainer.hideIfEmpty) {
                    return false;
                }
                return (cachedViewlet === null || cachedViewlet === void 0 ? void 0 : cachedViewlet.views) && cachedViewlet.views.length
                    ? cachedViewlet.views.every(({ when }) => !!when && !this.contextKeyService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(when)))
                    : viewletId === views_1.TEST_VIEW_CONTAINER_ID /* Hide Test viewlet for the first time or it had no views registered before */;
            }
            removeNotExistingComposites() {
                const viewlets = this.viewletService.getViewlets();
                for (const { id } of this.cachedViewlets) {
                    if (viewlets.every(viewlet => viewlet.id !== id)) {
                        this.hideComposite(id);
                    }
                }
            }
            hideComposite(compositeId) {
                this.compositeBar.hideComposite(compositeId);
                const compositeActions = this.compositeActions.get(compositeId);
                if (compositeActions) {
                    compositeActions.activityAction.dispose();
                    compositeActions.pinnedAction.dispose();
                    this.compositeActions.delete(compositeId);
                }
            }
            getPinnedViewletIds() {
                const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(v => v.id);
                return this.viewletService.getViewlets()
                    .filter(v => this.compositeBar.isPinned(v.id))
                    .sort((v1, v2) => pinnedCompositeIds.indexOf(v1.id) - pinnedCompositeIds.indexOf(v2.id))
                    .map(v => v.id);
            }
            layout(width, height) {
                if (!this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */)) {
                    return;
                }
                // Layout contents
                const contentAreaSize = super.layoutContents(width, height).contentSize;
                // Layout composite bar
                let availableHeight = contentAreaSize.height;
                if (this.homeBarContainer) {
                    availableHeight -= this.homeBarContainer.clientHeight;
                }
                if (this.menuBarContainer) {
                    availableHeight -= this.menuBarContainer.clientHeight;
                }
                if (this.globalActivityActionBar) {
                    availableHeight -= (this.globalActivityActionBar.viewItems.length * ActivitybarPart.ACTION_HEIGHT); // adjust height for global actions showing
                }
                this.compositeBar.layout(new dom_1.Dimension(width, availableHeight));
            }
            getViewContainer(viewletId) {
                return this.viewDescriptorService.getViewContainerById(viewletId) || undefined;
            }
            onDidStorageChange(e) {
                if (e.key === ActivitybarPart.PINNED_VIEWLETS && e.scope === 0 /* GLOBAL */
                    && this.pinnedViewletsValue !== this.getStoredPinnedViewletsValue() /* This checks if current window changed the value or not */) {
                    this._pinnedViewletsValue = undefined;
                    const newCompositeItems = [];
                    const compositeItems = this.compositeBar.getCompositeBarItems();
                    const cachedViewlets = this.getCachedViewlets();
                    for (const cachedViewlet of cachedViewlets) {
                        // Add and update existing items
                        const existingItem = compositeItems.filter(({ id }) => id === cachedViewlet.id)[0];
                        if (existingItem) {
                            newCompositeItems.push({
                                id: existingItem.id,
                                name: existingItem.name,
                                order: existingItem.order,
                                pinned: cachedViewlet.pinned,
                                visible: existingItem.visible
                            });
                        }
                    }
                    for (let index = 0; index < compositeItems.length; index++) {
                        // Add items currently exists but does not exist in new.
                        if (!newCompositeItems.some(({ id }) => id === compositeItems[index].id)) {
                            newCompositeItems.splice(index, 0, compositeItems[index]);
                        }
                    }
                    this.compositeBar.setCompositeBarItems(newCompositeItems);
                }
            }
            saveCachedViewlets() {
                const state = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                for (const compositeItem of compositeItems) {
                    const viewContainer = this.getViewContainer(compositeItem.id);
                    if (viewContainer) {
                        const viewContainerModel = this.viewDescriptorService.getViewContainerModel(viewContainer);
                        const views = [];
                        for (const { when } of viewContainerModel.allViewDescriptors) {
                            views.push({ when: when ? when.serialize() : undefined });
                        }
                        const cacheIcon = uri_1.URI.isUri(viewContainerModel.icon) ? viewContainerModel.icon.scheme === network_1.Schemas.file : true;
                        state.push({
                            id: compositeItem.id,
                            name: viewContainerModel.title,
                            icon: cacheIcon ? viewContainerModel.icon : undefined,
                            views,
                            pinned: compositeItem.pinned,
                            order: compositeItem.order,
                            visible: compositeItem.visible
                        });
                    }
                    else {
                        state.push({ id: compositeItem.id, pinned: compositeItem.pinned, order: compositeItem.order, visible: false });
                    }
                }
                this.storeCachedViewletsState(state);
            }
            getCachedViewlets() {
                const cachedViewlets = this.getPinnedViewlets();
                for (const placeholderViewlet of this.getPlaceholderViewlets()) {
                    const cachedViewlet = cachedViewlets.filter(cached => cached.id === placeholderViewlet.id)[0];
                    if (cachedViewlet) {
                        cachedViewlet.name = placeholderViewlet.name;
                        cachedViewlet.icon = placeholderViewlet.iconCSS ? placeholderViewlet.iconCSS :
                            placeholderViewlet.iconUrl ? uri_1.URI.revive(placeholderViewlet.iconUrl) : undefined;
                        cachedViewlet.views = placeholderViewlet.views;
                    }
                }
                return cachedViewlets;
            }
            storeCachedViewletsState(cachedViewlets) {
                this.setPinnedViewlets(cachedViewlets.map(({ id, pinned, visible, order }) => ({
                    id,
                    pinned,
                    visible,
                    order
                })));
                this.setPlaceholderViewlets(cachedViewlets.map(({ id, icon, name, views }) => ({
                    id,
                    iconUrl: uri_1.URI.isUri(icon) ? icon : undefined,
                    iconCSS: types_1.isString(icon) ? icon : undefined,
                    name,
                    views
                })));
            }
            getPinnedViewlets() {
                return JSON.parse(this.pinnedViewletsValue);
            }
            setPinnedViewlets(pinnedViewlets) {
                this.pinnedViewletsValue = JSON.stringify(pinnedViewlets);
            }
            get pinnedViewletsValue() {
                if (!this._pinnedViewletsValue) {
                    this._pinnedViewletsValue = this.getStoredPinnedViewletsValue();
                }
                return this._pinnedViewletsValue;
            }
            set pinnedViewletsValue(pinnedViewletsValue) {
                if (this.pinnedViewletsValue !== pinnedViewletsValue) {
                    this._pinnedViewletsValue = pinnedViewletsValue;
                    this.setStoredPinnedViewletsValue(pinnedViewletsValue);
                }
            }
            getStoredPinnedViewletsValue() {
                return this.storageService.get(ActivitybarPart.PINNED_VIEWLETS, 0 /* GLOBAL */, '[]');
            }
            setStoredPinnedViewletsValue(value) {
                this.storageService.store(ActivitybarPart.PINNED_VIEWLETS, value, 0 /* GLOBAL */);
            }
            getPlaceholderViewlets() {
                return JSON.parse(this.placeholderViewletsValue);
            }
            setPlaceholderViewlets(placeholderViewlets) {
                this.placeholderViewletsValue = JSON.stringify(placeholderViewlets);
            }
            get placeholderViewletsValue() {
                if (!this._placeholderViewletsValue) {
                    this._placeholderViewletsValue = this.getStoredPlaceholderViewletsValue();
                }
                return this._placeholderViewletsValue;
            }
            set placeholderViewletsValue(placeholderViewletsValue) {
                if (this.placeholderViewletsValue !== placeholderViewletsValue) {
                    this._placeholderViewletsValue = placeholderViewletsValue;
                    this.setStoredPlaceholderViewletsValue(placeholderViewletsValue);
                }
            }
            getStoredPlaceholderViewletsValue() {
                return this.storageService.get(ActivitybarPart.PLACEHOLDER_VIEWLETS, 0 /* GLOBAL */, '[]');
            }
            setStoredPlaceholderViewletsValue(value) {
                this.storageService.store(ActivitybarPart.PLACEHOLDER_VIEWLETS, value, 0 /* GLOBAL */);
            }
            migrateFromOldCachedViewletsValue() {
                const value = this.storageService.get('workbench.activity.pinnedViewlets', 0 /* GLOBAL */);
                if (value !== undefined) {
                    const storedStates = JSON.parse(value);
                    const cachedViewlets = storedStates.map(c => {
                        const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true, name: undefined, icon: undefined, views: undefined } : c;
                        serialized.visible = types_1.isUndefinedOrNull(serialized.visible) ? true : serialized.visible;
                        return serialized;
                    });
                    this.storeCachedViewletsState(cachedViewlets);
                    this.storageService.remove('workbench.activity.pinnedViewlets', 0 /* GLOBAL */);
                }
            }
            toJSON() {
                return {
                    type: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */
                };
            }
        };
        ActivitybarPart.ACTION_HEIGHT = 48;
        ActivitybarPart.PINNED_VIEWLETS = 'workbench.activity.pinnedViewlets2';
        ActivitybarPart.PLACEHOLDER_VIEWLETS = 'workbench.activity.placeholderViewlets';
        ActivitybarPart = __decorate([
            __param(0, viewlet_1.IViewletService),
            __param(1, instantiation_1.IInstantiationService),
            __param(2, layoutService_1.IWorkbenchLayoutService),
            __param(3, themeService_1.IThemeService),
            __param(4, storage_1.IStorageService),
            __param(5, extensions_1.IExtensionService),
            __param(6, views_1.IViewDescriptorService),
            __param(7, contextkey_1.IContextKeyService),
            __param(8, configuration_1.IConfigurationService),
            __param(9, environmentService_1.IWorkbenchEnvironmentService),
            __param(10, storageKeys_1.IStorageKeysSyncRegistryService),
            __param(11, productService_1.IProductService)
        ], ActivitybarPart);
        return ActivitybarPart;
    })();
    exports.ActivitybarPart = ActivitybarPart;
    extensions_2.registerSingleton(activityBarService_1.IActivityBarService, ActivitybarPart);
});
//# sourceMappingURL=activitybarPart.js.map