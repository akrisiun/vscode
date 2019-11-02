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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/commands/common/commands", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/theme/common/themeService", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/browser/parts/views/panelViewlet", "vs/nls", "vs/base/common/async", "vs/platform/theme/common/colorRegistry", "vs/base/common/types", "vs/platform/label/common/label", "vs/platform/registry/common/platform", "vs/base/common/filters", "vs/base/browser/ui/tree/treeDefaults", "vs/base/common/strings", "vs/css!./media/views"], function (require, exports, event_1, lifecycle_1, instantiation_1, actions_1, keybinding_1, contextView_1, actions_2, menuEntryActionViewItem_1, contextkey_1, views_1, configuration_1, notification_1, progress_1, extensions_1, workbenchThemeService_1, commands_1, DOM, labels_1, actionbar_1, uri_1, resources_1, themeService_1, files_1, listService_1, panelViewlet_1, nls_1, async_1, colorRegistry_1, types_1, label_1, platform_1, filters_1, treeDefaults_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CustomTreeViewPanel = class CustomTreeViewPanel extends panelViewlet_1.ViewletPanel {
        constructor(options, notificationService, keybindingService, contextMenuService, configurationService, contextKeyService) {
            super(Object.assign(Object.assign({}, options), { ariaHeaderLabel: options.title }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.notificationService = notificationService;
            const { treeView } = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(options.id);
            this.treeView = treeView;
            this._register(this.treeView.onDidChangeActions(() => this.updateActions(), this));
            this._register(this.treeView.onDidChangeTitle((newTitle) => this.updateTitle(newTitle)));
            this._register(lifecycle_1.toDisposable(() => this.treeView.setVisibility(false)));
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this.updateTreeVisibility();
        }
        focus() {
            super.focus();
            this.treeView.focus();
        }
        renderBody(container) {
            if (this.treeView instanceof CustomTreeView) {
                this.treeView.show(container);
            }
        }
        layoutBody(height, width) {
            this.treeView.layout(height, width);
        }
        getActions() {
            return [...this.treeView.getPrimaryActions()];
        }
        getSecondaryActions() {
            return [...this.treeView.getSecondaryActions()];
        }
        getActionViewItem(action) {
            return action instanceof actions_2.MenuItemAction ? new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService) : undefined;
        }
        getOptimalWidth() {
            return this.treeView.getOptimalWidth();
        }
        updateTreeVisibility() {
            this.treeView.setVisibility(this.isBodyVisible());
        }
    };
    CustomTreeViewPanel = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService)
    ], CustomTreeViewPanel);
    exports.CustomTreeViewPanel = CustomTreeViewPanel;
    let TitleMenus = class TitleMenus extends lifecycle_1.Disposable {
        constructor(id, contextKeyService, menuService) {
            super();
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.titleActions = [];
            this.titleActionsDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.titleSecondaryActions = [];
            this._onDidChangeTitle = this._register(new event_1.Emitter());
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            const scopedContextKeyService = this._register(this.contextKeyService.createScoped());
            scopedContextKeyService.createKey('view', id);
            const titleMenu = this._register(this.menuService.createMenu(40 /* ViewTitle */, scopedContextKeyService));
            const updateActions = () => {
                this.titleActions = [];
                this.titleSecondaryActions = [];
                this.titleActionsDisposable.value = menuEntryActionViewItem_1.createAndFillInActionBarActions(titleMenu, undefined, { primary: this.titleActions, secondary: this.titleSecondaryActions });
                this._onDidChangeTitle.fire();
            };
            this._register(titleMenu.onDidChange(updateActions));
            updateActions();
            this._register(lifecycle_1.toDisposable(() => {
                this.titleActions = [];
                this.titleSecondaryActions = [];
            }));
        }
        getTitleActions() {
            return this.titleActions;
        }
        getTitleSecondaryActions() {
            return this.titleSecondaryActions;
        }
    };
    TitleMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService)
    ], TitleMenus);
    class Root {
        constructor() {
            this.label = { label: 'root' };
            this.handle = '0';
            this.parentHandle = undefined;
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.children = undefined;
        }
    }
    const noDataProviderMessage = nls_1.localize('no-dataprovider', "There is no data provider registered that can provide view data.");
    let CustomTreeView = class CustomTreeView extends lifecycle_1.Disposable {
        constructor(id, _title, viewContainer, extensionService, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService) {
            super();
            this.id = id;
            this._title = _title;
            this.viewContainer = viewContainer;
            this.extensionService = extensionService;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.isVisible = false;
            this.activated = false;
            this._hasIconForParentNode = false;
            this._hasIconForLeafNode = false;
            this._showCollapseAllAction = false;
            this.focused = false;
            this._canSelectMany = false;
            this.elementsToRefresh = [];
            this._onDidExpandItem = this._register(new event_1.Emitter());
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = this._register(new event_1.Emitter());
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActions = this._register(new event_1.Emitter());
            this.onDidChangeActions = this._onDidChangeActions.event;
            this._onDidChangeTitle = this._register(new event_1.Emitter());
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this._height = 0;
            this._width = 0;
            this.refreshing = false;
            this.root = new Root();
            this.menus = this._register(instantiationService.createInstance(TitleMenus, this.id));
            this._register(this.menus.onDidChangeTitle(() => this._onDidChangeActions.fire()));
            this._register(this.themeService.onDidFileIconThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.themeService.onThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer.decorations')) {
                    this.doRefresh([this.root]); /** soft refresh **/
                }
            }));
            this._register(platform_1.Registry.as(views_1.Extensions.ViewsRegistry).onDidChangeContainer(({ views, from, to }) => {
                if (from === this.viewContainer && views.some(v => v.id === this.id)) {
                    this.viewContainer = to;
                }
            }));
            this.create();
        }
        get dataProvider() {
            return this._dataProvider;
        }
        set dataProvider(dataProvider) {
            if (this.tree === undefined) {
                this.createTree();
            }
            if (dataProvider) {
                this._dataProvider = new class {
                    async getChildren(node) {
                        if (node && node.children) {
                            return Promise.resolve(node.children);
                        }
                        const children = await (node instanceof Root ? dataProvider.getChildren() : dataProvider.getChildren(node));
                        node.children = children;
                        return children;
                    }
                };
                this.updateMessage();
                this.refresh();
            }
            else {
                this._dataProvider = undefined;
                this.updateMessage();
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
        }
        get title() {
            return this._title;
        }
        set title(name) {
            this._title = name;
            this._onDidChangeTitle.fire(this._title);
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            this._canSelectMany = canSelectMany;
        }
        get hasIconForParentNode() {
            return this._hasIconForParentNode;
        }
        get hasIconForLeafNode() {
            return this._hasIconForLeafNode;
        }
        get visible() {
            return this.isVisible;
        }
        get showCollapseAllAction() {
            return this._showCollapseAllAction;
        }
        set showCollapseAllAction(showCollapseAllAction) {
            if (this._showCollapseAllAction !== !!showCollapseAllAction) {
                this._showCollapseAllAction = !!showCollapseAllAction;
                this._onDidChangeActions.fire();
            }
        }
        getPrimaryActions() {
            if (this.showCollapseAllAction) {
                const collapseAllAction = new actions_1.Action('vs.tree.collapse', nls_1.localize('collapseAll', "Collapse All"), 'monaco-tree-action codicon-collapse-all', true, () => this.tree ? new treeDefaults_1.CollapseAllAction(this.tree, true).run() : Promise.resolve());
                return [...this.menus.getTitleActions(), collapseAllAction];
            }
            else {
                return this.menus.getTitleActions();
            }
        }
        getSecondaryActions() {
            return this.menus.getTitleSecondaryActions();
        }
        setVisibility(isVisible) {
            isVisible = !!isVisible;
            if (this.isVisible === isVisible) {
                return;
            }
            this.isVisible = isVisible;
            if (this.isVisible) {
                this.activate();
            }
            if (this.tree) {
                if (this.isVisible) {
                    DOM.show(this.tree.getHTMLElement());
                }
                else {
                    DOM.hide(this.tree.getHTMLElement()); // make sure the tree goes out of the tabindex world by hiding it
                }
                if (this.isVisible && this.elementsToRefresh.length) {
                    this.doRefresh(this.elementsToRefresh);
                    this.elementsToRefresh = [];
                }
            }
            this._onDidChangeVisibility.fire(this.isVisible);
        }
        focus(reveal = true) {
            if (this.tree && this.root.children && this.root.children.length > 0) {
                // Make sure the current selected element is revealed
                const selectedElement = this.tree.getSelection()[0];
                if (selectedElement && reveal) {
                    this.tree.reveal(selectedElement, 0.5);
                }
                // Pass Focus to Viewer
                this.tree.domFocus();
            }
            else {
                this.domNode.focus();
            }
        }
        show(container) {
            DOM.append(container, this.domNode);
        }
        create() {
            this.domNode = DOM.$('.tree-explorer-viewlet-tree-view');
            this.messageElement = DOM.append(this.domNode, DOM.$('.message'));
            this.treeContainer = DOM.append(this.domNode, DOM.$('.customview-tree'));
            DOM.addClass(this.treeContainer, 'file-icon-themable-tree');
            DOM.addClass(this.treeContainer, 'show-file-icons');
            const focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(focusTracker.onDidFocus(() => this.focused = true));
            this._register(focusTracker.onDidBlur(() => this.focused = false));
        }
        createTree() {
            const actionViewItemProvider = (action) => action instanceof actions_2.MenuItemAction ? this.instantiationService.createInstance(menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem, action) : undefined;
            const treeMenus = this._register(this.instantiationService.createInstance(TreeMenus, this.id));
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const dataSource = this.instantiationService.createInstance(TreeDataSource, this, (task) => this.progressService.withProgress({ location: this.viewContainer.id }, () => task));
            const aligner = new Aligner(this.themeService);
            const renderer = this.instantiationService.createInstance(TreeRenderer, this.id, treeMenus, this.treeLabels, actionViewItemProvider, aligner);
            this.tree = this._register(this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'CustomView', this.treeContainer, new CustomTreeDelegate(), [renderer], dataSource, {
                identityProvider: new CustomViewIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        return element.tooltip ? element.tooltip : element.label ? element.label.label : '';
                    }
                },
                ariaLabel: this._title,
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label ? item.label.label : (item.resourceUri ? resources_1.basename(uri_1.URI.revive(item.resourceUri)) : undefined);
                    }
                },
                expandOnlyOnTwistieClick: (e) => !!e.command,
                collapseByDefault: (e) => {
                    return e.collapsibleState !== views_1.TreeItemCollapsibleState.Expanded;
                },
                multipleSelectionSupport: this.canSelectMany,
            }));
            aligner.tree = this.tree;
            const actionRunner = new MultipleSelectionActionRunner(this.notificationService, () => this.tree.getSelection());
            renderer.actionRunner = actionRunner;
            this.tree.contextKeyService.createKey(this.id, true);
            this._register(this.tree.onContextMenu(e => this.onContextMenu(treeMenus, e, actionRunner)));
            this._register(this.tree.onDidChangeSelection(e => this._onDidChangeSelection.fire(e.elements)));
            this._register(this.tree.onDidChangeCollapseState(e => {
                if (!e.node.element) {
                    return;
                }
                const element = Array.isArray(e.node.element.element) ? e.node.element.element[0] : e.node.element.element;
                if (e.node.collapsed) {
                    this._onDidCollapseItem.fire(element);
                }
                else {
                    this._onDidExpandItem.fire(element);
                }
            }));
            this.tree.setInput(this.root).then(() => this.updateContentAreas());
            const customTreeNavigator = new listService_1.TreeResourceNavigator2(this.tree, { openOnFocus: false, openOnSelection: false });
            this._register(customTreeNavigator);
            this._register(customTreeNavigator.onDidOpenResource(e => {
                if (!e.browserEvent) {
                    return;
                }
                const selection = this.tree.getSelection();
                if ((selection.length === 1) && selection[0].command) {
                    this.commandService.executeCommand(selection[0].command.id, ...(selection[0].command.arguments || []));
                }
            }));
        }
        onContextMenu(treeMenus, treeEvent, actionRunner) {
            const node = treeEvent.element;
            if (node === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            this.tree.setFocus([node]);
            const actions = treeMenus.getResourceContextActions(node);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ $treeViewId: this.id, $treeItemHandle: node.handle }),
                actionRunner
            });
        }
        updateMessage() {
            if (this._message) {
                this.showMessage(this._message);
            }
            else if (!this.dataProvider) {
                this.showMessage(noDataProviderMessage);
            }
            else {
                this.hideMessage();
            }
            this.updateContentAreas();
        }
        showMessage(message) {
            DOM.removeClass(this.messageElement, 'hide');
            if (this._messageValue !== message) {
                this.resetMessageElement();
                this._messageValue = message;
                if (!strings_1.isFalsyOrWhitespace(this._message)) {
                    this.messageElement.textContent = this._messageValue;
                }
                this.layout(this._height, this._width);
            }
        }
        hideMessage() {
            this.resetMessageElement();
            DOM.addClass(this.messageElement, 'hide');
            this.layout(this._height, this._width);
        }
        resetMessageElement() {
            DOM.clearNode(this.messageElement);
        }
        layout(height, width) {
            if (height && width) {
                this._height = height;
                this._width = width;
                const treeHeight = height - DOM.getTotalHeight(this.messageElement);
                this.treeContainer.style.height = treeHeight + 'px';
                if (this.tree) {
                    this.tree.layout(treeHeight, width);
                }
            }
        }
        getOptimalWidth() {
            if (this.tree) {
                const parentNode = this.tree.getHTMLElement();
                const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));
                return DOM.getLargestChildWidth(parentNode, childNodes);
            }
            return 0;
        }
        refresh(elements) {
            if (this.dataProvider && this.tree) {
                if (!elements) {
                    elements = [this.root];
                    // remove all waiting elements to refresh if root is asked to refresh
                    this.elementsToRefresh = [];
                }
                for (const element of elements) {
                    element.children = undefined; // reset children
                }
                if (this.isVisible) {
                    return this.doRefresh(elements);
                }
                else {
                    if (this.elementsToRefresh.length) {
                        const seen = new Set();
                        this.elementsToRefresh.forEach(element => seen.add(element.handle));
                        for (const element of elements) {
                            if (!seen.has(element.handle)) {
                                this.elementsToRefresh.push(element);
                            }
                        }
                    }
                    else {
                        this.elementsToRefresh.push(...elements);
                    }
                }
            }
            return Promise.resolve(undefined);
        }
        async expand(itemOrItems) {
            const tree = this.tree;
            if (tree) {
                itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                await Promise.all(itemOrItems.map(element => {
                    return tree.expand(element, false);
                }));
            }
            return Promise.resolve(undefined);
        }
        setSelection(items) {
            if (this.tree) {
                this.tree.setSelection(items);
            }
        }
        setFocus(item) {
            if (this.tree) {
                this.focus();
                this.tree.setFocus([item]);
            }
        }
        reveal(item) {
            if (this.tree) {
                return Promise.resolve(this.tree.reveal(item));
            }
            return Promise.resolve();
        }
        activate() {
            if (!this.activated) {
                this.progressService.withProgress({ location: this.viewContainer.id }, () => this.extensionService.activateByEvent(`onView:${this.id}`))
                    .then(() => async_1.timeout(2000))
                    .then(() => {
                    this.updateMessage();
                });
                this.activated = true;
            }
        }
        async doRefresh(elements) {
            const tree = this.tree;
            if (tree && this.visible) {
                this.refreshing = true;
                await Promise.all(elements.map(element => tree.updateChildren(element, true)));
                elements.map(element => tree.rerender(element));
                this.refreshing = false;
                this.updateContentAreas();
                if (this.focused) {
                    this.focus(false);
                }
            }
        }
        updateContentAreas() {
            const isTreeEmpty = !this.root.children || this.root.children.length === 0;
            // Hide tree container only when there is a message and tree is empty and not refreshing
            if (this._messageValue && isTreeEmpty && !this.refreshing) {
                DOM.addClass(this.treeContainer, 'hide');
                this.domNode.setAttribute('tabindex', '0');
            }
            else {
                DOM.removeClass(this.treeContainer, 'hide');
                this.domNode.removeAttribute('tabindex');
            }
        }
    };
    CustomTreeView = __decorate([
        __param(3, extensions_1.IExtensionService),
        __param(4, workbenchThemeService_1.IWorkbenchThemeService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, commands_1.ICommandService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, progress_1.IProgressService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, notification_1.INotificationService)
    ], CustomTreeView);
    exports.CustomTreeView = CustomTreeView;
    class CustomViewIdentityProvider {
        getId(element) {
            return element.handle;
        }
    }
    class CustomTreeDelegate {
        getHeight(element) {
            return TreeRenderer.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
    }
    class TreeDataSource {
        constructor(treeView, withProgress) {
            this.treeView = treeView;
            this.withProgress = withProgress;
        }
        hasChildren(element) {
            return !!this.treeView.dataProvider && (element.collapsibleState !== views_1.TreeItemCollapsibleState.None);
        }
        getChildren(element) {
            if (this.treeView.dataProvider) {
                return this.withProgress(this.treeView.dataProvider.getChildren(element));
            }
            return Promise.resolve([]);
        }
    }
    // todo@joh,sandy make this proper and contributable from extensions
    themeService_1.registerThemingParticipant((theme, collector) => {
        const matchBackgroundColor = theme.getColor(colorRegistry_1.listFilterMatchHighlight);
        if (matchBackgroundColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
        }
        const matchBorderColor = theme.getColor(colorRegistry_1.listFilterMatchHighlightBorder);
        if (matchBorderColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a { color: ${link}; }`);
        }
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a:focus { outline: 1px solid ${focusBorderColor}; outline-offset: -1px; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message code { background-color: ${codeBackground}; }`);
        }
    });
    let TreeRenderer = class TreeRenderer extends lifecycle_1.Disposable {
        constructor(treeViewId, menus, labels, actionViewItemProvider, aligner, themeService, configurationService, labelService) {
            super();
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.aligner = aligner;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.labelService = labelService;
        }
        get templateId() {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        renderTemplate(container) {
            DOM.addClass(container, 'custom-view-tree-node-item');
            const icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            const resourceLabel = this.labels.create(container, { supportHighlights: true });
            const actionsContainer = DOM.append(resourceLabel.element, DOM.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider
            });
            return { resourceLabel, icon, actionBar, container, elementDisposable: lifecycle_1.Disposable.None };
        }
        renderElement(element, index, templateData) {
            templateData.elementDisposable.dispose();
            const node = element.element;
            const resource = node.resourceUri ? uri_1.URI.revive(node.resourceUri) : null;
            const treeItemLabel = node.label ? node.label : resource ? { label: resources_1.basename(resource) } : undefined;
            const description = types_1.isString(node.description) ? node.description : resource && node.description === true ? this.labelService.getUriLabel(resources_1.dirname(resource), { relative: true }) : undefined;
            const label = treeItemLabel ? treeItemLabel.label : undefined;
            const matches = (treeItemLabel && treeItemLabel.highlights && label) ? treeItemLabel.highlights.map(([start, end]) => {
                if ((Math.abs(start) > label.length) || (Math.abs(end) >= label.length)) {
                    return ({ start: 0, end: 0 });
                }
                if (start < 0) {
                    start = label.length + start;
                }
                if (end < 0) {
                    end = label.length + end;
                }
                if (start > end) {
                    const swap = start;
                    start = end;
                    end = swap;
                }
                return ({ start, end });
            }) : undefined;
            const icon = this.themeService.getTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            const title = node.tooltip ? node.tooltip : resource ? undefined : label;
            // reset
            templateData.actionBar.clear();
            if (resource || node.themeIcon) {
                const fileDecorations = this.configurationService.getValue('explorer.decorations');
                templateData.resourceLabel.setResource({ name: label, description, resource: resource ? resource : uri_1.URI.parse('missing:_icon_resource') }, { fileKind: this.getFileKind(node), title, hideIcon: !!iconUrl, fileDecorations, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches: matches ? matches : filters_1.createMatches(element.filterData) });
            }
            else {
                templateData.resourceLabel.setResource({ name: label, description }, { title, hideIcon: true, extraClasses: ['custom-view-tree-node-item-resourceLabel'], matches: matches ? matches : filters_1.createMatches(element.filterData) });
            }
            templateData.icon.style.backgroundImage = iconUrl ? DOM.asCSSUrl(iconUrl) : '';
            templateData.icon.title = title ? title : '';
            DOM.toggleClass(templateData.icon, 'custom-view-tree-node-item-icon', !!iconUrl);
            templateData.actionBar.context = { $treeViewId: this.treeViewId, $treeItemHandle: node.handle };
            templateData.actionBar.push(this.menus.getResourceActions(node), { icon: true, label: false });
            if (this._actionRunner) {
                templateData.actionBar.actionRunner = this._actionRunner;
            }
            this.setAlignment(templateData.container, node);
            templateData.elementDisposable = (this.themeService.onDidFileIconThemeChange(() => this.setAlignment(templateData.container, node)));
        }
        setAlignment(container, treeItem) {
            DOM.toggleClass(container.parentElement, 'align-icon-with-twisty', this.aligner.alignIconWithTwisty(treeItem));
        }
        getFileKind(node) {
            if (node.themeIcon) {
                switch (node.themeIcon.id) {
                    case themeService_1.FileThemeIcon.id:
                        return files_1.FileKind.FILE;
                    case themeService_1.FolderThemeIcon.id:
                        return files_1.FileKind.FOLDER;
                }
            }
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Collapsed || node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
        }
        disposeElement(resource, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
        }
    };
    TreeRenderer.ITEM_HEIGHT = 22;
    TreeRenderer.TREE_TEMPLATE_ID = 'treeExplorer';
    TreeRenderer = __decorate([
        __param(5, workbenchThemeService_1.IWorkbenchThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, label_1.ILabelService)
    ], TreeRenderer);
    class Aligner extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
        }
        set tree(tree) {
            this._tree = tree;
        }
        alignIconWithTwisty(treeItem) {
            if (treeItem.collapsibleState !== views_1.TreeItemCollapsibleState.None) {
                return false;
            }
            if (!this.hasIcon(treeItem)) {
                return false;
            }
            if (this._tree) {
                const parent = this._tree.getParentElement(treeItem) || this._tree.getInput();
                if (this.hasIcon(parent)) {
                    return false;
                }
                return !!parent.children && parent.children.every(c => c.collapsibleState === views_1.TreeItemCollapsibleState.None || !this.hasIcon(c));
            }
            else {
                return false;
            }
        }
        hasIcon(node) {
            const icon = this.themeService.getTheme().type === themeService_1.LIGHT ? node.icon : node.iconDark;
            if (icon) {
                return true;
            }
            if (node.resourceUri || node.themeIcon) {
                const fileIconTheme = this.themeService.getFileIconTheme();
                const isFolder = node.themeIcon ? node.themeIcon.id === themeService_1.FolderThemeIcon.id : node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
                if (isFolder) {
                    return fileIconTheme.hasFileIcons && fileIconTheme.hasFolderIcons;
                }
                return fileIconTheme.hasFileIcons;
            }
            return false;
        }
    }
    class MultipleSelectionActionRunner extends actions_1.ActionRunner {
        constructor(notificationService, getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
            this._register(this.onDidRun(e => {
                if (e.error) {
                    notificationService.error(nls_1.localize('command-error', 'Error running command {1}: {0}. This is likely caused by the extension that contributes {1}.', e.error.message, e.action.id));
                }
            }));
        }
        runAction(action, context) {
            const selection = this.getSelectedResources();
            let selectionHandleArgs = undefined;
            let actionInSelected = false;
            if (selection.length > 1) {
                selectionHandleArgs = selection.map(selected => {
                    if (selected.handle === context.$treeItemHandle) {
                        actionInSelected = true;
                    }
                    return { $treeViewId: context.$treeViewId, $treeItemHandle: selected.handle };
                });
            }
            if (!actionInSelected) {
                selectionHandleArgs = undefined;
            }
            return action.run(...[context, selectionHandleArgs]);
        }
    }
    let TreeMenus = class TreeMenus extends lifecycle_1.Disposable {
        constructor(id, contextKeyService, menuService, contextMenuService) {
            super();
            this.id = id;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
        }
        getResourceActions(element) {
            return this.getActions(39 /* ViewItemContext */, { key: 'viewItem', value: element.contextValue }).primary;
        }
        getResourceContextActions(element) {
            return this.getActions(39 /* ViewItemContext */, { key: 'viewItem', value: element.contextValue }).secondary;
        }
        getActions(menuId, context) {
            const contextKeyService = this.contextKeyService.createScoped();
            contextKeyService.createKey('view', this.id);
            contextKeyService.createKey(context.key, context.value);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            menu.dispose();
            contextKeyService.dispose();
            return result;
        }
    };
    TreeMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService),
        __param(3, contextView_1.IContextMenuService)
    ], TreeMenus);
});
//# sourceMappingURL=customView.js.map