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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/theme/common/styler", "vs/workbench/common/theme", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/platform/registry/common/platform", "vs/workbench/browser/actions", "vs/workbench/browser/viewlet", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/splitview/panelview", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/mouseEvent", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/css!./media/panelviewlet"], function (require, exports, nls, event_1, styler_1, theme_1, dom_1, lifecycle_1, arrays_1, platform_1, actions_1, viewlet_1, toolbar_1, keybinding_1, contextView_1, telemetry_1, themeService_1, panelview_1, configuration_1, layoutService_1, mouseEvent_1, views_1, storage_1, contextkey_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ViewletPanel = class ViewletPanel extends panelview_1.Panel {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService) {
            super(options);
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidChangeBodyVisibility = this._register(new event_1.Emitter());
            this.onDidChangeBodyVisibility = this._onDidChangeBodyVisibility.event;
            this._onDidChangeTitleArea = this._register(new event_1.Emitter());
            this.onDidChangeTitleArea = this._onDidChangeTitleArea.event;
            this._isVisible = false;
            this.showActionsAlways = false;
            this.id = options.id;
            this.title = options.title;
            this.actionRunner = options.actionRunner;
            this.showActionsAlways = !!options.showActionsAlways;
            this.focusedViewContextKey = views_1.FocusedViewContext.bindTo(contextKeyService);
        }
        setVisible(visible) {
            if (this._isVisible !== visible) {
                this._isVisible = visible;
                if (this.isExpanded()) {
                    this._onDidChangeBodyVisibility.fire(visible);
                }
            }
        }
        isVisible() {
            return this._isVisible;
        }
        isBodyVisible() {
            return this._isVisible && this.isExpanded();
        }
        setExpanded(expanded) {
            const changed = super.setExpanded(expanded);
            if (changed) {
                this._onDidChangeBodyVisibility.fire(expanded);
            }
            return changed;
        }
        render() {
            super.render();
            const focusTracker = dom_1.trackFocus(this.element);
            this._register(focusTracker);
            this._register(focusTracker.onDidFocus(() => {
                this.focusedViewContextKey.set(this.id);
                this._onDidFocus.fire();
            }));
            this._register(focusTracker.onDidBlur(() => {
                this.focusedViewContextKey.reset();
                this._onDidBlur.fire();
            }));
        }
        renderHeader(container) {
            this.headerContainer = container;
            this.renderTwisties(container);
            this.renderHeaderTitle(container, this.title);
            const actions = dom_1.append(container, dom_1.$('.actions'));
            dom_1.toggleClass(actions, 'show', this.showActionsAlways);
            this.toolbar = new toolbar_1.ToolBar(actions, this.contextMenuService, {
                orientation: 0 /* HORIZONTAL */,
                actionViewItemProvider: action => this.getActionViewItem(action),
                ariaLabel: nls.localize('viewToolbarAriaLabel', "{0} actions", this.title),
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                actionRunner: this.actionRunner
            });
            this._register(this.toolbar);
            this.setActions();
            const onDidRelevantConfigurationChange = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration(ViewletPanel.AlwaysShowActionsConfig));
            this._register(onDidRelevantConfigurationChange(this.updateActionsVisibility, this));
            this.updateActionsVisibility();
        }
        renderTwisties(container) {
            this.twistiesContainer = dom_1.append(container, dom_1.$('.twisties.codicon.codicon-chevron-right'));
        }
        renderHeaderTitle(container, title) {
            this.titleContainer = dom_1.append(container, dom_1.$('h3.title', undefined, title));
        }
        updateTitle(title) {
            if (this.titleContainer) {
                this.titleContainer.textContent = title;
            }
            this._onDidChangeTitleArea.fire();
        }
        focus() {
            if (this.element) {
                this.element.focus();
                this._onDidFocus.fire();
            }
        }
        setActions() {
            if (this.toolbar) {
                this.toolbar.setActions(actions_1.prepareActions(this.getActions()), actions_1.prepareActions(this.getSecondaryActions()))();
                this.toolbar.context = this.getActionsContext();
            }
        }
        updateActionsVisibility() {
            if (!this.headerContainer) {
                return;
            }
            const shouldAlwaysShowActions = this.configurationService.getValue('workbench.view.alwaysShowHeaderActions');
            dom_1.toggleClass(this.headerContainer, 'actions-always-visible', shouldAlwaysShowActions);
        }
        updateActions() {
            this.setActions();
            this._onDidChangeTitleArea.fire();
        }
        getActions() {
            return [];
        }
        getSecondaryActions() {
            return [];
        }
        getActionViewItem(action) {
            return undefined;
        }
        getActionsContext() {
            return undefined;
        }
        getOptimalWidth() {
            return 0;
        }
        saveState() {
            // Subclasses to implement for saving state
        }
    };
    ViewletPanel.AlwaysShowActionsConfig = 'workbench.view.alwaysShowHeaderActions';
    ViewletPanel = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService)
    ], ViewletPanel);
    exports.ViewletPanel = ViewletPanel;
    let PanelViewlet = class PanelViewlet extends viewlet_1.Viewlet {
        constructor(id, options, configurationService, layoutService, contextMenuService, telemetryService, themeService, storageService) {
            super(id, configurationService, layoutService, telemetryService, themeService, storageService);
            this.options = options;
            this.contextMenuService = contextMenuService;
            this.panelItems = [];
        }
        get onDidSashChange() {
            return types_1.assertIsDefined(this.panelview).onDidSashChange;
        }
        get panels() {
            return this.panelItems.map(i => i.panel);
        }
        get length() {
            return this.panelItems.length;
        }
        create(parent) {
            super.create(parent);
            this.panelview = this._register(new panelview_1.PanelView(parent, this.options));
            this._register(this.panelview.onDidDrop(({ from, to }) => this.movePanel(from, to)));
            this._register(dom_1.addDisposableListener(parent, dom_1.EventType.CONTEXT_MENU, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent(e))));
        }
        showContextMenu(event) {
            for (const panelItem of this.panelItems) {
                // Do not show context menu if target is coming from inside panel views
                if (dom_1.isAncestor(event.target, panelItem.panel.element)) {
                    return;
                }
            }
            event.stopPropagation();
            event.preventDefault();
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => this.getContextMenuActions()
            });
        }
        getTitle() {
            let title = platform_1.Registry.as(viewlet_1.Extensions.Viewlets).getViewlet(this.getId()).name;
            if (this.isSingleView()) {
                const panelItemTitle = this.panelItems[0].panel.title;
                title = panelItemTitle ? `${title}: ${panelItemTitle}` : title;
            }
            return title;
        }
        getActions() {
            if (this.isSingleView()) {
                return this.panelItems[0].panel.getActions();
            }
            return [];
        }
        getSecondaryActions() {
            if (this.isSingleView()) {
                return this.panelItems[0].panel.getSecondaryActions();
            }
            return [];
        }
        getActionViewItem(action) {
            if (this.isSingleView()) {
                return this.panelItems[0].panel.getActionViewItem(action);
            }
            return super.getActionViewItem(action);
        }
        focus() {
            super.focus();
            if (this.lastFocusedPanel) {
                this.lastFocusedPanel.focus();
            }
            else if (this.panelItems.length > 0) {
                for (const { panel } of this.panelItems) {
                    if (panel.isExpanded()) {
                        panel.focus();
                        return;
                    }
                }
            }
        }
        layout(dimension) {
            if (this.panelview) {
                this.panelview.layout(dimension.height, dimension.width);
            }
        }
        getOptimalWidth() {
            const sizes = this.panelItems
                .map(panelItem => panelItem.panel.getOptimalWidth() || 0);
            return Math.max(...sizes);
        }
        addPanels(panels) {
            const wasSingleView = this.isSingleView();
            for (const { panel, size, index } of panels) {
                this.addPanel(panel, size, index);
            }
            this.updateViewHeaders();
            if (this.isSingleView() !== wasSingleView) {
                this.updateTitleArea();
            }
        }
        addPanel(panel, size, index = this.panelItems.length - 1) {
            const onDidFocus = panel.onDidFocus(() => this.lastFocusedPanel = panel);
            const onDidChangeTitleArea = panel.onDidChangeTitleArea(() => {
                if (this.isSingleView()) {
                    this.updateTitleArea();
                }
            });
            const onDidChange = panel.onDidChange(() => {
                if (panel === this.lastFocusedPanel && !panel.isExpanded()) {
                    this.lastFocusedPanel = undefined;
                }
            });
            const panelStyler = styler_1.attachStyler(this.themeService, {
                headerForeground: theme_1.SIDE_BAR_SECTION_HEADER_FOREGROUND,
                headerBackground: theme_1.SIDE_BAR_SECTION_HEADER_BACKGROUND,
                headerBorder: theme_1.SIDE_BAR_SECTION_HEADER_BORDER,
                dropBackground: theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND
            }, panel);
            const disposable = lifecycle_1.combinedDisposable(onDidFocus, onDidChangeTitleArea, panelStyler, onDidChange);
            const panelItem = { panel, disposable };
            this.panelItems.splice(index, 0, panelItem);
            types_1.assertIsDefined(this.panelview).addPanel(panel, size, index);
        }
        removePanels(panels) {
            const wasSingleView = this.isSingleView();
            panels.forEach(panel => this.removePanel(panel));
            this.updateViewHeaders();
            if (wasSingleView !== this.isSingleView()) {
                this.updateTitleArea();
            }
        }
        removePanel(panel) {
            const index = arrays_1.firstIndex(this.panelItems, i => i.panel === panel);
            if (index === -1) {
                return;
            }
            if (this.lastFocusedPanel === panel) {
                this.lastFocusedPanel = undefined;
            }
            types_1.assertIsDefined(this.panelview).removePanel(panel);
            const [panelItem] = this.panelItems.splice(index, 1);
            panelItem.disposable.dispose();
        }
        movePanel(from, to) {
            const fromIndex = arrays_1.firstIndex(this.panelItems, item => item.panel === from);
            const toIndex = arrays_1.firstIndex(this.panelItems, item => item.panel === to);
            if (fromIndex < 0 || fromIndex >= this.panelItems.length) {
                return;
            }
            if (toIndex < 0 || toIndex >= this.panelItems.length) {
                return;
            }
            const [panelItem] = this.panelItems.splice(fromIndex, 1);
            this.panelItems.splice(toIndex, 0, panelItem);
            types_1.assertIsDefined(this.panelview).movePanel(from, to);
        }
        resizePanel(panel, size) {
            types_1.assertIsDefined(this.panelview).resizePanel(panel, size);
        }
        getPanelSize(panel) {
            return types_1.assertIsDefined(this.panelview).getPanelSize(panel);
        }
        updateViewHeaders() {
            if (this.isSingleView()) {
                this.panelItems[0].panel.setExpanded(true);
                this.panelItems[0].panel.headerVisible = false;
            }
            else {
                this.panelItems.forEach(i => i.panel.headerVisible = true);
            }
        }
        isSingleView() {
            return this.options.showHeaderInTitleWhenSingleView && this.panelItems.length === 1;
        }
        dispose() {
            super.dispose();
            this.panelItems.forEach(i => i.disposable.dispose());
            if (this.panelview) {
                this.panelview.dispose();
            }
        }
    };
    PanelViewlet = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, themeService_1.IThemeService),
        __param(7, storage_1.IStorageService)
    ], PanelViewlet);
    exports.PanelViewlet = PanelViewlet;
});
//# sourceMappingURL=panelViewlet.js.map