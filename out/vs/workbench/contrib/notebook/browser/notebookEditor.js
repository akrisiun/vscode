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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/cancellation", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/fontInfo", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorInput", "vs/workbench/contrib/notebook/browser/notebookService", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/output/outputRenderer", "vs/workbench/contrib/notebook/browser/view/renderers/backLayerWebView", "vs/workbench/contrib/notebook/browser/view/renderers/cellRenderer", "vs/workbench/contrib/notebook/browser/viewModel/eventDispatcher", "vs/workbench/contrib/notebook/browser/viewModel/notebookViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/welcome/walkThrough/common/walkThroughUtils", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/base/common/errors", "vs/css!./media/notebook"], function (require, exports, browser_1, DOM, cancellation_1, color_1, event_1, lifecycle_1, fontInfo_1, nls, configuration_1, contextkey_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, baseEditor_1, editor_1, constants_1, notebookBrowser_1, notebookEditorInput_1, notebookService_1, notebookCellList_1, outputRenderer_1, backLayerWebView_1, cellRenderer_1, eventDispatcher_1, notebookViewModel_1, notebookCommon_1, walkThroughUtils_1, editorGroupsService_1, notebookEditorExtensions_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CELL_TOOLBAR_SEPERATOR = exports.notebookOutputContainerColor = exports.focusedCellIndicator = exports.NotebookEditor = exports.NotebookCodeEditors = exports.NotebookEditorOptions = void 0;
    const $ = DOM.$;
    const NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'NotebookEditorViewState';
    class NotebookEditorOptions extends editor_1.EditorOptions {
        constructor(options) {
            super();
            this.overwrite(options);
            this.cellOptions = options.cellOptions;
        }
        with(options) {
            return new NotebookEditorOptions(Object.assign(Object.assign({}, this), options));
        }
    }
    exports.NotebookEditorOptions = NotebookEditorOptions;
    class NotebookCodeEditors {
        constructor(_list, _renderedEditors) {
            this._list = _list;
            this._renderedEditors = _renderedEditors;
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChangeActiveEditor = new event_1.Emitter();
            this.onDidChangeActiveEditor = this._onDidChangeActiveEditor.event;
            _list.onDidChangeFocus(_e => this._onDidChangeActiveEditor.fire(this), undefined, this._disposables);
        }
        dispose() {
            this._onDidChangeActiveEditor.dispose();
            this._disposables.dispose();
        }
        get activeCodeEditor() {
            const [focused] = this._list.getFocusedElements();
            return this._renderedEditors.get(focused);
        }
    }
    exports.NotebookCodeEditors = NotebookCodeEditors;
    let NotebookEditor = /** @class */ (() => {
        let NotebookEditor = class NotebookEditor extends baseEditor_1.BaseEditor {
            constructor(telemetryService, themeService, instantiationService, storageService, notebookService, editorGroupService, configurationService, contextKeyService) {
                super(NotebookEditor.ID, telemetryService, themeService, storageService);
                this.instantiationService = instantiationService;
                this.notebookService = notebookService;
                this.configurationService = configurationService;
                this.contextKeyService = contextKeyService;
                this.titleBar = null;
                this.webview = null;
                this.webviewTransparentCover = null;
                this.renderedEditors = new Map();
                this.localStore = this._register(new lifecycle_1.DisposableStore());
                this.groupListener = this._register(new lifecycle_1.MutableDisposable());
                this.dimension = null;
                this.editorFocus = null;
                this.editorEditable = null;
                this.editorRunnable = null;
                this.editorExecutingNotebook = null;
                this._onDidChangeModel = new event_1.Emitter();
                this.onDidChangeModel = this._onDidChangeModel.event;
                //#endregion
                //#region Mouse Events
                this._onMouseUp = this._register(new event_1.Emitter());
                this.onMouseUp = this._onMouseUp.event;
                this._onMouseDown = this._register(new event_1.Emitter());
                this.onMouseDown = this._onMouseDown.event;
                this.editorMemento = this.getEditorMemento(editorGroupService, NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY);
                this.outputRenderer = new outputRenderer_1.OutputRenderer(this, this.instantiationService);
                this._contributions = {};
                this.scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
                this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor.scrollBeyondLastLine')) {
                        this.scrollBeyondLastLine = this.configurationService.getValue('editor.scrollBeyondLastLine');
                        if (this.dimension) {
                            this.layout(this.dimension);
                        }
                    }
                });
            }
            set viewModel(newModel) {
                this.notebookViewModel = newModel;
                this._onDidChangeModel.fire();
            }
            get viewModel() {
                return this.notebookViewModel;
            }
            get minimumWidth() { return 375; }
            get maximumWidth() { return Number.POSITIVE_INFINITY; }
            // these setters need to exist because this extends from BaseEditor
            set minimumWidth(value) { }
            set maximumWidth(value) { }
            //#region Editor Core
            get isNotebookEditor() {
                return true;
            }
            createEditor(parent) {
                this._rootElement = DOM.append(parent, $('.notebook-editor'));
                this.createBody(this._rootElement);
                this.generateFontInfo();
                this.editorFocus = notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED.bindTo(this.contextKeyService);
                this.editorFocus.set(true);
                this._register(this.onDidFocus(() => {
                    var _a;
                    (_a = this.editorFocus) === null || _a === void 0 ? void 0 : _a.set(true);
                }));
                this._register(this.onDidBlur(() => {
                    var _a;
                    (_a = this.editorFocus) === null || _a === void 0 ? void 0 : _a.set(false);
                }));
                this.editorEditable = notebookBrowser_1.NOTEBOOK_EDITOR_EDITABLE.bindTo(this.contextKeyService);
                this.editorEditable.set(true);
                this.editorRunnable = notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE.bindTo(this.contextKeyService);
                this.editorRunnable.set(true);
                this.editorExecutingNotebook = notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK.bindTo(this.contextKeyService);
                const contributions = notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getEditorContributions();
                for (const desc of contributions) {
                    try {
                        const contribution = this.instantiationService.createInstance(desc.ctor, this);
                        this._contributions[desc.id] = contribution;
                    }
                    catch (err) {
                        errors_1.onUnexpectedError(err);
                    }
                }
            }
            populateEditorTitlebar() {
                for (let element = this._rootElement.parentElement; element; element = element.parentElement) {
                    if (DOM.hasClass(element, 'editor-group-container')) {
                        // elemnet is editor group container
                        for (let i = 0; i < element.childElementCount; i++) {
                            const child = element.childNodes.item(i);
                            if (DOM.hasClass(child, 'title')) {
                                this.titleBar = child;
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            clearEditorTitlebarZindex() {
                if (this.titleBar === null) {
                    this.populateEditorTitlebar();
                }
                if (this.titleBar) {
                    this.titleBar.style.zIndex = 'auto';
                }
            }
            increaseEditorTitlebarZindex() {
                if (this.titleBar === null) {
                    this.populateEditorTitlebar();
                }
                if (this.titleBar) {
                    this.titleBar.style.zIndex = '500';
                }
            }
            generateFontInfo() {
                const editorOptions = this.configurationService.getValue('editor');
                this.fontInfo = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.getZoomLevel());
            }
            createBody(parent) {
                this.body = document.createElement('div');
                DOM.addClass(this.body, 'cell-list-container');
                this.createCellList();
                DOM.append(parent, this.body);
            }
            createCellList() {
                DOM.addClass(this.body, 'cell-list-container');
                const dndController = new cellRenderer_1.CellDragAndDropController(this);
                const renders = [
                    this.instantiationService.createInstance(cellRenderer_1.CodeCellRenderer, this, this.contextKeyService, this.renderedEditors, dndController),
                    this.instantiationService.createInstance(cellRenderer_1.MarkdownCellRenderer, this.contextKeyService, this, dndController, this.renderedEditors),
                ];
                this.list = this.instantiationService.createInstance(notebookCellList_1.NotebookCellList, 'NotebookCellList', this.body, this.instantiationService.createInstance(cellRenderer_1.NotebookCellListDelegate), renders, this.contextKeyService, {
                    setRowLineHeight: false,
                    setRowHeight: false,
                    supportDynamicHeights: true,
                    horizontalScrolling: false,
                    keyboardSupport: false,
                    mouseSupport: true,
                    multipleSelectionSupport: false,
                    enableKeyboardNavigation: true,
                    additionalScrollHeight: 0,
                    transformOptimization: false,
                    styleController: (_suffix) => { return this.list; },
                    overrideStyles: {
                        listBackground: colorRegistry_1.editorBackground,
                        listActiveSelectionBackground: colorRegistry_1.editorBackground,
                        listActiveSelectionForeground: colorRegistry_1.foreground,
                        listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                        listFocusAndSelectionForeground: colorRegistry_1.foreground,
                        listFocusBackground: colorRegistry_1.editorBackground,
                        listFocusForeground: colorRegistry_1.foreground,
                        listHoverForeground: colorRegistry_1.foreground,
                        listHoverBackground: colorRegistry_1.editorBackground,
                        listHoverOutline: colorRegistry_1.focusBorder,
                        listFocusOutline: colorRegistry_1.focusBorder,
                        listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                        listInactiveSelectionForeground: colorRegistry_1.foreground,
                        listInactiveFocusBackground: colorRegistry_1.editorBackground,
                        listInactiveFocusOutline: colorRegistry_1.editorBackground,
                    },
                    accessibilityProvider: {
                        getAriaLabel() { return null; },
                        getWidgetAriaLabel() {
                            return nls.localize('notebookTreeAriaLabel', "Notebook");
                        }
                    }
                });
                this.control = new NotebookCodeEditors(this.list, this.renderedEditors);
                this.webview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this);
                this._register(this.webview.onMessage(message => {
                    if (this.viewModel) {
                        this.notebookService.onDidReceiveMessage(this.viewModel.viewType, this.viewModel.uri, message);
                    }
                }));
                this.list.rowsContainer.appendChild(this.webview.element);
                this._register(this.list);
                this._register(lifecycle_1.combinedDisposable(...renders));
                // transparent cover
                this.webviewTransparentCover = DOM.append(this.list.rowsContainer, $('.webview-cover'));
                this.webviewTransparentCover.style.display = 'none';
                this._register(DOM.addStandardDisposableGenericMouseDownListner(this._rootElement, (e) => {
                    if (DOM.hasClass(e.target, 'slider') && this.webviewTransparentCover) {
                        this.webviewTransparentCover.style.display = 'block';
                    }
                }));
                this._register(DOM.addStandardDisposableGenericMouseUpListner(this._rootElement, (e) => {
                    if (this.webviewTransparentCover) {
                        // no matter when
                        this.webviewTransparentCover.style.display = 'none';
                    }
                }));
                this._register(this.list.onMouseDown(e => {
                    if (e.element) {
                        this._onMouseDown.fire({ event: e.browserEvent, target: e.element });
                    }
                }));
                this._register(this.list.onMouseUp(e => {
                    if (e.element) {
                        this._onMouseUp.fire({ event: e.browserEvent, target: e.element });
                    }
                }));
            }
            getDomNode() {
                return this._rootElement;
            }
            getControl() {
                return this.control;
            }
            getInnerWebview() {
                var _a;
                return (_a = this.webview) === null || _a === void 0 ? void 0 : _a.webview;
            }
            setVisible(visible, group) {
                if (visible) {
                    this.increaseEditorTitlebarZindex();
                }
                else {
                    this.clearEditorTitlebarZindex();
                }
                super.setVisible(visible, group);
            }
            onWillHide() {
                var _a, _b, _c, _d, _f;
                if (this.input && this.input instanceof notebookEditorInput_1.NotebookEditorInput && !this.input.isDisposed()) {
                    this.saveEditorViewState(this.input);
                }
                (_a = this.editorFocus) === null || _a === void 0 ? void 0 : _a.set(false);
                if (this.webview) {
                    this.localStore.clear();
                    (_b = this.list) === null || _b === void 0 ? void 0 : _b.rowsContainer.removeChild((_c = this.webview) === null || _c === void 0 ? void 0 : _c.element);
                    (_d = this.webview) === null || _d === void 0 ? void 0 : _d.dispose();
                    this.webview = null;
                }
                (_f = this.list) === null || _f === void 0 ? void 0 : _f.clear();
                super.onHide();
            }
            setEditorVisible(visible, group) {
                super.setEditorVisible(visible, group);
                this.groupListener.value = (group.onWillCloseEditor(e => this.onWillCloseEditorInGroup(e)));
            }
            onWillCloseEditorInGroup(e) {
                const editor = e.editor;
                if (!(editor instanceof notebookEditorInput_1.NotebookEditorInput)) {
                    return; // only handle files
                }
                if (editor === this.input) {
                    this.clearEditorTitlebarZindex();
                    this.saveEditorViewState(editor);
                }
            }
            focus() {
                var _a, _b;
                super.focus();
                (_a = this.editorFocus) === null || _a === void 0 ? void 0 : _a.set(true);
                (_b = this.list) === null || _b === void 0 ? void 0 : _b.domFocus();
            }
            async setInput(input, options, token) {
                var _a, _b;
                if (this.input instanceof notebookEditorInput_1.NotebookEditorInput) {
                    this.saveEditorViewState(this.input);
                }
                await super.setInput(input, options, token);
                const model = await input.resolve();
                if (this.notebookViewModel === undefined || !this.notebookViewModel.equal(model) || this.webview === null) {
                    this.detachModel();
                    await this.attachModel(input, model);
                }
                // reveal cell if editor options tell to do so
                if (options instanceof NotebookEditorOptions && options.cellOptions) {
                    const cellOptions = options.cellOptions;
                    const cell = this.notebookViewModel.viewCells.find(cell => cell.uri.toString() === cellOptions.resource.toString());
                    if (cell) {
                        this.selectElement(cell);
                        this.revealInCenterIfOutsideViewport(cell);
                        const editor = this.renderedEditors.get(cell);
                        if (editor) {
                            if ((_a = cellOptions.options) === null || _a === void 0 ? void 0 : _a.selection) {
                                const { selection } = cellOptions.options;
                                editor.setSelection(Object.assign(Object.assign({}, selection), { endLineNumber: selection.endLineNumber || selection.startLineNumber, endColumn: selection.endColumn || selection.startColumn }));
                            }
                            if (!((_b = cellOptions.options) === null || _b === void 0 ? void 0 : _b.preserveFocus)) {
                                editor.focus();
                            }
                        }
                    }
                }
            }
            clearInput() {
                super.clearInput();
            }
            detachModel() {
                var _a, _b, _c, _d, _f;
                this.localStore.clear();
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.detachViewModel();
                (_b = this.viewModel) === null || _b === void 0 ? void 0 : _b.dispose();
                // avoid event
                this.notebookViewModel = undefined;
                (_c = this.webview) === null || _c === void 0 ? void 0 : _c.clearInsets();
                (_d = this.webview) === null || _d === void 0 ? void 0 : _d.clearPreloadsCache();
                (_f = this.list) === null || _f === void 0 ? void 0 : _f.clear();
            }
            updateForMetadata() {
                var _a, _b, _c, _d, _f;
                (_a = this.editorEditable) === null || _a === void 0 ? void 0 : _a.set(!!((_b = this.viewModel.metadata) === null || _b === void 0 ? void 0 : _b.editable));
                (_c = this.editorRunnable) === null || _c === void 0 ? void 0 : _c.set(!!((_d = this.viewModel.metadata) === null || _d === void 0 ? void 0 : _d.runnable));
                DOM.toggleClass(this.getDomNode(), 'notebook-editor-editable', !!((_f = this.viewModel.metadata) === null || _f === void 0 ? void 0 : _f.editable));
            }
            async attachModel(input, model) {
                var _a, _b;
                if (!this.webview) {
                    this.webview = this.instantiationService.createInstance(backLayerWebView_1.BackLayerWebView, this);
                    (_a = this.list) === null || _a === void 0 ? void 0 : _a.rowsContainer.insertAdjacentElement('afterbegin', this.webview.element);
                }
                await this.webview.waitForInitialization();
                this.eventDispatcher = new eventDispatcher_1.NotebookEventDispatcher();
                this.viewModel = this.instantiationService.createInstance(notebookViewModel_1.NotebookViewModel, input.viewType, model, this.eventDispatcher, this.getLayoutInfo());
                this.eventDispatcher.emit([new eventDispatcher_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
                this.updateForMetadata();
                this.localStore.add(this.eventDispatcher.onDidChangeMetadata((e) => {
                    this.updateForMetadata();
                }));
                // restore view states, including contributions
                const viewState = this.loadTextEditorViewState(input);
                {
                    // restore view state
                    this.viewModel.restoreEditorViewState(viewState);
                    // contribution state restore
                    const contributionsState = (viewState === null || viewState === void 0 ? void 0 : viewState.contributionsState) || {};
                    const keys = Object.keys(this._contributions);
                    for (let i = 0, len = keys.length; i < len; i++) {
                        const id = keys[i];
                        const contribution = this._contributions[id];
                        if (typeof contribution.restoreViewState === 'function') {
                            contribution.restoreViewState(contributionsState[id]);
                        }
                    }
                }
                (_b = this.webview) === null || _b === void 0 ? void 0 : _b.updateRendererPreloads(this.viewModel.renderers);
                this.localStore.add(this.list.onWillScroll(e => {
                    this.webview.updateViewScrollTop(-e.scrollTop, []);
                    this.webviewTransparentCover.style.top = `${e.scrollTop}px`;
                }));
                this.localStore.add(this.list.onDidChangeContentHeight(() => {
                    DOM.scheduleAtNextAnimationFrame(() => {
                        var _a, _b, _c, _d, _f;
                        const scrollTop = ((_a = this.list) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0;
                        const scrollHeight = ((_b = this.list) === null || _b === void 0 ? void 0 : _b.scrollHeight) || 0;
                        this.webview.element.style.height = `${scrollHeight}px`;
                        if ((_c = this.webview) === null || _c === void 0 ? void 0 : _c.insetMapping) {
                            let updateItems = [];
                            let removedItems = [];
                            (_d = this.webview) === null || _d === void 0 ? void 0 : _d.insetMapping.forEach((value, key) => {
                                var _a, _b;
                                const cell = value.cell;
                                const viewIndex = (_a = this.list) === null || _a === void 0 ? void 0 : _a.getViewIndex(cell);
                                if (viewIndex === undefined) {
                                    return;
                                }
                                if (cell.outputs.indexOf(key) < 0) {
                                    // output is already gone
                                    removedItems.push(key);
                                }
                                const cellTop = ((_b = this.list) === null || _b === void 0 ? void 0 : _b.getAbsoluteTopOfElement(cell)) || 0;
                                if (this.webview.shouldUpdateInset(cell, key, cellTop)) {
                                    updateItems.push({
                                        cell: cell,
                                        output: key,
                                        cellTop: cellTop
                                    });
                                }
                            });
                            removedItems.forEach(output => { var _a; return (_a = this.webview) === null || _a === void 0 ? void 0 : _a.removeInset(output); });
                            if (updateItems.length) {
                                (_f = this.webview) === null || _f === void 0 ? void 0 : _f.updateViewScrollTop(-scrollTop, updateItems);
                            }
                        }
                    });
                }));
                this.list.attachViewModel(this.viewModel);
                this.localStore.add(this.list.onDidRemoveOutput(output => {
                    this.removeInset(output);
                }));
                this.localStore.add(this.list.onDidHideOutput(output => {
                    this.hideInset(output);
                }));
                this.list.layout();
                // restore list state at last, it must be after list layout
                this.restoreListViewState(viewState);
            }
            restoreListViewState(viewState) {
                var _a, _b;
                if ((viewState === null || viewState === void 0 ? void 0 : viewState.scrollPosition) !== undefined) {
                    this.list.scrollTop = viewState.scrollPosition.top;
                    this.list.scrollLeft = viewState.scrollPosition.left;
                }
                else {
                    this.list.scrollTop = 0;
                    this.list.scrollLeft = 0;
                }
                const focusIdx = typeof (viewState === null || viewState === void 0 ? void 0 : viewState.focus) === 'number' ? viewState.focus : 0;
                if (focusIdx < this.list.length) {
                    this.list.setFocus([focusIdx]);
                    this.list.setSelection([focusIdx]);
                }
                else if (this.list.length > 0) {
                    this.list.setFocus([0]);
                }
                if (viewState === null || viewState === void 0 ? void 0 : viewState.editorFocused) {
                    (_a = this.list) === null || _a === void 0 ? void 0 : _a.focusView();
                    const cell = (_b = this.notebookViewModel) === null || _b === void 0 ? void 0 : _b.viewCells[focusIdx];
                    if (cell) {
                        cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                    }
                }
            }
            saveEditorViewState(input) {
                var _a;
                if (this.group && this.notebookViewModel) {
                    const state = this.notebookViewModel.geteEditorViewState();
                    if (this.list) {
                        state.scrollPosition = { left: this.list.scrollLeft, top: this.list.scrollTop };
                        let cellHeights = {};
                        for (let i = 0; i < this.viewModel.length; i++) {
                            const elm = this.viewModel.viewCells[i];
                            if (elm.cellKind === notebookCommon_1.CellKind.Code) {
                                cellHeights[i] = elm.layoutInfo.totalHeight;
                            }
                            else {
                                cellHeights[i] = 0;
                            }
                        }
                        state.cellTotalHeights = cellHeights;
                        const focus = this.list.getFocus()[0];
                        if (focus) {
                            const element = this.notebookViewModel.viewCells[focus];
                            const itemDOM = (_a = this.list) === null || _a === void 0 ? void 0 : _a.domElementOfElement(element);
                            let editorFocused = false;
                            if (document.activeElement && itemDOM && itemDOM.contains(document.activeElement)) {
                                editorFocused = true;
                            }
                            state.editorFocused = editorFocused;
                            state.focus = focus;
                        }
                    }
                    // Save contribution view states
                    const contributionsState = {};
                    const keys = Object.keys(this._contributions);
                    for (const id of keys) {
                        const contribution = this._contributions[id];
                        if (typeof contribution.saveViewState === 'function') {
                            contributionsState[id] = contribution.saveViewState();
                        }
                    }
                    state.contributionsState = contributionsState;
                    this.editorMemento.saveEditorState(this.group, input.resource, state);
                    this.notebookViewModel.viewCells.forEach(cell => cell.save());
                }
            }
            loadTextEditorViewState(input) {
                if (this.group) {
                    return this.editorMemento.loadEditorState(this.group, input.resource);
                }
                return;
            }
            layout(dimension) {
                var _a, _b, _c;
                this.dimension = new DOM.Dimension(dimension.width, dimension.height);
                DOM.toggleClass(this._rootElement, 'mid-width', dimension.width < 1000 && dimension.width >= 600);
                DOM.toggleClass(this._rootElement, 'narrow-width', dimension.width < 600);
                DOM.size(this.body, dimension.width, dimension.height);
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.updateOptions({ additionalScrollHeight: this.scrollBeyondLastLine ? dimension.height : 0 });
                (_b = this.list) === null || _b === void 0 ? void 0 : _b.layout(dimension.height, dimension.width);
                if (this.webviewTransparentCover) {
                    this.webviewTransparentCover.style.height = `${dimension.height}px`;
                    this.webviewTransparentCover.style.width = `${dimension.width}px`;
                }
                (_c = this.eventDispatcher) === null || _c === void 0 ? void 0 : _c.emit([new eventDispatcher_1.NotebookLayoutChangedEvent({ width: true, fontInfo: true }, this.getLayoutInfo())]);
            }
            saveState() {
                if (this.input instanceof notebookEditorInput_1.NotebookEditorInput) {
                    this.saveEditorViewState(this.input);
                }
                super.saveState();
            }
            //#endregion
            //#region Editor Features
            selectElement(cell) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.selectElement(cell);
                // this.viewModel!.selectionHandles = [cell.handle];
            }
            revealInView(cell) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementInView(cell);
            }
            revealInCenterIfOutsideViewport(cell) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementInCenterIfOutsideViewport(cell);
            }
            revealInCenter(cell) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementInCenter(cell);
            }
            revealLineInView(cell, line) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementLineInView(cell, line);
            }
            revealLineInCenter(cell, line) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementLineInCenter(cell, line);
            }
            revealLineInCenterIfOutsideViewport(cell, line) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementLineInCenterIfOutsideViewport(cell, line);
            }
            revealRangeInView(cell, range) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInView(cell, range);
            }
            revealRangeInCenter(cell, range) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInCenter(cell, range);
            }
            revealRangeInCenterIfOutsideViewport(cell, range) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementRangeInCenterIfOutsideViewport(cell, range);
            }
            setCellSelection(cell, range) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.setCellSelection(cell, range);
            }
            changeDecorations(callback) {
                var _a;
                return (_a = this.notebookViewModel) === null || _a === void 0 ? void 0 : _a.changeDecorations(callback);
            }
            setHiddenAreas(_ranges) {
                return this.list.setHiddenAreas(_ranges, true);
            }
            //#endregion
            //#region Cell operations
            async layoutNotebookCell(cell, height) {
                const viewIndex = this.list.getViewIndex(cell);
                if (viewIndex === undefined) {
                    // the cell is hidden
                    return;
                }
                let relayout = (cell, height) => {
                    var _a;
                    (_a = this.list) === null || _a === void 0 ? void 0 : _a.updateElementHeight2(cell, height);
                };
                let r;
                DOM.scheduleAtNextAnimationFrame(() => {
                    relayout(cell, height);
                    r();
                });
                return new Promise(resolve => { r = resolve; });
            }
            insertNotebookCell(cell, type, direction = 'above', initialText = '', ui = false) {
                if (!this.notebookViewModel.metadata.editable) {
                    return null;
                }
                const newLanguages = this.notebookViewModel.languages;
                const language = (type === notebookCommon_1.CellKind.Code && newLanguages && newLanguages.length) ? newLanguages[0] : 'markdown';
                const index = cell ? this.notebookViewModel.getCellIndex(cell) : 0;
                const nextIndex = ui ? this.notebookViewModel.getNextVisibleCellIndex(index) : index + 1;
                const insertIndex = cell ?
                    (direction === 'above' ? index : nextIndex) :
                    index;
                const newCell = this.notebookViewModel.createCell(insertIndex, initialText.split(/\r?\n/g), language, type, true);
                if (type === notebookCommon_1.CellKind.Markdown) {
                    newCell.editState = notebookBrowser_1.CellEditState.Editing;
                }
                return newCell;
            }
            async deleteNotebookCell(cell) {
                if (!this.notebookViewModel.metadata.editable) {
                    return false;
                }
                cell.save();
                const index = this.notebookViewModel.getCellIndex(cell);
                this.notebookViewModel.deleteCell(index, true);
                return true;
            }
            async moveCellDown(cell) {
                if (!this.notebookViewModel.metadata.editable) {
                    return false;
                }
                const index = this.notebookViewModel.getCellIndex(cell);
                if (index === this.notebookViewModel.length - 1) {
                    return false;
                }
                const newIdx = index + 1;
                return this.moveCellToIndex(index, newIdx);
            }
            async moveCellUp(cell) {
                if (!this.notebookViewModel.metadata.editable) {
                    return false;
                }
                const index = this.notebookViewModel.getCellIndex(cell);
                if (index === 0) {
                    return false;
                }
                const newIdx = index - 1;
                return this.moveCellToIndex(index, newIdx);
            }
            async moveCell(cell, relativeToCell, direction) {
                if (!this.notebookViewModel.metadata.editable) {
                    return false;
                }
                if (cell === relativeToCell) {
                    return false;
                }
                const originalIdx = this.notebookViewModel.getCellIndex(cell);
                const relativeToIndex = this.notebookViewModel.getCellIndex(relativeToCell);
                let newIdx = direction === 'above' ? relativeToIndex : relativeToIndex + 1;
                if (originalIdx < newIdx) {
                    newIdx--;
                }
                return this.moveCellToIndex(originalIdx, newIdx);
            }
            async moveCellToIndex(index, newIdx) {
                if (index === newIdx) {
                    return false;
                }
                if (!this.notebookViewModel.moveCellToIdx(index, newIdx, true)) {
                    throw new Error('Notebook Editor move cell, index out of range');
                }
                let r;
                DOM.scheduleAtNextAnimationFrame(() => {
                    var _a;
                    (_a = this.list) === null || _a === void 0 ? void 0 : _a.revealElementInView(this.notebookViewModel.viewCells[newIdx]);
                    r(true);
                });
                return new Promise(resolve => { r = resolve; });
            }
            editNotebookCell(cell) {
                var _a;
                if (!cell.getEvaluatedMetadata(this.notebookViewModel.metadata).editable) {
                    return;
                }
                cell.editState = notebookBrowser_1.CellEditState.Editing;
                (_a = this.renderedEditors.get(cell)) === null || _a === void 0 ? void 0 : _a.focus();
            }
            saveNotebookCell(cell) {
                cell.editState = notebookBrowser_1.CellEditState.Preview;
            }
            getActiveCell() {
                var _a;
                let elements = (_a = this.list) === null || _a === void 0 ? void 0 : _a.getFocusedElements();
                if (elements && elements.length) {
                    return elements[0];
                }
                return undefined;
            }
            cancelNotebookExecution() {
                if (!this.notebookViewModel.currentTokenSource) {
                    throw new Error('Notebook is not executing');
                }
                this.notebookViewModel.currentTokenSource.cancel();
                this.notebookViewModel.currentTokenSource = undefined;
            }
            async executeNotebook() {
                if (!this.notebookViewModel.metadata.runnable) {
                    return;
                }
                // return this.progressService.showWhile(this._executeNotebook());
                return this._executeNotebook();
            }
            async _executeNotebook() {
                if (this.notebookViewModel.currentTokenSource) {
                    return;
                }
                const tokenSource = new cancellation_1.CancellationTokenSource();
                try {
                    this.editorExecutingNotebook.set(true);
                    this.notebookViewModel.currentTokenSource = tokenSource;
                    for (let cell of this.notebookViewModel.viewCells) {
                        if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                            await this._executeNotebookCell(cell, tokenSource);
                        }
                    }
                }
                finally {
                    this.editorExecutingNotebook.set(false);
                    this.notebookViewModel.currentTokenSource = undefined;
                    tokenSource.dispose();
                }
            }
            cancelNotebookCellExecution(cell) {
                if (!cell.currentTokenSource) {
                    throw new Error('Cell is not executing');
                }
                cell.currentTokenSource.cancel();
                cell.currentTokenSource = undefined;
            }
            async executeNotebookCell(cell) {
                if (!cell.getEvaluatedMetadata(this.notebookViewModel.metadata).runnable) {
                    return;
                }
                const tokenSource = new cancellation_1.CancellationTokenSource();
                try {
                    this._executeNotebookCell(cell, tokenSource);
                }
                finally {
                    tokenSource.dispose();
                }
            }
            async _executeNotebookCell(cell, tokenSource) {
                var _a;
                try {
                    cell.currentTokenSource = tokenSource;
                    const provider = this.notebookService.getContributedNotebookProviders(this.viewModel.uri)[0];
                    if (provider) {
                        const viewType = provider.id;
                        const notebookUri = (_a = notebookCommon_1.CellUri.parse(cell.uri)) === null || _a === void 0 ? void 0 : _a.notebook;
                        if (notebookUri) {
                            return await this.notebookService.executeNotebookCell(viewType, notebookUri, cell.handle, tokenSource.token);
                        }
                    }
                }
                finally {
                    cell.currentTokenSource = undefined;
                }
            }
            focusNotebookCell(cell, focusEditor) {
                var _a, _b, _c;
                if (focusEditor) {
                    this.selectElement(cell);
                    (_a = this.list) === null || _a === void 0 ? void 0 : _a.focusView();
                    cell.editState = notebookBrowser_1.CellEditState.Editing;
                    cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
                    this.revealInCenterIfOutsideViewport(cell);
                }
                else {
                    let itemDOM = (_b = this.list) === null || _b === void 0 ? void 0 : _b.domElementOfElement(cell);
                    if (document.activeElement && itemDOM && itemDOM.contains(document.activeElement)) {
                        document.activeElement.blur();
                    }
                    cell.editState = notebookBrowser_1.CellEditState.Preview;
                    cell.focusMode = notebookBrowser_1.CellFocusMode.Container;
                    this.selectElement(cell);
                    this.revealInCenterIfOutsideViewport(cell);
                    (_c = this.list) === null || _c === void 0 ? void 0 : _c.focusView();
                }
            }
            //#endregion
            //#region MISC
            getLayoutInfo() {
                if (!this.list) {
                    throw new Error('Editor is not initalized successfully');
                }
                return {
                    width: this.dimension.width,
                    height: this.dimension.height,
                    fontInfo: this.fontInfo
                };
            }
            triggerScroll(event) {
                var _a;
                (_a = this.list) === null || _a === void 0 ? void 0 : _a.triggerScrollFromMouseWheelEvent(event);
            }
            createInset(cell, output, shadowContent, offset) {
                var _a, _b, _c;
                if (!this.webview) {
                    return;
                }
                let preloads = this.notebookViewModel.renderers;
                if (!this.webview.insetMapping.has(output)) {
                    let cellTop = ((_a = this.list) === null || _a === void 0 ? void 0 : _a.getAbsoluteTopOfElement(cell)) || 0;
                    this.webview.createInset(cell, output, cellTop, offset, shadowContent, preloads);
                }
                else {
                    let cellTop = ((_b = this.list) === null || _b === void 0 ? void 0 : _b.getAbsoluteTopOfElement(cell)) || 0;
                    let scrollTop = ((_c = this.list) === null || _c === void 0 ? void 0 : _c.scrollTop) || 0;
                    this.webview.updateViewScrollTop(-scrollTop, [{ cell: cell, output: output, cellTop: cellTop }]);
                }
            }
            removeInset(output) {
                if (!this.webview) {
                    return;
                }
                this.webview.removeInset(output);
            }
            hideInset(output) {
                if (!this.webview) {
                    return;
                }
                this.webview.hideInset(output);
            }
            getOutputRenderer() {
                return this.outputRenderer;
            }
            postMessage(message) {
                var _a;
                (_a = this.webview) === null || _a === void 0 ? void 0 : _a.webview.sendMessage(message);
            }
            //#endregion
            //#region Editor Contributions
            getContribution(id) {
                return (this._contributions[id] || null);
            }
            //#endregion
            dispose() {
                const keys = Object.keys(this._contributions);
                for (let i = 0, len = keys.length; i < len; i++) {
                    const contributionId = keys[i];
                    this._contributions[contributionId].dispose();
                }
                super.dispose();
            }
            toJSON() {
                var _a;
                return {
                    notebookHandle: (_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.handle
                };
            }
        };
        NotebookEditor.ID = 'workbench.editor.notebook';
        NotebookEditor = __decorate([
            __param(0, telemetry_1.ITelemetryService),
            __param(1, themeService_1.IThemeService),
            __param(2, instantiation_1.IInstantiationService),
            __param(3, storage_1.IStorageService),
            __param(4, notebookService_1.INotebookService),
            __param(5, editorGroupsService_1.IEditorGroupsService),
            __param(6, configuration_1.IConfigurationService),
            __param(7, contextkey_1.IContextKeyService)
        ], NotebookEditor);
        return NotebookEditor;
    })();
    exports.NotebookEditor = NotebookEditor;
    const embeddedEditorBackground = 'walkThrough.embeddedEditorBackground';
    exports.focusedCellIndicator = colorRegistry_1.registerColor('notebook.focusedCellIndicator', {
        light: new color_1.Color(new color_1.RGBA(102, 175, 224)),
        dark: new color_1.Color(new color_1.RGBA(12, 125, 157)),
        hc: new color_1.Color(new color_1.RGBA(0, 73, 122))
    }, nls.localize('notebook.focusedCellIndicator', "The color of the focused notebook cell indicator."));
    exports.notebookOutputContainerColor = colorRegistry_1.registerColor('notebook.outputContainerBackgroundColor', {
        dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.06)),
        light: new color_1.Color(new color_1.RGBA(237, 239, 249)),
        hc: null
    }, nls.localize('notebook.outputContainerBackgroundColor', "The Color of the notebook output container background."));
    // TODO currently also used for toolbar border, if we keep all of this, pick a generic name
    exports.CELL_TOOLBAR_SEPERATOR = colorRegistry_1.registerColor('notebook.cellToolbarSeperator', {
        dark: color_1.Color.fromHex('#808080').transparent(0.35),
        light: color_1.Color.fromHex('#808080').transparent(0.35),
        hc: colorRegistry_1.contrastBorder
    }, nls.localize('cellToolbarSeperator', "The color of seperator in Cell bottom toolbar"));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const color = walkThroughUtils_1.getExtraColor(theme, embeddedEditorBackground, { dark: 'rgba(0, 0, 0, .4)', extra_dark: 'rgba(200, 235, 255, .064)', light: '#f4f4f4', hc: null });
        if (color) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell .monaco-editor-background,
			.monaco-workbench .part.editor > .content .notebook-editor .cell .margin-view-overlays,
			.monaco-workbench .part.editor > .content .notebook-editor .cell .cell-statusbar-container { background: ${color}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-drag-image .cell-editor-container > div { background: ${color} !important; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .output a,
			.monaco-workbench .part.editor > .content .notebook-editor .cell.markdown a { color: ${link};} `);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .output a:hover,
			.monaco-workbench .part.editor > .content .notebook-editor .cell .output a:active { color: ${activeLink}; }`);
        }
        const shortcut = theme.getColor(colorRegistry_1.textPreformatForeground);
        if (shortcut) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor code,
			.monaco-workbench .part.editor > .content .notebook-editor .shortcut { color: ${shortcut}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-editor { border-color: ${border}; }`);
        }
        const quoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
        if (quoteBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor blockquote { background: ${quoteBackground}; }`);
        }
        const quoteBorder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
        if (quoteBorder) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor blockquote { border-color: ${quoteBorder}; }`);
        }
        const containerBackground = theme.getColor(exports.notebookOutputContainerColor);
        if (containerBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .output { background-color: ${containerBackground}; }`);
        }
        const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
        if (editorBackgroundColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-statusbar-container { border-top: solid 1px ${editorBackgroundColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row > .monaco-toolbar { background-color: ${editorBackgroundColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row.cell-drag-image { background-color: ${editorBackgroundColor}; }`);
        }
        const cellToolbarSeperator = theme.getColor(exports.CELL_TOOLBAR_SEPERATOR);
        if (cellToolbarSeperator) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-bottom-toolbar-container .seperator { background-color: ${cellToolbarSeperator} }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-bottom-toolbar-container .seperator-short { background-color: ${cellToolbarSeperator} }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row > .monaco-toolbar { border: solid 1px ${cellToolbarSeperator}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row:hover .notebook-cell-focus-indicator,
			.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row.cell-output-hover .notebook-cell-focus-indicator { border-color: ${cellToolbarSeperator}; }`);
        }
        const focusedCellIndicatorColor = theme.getColor(exports.focusedCellIndicator);
        if (focusedCellIndicatorColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row.focused .notebook-cell-focus-indicator { border-color: ${focusedCellIndicatorColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row .notebook-cell-focus-indicator { border-color: ${focusedCellIndicatorColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row .notebook-cell-insertion-indicator-top { background-color: ${focusedCellIndicatorColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list-row.cell-editor-focus .cell-editor-part:before { outline: solid 1px ${focusedCellIndicatorColor}; }`);
        }
        // const widgetShadowColor = theme.getColor(widgetShadow);
        // if (widgetShadowColor) {
        // 	collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor > .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row > .monaco-toolbar {
        // 		box-shadow:  0 0 8px 4px ${widgetShadowColor}
        // 	}`)
        // }
        // Cell Margin
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row  > div.cell { margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row { padding-top: ${constants_1.EDITOR_TOP_MARGIN}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .output { margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-bottom-toolbar-container { width: calc(100% - ${constants_1.CELL_MARGIN * 2 + constants_1.CELL_RUN_GUTTER}px); margin: 0px ${constants_1.CELL_MARGIN}px 0px ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .markdown-cell-row .cell .cell-editor-part { margin-left: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-list-container > .monaco-list > .monaco-scrollable-element > .monaco-list-rows > .monaco-list-row  > div.cell.markdown { padding-left: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell .run-button-container { width: ${constants_1.CELL_RUN_GUTTER}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list .monaco-list-row .notebook-cell-insertion-indicator-top { left: ${constants_1.CELL_MARGIN + constants_1.CELL_RUN_GUTTER}px; right: ${constants_1.CELL_MARGIN}px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .cell-drag-image .cell-editor-container > div { padding: ${constants_1.EDITOR_TOP_PADDING}px 16px ${constants_1.EDITOR_BOTTOM_PADDING}px 16px; }`);
        collector.addRule(`.monaco-workbench .part.editor > .content .notebook-editor .monaco-list .monaco-list-row .notebook-cell-focus-indicator { left: ${constants_1.CELL_MARGIN}px; }`);
    });
});
//# sourceMappingURL=notebookEditor.js.map