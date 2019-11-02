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
define(["require", "exports", "vs/base/common/event", "vs/base/browser/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/panelViewlet", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./menus", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "./util", "vs/platform/theme/common/styler", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/strings", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/base/common/platform", "vs/base/common/resourceTree", "vs/base/common/iterator", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/comparers", "vs/base/common/filters", "vs/nls", "vs/base/common/arrays", "vs/base/common/decorators", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/workbench/common/editor", "vs/css!./media/scmViewlet"], function (require, exports, event_1, event_2, resources_1, lifecycle_1, panelViewlet_1, dom_1, labels_1, countBadge_1, editorService_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, menuEntryActionViewItem_1, menus_1, actionbar_1, themeService_1, util_1, styler_1, inputBox_1, strings_1, listService_1, configuration_1, async_1, notification_1, platform, resourceTree_1, iterator_1, uri_1, files_1, comparers_1, filters_1, nls_1, arrays_1, decorators_1, workbenchThemeService_1, storage_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ResourceGroupRenderer {
        constructor(actionViewItemProvider, themeService, menus) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceGroupRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            // hack
            dom_1.addClass(container.parentElement.parentElement.querySelector('.monaco-tl-twistie'), 'force-twistie');
            const element = dom_1.append(container, dom_1.$('.resource-group'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const actionsContainer = dom_1.append(element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = dom_1.append(element, dom_1.$('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const styler = styler_1.attachBadgeStyler(count, this.themeService);
            const elementDisposables = lifecycle_1.Disposable.None;
            const disposables = lifecycle_1.combinedDisposable(actionBar, styler);
            return { name, count, actionBar, elementDisposables, disposables };
        }
        renderElement(node, index, template) {
            template.elementDisposables.dispose();
            const group = node.element;
            template.name.textContent = group.label;
            template.actionBar.clear();
            template.actionBar.context = group;
            template.count.setCount(group.elements.length);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceGroupMenu(group), template.actionBar));
            template.elementDisposables = disposables;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Should never happen since node is incompressible');
        }
        disposeElement(group, index, template) {
            template.elementDisposables.dispose();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    }
    ResourceGroupRenderer.TEMPLATE_ID = 'resource group';
    class MultipleSelectionActionRunner extends actions_2.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        runAction(action, context) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedResources();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const args = arrays_1.flatten(actualContext.map(e => resourceTree_1.ResourceTree.isResourceNode(e) ? resourceTree_1.ResourceTree.collect(e) : [e]));
            return action.run(...args);
        }
    }
    class ResourceRenderer {
        constructor(viewModelProvider, labels, actionViewItemProvider, getSelectedResources, themeService, menus) {
            this.viewModelProvider = viewModelProvider;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.getSelectedResources = getSelectedResources;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            const element = dom_1.append(container, dom_1.$('.resource'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const fileLabel = this.labels.create(name, { supportHighlights: true });
            const actionsContainer = dom_1.append(fileLabel.element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider,
                actionRunner: new MultipleSelectionActionRunner(this.getSelectedResources)
            });
            const decorationIcon = dom_1.append(element, dom_1.$('.decoration-icon'));
            const disposables = lifecycle_1.combinedDisposable(actionBar, fileLabel);
            return { element, name, fileLabel, decorationIcon, actionBar, elementDisposables: lifecycle_1.Disposable.None, disposables };
        }
        renderElement(node, index, template) {
            template.elementDisposables.dispose();
            const elementDisposables = new lifecycle_1.DisposableStore();
            const resourceOrFolder = node.element;
            const theme = this.themeService.getTheme();
            const iconResource = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.element : resourceOrFolder;
            const icon = iconResource && (theme.type === themeService_1.LIGHT ? iconResource.decorations.icon : iconResource.decorations.iconDark);
            const uri = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? resourceOrFolder.uri : resourceOrFolder.sourceUri;
            const fileKind = resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
            const viewModel = this.viewModelProvider();
            template.fileLabel.setFile(uri, {
                fileDecorations: { colors: false, badges: !icon },
                hidePath: viewModel.mode === "tree" /* Tree */,
                fileKind,
                matches: filters_1.createMatches(node.filterData)
            });
            template.actionBar.clear();
            template.actionBar.context = resourceOrFolder;
            if (resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder)) {
                if (resourceOrFolder.element) {
                    elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceMenu(resourceOrFolder.element.resourceGroup), template.actionBar));
                    dom_1.toggleClass(template.name, 'strike-through', resourceOrFolder.element.decorations.strikeThrough);
                    dom_1.toggleClass(template.element, 'faded', resourceOrFolder.element.decorations.faded);
                }
                else {
                    elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceFolderMenu(resourceOrFolder.context), template.actionBar));
                    dom_1.removeClass(template.name, 'strike-through');
                    dom_1.removeClass(template.element, 'faded');
                }
            }
            else {
                elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceMenu(resourceOrFolder.resourceGroup), template.actionBar));
                dom_1.toggleClass(template.name, 'strike-through', resourceOrFolder.decorations.strikeThrough);
                dom_1.toggleClass(template.element, 'faded', resourceOrFolder.decorations.faded);
            }
            const tooltip = !resourceTree_1.ResourceTree.isResourceNode(resourceOrFolder) && resourceOrFolder.decorations.tooltip || '';
            if (icon) {
                template.decorationIcon.style.display = '';
                template.decorationIcon.style.backgroundImage = `url('${icon}')`;
                template.decorationIcon.title = tooltip;
            }
            else {
                template.decorationIcon.style.display = 'none';
                template.decorationIcon.style.backgroundImage = '';
                template.decorationIcon.title = '';
            }
            template.element.setAttribute('data-tooltip', tooltip);
            template.elementDisposables = elementDisposables;
        }
        disposeElement(resource, index, template) {
            template.elementDisposables.dispose();
        }
        renderCompressedElements(node, index, template, height) {
            template.elementDisposables.dispose();
            const elementDisposables = new lifecycle_1.DisposableStore();
            const compressed = node.element;
            const folder = compressed.elements[compressed.elements.length - 1];
            const label = compressed.elements.map(e => e.name).join('/');
            const fileKind = files_1.FileKind.FOLDER;
            template.fileLabel.setResource({ resource: folder.uri, name: label }, {
                fileDecorations: { colors: false, badges: true },
                fileKind,
                matches: filters_1.createMatches(node.filterData)
            });
            template.actionBar.clear();
            template.actionBar.context = folder;
            elementDisposables.add(util_1.connectPrimaryMenuToInlineActionBar(this.menus.getResourceFolderMenu(folder.context), template.actionBar));
            dom_1.removeClass(template.name, 'strike-through');
            dom_1.removeClass(template.element, 'faded');
            template.decorationIcon.style.display = 'none';
            template.decorationIcon.style.backgroundImage = '';
            template.element.setAttribute('data-tooltip', '');
            template.elementDisposables = elementDisposables;
        }
        disposeCompressedElements(node, index, template, height) {
            template.elementDisposables.dispose();
        }
        disposeTemplate(template) {
            template.elementDisposables.dispose();
            template.disposables.dispose();
        }
    }
    ResourceRenderer.TEMPLATE_ID = 'resource';
    class ProviderListDelegate {
        getHeight() { return 22; }
        getTemplateId(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element) || util_1.isSCMResource(element)) {
                return ResourceRenderer.TEMPLATE_ID;
            }
            else {
                return ResourceGroupRenderer.TEMPLATE_ID;
            }
        }
    }
    class SCMTreeFilter {
        filter(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return true;
            }
            else if (util_1.isSCMResourceGroup(element)) {
                return element.elements.length > 0 || !element.hideWhenEmpty;
            }
            else {
                return true;
            }
        }
    }
    class SCMTreeSorter {
        constructor(viewModelProvider) {
            this.viewModelProvider = viewModelProvider;
        }
        get viewModel() { return this.viewModelProvider(); }
        compare(one, other) {
            if (this.viewModel.mode === "list" /* List */) {
                return 0;
            }
            if (util_1.isSCMResourceGroup(one) && util_1.isSCMResourceGroup(other)) {
                return 0;
            }
            const oneIsDirectory = resourceTree_1.ResourceTree.isResourceNode(one);
            const otherIsDirectory = resourceTree_1.ResourceTree.isResourceNode(other);
            if (oneIsDirectory !== otherIsDirectory) {
                return oneIsDirectory ? -1 : 1;
            }
            const oneName = resourceTree_1.ResourceTree.isResourceNode(one) ? one.name : resources_1.basename(one.sourceUri);
            const otherName = resourceTree_1.ResourceTree.isResourceNode(other) ? other.name : resources_1.basename(other.sourceUri);
            return comparers_1.compareFileNames(oneName, otherName);
        }
    }
    __decorate([
        decorators_1.memoize
    ], SCMTreeSorter.prototype, "viewModel", null);
    exports.SCMTreeSorter = SCMTreeSorter;
    class SCMTreeKeyboardNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                return element.name;
            }
            else if (util_1.isSCMResourceGroup(element)) {
                return element.label;
            }
            else {
                return resources_1.basename(element.sourceUri);
            }
        }
        getCompressedNodeKeyboardNavigationLabel(elements) {
            const folders = elements;
            return folders.map(e => e.name).join('/');
        }
    }
    exports.SCMTreeKeyboardNavigationLabelProvider = SCMTreeKeyboardNavigationLabelProvider;
    class SCMResourceIdentityProvider {
        getId(element) {
            if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                const group = element.context;
                return `${group.provider.contextValue}/${group.id}/$FOLDER/${element.uri.toString()}`;
            }
            else if (util_1.isSCMResource(element)) {
                const group = element.resourceGroup;
                const provider = group.provider;
                return `${provider.contextValue}/${group.id}/${element.sourceUri.toString()}`;
            }
            else {
                const provider = element.provider;
                return `${provider.contextValue}/${element.id}`;
            }
        }
    }
    function groupItemAsTreeElement(item, mode) {
        const children = mode === "list" /* List */
            ? iterator_1.Iterator.map(iterator_1.Iterator.fromArray(item.resources), element => ({ element, incompressible: true }))
            : iterator_1.Iterator.map(item.tree.root.children, node => asTreeElement(node, true));
        return { element: item.group, children, incompressible: true, collapsible: true };
    }
    function asTreeElement(node, forceIncompressible) {
        return {
            element: (node.childrenCount === 0 && node.element) ? node.element : node,
            children: iterator_1.Iterator.map(node.children, node => asTreeElement(node, false)),
            incompressible: !!node.element || forceIncompressible
        };
    }
    var ViewModelMode;
    (function (ViewModelMode) {
        ViewModelMode["List"] = "list";
        ViewModelMode["Tree"] = "tree";
    })(ViewModelMode || (ViewModelMode = {}));
    let ViewModel = class ViewModel {
        constructor(groups, tree, _mode, editorService, configurationService) {
            this.groups = groups;
            this.tree = tree;
            this._mode = _mode;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this._onDidChangeMode = new event_1.Emitter();
            this.onDidChangeMode = this._onDidChangeMode.event;
            this.items = [];
            this.visibilityDisposables = new lifecycle_1.DisposableStore();
            this.firstVisible = true;
            this.disposables = new lifecycle_1.DisposableStore();
        }
        get mode() { return this._mode; }
        set mode(mode) {
            this._mode = mode;
            for (const item of this.items) {
                item.tree.clear();
                if (mode === "tree" /* Tree */) {
                    for (const resource of item.resources) {
                        item.tree.add(resource.sourceUri, resource);
                    }
                }
            }
            this.refresh();
            this._onDidChangeMode.fire(mode);
        }
        onDidSpliceGroups({ start, deleteCount, toInsert }) {
            const itemsToInsert = [];
            for (const group of toInsert) {
                const tree = new resourceTree_1.ResourceTree(group, group.provider.rootUri || uri_1.URI.file('/'));
                const resources = [...group.elements];
                const disposable = lifecycle_1.combinedDisposable(group.onDidChange(() => this.tree.refilter()), group.onDidSplice(splice => this.onDidSpliceGroup(item, splice)));
                const item = { group, resources, tree, disposable };
                if (this._mode === "tree" /* Tree */) {
                    for (const resource of resources) {
                        item.tree.add(resource.sourceUri, resource);
                    }
                }
                itemsToInsert.push(item);
            }
            const itemsToDispose = this.items.splice(start, deleteCount, ...itemsToInsert);
            for (const item of itemsToDispose) {
                item.disposable.dispose();
            }
            this.refresh();
        }
        onDidSpliceGroup(item, { start, deleteCount, toInsert }) {
            const deleted = item.resources.splice(start, deleteCount, ...toInsert);
            if (this._mode === "tree" /* Tree */) {
                for (const resource of deleted) {
                    item.tree.delete(resource.sourceUri);
                }
                for (const resource of toInsert) {
                    item.tree.add(resource.sourceUri, resource);
                }
            }
            this.refresh(item);
        }
        setVisible(visible) {
            if (visible) {
                this.visibilityDisposables = new lifecycle_1.DisposableStore();
                this.groups.onDidSplice(this.onDidSpliceGroups, this, this.visibilityDisposables);
                this.onDidSpliceGroups({ start: 0, deleteCount: this.items.length, toInsert: this.groups.elements });
                if (typeof this.scrollTop === 'number') {
                    this.tree.scrollTop = this.scrollTop;
                    this.scrollTop = undefined;
                }
                this.editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.visibilityDisposables);
                this.onDidActiveEditorChange();
            }
            else {
                this.visibilityDisposables.dispose();
                this.onDidSpliceGroups({ start: 0, deleteCount: this.items.length, toInsert: [] });
                this.scrollTop = this.tree.scrollTop;
            }
        }
        refresh(item) {
            if (item) {
                this.tree.setChildren(item.group, groupItemAsTreeElement(item, this.mode).children);
            }
            else {
                this.tree.setChildren(null, this.items.map(item => groupItemAsTreeElement(item, this.mode)));
            }
        }
        onDidActiveEditorChange() {
            var _a;
            if (!this.configurationService.getValue('scm.autoReveal')) {
                return;
            }
            if (this.firstVisible) {
                this.firstVisible = false;
                this.visibilityDisposables.add(async_1.disposableTimeout(() => this.onDidActiveEditorChange(), 250));
                return;
            }
            const editor = this.editorService.activeEditor;
            if (!editor) {
                return;
            }
            const uri = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            if (!uri) {
                return;
            }
            // go backwards from last group
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                const resource = this.mode === "tree" /* Tree */
                    ? (_a = item.tree.getNode(uri)) === null || _a === void 0 ? void 0 : _a.element : arrays_1.find(item.resources, r => resources_1.isEqual(r.sourceUri, uri));
                if (resource) {
                    this.tree.reveal(resource);
                    this.tree.setSelection([resource]);
                    this.tree.setFocus([resource]);
                    return;
                }
            }
        }
        dispose() {
            this.visibilityDisposables.dispose();
            this.disposables.dispose();
        }
    };
    ViewModel = __decorate([
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService)
    ], ViewModel);
    class ToggleViewModeAction extends actions_2.Action {
        constructor(viewModel) {
            super(ToggleViewModeAction.ID, ToggleViewModeAction.LABEL);
            this.viewModel = viewModel;
            this._register(this.viewModel.onDidChangeMode(this.onDidChangeMode, this));
            this.onDidChangeMode(this.viewModel.mode);
        }
        async run() {
            this.viewModel.mode = this.viewModel.mode === "list" /* List */ ? "tree" /* Tree */ : "list" /* List */;
        }
        onDidChangeMode(mode) {
            const iconClass = mode === "list" /* List */ ? 'codicon-filter' : 'codicon-selection';
            this.class = `scm-action toggle-view-mode ${iconClass}`;
        }
    }
    exports.ToggleViewModeAction = ToggleViewModeAction;
    ToggleViewModeAction.ID = 'workbench.scm.action.toggleViewMode';
    ToggleViewModeAction.LABEL = nls_1.localize('toggleViewMode', "Toggle View Mode");
    function convertValidationType(type) {
        switch (type) {
            case 2 /* Information */: return 1 /* INFO */;
            case 1 /* Warning */: return 2 /* WARNING */;
            case 0 /* Error */: return 3 /* ERROR */;
        }
    }
    let RepositoryPanel = class RepositoryPanel extends panelViewlet_1.ViewletPanel {
        constructor(repository, options, keybindingService, themeService, contextMenuService, contextViewService, commandService, notificationService, editorService, instantiationService, configurationService, contextKeyService, menuService, storageService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService);
            this.repository = repository;
            this.keybindingService = keybindingService;
            this.themeService = themeService;
            this.contextMenuService = contextMenuService;
            this.contextViewService = contextViewService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.menuService = menuService;
            this.storageService = storageService;
            this.cachedHeight = undefined;
            this.cachedWidth = undefined;
            this.commitTemplate = '';
            this.menus = instantiationService.createInstance(menus_1.SCMMenus, this.repository.provider);
            this._register(this.menus);
            this._register(this.menus.onDidChangeTitle(this._onDidChangeTitleArea.fire, this._onDidChangeTitleArea));
            this.contextKeyService = contextKeyService.createScoped(this.element);
            this.contextKeyService.createKey('scmRepository', this.repository);
        }
        render() {
            super.render();
            this._register(this.menus.onDidChangeTitle(this.updateActions, this));
        }
        renderHeaderTitle(container) {
            let title;
            let type;
            if (this.repository.provider.rootUri) {
                title = resources_1.basename(this.repository.provider.rootUri);
                type = this.repository.provider.label;
            }
            else {
                title = this.repository.provider.label;
                type = '';
            }
            super.renderHeaderTitle(container, title);
            dom_1.addClass(container, 'scm-provider');
            dom_1.append(container, dom_1.$('span.type', undefined, type));
        }
        renderBody(container) {
            const focusTracker = dom_1.trackFocus(container);
            this._register(focusTracker.onDidFocus(() => this.repository.focus()));
            this._register(focusTracker);
            // Input
            this.inputBoxContainer = dom_1.append(container, dom_1.$('.scm-editor'));
            const updatePlaceholder = () => {
                const binding = this.keybindingService.lookupKeybinding('scm.acceptInput');
                const label = binding ? binding.getLabel() : (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter');
                const placeholder = strings_1.format(this.repository.input.placeholder, label);
                this.inputBox.setPlaceHolder(placeholder);
            };
            const validationDelayer = new async_1.ThrottledDelayer(200);
            const validate = () => {
                return this.repository.input.validateInput(this.inputBox.value, this.inputBox.inputElement.selectionStart || 0).then(result => {
                    if (!result) {
                        this.inputBox.inputElement.removeAttribute('aria-invalid');
                        this.inputBox.hideMessage();
                    }
                    else {
                        this.inputBox.inputElement.setAttribute('aria-invalid', 'true');
                        this.inputBox.showMessage({ content: result.message, type: convertValidationType(result.type) });
                    }
                });
            };
            const triggerValidation = () => validationDelayer.trigger(validate);
            this.inputBox = new inputBox_1.InputBox(this.inputBoxContainer, this.contextViewService, { flexibleHeight: true, flexibleMaxHeight: 134 });
            this.inputBox.setEnabled(this.isBodyVisible());
            this._register(styler_1.attachInputBoxStyler(this.inputBox, this.themeService));
            this._register(this.inputBox);
            this._register(this.inputBox.onDidChange(triggerValidation, null));
            const onKeyUp = event_2.domEvent(this.inputBox.inputElement, 'keyup');
            const onMouseUp = event_2.domEvent(this.inputBox.inputElement, 'mouseup');
            this._register(event_1.Event.any(onKeyUp, onMouseUp)(triggerValidation, null));
            this.inputBox.value = this.repository.input.value;
            this._register(this.inputBox.onDidChange(value => this.repository.input.value = value, null));
            this._register(this.repository.input.onDidChange(value => this.inputBox.value = value, null));
            updatePlaceholder();
            this._register(this.repository.input.onDidChangePlaceholder(updatePlaceholder, null));
            this._register(this.keybindingService.onDidUpdateKeybindings(updatePlaceholder, null));
            this._register(this.inputBox.onDidHeightChange(() => this.layoutBody()));
            if (this.repository.provider.onDidChangeCommitTemplate) {
                this._register(this.repository.provider.onDidChangeCommitTemplate(this.onDidChangeCommitTemplate, this));
            }
            this.onDidChangeCommitTemplate();
            // Input box visibility
            this._register(this.repository.input.onDidChangeVisibility(this.updateInputBoxVisibility, this));
            this.updateInputBoxVisibility();
            // List
            this.listContainer = dom_1.append(container, dom_1.$('.scm-status.show-file-icons'));
            const updateActionsVisibility = () => dom_1.toggleClass(this.listContainer, 'show-actions', this.configurationService.getValue('scm.alwaysShowActions'));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowActions'))(updateActionsVisibility);
            updateActionsVisibility();
            const delegate = new ProviderListDelegate();
            const actionViewItemProvider = (action) => this.getActionViewItem(action);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(this.listLabels);
            const renderers = [
                new ResourceGroupRenderer(actionViewItemProvider, this.themeService, this.menus),
                new ResourceRenderer(() => this.viewModel, this.listLabels, actionViewItemProvider, () => this.getSelectedResources(), this.themeService, this.menus)
            ];
            const filter = new SCMTreeFilter();
            const sorter = new SCMTreeSorter(() => this.viewModel);
            const keyboardNavigationLabelProvider = new SCMTreeKeyboardNavigationLabelProvider();
            const identityProvider = new SCMResourceIdentityProvider();
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleObjectTree, 'SCM Tree Repo', this.listContainer, delegate, renderers, {
                identityProvider,
                horizontalScrolling: false,
                filter,
                sorter,
                keyboardNavigationLabelProvider
            });
            this._register(event_1.Event.chain(this.tree.onDidOpen)
                .map(e => e.elements[0])
                .filter(e => !!e && !util_1.isSCMResourceGroup(e) && !resourceTree_1.ResourceTree.isResourceNode(e))
                .on(this.open, this));
            this._register(event_1.Event.chain(this.tree.onDidPin)
                .map(e => e.elements[0])
                .filter(e => !!e && !util_1.isSCMResourceGroup(e) && !resourceTree_1.ResourceTree.isResourceNode(e))
                .on(this.pin, this));
            this._register(this.tree.onContextMenu(this.onListContextMenu, this));
            this._register(this.tree);
            let mode = this.configurationService.getValue('scm.defaultViewMode') === 'list' ? "list" /* List */ : "tree" /* Tree */;
            const rootUri = this.repository.provider.rootUri;
            if (typeof rootUri !== 'undefined') {
                const storageMode = this.storageService.get(`scm.repository.viewMode:${rootUri.toString()}`, 1 /* WORKSPACE */);
                if (typeof storageMode === 'string') {
                    mode = storageMode;
                }
            }
            this.viewModel = this.instantiationService.createInstance(ViewModel, this.repository.provider.groups, this.tree, mode);
            this._register(this.viewModel);
            dom_1.addClass(this.listContainer, 'file-icon-themable-tree');
            dom_1.addClass(this.listContainer, 'show-file-icons');
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            this._register(this.themeService.onDidFileIconThemeChange(this.updateIndentStyles, this));
            this._register(this.viewModel.onDidChangeMode(this.onDidChangeMode, this));
            this.toggleViewModelModeAction = new ToggleViewModeAction(this.viewModel);
            this._register(this.toggleViewModelModeAction);
            this._register(this.onDidChangeBodyVisibility(this._onDidChangeVisibility, this));
            this.updateActions();
        }
        updateIndentStyles(theme) {
            dom_1.toggleClass(this.listContainer, 'list-view-mode', this.viewModel.mode === "list" /* List */);
            dom_1.toggleClass(this.listContainer, 'tree-view-mode', this.viewModel.mode === "tree" /* Tree */);
            dom_1.toggleClass(this.listContainer, 'align-icons-and-twisties', this.viewModel.mode === "tree" /* Tree */ && theme.hasFileIcons && !theme.hasFolderIcons);
            dom_1.toggleClass(this.listContainer, 'hide-arrows', this.viewModel.mode === "tree" /* Tree */ && theme.hidesExplorerArrows === true);
        }
        onDidChangeMode() {
            this.updateIndentStyles(this.themeService.getFileIconTheme());
            const rootUri = this.repository.provider.rootUri;
            if (typeof rootUri === 'undefined') {
                return;
            }
            this.storageService.store(`scm.repository.viewMode:${rootUri.toString()}`, this.viewModel.mode, 1 /* WORKSPACE */);
        }
        layoutBody(height = this.cachedHeight, width = this.cachedWidth) {
            if (height === undefined) {
                return;
            }
            this.cachedHeight = height;
            if (this.repository.input.visible) {
                dom_1.removeClass(this.inputBoxContainer, 'hidden');
                this.inputBox.layout();
                const editorHeight = this.inputBox.height;
                const listHeight = height - (editorHeight + 12 /* margin */);
                this.listContainer.style.height = `${listHeight}px`;
                this.tree.layout(listHeight, width);
            }
            else {
                dom_1.addClass(this.inputBoxContainer, 'hidden');
                this.listContainer.style.height = `${height}px`;
                this.tree.layout(height, width);
            }
        }
        focus() {
            super.focus();
            if (this.isExpanded()) {
                if (this.repository.input.visible) {
                    this.inputBox.focus();
                }
                else {
                    this.tree.domFocus();
                }
                this.repository.focus();
            }
        }
        _onDidChangeVisibility(visible) {
            this.inputBox.setEnabled(visible);
            this.viewModel.setVisible(visible);
        }
        getActions() {
            if (this.toggleViewModelModeAction) {
                return [
                    this.toggleViewModelModeAction,
                    ...this.menus.getTitleActions()
                ];
            }
            else {
                return this.menus.getTitleActions();
            }
        }
        getSecondaryActions() {
            return this.menus.getTitleSecondaryActions();
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActionsContext() {
            return this.repository.provider;
        }
        open(e) {
            e.open();
        }
        pin() {
            const activeControl = this.editorService.activeControl;
            if (activeControl) {
                activeControl.group.pinEditor(activeControl.input);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            let actions = [];
            if (util_1.isSCMResourceGroup(element)) {
                actions = this.menus.getResourceGroupContextActions(element);
            }
            else if (resourceTree_1.ResourceTree.isResourceNode(element)) {
                if (element.element) {
                    actions = this.menus.getResourceContextActions(element.element);
                }
                else {
                    actions = this.menus.getResourceFolderContextActions(element.context);
                }
            }
            else {
                actions = this.menus.getResourceContextActions(element);
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                actionRunner: new MultipleSelectionActionRunner(() => this.getSelectedResources())
            });
        }
        getSelectedResources() {
            return this.tree.getSelection()
                .filter(r => !!r && !util_1.isSCMResourceGroup(r));
        }
        onDidChangeCommitTemplate() {
            if (typeof this.repository.provider.commitTemplate === 'undefined' || !this.repository.input.visible) {
                return;
            }
            const oldCommitTemplate = this.commitTemplate;
            this.commitTemplate = this.repository.provider.commitTemplate;
            if (this.inputBox.value && this.inputBox.value !== oldCommitTemplate) {
                return;
            }
            this.inputBox.value = this.commitTemplate;
        }
        updateInputBoxVisibility() {
            if (this.cachedHeight) {
                this.layoutBody(this.cachedHeight);
            }
        }
    };
    RepositoryPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, contextView_1.IContextViewService),
        __param(6, commands_1.ICommandService),
        __param(7, notification_1.INotificationService),
        __param(8, editorService_1.IEditorService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, contextkey_1.IContextKeyService),
        __param(12, actions_1.IMenuService),
        __param(13, storage_1.IStorageService)
    ], RepositoryPanel);
    exports.RepositoryPanel = RepositoryPanel;
    class RepositoryViewDescriptor {
        constructor(repository, hideByDefault) {
            this.repository = repository;
            this.hideByDefault = hideByDefault;
            this.canToggleVisibility = true;
            this.order = -500;
            this.workspace = true;
            const repoId = repository.provider.rootUri ? repository.provider.rootUri.toString() : `#${RepositoryViewDescriptor.counter++}`;
            this.id = `scm:repository:${repository.provider.label}:${repoId}`;
            this.name = repository.provider.rootUri ? resources_1.basename(repository.provider.rootUri) : repository.provider.label;
            this.ctorDescriptor = { ctor: RepositoryPanel, arguments: [repository] };
        }
    }
    exports.RepositoryViewDescriptor = RepositoryViewDescriptor;
    RepositoryViewDescriptor.counter = 0;
});
//# sourceMappingURL=repositoryPanel.js.map