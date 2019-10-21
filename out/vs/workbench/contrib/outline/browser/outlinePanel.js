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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/storage/common/storage", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/panelViewlet", "vs/workbench/browser/viewlet", "vs/workbench/services/editor/common/editorService", "vs/editor/contrib/documentSymbols/outline", "vs/editor/contrib/documentSymbols/outlineTree", "vs/base/browser/mouseEvent", "vs/base/common/resources", "vs/editor/common/services/markersDecorationService", "vs/platform/markers/common/markers", "vs/css!./outlinePanel"], function (require, exports, dom, actionbar_1, progressbar_1, actions_1, async_1, errors_1, event_1, idGenerator_1, lifecycle_1, map_1, strings_1, editorBrowser_1, range_1, modes_1, outlineModel_1, nls_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, storage_1, styler_1, themeService_1, panelViewlet_1, viewlet_1, editorService_1, outline_1, outlineTree_1, mouseEvent_1, resources_1, markersDecorationService_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RequestState {
        constructor(_editorId, _modelId, _modelVersion, _providerCount) {
            this._editorId = _editorId;
            this._modelId = _modelId;
            this._modelVersion = _modelVersion;
            this._providerCount = _providerCount;
            //
        }
        equals(other) {
            return other
                && this._editorId === other._editorId
                && this._modelId === other._modelId
                && this._modelVersion === other._modelVersion
                && this._providerCount === other._providerCount;
        }
    }
    let RequestOracle = class RequestOracle {
        constructor(_callback, _featureRegistry, _editorService) {
            this._callback = _callback;
            this._featureRegistry = _featureRegistry;
            this._editorService = _editorService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposable = new lifecycle_1.MutableDisposable();
            _editorService.onDidActiveEditorChange(this._update, this, this._disposables);
            _featureRegistry.onDidChange(this._update, this, this._disposables);
            this._update();
        }
        dispose() {
            this._disposables.dispose();
            this._sessionDisposable.dispose();
        }
        _update() {
            let widget = this._editorService.activeTextEditorWidget;
            let codeEditor = undefined;
            if (editorBrowser_1.isCodeEditor(widget)) {
                codeEditor = widget;
            }
            else if (editorBrowser_1.isDiffEditor(widget)) {
                codeEditor = widget.getModifiedEditor();
            }
            if (!codeEditor || !codeEditor.hasModel()) {
                this._lastState = undefined;
                this._callback(undefined, undefined);
                return;
            }
            let thisState = new RequestState(codeEditor.getId(), codeEditor.getModel().id, codeEditor.getModel().getVersionId(), this._featureRegistry.all(codeEditor.getModel()).length);
            if (this._lastState && thisState.equals(this._lastState)) {
                // prevent unnecessary changes...
                return;
            }
            this._lastState = thisState;
            this._callback(codeEditor, undefined);
            let handle;
            let contentListener = codeEditor.onDidChangeModelContent(event => {
                clearTimeout(handle);
                const timeout = outlineModel_1.OutlineModel.getRequestDelay(codeEditor.getModel());
                handle = setTimeout(() => this._callback(codeEditor, event), timeout);
            });
            let modeListener = codeEditor.onDidChangeModelLanguage(_ => {
                this._callback(codeEditor, undefined);
            });
            let disposeListener = codeEditor.onDidDispose(() => {
                this._callback(undefined, undefined);
            });
            this._sessionDisposable.value = {
                dispose() {
                    contentListener.dispose();
                    clearTimeout(handle);
                    modeListener.dispose();
                    disposeListener.dispose();
                }
            };
        }
    };
    RequestOracle = __decorate([
        __param(2, editorService_1.IEditorService)
    ], RequestOracle);
    class SimpleToggleAction extends actions_1.Action {
        constructor(state, label, isChecked, callback, className) {
            super(`simple` + idGenerator_1.defaultGenerator.nextId(), label, className, true, () => {
                this.checked = !this.checked;
                callback(this);
                return Promise.resolve();
            });
            this.checked = isChecked();
            this._listener = state.onDidChange(() => this.checked = isChecked());
        }
        dispose() {
            this._listener.dispose();
            super.dispose();
        }
    }
    class OutlineViewState {
        constructor() {
            this._followCursor = false;
            this._filterOnType = true;
            this._sortBy = 2 /* ByKind */;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        set followCursor(value) {
            if (value !== this._followCursor) {
                this._followCursor = value;
                this._onDidChange.fire({ followCursor: true });
            }
        }
        get followCursor() {
            return this._followCursor;
        }
        get filterOnType() {
            return this._filterOnType;
        }
        set filterOnType(value) {
            if (value !== this._filterOnType) {
                this._filterOnType = value;
                this._onDidChange.fire({ filterOnType: true });
            }
        }
        set sortBy(value) {
            if (value !== this._sortBy) {
                this._sortBy = value;
                this._onDidChange.fire({ sortBy: true });
            }
        }
        get sortBy() {
            return this._sortBy;
        }
        persist(storageService) {
            storageService.store('outline/state', JSON.stringify({
                followCursor: this.followCursor,
                sortBy: this.sortBy,
                filterOnType: this.filterOnType,
            }), 1 /* WORKSPACE */);
        }
        restore(storageService) {
            let raw = storageService.get('outline/state', 1 /* WORKSPACE */);
            if (!raw) {
                return;
            }
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch (e) {
                return;
            }
            this.followCursor = data.followCursor;
            this.sortBy = data.sortBy;
            if (typeof data.filterOnType === 'boolean') {
                this.filterOnType = data.filterOnType;
            }
        }
    }
    let OutlinePanel = class OutlinePanel extends panelViewlet_1.ViewletPanel {
        constructor(options, _instantiationService, _themeService, _storageService, _editorService, _markerDecorationService, _configurationService, keybindingService, configurationService, contextKeyService, contextMenuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService);
            this._instantiationService = _instantiationService;
            this._themeService = _themeService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._markerDecorationService = _markerDecorationService;
            this._configurationService = _configurationService;
            this._disposables = new Array();
            this._editorDisposables = new lifecycle_1.DisposableStore();
            this._outlineViewState = new OutlineViewState();
            this._treeStates = new map_1.LRUCache(10);
            this._outlineViewState.restore(this._storageService);
            this._contextKeyFocused = outline_1.OutlineViewFocused.bindTo(contextKeyService);
            this._contextKeyFiltered = outline_1.OutlineViewFiltered.bindTo(contextKeyService);
            this._disposables.push(this.onDidFocus(_ => this._contextKeyFocused.set(true)));
            this._disposables.push(this.onDidBlur(_ => this._contextKeyFocused.set(false)));
        }
        dispose() {
            lifecycle_1.dispose(this._disposables);
            lifecycle_1.dispose(this._requestOracle);
            lifecycle_1.dispose(this._editorDisposables);
            super.dispose();
        }
        focus() {
            if (this._tree) {
                // focus on tree and fallback to root
                // dom node when the tree cannot take focus,
                // e.g. when hidden
                this._tree.domFocus();
                if (!this._tree.isDOMFocused()) {
                    this._domNode.focus();
                }
            }
        }
        renderBody(container) {
            this._domNode = container;
            this._domNode.tabIndex = 0;
            dom.addClass(container, 'outline-panel');
            let progressContainer = dom.$('.outline-progress');
            this._message = dom.$('.outline-message');
            this._inputContainer = dom.$('.outline-input');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer);
            this._register(styler_1.attachProgressBarStyler(this._progressBar, this._themeService));
            let treeContainer = dom.$('.outline-tree');
            dom.append(container, progressContainer, this._message, this._inputContainer, treeContainer);
            this._treeRenderer = this._instantiationService.createInstance(outlineTree_1.OutlineElementRenderer);
            this._treeDataSource = new outlineTree_1.OutlineDataSource();
            this._treeComparator = new outlineTree_1.OutlineItemComparator(this._outlineViewState.sortBy);
            this._treeFilter = this._instantiationService.createInstance(outlineTree_1.OutlineFilter, 'outline.filteredTypes');
            this._tree = this._instantiationService.createInstance(listService_1.WorkbenchDataTree, 'OutlinePanel', treeContainer, new outlineTree_1.OutlineVirtualDelegate(), [new outlineTree_1.OutlineGroupRenderer(), this._treeRenderer], 
            // https://github.com/microsoft/TypeScript/issues/32526
            this._treeDataSource, {
                expandOnlyOnTwistieClick: true,
                multipleSelectionSupport: false,
                filterOnType: this._outlineViewState.filterOnType,
                sorter: this._treeComparator,
                filter: this._treeFilter,
                identityProvider: new outlineTree_1.OutlineIdentityProvider(),
                keyboardNavigationLabelProvider: new outlineTree_1.OutlineNavigationLabelProvider()
            });
            this._disposables.push(this._tree);
            this._disposables.push(this._outlineViewState.onDidChange(this._onDidChangeUserState, this));
            // override the globally defined behaviour
            this._tree.updateOptions({
                filterOnType: this._outlineViewState.filterOnType
            });
            // feature: filter on type - keep tree and menu in sync
            this._register(this._tree.onDidUpdateOptions(e => {
                this._outlineViewState.filterOnType = Boolean(e.filterOnType);
            }));
            // feature: expand all nodes when filtering (not when finding)
            let viewState;
            this._register(this._tree.onDidChangeTypeFilterPattern(pattern => {
                if (!this._tree.options.filterOnType) {
                    return;
                }
                if (!viewState && pattern) {
                    viewState = this._tree.getViewState();
                    this._tree.expandAll();
                }
                else if (!pattern && viewState) {
                    this._tree.setInput(this._tree.getInput(), viewState);
                    viewState = undefined;
                }
            }));
            // feature: toggle icons
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("outline.icons" /* icons */)) {
                    this._tree.updateChildren();
                }
                if (e.affectsConfiguration('outline.filteredTypes')) {
                    this._treeFilter.update();
                    this._tree.refilter();
                }
            }));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && !this._requestOracle) {
                    this._requestOracle = this._instantiationService.createInstance(RequestOracle, (editor, event) => this._doUpdate(editor, event), modes_1.DocumentSymbolProviderRegistry);
                }
                else if (!visible) {
                    lifecycle_1.dispose(this._requestOracle);
                    this._requestOracle = undefined;
                    this._doUpdate(undefined, undefined);
                }
            }));
        }
        layoutBody(height, width) {
            this._tree.layout(height, width);
        }
        getActions() {
            return [
                new actions_1.Action('collapse', nls_1.localize('collapse', "Collapse All"), 'explorer-action codicon-collapse-all', true, () => {
                    return new viewlet_1.CollapseAction(this._tree, true, undefined).run();
                })
            ];
        }
        getSecondaryActions() {
            const group = this._register(new actions_1.RadioGroup([
                new SimpleToggleAction(this._outlineViewState, nls_1.localize('sortByPosition', "Sort By: Position"), () => this._outlineViewState.sortBy === 0 /* ByPosition */, _ => this._outlineViewState.sortBy = 0 /* ByPosition */),
                new SimpleToggleAction(this._outlineViewState, nls_1.localize('sortByName', "Sort By: Name"), () => this._outlineViewState.sortBy === 1 /* ByName */, _ => this._outlineViewState.sortBy = 1 /* ByName */),
                new SimpleToggleAction(this._outlineViewState, nls_1.localize('sortByKind', "Sort By: Type"), () => this._outlineViewState.sortBy === 2 /* ByKind */, _ => this._outlineViewState.sortBy = 2 /* ByKind */),
            ]));
            const result = [
                new SimpleToggleAction(this._outlineViewState, nls_1.localize('followCur', "Follow Cursor"), () => this._outlineViewState.followCursor, action => this._outlineViewState.followCursor = action.checked),
                new SimpleToggleAction(this._outlineViewState, nls_1.localize('filterOnType', "Filter on Type"), () => this._outlineViewState.filterOnType, action => this._outlineViewState.filterOnType = action.checked),
                new actionbar_1.Separator(),
                ...group.actions,
            ];
            for (const r of result) {
                this._register(r);
            }
            return result;
        }
        _onDidChangeUserState(e) {
            this._outlineViewState.persist(this._storageService);
            if (e.followCursor) {
                // todo@joh update immediately
            }
            if (e.sortBy) {
                this._treeComparator.type = this._outlineViewState.sortBy;
                this._tree.resort();
            }
            if (e.filterOnType) {
                this._tree.updateOptions({
                    filterOnType: this._outlineViewState.filterOnType
                });
            }
        }
        _showMessage(message) {
            dom.addClass(this._domNode, 'message');
            this._tree.setInput(undefined);
            this._progressBar.stop().hide();
            this._message.innerText = strings_1.escape(message);
        }
        static _createOutlineModel(model, disposables) {
            let promise = async_1.createCancelablePromise(token => outlineModel_1.OutlineModel.create(model, token));
            disposables.add({ dispose() { promise.cancel(); } });
            return promise.catch(err => {
                if (!errors_1.isPromiseCanceledError(err)) {
                    throw err;
                }
                return undefined;
            });
        }
        async _doUpdate(editor, event) {
            this._editorDisposables.clear();
            const oldModel = this._tree.getInput();
            // persist state
            if (oldModel) {
                this._treeStates.set(oldModel.textModel.uri.toString(), this._tree.getViewState());
            }
            if (!editor || !editor.hasModel() || !modes_1.DocumentSymbolProviderRegistry.has(editor.getModel())) {
                return this._showMessage(nls_1.localize('no-editor', "The active editor cannot provide outline information."));
            }
            const textModel = editor.getModel();
            const loadingMessage = oldModel && new async_1.TimeoutTimer(() => this._showMessage(nls_1.localize('loading', "Loading document symbols for '{0}'...", resources_1.basename(textModel.uri))), 100);
            const requestDelay = outlineModel_1.OutlineModel.getRequestDelay(textModel);
            this._progressBar.infinite().show(requestDelay);
            const createdModel = await OutlinePanel._createOutlineModel(textModel, this._editorDisposables);
            lifecycle_1.dispose(loadingMessage);
            if (!createdModel) {
                return;
            }
            let newModel = createdModel;
            if (outlineModel_1.TreeElement.empty(newModel)) {
                return this._showMessage(nls_1.localize('no-symbols', "No symbols found in document '{0}'", resources_1.basename(textModel.uri)));
            }
            dom.removeClass(this._domNode, 'message');
            if (event && oldModel && textModel.getLineCount() >= 25) {
                // heuristic: when the symbols-to-lines ratio changes by 50% between edits
                // wait a little (and hope that the next change isn't as drastic).
                let newSize = outlineModel_1.TreeElement.size(newModel);
                let newLength = textModel.getValueLength();
                let newRatio = newSize / newLength;
                let oldSize = outlineModel_1.TreeElement.size(oldModel);
                let oldLength = newLength - event.changes.reduce((prev, value) => prev + value.rangeLength, 0);
                let oldRatio = oldSize / oldLength;
                if (newRatio <= oldRatio * 0.5 || newRatio >= oldRatio * 1.5) {
                    let waitPromise = new Promise(resolve => {
                        let handle = setTimeout(() => {
                            handle = undefined;
                            resolve(true);
                        }, 2000);
                        this._disposables.push({
                            dispose() {
                                clearTimeout(handle);
                                resolve(false);
                            }
                        });
                    });
                    if (!await waitPromise) {
                        return;
                    }
                }
            }
            this._progressBar.stop().hide();
            if (oldModel && oldModel.merge(newModel)) {
                this._tree.updateChildren();
                newModel = oldModel;
            }
            else {
                let state = this._treeStates.get(newModel.textModel.uri.toString());
                this._tree.setInput(newModel, state);
            }
            // transfer focus from domNode to the tree
            if (this._domNode === document.activeElement) {
                this._tree.domFocus();
            }
            this._editorDisposables.add(lifecycle_1.toDisposable(() => this._contextKeyFiltered.reset()));
            // feature: reveal outline selection in editor
            // on change -> reveal/select defining range
            this._editorDisposables.add(this._tree.onDidOpen(e => {
                let [first] = e.elements;
                if (!(first instanceof outlineModel_1.OutlineElement)) {
                    return;
                }
                let focus = false;
                let aside = false;
                // todo@Joh
                if (e.browserEvent) {
                    if (e.browserEvent.type === 'keydown') {
                        focus = true;
                    }
                    else if (e.browserEvent.type === 'click') {
                        const event = new mouseEvent_1.StandardMouseEvent(e.browserEvent);
                        focus = e.browserEvent.detail === 2;
                        aside = (!this._tree.useAltAsMultipleSelectionModifier && event.altKey)
                            || (this._tree.useAltAsMultipleSelectionModifier && (event.ctrlKey || event.metaKey));
                    }
                }
                this._revealTreeSelection(newModel, first, focus, aside);
            }));
            // feature: reveal editor selection in outline
            this._revealEditorSelection(newModel, editor.getSelection());
            const versionIdThen = newModel.textModel.getVersionId();
            this._editorDisposables.add(editor.onDidChangeCursorSelection(e => {
                // first check if the document has changed and stop revealing the
                // cursor position iff it has -> we will update/recompute the
                // outline view then anyways
                if (!newModel.textModel.isDisposed() && newModel.textModel.getVersionId() === versionIdThen) {
                    this._revealEditorSelection(newModel, e.selection);
                }
            }));
            // feature: show markers in outline
            const updateMarker = (model, ignoreEmpty) => {
                if (!this._configurationService.getValue("outline.problems.enabled" /* problemsEnabled */)) {
                    return;
                }
                if (model !== textModel) {
                    return;
                }
                const markers = [];
                for (const [range, marker] of this._markerDecorationService.getLiveMarkers(textModel)) {
                    if (marker.severity === markers_1.MarkerSeverity.Error || marker.severity === markers_1.MarkerSeverity.Warning) {
                        markers.push(Object.assign(Object.assign({}, range), { severity: marker.severity }));
                    }
                }
                if (markers.length > 0 || !ignoreEmpty) {
                    newModel.updateMarker(markers);
                    this._tree.updateChildren();
                }
            };
            updateMarker(textModel, true);
            this._editorDisposables.add(this._markerDecorationService.onDidChangeMarker(updateMarker));
            this._editorDisposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("outline.problems.badges" /* problemsBadges */) || e.affectsConfiguration("outline.problems.colors" /* problemsColors */)) {
                    this._tree.updateChildren();
                    return;
                }
                if (!e.affectsConfiguration("outline.problems.enabled" /* problemsEnabled */)) {
                    return;
                }
                if (!this._configurationService.getValue("outline.problems.enabled" /* problemsEnabled */)) {
                    newModel.updateMarker([]);
                    this._tree.updateChildren();
                }
                else {
                    updateMarker(textModel, true);
                }
            }));
        }
        async _revealTreeSelection(model, element, focus, aside) {
            await this._editorService.openEditor({
                resource: model.textModel.uri,
                options: {
                    preserveFocus: !focus,
                    selection: range_1.Range.collapseToStart(element.symbol.selectionRange),
                    revealInCenterIfOutsideViewport: true
                }
            }, aside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        _revealEditorSelection(model, selection) {
            if (!this._outlineViewState.followCursor || !this._tree.getInput() || !selection) {
                return;
            }
            let [first] = this._tree.getSelection();
            let item = model.getItemEnclosingPosition({
                lineNumber: selection.selectionStartLineNumber,
                column: selection.selectionStartColumn
            }, first instanceof outlineModel_1.OutlineElement ? first : undefined);
            if (!item) {
                // nothing to reveal
                return;
            }
            let top = this._tree.getRelativeTop(item);
            if (top === null) {
                this._tree.reveal(item, 0.5);
            }
            this._tree.setFocus([item]);
            this._tree.setSelection([item]);
        }
    };
    OutlinePanel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, editorService_1.IEditorService),
        __param(5, markersDecorationService_1.IMarkerDecorationsService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, contextView_1.IContextMenuService)
    ], OutlinePanel);
    exports.OutlinePanel = OutlinePanel;
});
//# sourceMappingURL=outlinePanel.js.map