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
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform", "vs/workbench/common/panel", "vs/workbench/browser/parts/compositePart", "vs/workbench/browser/panel", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/compositeBar", "vs/workbench/browser/parts/compositeBarActions", "vs/platform/notification/common/notification", "vs/base/browser/dom", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/lifecycle/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/css!./media/panelpart"], function (require, exports, event_1, platform_1, panel_1, compositePart_1, panel_2, panelService_1, layoutService_1, storage_1, contextView_1, telemetry_1, keybinding_1, instantiation_1, panelActions_1, themeService_1, theme_1, colorRegistry_1, compositeBar_1, compositeBarActions_1, notification_1, dom_1, nls_1, contextkey_1, types_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let PanelPart = class PanelPart extends compositePart_1.CompositePart {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, contextKeyService, lifecycleService) {
            super(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, platform_1.Registry.as(panel_2.Extensions.Panels), PanelPart.activePanelSettingsKey, platform_1.Registry.as(panel_2.Extensions.Panels).getDefaultPanelId(), 'panel', 'panel', undefined, "workbench.parts.panel" /* PANEL_PART */, { hasTitle: true });
            this.lifecycleService = lifecycleService;
            //#region IView
            this.minimumWidth = 300;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 77;
            this.maximumHeight = Number.POSITIVE_INFINITY;
            this.snap = true;
            this.onDidPanelClose = this.onDidCompositeClose.event;
            this._onDidVisibilityChange = this._register(new event_1.Emitter());
            this.onDidVisibilityChange = this._onDidVisibilityChange.event;
            this.compositeActions = new Map();
            this.blockOpeningPanel = false;
            this.compositeBar = this._register(this.instantiationService.createInstance(compositeBar_1.CompositeBar, this.getCachedPanels(), {
                icon: false,
                orientation: 0 /* HORIZONTAL */,
                openComposite: (compositeId) => Promise.resolve(this.openPanel(compositeId, true)),
                getActivityAction: (compositeId) => this.getCompositeActions(compositeId).activityAction,
                getCompositePinnedAction: (compositeId) => this.getCompositeActions(compositeId).pinnedAction,
                getOnCompositeClickAction: (compositeId) => this.instantiationService.createInstance(panelActions_1.PanelActivityAction, this.getPanel(compositeId)),
                getContextMenuActions: () => [
                    this.instantiationService.createInstance(panelActions_1.TogglePanelPositionAction, panelActions_1.TogglePanelPositionAction.ID, panelActions_1.TogglePanelPositionAction.LABEL),
                    this.instantiationService.createInstance(panelActions_1.TogglePanelAction, panelActions_1.TogglePanelAction.ID, nls_1.localize('hidePanel', "Hide Panel"))
                ],
                getDefaultCompositeId: () => platform_1.Registry.as(panel_2.Extensions.Panels).getDefaultPanelId(),
                hidePart: () => this.layoutService.setPanelHidden(true),
                compositeSize: 0,
                overflowActionSize: 44,
                colors: (theme) => ({
                    activeBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND),
                    inactiveBackgroundColor: theme.getColor(theme_1.PANEL_BACKGROUND),
                    activeBorderBottomColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER),
                    activeForegroundColor: theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND),
                    inactiveForegroundColor: theme.getColor(theme_1.PANEL_INACTIVE_TITLE_FOREGROUND),
                    badgeBackground: theme.getColor(colorRegistry_1.badgeBackground),
                    badgeForeground: theme.getColor(colorRegistry_1.badgeForeground),
                    dragAndDropBackground: theme.getColor(theme_1.PANEL_DRAG_AND_DROP_BACKGROUND)
                })
            }));
            for (const panel of this.getPanels()) {
                this.compositeBar.addComposite(panel);
            }
            this.activePanelContextKey = panel_1.ActivePanelContext.bindTo(contextKeyService);
            this.panelFocusContextKey = panel_1.PanelFocusContext.bindTo(contextKeyService);
            this.registerListeners();
        }
        get preferredHeight() {
            const sidebarDimension = this.layoutService.getDimension("workbench.parts.sidebar" /* SIDEBAR_PART */);
            return sidebarDimension.height * 0.4;
        }
        get preferredWidth() {
            const statusbarPart = this.layoutService.getDimension("workbench.parts.statusbar" /* STATUSBAR_PART */);
            return statusbarPart.width * 0.4;
        }
        //#endregion
        get onDidPanelOpen() { return event_1.Event.map(this.onDidCompositeOpen.event, compositeOpen => ({ panel: compositeOpen.composite, focus: compositeOpen.focus })); }
        registerListeners() {
            // Panel open/close
            this._register(this.onDidPanelOpen(({ panel }) => this.onPanelOpen(panel)));
            this._register(this.onDidPanelClose(this.onPanelClose, this));
            // Panel register/deregister
            this._register(this.registry.onDidRegister(panelDescriptor => this.compositeBar.addComposite(panelDescriptor)));
            this._register(this.registry.onDidDeregister(panelDescriptor => {
                this.compositeBar.hideComposite(panelDescriptor.id);
                this.removeComposite(panelDescriptor.id);
            }));
            // Activate panel action on opening of a panel
            this._register(this.onDidPanelOpen(({ panel }) => {
                this.compositeBar.activateComposite(panel.getId());
                this.layoutCompositeBar(); // Need to relayout composite bar since different panels have different action bar width
            }));
            // Deactivate panel action on close
            this._register(this.onDidPanelClose(panel => this.compositeBar.deactivateComposite(panel.getId())));
            // State
            this.lifecycleService.when(4 /* Eventually */).then(() => {
                this._register(this.compositeBar.onDidChange(() => this.saveCachedPanels()));
                this._register(this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
            });
        }
        onPanelOpen(panel) {
            this.activePanelContextKey.set(panel.getId());
        }
        onPanelClose(panel) {
            const id = panel.getId();
            if (this.activePanelContextKey.get() === id) {
                this.activePanelContextKey.reset();
            }
        }
        create(parent) {
            this.element = parent;
            super.create(parent);
            const focusTracker = this._register(dom_1.trackFocus(parent));
            this._register(focusTracker.onDidFocus(() => this.panelFocusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.panelFocusContextKey.set(false)));
        }
        updateStyles() {
            super.updateStyles();
            const container = this.getContainer();
            container.style.backgroundColor = this.getColor(theme_1.PANEL_BACKGROUND);
            container.style.borderLeftColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            const title = this.getTitleArea();
            if (title) {
                title.style.borderTopColor = this.getColor(theme_1.PANEL_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            }
        }
        openPanel(id, focus) {
            if (this.blockOpeningPanel) {
                return null; // Workaround against a potential race condition
            }
            // First check if panel is hidden and show if so
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                try {
                    this.blockOpeningPanel = true;
                    this.layoutService.setPanelHidden(false);
                }
                finally {
                    this.blockOpeningPanel = false;
                }
            }
            return types_1.withUndefinedAsNull(this.openComposite(id, focus));
        }
        showActivity(panelId, badge, clazz) {
            return this.compositeBar.showActivity(panelId, badge, clazz);
        }
        getPanel(panelId) {
            return types_1.withNullAsUndefined(platform_1.Registry.as(panel_2.Extensions.Panels).getPanel(panelId));
        }
        getPanels() {
            return platform_1.Registry.as(panel_2.Extensions.Panels).getPanels()
                .sort((v1, v2) => typeof v1.order === 'number' && typeof v2.order === 'number' ? v1.order - v2.order : NaN);
        }
        getPinnedPanels() {
            const pinnedCompositeIds = this.compositeBar.getPinnedComposites().map(c => c.id);
            return this.getPanels()
                .filter(p => pinnedCompositeIds.indexOf(p.id) !== -1)
                .sort((p1, p2) => pinnedCompositeIds.indexOf(p1.id) - pinnedCompositeIds.indexOf(p2.id));
        }
        getActions() {
            return [
                this.instantiationService.createInstance(panelActions_1.ToggleMaximizedPanelAction, panelActions_1.ToggleMaximizedPanelAction.ID, panelActions_1.ToggleMaximizedPanelAction.LABEL),
                this.instantiationService.createInstance(panelActions_1.ClosePanelAction, panelActions_1.ClosePanelAction.ID, panelActions_1.ClosePanelAction.LABEL)
            ];
        }
        getActivePanel() {
            return this.getActiveComposite();
        }
        getLastActivePanelId() {
            return this.getLastActiveCompositetId();
        }
        hideActivePanel() {
            // First check if panel is visible and hide if so
            if (this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                this.layoutService.setPanelHidden(true);
            }
            this.hideActiveComposite();
        }
        createTitleLabel(parent) {
            const titleArea = this.compositeBar.create(parent);
            titleArea.classList.add('panel-switcher-container');
            return {
                updateTitle: (id, title, keybinding) => {
                    const action = this.compositeBar.getAction(id);
                    if (action) {
                        action.label = title;
                    }
                },
                updateStyles: () => {
                    // Handled via theming participant
                }
            };
        }
        layout(width, height) {
            if (!this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                return;
            }
            if (this.layoutService.getPanelPosition() === 1 /* RIGHT */) {
                this._contentDimension = new dom_1.Dimension(width - 1, height); // Take into account the 1px border when layouting
            }
            else {
                this._contentDimension = new dom_1.Dimension(width, height);
            }
            // Layout contents
            super.layout(this._contentDimension.width, this._contentDimension.height);
            // Layout composite bar
            this.layoutCompositeBar();
        }
        layoutCompositeBar() {
            if (this._contentDimension) {
                let availableWidth = this._contentDimension.width - 40; // take padding into account
                if (this.toolBar) {
                    availableWidth = Math.max(PanelPart.MIN_COMPOSITE_BAR_WIDTH, availableWidth - this.getToolbarWidth()); // adjust height for global actions showing
                }
                this.compositeBar.layout(new dom_1.Dimension(availableWidth, this.dimension.height));
            }
        }
        getCompositeActions(compositeId) {
            let compositeActions = this.compositeActions.get(compositeId);
            if (!compositeActions) {
                compositeActions = {
                    activityAction: this.instantiationService.createInstance(panelActions_1.PanelActivityAction, this.getPanel(compositeId)),
                    pinnedAction: new compositeBarActions_1.ToggleCompositePinnedAction(this.getPanel(compositeId), this.compositeBar)
                };
                this.compositeActions.set(compositeId, compositeActions);
            }
            return compositeActions;
        }
        removeComposite(compositeId) {
            if (super.removeComposite(compositeId)) {
                const compositeActions = this.compositeActions.get(compositeId);
                if (compositeActions) {
                    compositeActions.activityAction.dispose();
                    compositeActions.pinnedAction.dispose();
                    this.compositeActions.delete(compositeId);
                }
                return true;
            }
            return false;
        }
        getToolbarWidth() {
            const activePanel = this.getActivePanel();
            if (!activePanel) {
                return 0;
            }
            return this.toolBar.getItemsWidth();
        }
        onDidStorageChange(e) {
            if (e.key === PanelPart.PINNED_PANELS && e.scope === 0 /* GLOBAL */
                && this.cachedPanelsValue !== this.getStoredCachedPanelsValue() /* This checks if current window changed the value or not */) {
                this._cachedPanelsValue = undefined;
                const newCompositeItems = [];
                const compositeItems = this.compositeBar.getCompositeBarItems();
                const cachedPanels = this.getCachedPanels();
                for (const cachedPanel of cachedPanels) {
                    // Add and update existing items
                    const existingItem = compositeItems.filter(({ id }) => id === cachedPanel.id)[0];
                    if (existingItem) {
                        newCompositeItems.push({
                            id: existingItem.id,
                            name: existingItem.name,
                            order: existingItem.order,
                            pinned: cachedPanel.pinned,
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
        saveCachedPanels() {
            const state = [];
            const compositeItems = this.compositeBar.getCompositeBarItems();
            for (const compositeItem of compositeItems) {
                state.push({ id: compositeItem.id, pinned: compositeItem.pinned, order: compositeItem.order, visible: compositeItem.visible });
            }
            this.cachedPanelsValue = JSON.stringify(state);
        }
        getCachedPanels() {
            const registeredPanels = this.getPanels();
            const storedStates = JSON.parse(this.cachedPanelsValue);
            const cachedPanels = storedStates.map(c => {
                const serialized = typeof c === 'string' /* migration from pinned states to composites states */ ? { id: c, pinned: true, order: undefined, visible: true } : c;
                const registered = registeredPanels.some(p => p.id === serialized.id);
                serialized.visible = registered ? types_1.isUndefinedOrNull(serialized.visible) ? true : serialized.visible : false;
                return serialized;
            });
            return cachedPanels;
        }
        get cachedPanelsValue() {
            if (!this._cachedPanelsValue) {
                this._cachedPanelsValue = this.getStoredCachedPanelsValue();
            }
            return this._cachedPanelsValue;
        }
        set cachedPanelsValue(cachedViewletsValue) {
            if (this.cachedPanelsValue !== cachedViewletsValue) {
                this._cachedPanelsValue = cachedViewletsValue;
                this.setStoredCachedViewletsValue(cachedViewletsValue);
            }
        }
        getStoredCachedPanelsValue() {
            return this.storageService.get(PanelPart.PINNED_PANELS, 0 /* GLOBAL */, '[]');
        }
        setStoredCachedViewletsValue(value) {
            this.storageService.store(PanelPart.PINNED_PANELS, value, 0 /* GLOBAL */);
        }
        setVisible(visible) {
            this._onDidVisibilityChange.fire(visible);
        }
        toJSON() {
            return {
                type: "workbench.parts.panel" /* PANEL_PART */
            };
        }
    };
    PanelPart.activePanelSettingsKey = 'workbench.panelpart.activepanelid';
    PanelPart.PINNED_PANELS = 'workbench.panel.pinnedPanels';
    PanelPart.MIN_COMPOSITE_BAR_WIDTH = 50;
    PanelPart = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, storage_1.IStorageService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, lifecycle_1.ILifecycleService)
    ], PanelPart);
    exports.PanelPart = PanelPart;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Panel Background: since panels can host editors, we apply a background rule if the panel background
        // color is different from the editor background color. This is a bit of a hack though. The better way
        // would be to have a way to push the background color onto each editor widget itself somehow.
        const panelBackground = theme.getColor(theme_1.PANEL_BACKGROUND);
        if (panelBackground && panelBackground !== theme.getColor(colorRegistry_1.editorBackground)) {
            collector.addRule(`
			.monaco-workbench .part.panel > .content .monaco-editor,
			.monaco-workbench .part.panel > .content .monaco-editor .margin,
			.monaco-workbench .part.panel > .content .monaco-editor .monaco-editor-background {
				background-color: ${panelBackground};
			}
		`);
        }
        // Title Active
        const titleActive = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_FOREGROUND);
        const titleActiveBorder = theme.getColor(theme_1.PANEL_ACTIVE_TITLE_BORDER);
        if (titleActive || titleActiveBorder) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:hover .action-label {
				color: ${titleActive} !important;
				border-bottom-color: ${titleActiveBorder} !important;
			}
		`);
        }
        // Title focus
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus .action-label {
				color: ${titleActive} !important;
				border-bottom-color: ${focusBorderColor} !important;
				border-bottom: 1px solid;
			}
			`);
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:focus {
				outline: none;
			}
			`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item.checked .action-label,
			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item .action-label:hover {
				outline-color: ${outline};
				outline-width: 1px;
				outline-style: solid;
				border-bottom: none;
				padding-bottom: 0;
				outline-offset: 1px;
			}

			.monaco-workbench .part.panel > .title > .panel-switcher-container > .monaco-action-bar .action-item:not(.checked) .action-label:hover {
				outline-style: dashed;
			}
		`);
        }
        const inputBorder = theme.getColor(theme_1.PANEL_INPUT_BORDER);
        if (inputBorder) {
            collector.addRule(`
			.monaco-workbench .part.panel .monaco-inputbox {
				border-color: ${inputBorder}
			}
		`);
        }
    });
    extensions_1.registerSingleton(panelService_1.IPanelService, PanelPart);
});
//# sourceMappingURL=panelPart.js.map