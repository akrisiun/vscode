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
define(["require", "exports", "vs/nls", "vs/base/common/performance", "vs/base/common/decorators", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/base/browser/dom", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/contrib/files/browser/views/explorerDecorationsProvider", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/resources", "vs/workbench/services/decorations/browser/decorations", "vs/platform/list/browser/listService", "vs/base/browser/dnd", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/label/common/label", "vs/workbench/contrib/files/browser/views/explorerViewer", "vs/platform/theme/common/themeService", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/errors", "vs/workbench/browser/labels", "vs/workbench/browser/parts/views/views", "vs/platform/storage/common/storage", "vs/platform/clipboard/common/clipboardService", "vs/base/common/resources", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/files/common/files", "vs/base/common/lifecycle"], function (require, exports, nls, perf, decorators_1, files_1, fileActions_1, editor_1, diffEditorInput_1, DOM, layoutService_1, explorerDecorationsProvider_1, workspace_1, configuration_1, keybinding_1, instantiation_1, progress_1, contextView_1, contextkey_1, resources_1, decorations_1, listService_1, dnd_1, editorService_1, panelViewlet_1, label_1, explorerViewer_1, themeService_1, actions_1, menuEntryActionViewItem_1, telemetry_1, explorerModel_1, errors_1, labels_1, views_1, storage_1, clipboardService_1, resources_2, map_1, arrays_1, types_1, files_2, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExplorerView = class ExplorerView extends panelViewlet_1.ViewletPanel {
        constructor(options, contextMenuService, instantiationService, contextService, progressService, editorService, layoutService, keybindingService, contextKeyService, configurationService, decorationService, labelService, themeService, menuService, telemetryService, explorerService, storageService, clipboardService, fileService) {
            super(Object.assign(Object.assign({}, options), { id: ExplorerView.ID, ariaHeaderLabel: nls.localize('explorerSection', "Files Explorer Section") }), keybindingService, contextMenuService, configurationService, contextKeyService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.progressService = progressService;
            this.editorService = editorService;
            this.layoutService = layoutService;
            this.contextKeyService = contextKeyService;
            this.labelService = labelService;
            this.themeService = themeService;
            this.menuService = menuService;
            this.telemetryService = telemetryService;
            this.explorerService = explorerService;
            this.storageService = storageService;
            this.clipboardService = clipboardService;
            this.fileService = fileService;
            // Refresh is needed on the initial explorer open
            this.shouldRefresh = true;
            this.autoReveal = false;
            this.resourceContext = instantiationService.createInstance(resources_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.folderContext = files_1.ExplorerFolderContext.bindTo(contextKeyService);
            this.readonlyContext = files_1.ExplorerResourceReadonlyContext.bindTo(contextKeyService);
            this.rootContext = files_1.ExplorerRootContext.bindTo(contextKeyService);
            this.resourceMoveableToTrash = files_1.ExplorerResourceMoveableToTrash.bindTo(contextKeyService);
            const decorationProvider = new explorerDecorationsProvider_1.ExplorerDecorationsProvider(this.explorerService, contextService);
            this._register(decorationService.registerDecorationsProvider(decorationProvider));
            this._register(decorationProvider);
            this._register(this.resourceContext);
        }
        get name() {
            return this.labelService.getWorkspaceLabel(this.contextService.getWorkspace());
        }
        get title() {
            return this.name;
        }
        set title(value) {
            // noop
        }
        // Memoized locals
        get contributedContextMenu() {
            const contributedContextMenu = this.menuService.createMenu(11 /* ExplorerContext */, this.tree.contextKeyService);
            this._register(contributedContextMenu);
            return contributedContextMenu;
        }
        get fileCopiedContextKey() {
            return fileActions_1.FileCopiedContext.bindTo(this.contextKeyService);
        }
        get resourceCutContextKey() {
            return files_1.ExplorerResourceCut.bindTo(this.contextKeyService);
        }
        // Split view methods
        renderHeader(container) {
            super.renderHeader(container);
            // Expand on drag over
            this.dragHandler = new dnd_1.DelayedDragHandler(container, () => this.setExpanded(true));
            const titleElement = container.querySelector('.title');
            const setHeader = () => {
                const workspace = this.contextService.getWorkspace();
                const title = workspace.folders.map(folder => folder.name).join();
                titleElement.textContent = this.name;
                titleElement.title = title;
            };
            this._register(this.contextService.onDidChangeWorkspaceName(setHeader));
            this._register(this.labelService.onDidChangeFormatters(setHeader));
            setHeader();
        }
        layoutBody(height, width) {
            this.tree.layout(height, width);
        }
        renderBody(container) {
            const treeContainer = DOM.append(container, DOM.$('.explorer-folders-view'));
            this.createTree(treeContainer);
            if (this.toolbar) {
                this.toolbar.setActions(this.getActions(), this.getSecondaryActions())();
            }
            this._register(this.labelService.onDidChangeFormatters(() => {
                this._onDidChangeTitleArea.fire();
            }));
            this._register(this.explorerService.onDidChangeRoots(() => this.setTreeInput()));
            this._register(this.explorerService.onDidChangeItem(e => {
                if (this.explorerService.isEditable(undefined)) {
                    this.tree.domFocus();
                }
                this.refresh(e.recursive, e.item);
            }));
            this._register(this.explorerService.onDidChangeEditable(async (e) => {
                const isEditing = !!this.explorerService.getEditableData(e);
                if (isEditing) {
                    await this.tree.expand(e.parent);
                }
                else {
                    DOM.removeClass(treeContainer, 'highlight');
                }
                await this.refresh(false, e.parent);
                if (isEditing) {
                    DOM.addClass(treeContainer, 'highlight');
                    this.tree.reveal(e);
                }
                else {
                    this.tree.domFocus();
                }
            }));
            this._register(this.explorerService.onDidSelectResource(e => this.onSelectResource(e.resource, e.reveal)));
            this._register(this.explorerService.onDidCopyItems(e => this.onCopyItems(e.items, e.cut, e.previouslyCutItems)));
            // Update configuration
            const configuration = this.configurationService.getValue();
            this.onConfigurationUpdated(configuration);
            // When the explorer viewer is loaded, listen to changes to the editor input
            this._register(this.editorService.onDidActiveEditorChange(() => {
                this.selectActiveFile(true);
            }));
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue(), e)));
            this._register(this.onDidChangeBodyVisibility(async (visible) => {
                if (visible) {
                    // If a refresh was requested and we are now visible, run it
                    if (this.shouldRefresh) {
                        this.shouldRefresh = false;
                        await this.setTreeInput();
                    }
                    // Find resource to focus from active editor input if set
                    this.selectActiveFile(false, true);
                }
            }));
        }
        getActions() {
            if (!this.actions) {
                this.actions = [
                    this.instantiationService.createInstance(fileActions_1.NewFileAction),
                    this.instantiationService.createInstance(fileActions_1.NewFolderAction),
                    this.instantiationService.createInstance(fileActions_1.RefreshExplorerView, fileActions_1.RefreshExplorerView.ID, fileActions_1.RefreshExplorerView.LABEL),
                    this.instantiationService.createInstance(fileActions_1.CollapseExplorerView, fileActions_1.CollapseExplorerView.ID, fileActions_1.CollapseExplorerView.LABEL)
                ];
                this.actions.forEach(a => this._register(a));
            }
            return this.actions;
        }
        focus() {
            this.tree.domFocus();
            const focused = this.tree.getFocus();
            if (focused.length === 1) {
                if (this.autoReveal) {
                    this.tree.reveal(focused[0], 0.5);
                }
                const activeFile = this.getActiveFile();
                if (!activeFile && !focused[0].isDirectory) {
                    // Open the focused element in the editor if there is currently no file opened #67708
                    this.editorService.openEditor({ resource: focused[0].resource, options: { preserveFocus: true, revealIfVisible: true } });
                }
            }
        }
        selectActiveFile(deselect, reveal = this.autoReveal) {
            if (this.autoReveal) {
                const activeFile = this.getActiveFile();
                if (activeFile) {
                    const focus = this.tree.getFocus();
                    if (focus.length === 1 && focus[0].resource.toString() === activeFile.toString()) {
                        // No action needed, active file is already focused
                        return;
                    }
                    this.explorerService.select(activeFile, reveal);
                }
                else if (deselect) {
                    this.tree.setSelection([]);
                    this.tree.setFocus([]);
                }
            }
        }
        createTree(container) {
            this.filter = this.instantiationService.createInstance(explorerViewer_1.FilesFilter);
            this._register(this.filter);
            const explorerLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(explorerLabels);
            const updateWidth = (stat) => this.tree.updateWidth(stat);
            const filesRenderer = this.instantiationService.createInstance(explorerViewer_1.FilesRenderer, explorerLabels, updateWidth);
            this._register(filesRenderer);
            this._register(views_1.createFileIconThemableTreeContainerScope(container, this.themeService));
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'FileExplorer', container, new explorerViewer_1.ExplorerDelegate(), [filesRenderer], this.instantiationService.createInstance(explorerViewer_1.ExplorerDataSource), {
                accessibilityProvider: new explorerViewer_1.ExplorerAccessibilityProvider(),
                ariaLabel: nls.localize('treeAriaLabel', "Files Explorer"),
                identityProvider: {
                    getId: (stat) => {
                        if (stat instanceof explorerModel_1.NewExplorerItem) {
                            return `new:${stat.resource}`;
                        }
                        return stat.resource;
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (stat) => {
                        if (this.explorerService.isEditable(stat)) {
                            return undefined;
                        }
                        return stat.name;
                    }
                },
                multipleSelectionSupport: true,
                filter: this.filter,
                sorter: this.instantiationService.createInstance(explorerViewer_1.FileSorter),
                dnd: this.instantiationService.createInstance(explorerViewer_1.FileDragAndDrop),
                autoExpandSingleChildren: true,
                additionalScrollHeight: explorerViewer_1.ExplorerDelegate.ITEM_HEIGHT
            });
            this._register(this.tree);
            // Bind context keys
            files_1.FilesExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.tree.contextKeyService);
            // Update resource context based on focused element
            this._register(this.tree.onDidChangeFocus(e => this.onFocusChanged(e.elements)));
            this.onFocusChanged([]);
            const explorerNavigator = new listService_1.TreeResourceNavigator2(this.tree);
            this._register(explorerNavigator);
            // Open when selecting via keyboard
            this._register(explorerNavigator.onDidOpenResource(async (e) => {
                const selection = this.tree.getSelection();
                // Do not react if the user is expanding selection via keyboard.
                // Check if the item was previously also selected, if yes the user is simply expanding / collapsing current selection #66589.
                const shiftDown = e.browserEvent instanceof KeyboardEvent && e.browserEvent.shiftKey;
                if (selection.length === 1 && !shiftDown) {
                    if (selection[0].isDirectory || this.explorerService.isEditable(undefined)) {
                        // Do not react if user is clicking on explorer items while some are being edited #70276
                        // Do not react if clicking on directories
                        return;
                    }
                    this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'explorer' });
                    await this.editorService.openEditor({ resource: selection[0].resource, options: { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned } }, e.sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onDidScroll(e => {
                let editable = this.explorerService.getEditable();
                if (e.scrollTopChanged && editable && this.tree.getRelativeTop(editable.stat) === null) {
                    editable.data.onFinish('', false);
                }
            }));
            // save view state on shutdown
            this._register(this.storageService.onWillSaveState(() => {
                this.storageService.store(ExplorerView.TREE_VIEW_STATE_STORAGE_KEY, JSON.stringify(this.tree.getViewState()), 1 /* WORKSPACE */);
            }));
        }
        // React on events
        onConfigurationUpdated(configuration, event) {
            this.autoReveal = configuration && configuration.explorer && configuration.explorer.autoReveal;
            // Push down config updates to components of viewer
            let needsRefresh = false;
            if (this.filter) {
                needsRefresh = this.filter.updateConfiguration();
            }
            if (event && !needsRefresh) {
                needsRefresh = event.affectsConfiguration('explorer.decorations.colors')
                    || event.affectsConfiguration('explorer.decorations.badges');
            }
            // Refresh viewer as needed if this originates from a config event
            if (event && needsRefresh) {
                this.refresh(true);
            }
        }
        setContextKeys(stat) {
            const isSingleFolder = this.contextService.getWorkbenchState() === 2 /* FOLDER */;
            const resource = stat ? stat.resource : isSingleFolder ? this.contextService.getWorkspace().folders[0].uri : null;
            this.resourceContext.set(resource);
            this.folderContext.set((isSingleFolder && !stat) || !!stat && stat.isDirectory);
            this.readonlyContext.set(!!stat && stat.isReadonly);
            this.rootContext.set(!stat || (stat && stat.isRoot));
        }
        onContextMenu(e) {
            const stat = e.element;
            // update dynamic contexts
            this.fileCopiedContextKey.set(this.clipboardService.hasResources());
            this.setContextKeys(stat);
            const selection = this.tree.getSelection();
            const actions = [];
            const roots = this.explorerService.roots; // If the click is outside of the elements pass the root resource if there is only one root. If there are multiple roots pass empty object.
            const arg = stat instanceof explorerModel_1.ExplorerItem ? stat.resource : roots.length === 1 ? roots[0].resource : {};
            const actionsDisposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(this.contributedContextMenu, { arg, shouldForwardArgs: true }, actions, this.contextMenuService);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                    lifecycle_1.dispose(actionsDisposable);
                },
                getActionsContext: () => stat && selection && selection.indexOf(stat) >= 0
                    ? selection.map((fs) => fs.resource)
                    : stat instanceof explorerModel_1.ExplorerItem ? [stat.resource] : []
            });
        }
        onFocusChanged(elements) {
            const stat = elements && elements.length ? elements[0] : null;
            this.setContextKeys(stat);
            if (stat) {
                const enableTrash = this.configurationService.getValue().files.enableTrash;
                const hasCapability = this.fileService.hasCapability(stat.resource, 4096 /* Trash */);
                this.resourceMoveableToTrash.set(enableTrash && hasCapability);
            }
            else {
                this.resourceMoveableToTrash.reset();
            }
        }
        // General methods
        /**
         * Refresh the contents of the explorer to get up to date data from the disk about the file structure.
         * If the item is passed we refresh only that level of the tree, otherwise we do a full refresh.
         */
        refresh(recursive, item) {
            if (!this.tree || !this.isBodyVisible()) {
                this.shouldRefresh = true;
                return Promise.resolve(undefined);
            }
            // Tree node doesn't exist yet
            if (item && !this.tree.hasNode(item)) {
                return Promise.resolve(undefined);
            }
            const toRefresh = item || this.tree.getInput();
            return this.tree.updateChildren(toRefresh, recursive);
        }
        getOptimalWidth() {
            const parentNode = this.tree.getHTMLElement();
            const childNodes = [].slice.call(parentNode.querySelectorAll('.explorer-item .label-name')); // select all file labels
            return DOM.getLargestChildWidth(parentNode, childNodes);
        }
        // private didLoad = false;
        setTreeInput() {
            if (!this.isBodyVisible()) {
                this.shouldRefresh = true;
                return Promise.resolve(undefined);
            }
            const initialInputSetup = !this.tree.getInput();
            if (initialInputSetup) {
                perf.mark('willResolveExplorer');
            }
            const roots = this.explorerService.roots;
            let input = roots[0];
            if (this.contextService.getWorkbenchState() !== 2 /* FOLDER */ || roots[0].isError) {
                // Display roots only when multi folder workspace
                input = roots;
            }
            let viewState;
            if (this.tree && this.tree.getInput()) {
                viewState = this.tree.getViewState();
            }
            else {
                const rawViewState = this.storageService.get(ExplorerView.TREE_VIEW_STATE_STORAGE_KEY, 1 /* WORKSPACE */);
                if (rawViewState) {
                    viewState = JSON.parse(rawViewState);
                }
            }
            const previousInput = this.tree.getInput();
            const promise = this.tree.setInput(input, viewState).then(() => {
                if (Array.isArray(input)) {
                    if (!viewState || previousInput instanceof explorerModel_1.ExplorerItem) {
                        // There is no view state for this workspace, expand all roots. Or we transitioned from a folder workspace.
                        input.forEach(item => this.tree.expand(item).then(undefined, errors_1.onUnexpectedError));
                    }
                    if (Array.isArray(previousInput) && previousInput.length < input.length) {
                        // Roots added to the explorer -> expand them.
                        input.slice(previousInput.length).forEach(item => this.tree.expand(item).then(undefined, errors_1.onUnexpectedError));
                    }
                }
                if (initialInputSetup) {
                    perf.mark('didResolveExplorer');
                }
            });
            this.progressService.withProgress({
                location: 1 /* Explorer */,
                delay: this.layoutService.isRestored() ? 800 : 1200 // less ugly initial startup
            }, _progress => promise);
            return promise;
        }
        getActiveFile() {
            const input = this.editorService.activeEditor;
            // ignore diff editor inputs (helps to get out of diffing when returning to explorer)
            if (input instanceof diffEditorInput_1.DiffEditorInput) {
                return undefined;
            }
            // check for files
            return types_1.withNullAsUndefined(editor_1.toResource(input, { supportSideBySide: editor_1.SideBySideEditor.MASTER }));
        }
        async onSelectResource(resource, reveal = this.autoReveal) {
            if (!resource || !this.isBodyVisible()) {
                return;
            }
            // Expand all stats in the parent chain.
            let item = this.explorerService.roots.filter(i => resources_2.isEqualOrParent(resource, i.resource))
                // Take the root that is the closest to the stat #72299
                .sort((first, second) => second.resource.path.length - first.resource.path.length)[0];
            while (item && item.resource.toString() !== resource.toString()) {
                await this.tree.expand(item);
                item = arrays_1.first(map_1.values(item.children), i => resources_2.isEqualOrParent(resource, i.resource));
            }
            if (item && item.parent) {
                if (reveal) {
                    this.tree.reveal(item, 0.5);
                }
                this.tree.setFocus([item]);
                this.tree.setSelection([item]);
            }
        }
        onCopyItems(stats, cut, previousCut) {
            this.fileCopiedContextKey.set(stats.length > 0);
            this.resourceCutContextKey.set(cut && stats.length > 0);
            if (previousCut) {
                previousCut.forEach(item => this.tree.rerender(item));
            }
            if (cut) {
                stats.forEach(s => this.tree.rerender(s));
            }
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        dispose() {
            if (this.dragHandler) {
                this.dragHandler.dispose();
            }
            super.dispose();
        }
    };
    ExplorerView.ID = 'workbench.explorer.fileView';
    ExplorerView.TREE_VIEW_STATE_STORAGE_KEY = 'workbench.explorer.treeViewState';
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "contributedContextMenu", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "fileCopiedContextKey", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerView.prototype, "resourceCutContextKey", null);
    ExplorerView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, progress_1.IProgressService),
        __param(5, editorService_1.IEditorService),
        __param(6, layoutService_1.IWorkbenchLayoutService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, decorations_1.IDecorationsService),
        __param(11, label_1.ILabelService),
        __param(12, themeService_1.IThemeService),
        __param(13, actions_1.IMenuService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, files_1.IExplorerService),
        __param(16, storage_1.IStorageService),
        __param(17, clipboardService_1.IClipboardService),
        __param(18, files_2.IFileService)
    ], ExplorerView);
    exports.ExplorerView = ExplorerView;
});
//# sourceMappingURL=explorerView.js.map