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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/common/activity", "vs/platform/registry/common/platform", "vs/workbench/browser/part", "vs/workbench/browser/parts/activitybar/activitybarActions", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/workbench/browser/actions/layoutActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/workbench/services/activityBar/browser/activityBarService", "vs/platform/instantiation/common/extensions", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/configuration/common/configuration", "vs/css!./media/activitybarpart"], function (require, exports, nls, errors_1, actionbar_1, activity_1, platform_1, part_1, activitybarActions_1, viewlet_1, layoutService_1, instantiation_1, lifecycle_1, layoutActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, dom_1, storage_1, extensions_1, uri_1, compositeBarActions_1, views_1, contextkey_1, types_1, activityBarService_1, extensions_2, network_1, environmentService_1, menubarControl_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ActivitybarPart = class ActivitybarPart extends part_1.Part {
        constructor(viewletService, instantiationService, layoutService, themeService, storageService, extensionService, viewsService, contextKeyService, configurationService, workbenchEnvironmentService) {
            super("workbench.parts.activitybar" /* ACTIVITYBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.viewletService = viewletService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.viewsService = viewsService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            //#region IView
            this.minimumWidth = 48;
            this.maximumWidth = 48;
            this.minimumHeight = 0;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.cachedViewlets = [];
            this.compositeActions = new Map();
            this.viewletDisposables = new Map();
            this.cachedViewlets = this.getCachedViewlets();
            for (const cachedViewlet of this.cachedViewlets) {
                if (workbenchEnvironmentService.configuration.remoteAuthority // In remote window, hide activity bar entries until registered.
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
                getOnCompositeClickAction: (compositeId) => this.instantiationService.createInstance(activitybarActions_1.ToggleViewletAction, this.viewletService.getViewlet(compositeId)),
                getContextMenuActions: () => [this.instantiationService.createInstance(layoutActions_1.ToggleActivityBarVisibilityAction, layoutActions_1.ToggleActivityBarVisibilityAction.ID, nls.localize('hideActivitBar', "Hide Activity Bar"))],
                getDefaultCompositeId: () => this.viewletService.getDefaultViewletId(),
                hidePart: () => this.layoutService.setSideBarHidden(true),
                compositeSize: 50,
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
                    if (this.configurationService.getValue('window.menuBarVisibility') === 'compact') {
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
                if (viewContainer && viewContainer.hideIfEmpty) {
                    const viewDescriptors = this.viewsService.getViewDescriptors(viewContainer);
                    if (viewDescriptors && viewDescriptors.activeViewDescriptors.length === 0) {
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
                return this.showGlobalActivity(badge, clazz);
            }
            throw errors_1.illegalArgument('globalActivityId');
        }
        showGlobalActivity(badge, clazz) {
            this.globalActivityAction.setBadge(badge, clazz);
            return lifecycle_1.toDisposable(() => this.globalActivityAction.setBadge(undefined));
        }
        uninstallMenubar() {
            if (this.customMenubar) {
                this.customMenubar.dispose();
            }
            if (this.menubar) {
                dom_1.removeNode(this.menubar);
            }
        }
        installMenubar() {
            this.menubar = document.createElement('div');
            dom_1.addClass(this.menubar, 'menubar');
            this.content.prepend(this.menubar);
            // Menubar: install a custom menu bar depending on configuration
            this.customMenubar = this._register(this.instantiationService.createInstance(menubarControl_1.CustomMenubarControl));
            this.customMenubar.create(this.menubar);
        }
        createContentArea(parent) {
            this.element = parent;
            this.content = document.createElement('div');
            dom_1.addClass(this.content, 'content');
            parent.appendChild(this.content);
            // Install menubar if compact
            if (this.configurationService.getValue('window.menuBarVisibility') === 'compact') {
                this.installMenubar();
            }
            // Viewlets action bar
            this.compositeBar.create(this.content);
            // Global action bar
            const globalActivities = document.createElement('div');
            dom_1.addClass(globalActivities, 'global-activity');
            this.content.appendChild(globalActivities);
            this.createGlobalActivityActionBar(globalActivities);
            this.element.style.display = this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */) ? null : 'none';
            return this.content;
        }
        updateStyles() {
            super.updateStyles();
            // Part container
            const container = this.getContainer();
            const background = this.getColor(theme_1.ACTIVITY_BAR_BACKGROUND);
            container.style.backgroundColor = background;
            const borderColor = this.getColor(theme_1.ACTIVITY_BAR_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const isPositionLeft = this.layoutService.getSideBarPosition() === 0 /* LEFT */;
            container.style.boxSizing = borderColor && isPositionLeft ? 'border-box' : '';
            container.style.borderRightWidth = borderColor && isPositionLeft ? '1px' : null;
            container.style.borderRightStyle = borderColor && isPositionLeft ? 'solid' : null;
            container.style.borderRightColor = isPositionLeft ? borderColor : null;
            container.style.borderLeftWidth = borderColor && !isPositionLeft ? '1px' : null;
            container.style.borderLeftStyle = borderColor && !isPositionLeft ? 'solid' : null;
            container.style.borderLeftColor = !isPositionLeft ? borderColor : null;
        }
        getActivitybarItemColors(theme) {
            return {
                activeForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND),
                inactiveForegroundColor: theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND),
                badgeBackground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND),
                badgeForeground: theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND),
                dragAndDropBackground: theme.getColor(theme_1.ACTIVITY_BAR_DRAG_AND_DROP_BACKGROUND),
                activeBackgroundColor: undefined, inactiveBackgroundColor: undefined, activeBorderBottomColor: undefined,
            };
        }
        createGlobalActivityActionBar(container) {
            this.globalActivityActionBar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: a => this.instantiationService.createInstance(activitybarActions_1.GlobalActivityActionViewItem, a, (theme) => this.getActivitybarItemColors(theme)),
                orientation: 2 /* VERTICAL */,
                ariaLabel: nls.localize('manage', "Manage"),
                animated: false
            }));
            this.globalActivityAction = new compositeBarActions_1.ActivityAction({
                id: 'workbench.actions.manage',
                name: nls.localize('manage', "Manage"),
                cssClass: 'update-activity'
            });
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
                        activityAction: this.instantiationService.createInstance(activitybarActions_1.PlaceHolderViewletActivityAction, compositeId, cachedComposite && cachedComposite.name ? cachedComposite.name : compositeId, cachedComposite && cachedComposite.iconUrl ? uri_1.URI.revive(cachedComposite.iconUrl) : undefined),
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
                const isActive = activeViewlet && activeViewlet.getId() === viewlet.id;
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
                this.enableCompositeActions(viewlet);
                const viewContainer = this.getViewContainer(viewlet.id);
                if (viewContainer && viewContainer.hideIfEmpty) {
                    const viewDescriptors = this.viewsService.getViewDescriptors(viewContainer);
                    if (viewDescriptors) {
                        this.onDidChangeActiveViews(viewlet, viewDescriptors);
                        this.viewletDisposables.set(viewlet.id, viewDescriptors.onDidChangeActiveViews(() => this.onDidChangeActiveViews(viewlet, viewDescriptors)));
                    }
                }
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
        onDidChangeActiveViews(viewlet, viewDescriptors) {
            if (viewDescriptors.activeViewDescriptors.length) {
                this.compositeBar.addComposite(viewlet);
            }
            else {
                this.hideComposite(viewlet.id);
            }
        }
        shouldBeHidden(viewletId, cachedViewlet) {
            const viewContainer = this.getViewContainer(viewletId);
            if (!viewContainer || !viewContainer.hideIfEmpty) {
                return false;
            }
            return cachedViewlet && cachedViewlet.views && cachedViewlet.views.length
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
        enableCompositeActions(viewlet) {
            const { activityAction, pinnedAction } = this.getCompositeActions(viewlet.id);
            if (activityAction instanceof activitybarActions_1.PlaceHolderViewletActivityAction) {
                activityAction.setActivity(viewlet);
            }
            if (pinnedAction instanceof activitybarActions_1.PlaceHolderToggleCompositePinnedAction) {
                pinnedAction.setActivity(viewlet);
            }
        }
        getPinnedViewletIds() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(v => v.id);
            return this.viewletService.getViewlets()
                .filter(v => this.compositeBar.isPinned(v.id))
                .sort((v1, v2) => pinnedCompositeIds.indexOf(v1.id) - pinnedCompositeIds.indexOf(v2.id))
                .map(v => v.id);
        }
        setVisible(visible) {
            if (this.element) {
                this.element.style.display = visible ? null : 'none';
            }
        }
        layout(width, height) {
            if (!this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */)) {
                return;
            }
            // Layout contents
            const contentAreaSize = super.layoutContents(width, height).contentSize;
            // Layout composite bar
            let availableHeight = contentAreaSize.height;
            if (this.globalActivityActionBar) {
                availableHeight -= (this.globalActivityActionBar.viewItems.length * ActivitybarPart.ACTION_HEIGHT); // adjust height for global actions showing
            }
            this.compositeBar.layout(new dom_1.Dimension(width, availableHeight));
        }
        onDidStorageChange(e) {
            if (e.key === ActivitybarPart.PINNED_VIEWLETS && e.scope === 0 /* GLOBAL */
                && this.cachedViewletsValue !== this.getStoredCachedViewletsValue() /* This checks if current window changed the value or not */) {
                this._cachedViewletsValue = null;
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
            const allViewlets = this.viewletService.getViewlets();
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                const viewContainer = this.getViewContainer(compositeItem.id);
                const viewlet = allViewlets.filter(({ id }) => id === compositeItem.id)[0];
                if (viewlet) {
                    const views = [];
                    if (viewContainer) {
                        const viewDescriptors = this.viewsService.getViewDescriptors(viewContainer);
                        if (viewDescriptors) {
                            for (const { when } of viewDescriptors.allViewDescriptors) {
                                views.push({ when: when ? when.serialize() : undefined });
                            }
                        }
                    }
                    state.push({ id: compositeItem.id, name: viewlet.name, iconUrl: viewlet.iconUrl && viewlet.iconUrl.scheme === network_1.Schemas.file ? viewlet.iconUrl : undefined, views, pinned: compositeItem.pinned, order: compositeItem.order, visible: compositeItem.visible });
                }
                else {
                    state.push({ id: compositeItem.id, pinned: compositeItem.pinned, order: compositeItem.order, visible: false });
                }
            }
            this.cachedViewletsValue = JSON.stringify(state);
        }
        getCachedViewlets() {
            const storedStates = JSON.parse(this.cachedViewletsValue);
            const cachedViewlets = storedStates.map(c => {
                const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true, name: undefined, iconUrl: undefined, views: undefined } : c;
                serialized.visible = types_1.isUndefinedOrNull(serialized.visible) ? true : serialized.visible;
                return serialized;
            });
            for (const old of this.loadOldCachedViewlets()) {
                const cachedViewlet = cachedViewlets.filter(cached => cached.id === old.id)[0];
                if (cachedViewlet) {
                    cachedViewlet.name = old.name;
                    cachedViewlet.iconUrl = old.iconUrl;
                    cachedViewlet.views = old.views;
                }
            }
            return cachedViewlets;
        }
        loadOldCachedViewlets() {
            const previousState = this.storageService.get('workbench.activity.placeholderViewlets', 0 /* GLOBAL */, '[]');
            const result = JSON.parse(previousState);
            this.storageService.remove('workbench.activity.placeholderViewlets', 0 /* GLOBAL */);
            return result;
        }
        get cachedViewletsValue() {
            if (!this._cachedViewletsValue) {
                this._cachedViewletsValue = this.getStoredCachedViewletsValue();
            }
            return this._cachedViewletsValue;
        }
        set cachedViewletsValue(cachedViewletsValue) {
            if (this.cachedViewletsValue !== cachedViewletsValue) {
                this._cachedViewletsValue = cachedViewletsValue;
                this.setStoredCachedViewletsValue(cachedViewletsValue);
            }
        }
        getStoredCachedViewletsValue() {
            return this.storageService.get(ActivitybarPart.PINNED_VIEWLETS, 0 /* GLOBAL */, '[]');
        }
        setStoredCachedViewletsValue(value) {
            this.storageService.store(ActivitybarPart.PINNED_VIEWLETS, value, 0 /* GLOBAL */);
        }
        getViewContainer(viewletId) {
            const viewContainerRegistry = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry);
            return viewContainerRegistry.get(viewletId);
        }
        toJSON() {
            return {
                type: "workbench.parts.activitybar" /* ACTIVITYBAR_PART */
            };
        }
    };
    ActivitybarPart.ACTION_HEIGHT = 48;
    ActivitybarPart.PINNED_VIEWLETS = 'workbench.activity.pinnedViewlets';
    ActivitybarPart = __decorate([
        __param(0, viewlet_1.IViewletService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, themeService_1.IThemeService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, views_1.IViewsService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService)
    ], ActivitybarPart);
    exports.ActivitybarPart = ActivitybarPart;
    extensions_2.registerSingleton(activityBarService_1.IActivityBarService, ActivitybarPart);
});
//# sourceMappingURL=activitybarPart.js.map