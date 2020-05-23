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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/common/modes/textToHtmlTokenizer", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/renderers/cellMenus", "vs/workbench/contrib/notebook/browser/view/renderers/codeCell", "vs/workbench/contrib/notebook/browser/view/renderers/markdownCell", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/css!vs/workbench/contrib/notebook/browser/media/notebook"], function (require, exports, browser_1, DOM, event_1, keyboardEvent_1, progressbar_1, toolbar_1, actions_1, codicons_1, color_1, event_2, lifecycle_1, objects_1, platform, strings_1, codeEditorWidget_1, editorOptions_1, fontInfo_1, range_1, modes, textToHtmlTokenizer_1, modeService_1, nls, menuEntryActionViewItem_1, actions_2, configuration_1, contextView_1, instantiation_1, keybinding_1, notification_1, constants_1, coreActions_1, notebookBrowser_1, cellMenus_1, codeCell_1, markdownCell_1, codeCellViewModel_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCellRenderer = exports.CellLanguageStatusBarItem = exports.CellDragAndDropController = exports.MarkdownCellRenderer = exports.CellEditorOptions = exports.CodiconActionViewItem = exports.NotebookCellListDelegate = void 0;
    const $ = DOM.$;
    let NotebookCellListDelegate = /** @class */ (() => {
        let NotebookCellListDelegate = class NotebookCellListDelegate {
            constructor(configurationService) {
                this.configurationService = configurationService;
                const editorOptions = this.configurationService.getValue('editor');
                this._lineHeight = fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.getZoomLevel()).lineHeight;
            }
            getHeight(element) {
                return element.getHeight(this._lineHeight);
            }
            hasDynamicHeight(element) {
                return element.hasDynamicHeight();
            }
            getTemplateId(element) {
                if (element.cellKind === notebookCommon_1.CellKind.Markdown) {
                    return MarkdownCellRenderer.TEMPLATE_ID;
                }
                else {
                    return CodeCellRenderer.TEMPLATE_ID;
                }
            }
        };
        NotebookCellListDelegate = __decorate([
            __param(0, configuration_1.IConfigurationService)
        ], NotebookCellListDelegate);
        return NotebookCellListDelegate;
    })();
    exports.NotebookCellListDelegate = NotebookCellListDelegate;
    class CodiconActionViewItem extends menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem {
        constructor(_action, _keybindingService, _notificationService, _contextMenuService) {
            super(_action, _keybindingService, _notificationService, _contextMenuService);
            this._action = _action;
        }
        updateLabel() {
            var _a;
            if (this.options.label && this.label) {
                this.label.innerHTML = codicons_1.renderCodicons((_a = this._commandAction.label) !== null && _a !== void 0 ? _a : '');
            }
        }
    }
    exports.CodiconActionViewItem = CodiconActionViewItem;
    let CellEditorOptions = /** @class */ (() => {
        class CellEditorOptions {
            constructor(configurationService, language) {
                this._onDidChange = new event_2.Emitter();
                this.onDidChange = this._onDidChange.event;
                this._disposable = configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration('editor')) {
                        this._value = computeEditorOptions();
                        this._onDidChange.fire(this.value);
                    }
                });
                const computeEditorOptions = () => {
                    const editorOptions = objects_1.deepClone(configurationService.getValue('editor', { overrideIdentifier: language }));
                    return Object.assign(Object.assign({}, editorOptions), CellEditorOptions.fixedEditorOptions);
                };
                this._value = computeEditorOptions();
            }
            dispose() {
                this._onDidChange.dispose();
                this._disposable.dispose();
            }
            get value() {
                return this._value;
            }
        }
        CellEditorOptions.fixedEditorOptions = {
            padding: {
                top: constants_1.EDITOR_TOP_PADDING,
                bottom: constants_1.EDITOR_BOTTOM_PADDING
            },
            scrollBeyondLastLine: false,
            scrollbar: {
                verticalScrollbarSize: 14,
                horizontal: 'auto',
                useShadows: true,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                alwaysConsumeMouseWheel: false
            },
            renderLineHighlightOnlyWhenFocus: true,
            overviewRulerLanes: 0,
            selectOnLineNumbers: false,
            lineNumbers: 'off',
            lineDecorationsWidth: 0,
            glyphMargin: false,
            fixedOverflowWidgets: true,
            minimap: { enabled: false },
            renderValidationDecorations: 'on'
        };
        return CellEditorOptions;
    })();
    exports.CellEditorOptions = CellEditorOptions;
    class AbstractCellRenderer {
        constructor(instantiationService, notebookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyService, language, dndController) {
            this.instantiationService = instantiationService;
            this.notebookEditor = notebookEditor;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextKeyService = contextKeyService;
            this.dndController = dndController;
            this.actionRunner = new actions_1.ActionRunner();
            this.editorOptions = new CellEditorOptions(configurationService, language);
        }
        dispose() {
            this.editorOptions.dispose();
        }
        createBottomCellToolbar(container) {
            const toolbar = new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_2.MenuItemAction) {
                        const item = new CodiconActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                        return item;
                    }
                    return undefined;
                }
            });
            toolbar.getContainer().style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}px`;
            return toolbar;
        }
        setupBetweenCellToolbarActions(element, templateData, disposables, context) {
            const container = templateData.bottomCellContainer;
            container.innerHTML = '';
            container.style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}px`;
            DOM.append(container, $('.seperator'));
            const addCodeCell = DOM.append(container, $('span.button'));
            addCodeCell.innerHTML = codicons_1.renderCodicons(strings_1.escape(`$(add) Code `));
            addCodeCell.tabIndex = 0;
            const insertCellBelow = this.instantiationService.createInstance(coreActions_1.InsertCodeCellAction);
            const toolbarContext = Object.assign(Object.assign({}, context), { ui: true });
            disposables.add(DOM.addDisposableListener(addCodeCell, DOM.EventType.CLICK, e => {
                this.actionRunner.run(insertCellBelow, toolbarContext);
                e.stopPropagation();
            }));
            disposables.add((DOM.addDisposableListener(addCodeCell, DOM.EventType.KEY_DOWN, async (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if ((event.equals(3 /* Enter */) || event.equals(10 /* Space */))) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.actionRunner.run(insertCellBelow, toolbarContext);
                }
            })));
            DOM.append(container, $('.seperator-short'));
            const addMarkdownCell = DOM.append(container, $('span.button'));
            addMarkdownCell.innerHTML = codicons_1.renderCodicons(strings_1.escape('$(add) Markdown '));
            addMarkdownCell.tabIndex = 0;
            const insertMarkdownBelow = this.instantiationService.createInstance(coreActions_1.InsertMarkdownCellAction);
            disposables.add(DOM.addDisposableListener(addMarkdownCell, DOM.EventType.CLICK, e => {
                this.actionRunner.run(insertMarkdownBelow, toolbarContext);
                e.stopPropagation();
            }));
            disposables.add((DOM.addDisposableListener(addMarkdownCell, DOM.EventType.KEY_DOWN, async (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if ((event.equals(3 /* Enter */) || event.equals(10 /* Space */))) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.actionRunner.run(insertMarkdownBelow, toolbarContext);
                }
            })));
            DOM.append(container, $('.seperator'));
            if (element instanceof codeCellViewModel_1.CodeCellViewModel) {
                const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
                container.style.top = `${bottomToolbarOffset}px`;
                disposables.add(element.onDidChangeLayout(() => {
                    const bottomToolbarOffset = element.layoutInfo.bottomToolbarOffset;
                    container.style.top = `${bottomToolbarOffset}px`;
                }));
            }
            else {
                container.style.position = 'static';
                container.style.height = `${constants_1.BOTTOM_CELL_TOOLBAR_HEIGHT}`;
            }
        }
        createToolbar(container) {
            const toolbar = new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => {
                    if (action instanceof actions_2.MenuItemAction) {
                        const item = new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
                        return item;
                    }
                    return undefined;
                }
            });
            return toolbar;
        }
        getCellToolbarActions(menu) {
            const actions = [];
            for (let [, menuActions] of menu.getActions({ shouldForwardArgs: true })) {
                actions.push(...menuActions);
            }
            return actions;
        }
        setupCellToolbarActions(scopedContextKeyService, templateData, disposables) {
            const cellMenu = this.instantiationService.createInstance(cellMenus_1.CellMenus);
            const menu = disposables.add(cellMenu.getCellTitleMenu(scopedContextKeyService));
            const updateActions = () => {
                const actions = this.getCellToolbarActions(menu);
                templateData.toolbar.setActions(actions)();
                if (templateData.focusIndicator) {
                    if (actions.length) {
                        templateData.container.classList.add('cell-has-toolbar-actions');
                        templateData.focusIndicator.style.top = `${constants_1.EDITOR_TOOLBAR_HEIGHT + constants_1.EDITOR_TOP_MARGIN}px`;
                    }
                    else {
                        templateData.container.classList.remove('cell-has-toolbar-actions');
                        templateData.focusIndicator.style.top = `${constants_1.EDITOR_TOP_MARGIN}px`;
                    }
                }
            };
            updateActions();
            disposables.add(menu.onDidChange(() => {
                updateActions();
            }));
        }
        commonRenderElement(element, index, templateData) {
            if (element.dragging) {
                templateData.container.classList.add(DRAGGING_CLASS);
            }
            else {
                templateData.container.classList.remove(DRAGGING_CLASS);
            }
        }
    }
    let MarkdownCellRenderer = /** @class */ (() => {
        let MarkdownCellRenderer = class MarkdownCellRenderer extends AbstractCellRenderer {
            constructor(contextKeyService, notehookEditor, dndController, renderedEditors, instantiationService, configurationService, contextMenuService, keybindingService, notificationService) {
                super(instantiationService, notehookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyService, 'markdown', dndController);
                this.renderedEditors = renderedEditors;
            }
            get templateId() {
                return MarkdownCellRenderer.TEMPLATE_ID;
            }
            renderTemplate(container) {
                container.classList.add('markdown-cell-row');
                const disposables = new lifecycle_1.DisposableStore();
                const toolbar = disposables.add(this.createToolbar(container));
                const focusIndicator = DOM.append(container, DOM.$('.notebook-cell-focus-indicator'));
                focusIndicator.setAttribute('draggable', 'true');
                const codeInnerContent = DOM.append(container, $('.cell.code'));
                const editorPart = DOM.append(codeInnerContent, $('.cell-editor-part'));
                const editorContainer = DOM.append(editorPart, $('.markdown-editor-container'));
                editorPart.style.display = 'none';
                const innerContent = DOM.append(container, $('.cell.markdown'));
                const insertionIndicatorTop = DOM.append(container, DOM.$('.notebook-cell-insertion-indicator-top'));
                const foldingIndicator = DOM.append(container, DOM.$('.notebook-folding-indicator'));
                const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
                const statusBar = this.instantiationService.createInstance(CellEditorStatusBar, editorPart);
                const templateData = {
                    insertionIndicatorTop,
                    container,
                    cellContainer: innerContent,
                    editorPart,
                    editorContainer,
                    focusIndicator,
                    foldingIndicator,
                    disposables,
                    elementDisposables: new lifecycle_1.DisposableStore(),
                    toolbar,
                    bottomCellContainer,
                    statusBarContainer: statusBar.statusBarContainer,
                    languageStatusBarItem: statusBar.languageStatusBarItem,
                    toJSON: () => { return {}; }
                };
                this.dndController.addListeners(templateData, () => this.getDragImage(templateData));
                return templateData;
            }
            getDragImage(templateData) {
                const dragImageContainer = DOM.$('.cell-drag-image.monaco-list-row.focused.markdown-cell-row');
                dragImageContainer.innerHTML = templateData.container.innerHTML;
                return dragImageContainer;
            }
            renderElement(element, index, templateData, height) {
                this.commonRenderElement(element, index, templateData);
                templateData.currentRenderedCell = element;
                templateData.editorPart.style.display = 'none';
                templateData.cellContainer.innerHTML = '';
                let renderedHTML = element.getHTML();
                if (renderedHTML) {
                    templateData.cellContainer.appendChild(renderedHTML);
                }
                if (height) {
                    const elementDisposables = templateData.elementDisposables;
                    // render toolbar first
                    const contextKeyService = this.contextKeyService.createScoped(templateData.container);
                    this.setupCellToolbarActions(contextKeyService, templateData, elementDisposables);
                    const toolbarContext = {
                        cell: element,
                        notebookEditor: this.notebookEditor,
                        $mid: 12
                    };
                    templateData.toolbar.context = toolbarContext;
                    this.setupBetweenCellToolbarActions(element, templateData, elementDisposables, toolbarContext);
                    const markdownCell = new markdownCell_1.StatefullMarkdownCell(this.notebookEditor, element, templateData, this.editorOptions.value, this.renderedEditors, this.instantiationService);
                    elementDisposables.add(this.editorOptions.onDidChange(newValue => markdownCell.updateEditorOptions(newValue)));
                    elementDisposables.add(markdownCell);
                    notebookBrowser_1.NOTEBOOK_CELL_TYPE.bindTo(contextKeyService).set('markdown');
                    notebookBrowser_1.NOTEBOOK_VIEW_TYPE.bindTo(contextKeyService).set(element.viewType);
                    const metadata = element.getEvaluatedMetadata(this.notebookEditor.viewModel.notebookDocument.metadata);
                    const cellEditableKey = notebookBrowser_1.NOTEBOOK_CELL_EDITABLE.bindTo(contextKeyService);
                    cellEditableKey.set(!!metadata.editable);
                    const updateForMetadata = () => {
                        const metadata = element.getEvaluatedMetadata(this.notebookEditor.viewModel.notebookDocument.metadata);
                        cellEditableKey.set(!!metadata.editable);
                    };
                    updateForMetadata();
                    elementDisposables.add(element.onDidChangeState((e) => {
                        if (e.metadataChanged) {
                            updateForMetadata();
                        }
                    }));
                    const editModeKey = notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.bindTo(contextKeyService);
                    editModeKey.set(element.editState === notebookBrowser_1.CellEditState.Editing);
                    elementDisposables.add(element.onDidChangeState((e) => {
                        if (e.editStateChanged) {
                            editModeKey.set(element.editState === notebookBrowser_1.CellEditState.Editing);
                        }
                    }));
                    element.totalHeight = height;
                    templateData.languageStatusBarItem.update(element, this.notebookEditor);
                }
            }
            disposeTemplate(templateData) {
                templateData.disposables.clear();
            }
            disposeElement(element, index, templateData, height) {
                if (height) {
                    templateData.elementDisposables.clear();
                }
            }
        };
        MarkdownCellRenderer.TEMPLATE_ID = 'markdown_cell';
        MarkdownCellRenderer = __decorate([
            __param(4, instantiation_1.IInstantiationService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, contextView_1.IContextMenuService),
            __param(7, keybinding_1.IKeybindingService),
            __param(8, notification_1.INotificationService)
        ], MarkdownCellRenderer);
        return MarkdownCellRenderer;
    })();
    exports.MarkdownCellRenderer = MarkdownCellRenderer;
    const DRAGGING_CLASS = 'cell-dragging';
    const DRAGOVER_CLASS = 'cell-dragover';
    class CellDragAndDropController {
        constructor(notebookEditor) {
            this.notebookEditor = notebookEditor;
        }
        addListeners(templateData, dragImageProvider) {
            const container = templateData.container;
            const dragHandle = templateData.focusIndicator;
            const dragCleanup = () => {
                if (this.currentDraggedCell) {
                    this.currentDraggedCell.dragging = false;
                    this.currentDraggedCell = undefined;
                }
            };
            templateData.disposables.add(event_1.domEvent(dragHandle, DOM.EventType.DRAG_END)(() => {
                // TODO
                this.notebookEditor.getInnerWebview().element.style['pointer-events'] = '';
                // Note, templateData may have a different element rendered into it by now
                container.classList.remove(DRAGGING_CLASS);
                dragCleanup();
            }));
            templateData.disposables.add(event_1.domEvent(dragHandle, DOM.EventType.DRAG_START)(event => {
                this.notebookEditor.getInnerWebview().element.style['pointer-events'] = 'none';
                if (!event.dataTransfer) {
                    return;
                }
                this.currentDraggedCell = templateData.currentRenderedCell;
                this.currentDraggedCell.dragging = true;
                const dragImage = dragImageProvider();
                container.parentElement.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, 0, 0);
                setTimeout(() => container.parentElement.removeChild(dragImage), 0); // Comment this out to debug drag image layout
                container.classList.add(DRAGGING_CLASS);
            }));
            templateData.disposables.add(event_1.domEvent(container, DOM.EventType.DRAG_OVER)(event => {
                event.preventDefault();
            }));
            templateData.disposables.add(event_1.domEvent(container, DOM.EventType.DROP)(event => {
                event.preventDefault();
                const draggedCell = this.currentDraggedCell;
                dragCleanup();
                this.notebookEditor.moveCell(draggedCell, templateData.currentRenderedCell, 'above');
                container.classList.remove(DRAGOVER_CLASS);
            }));
            templateData.disposables.add(event_1.domEvent(container, DOM.EventType.DRAG_ENTER)(event => {
                event.preventDefault();
                container.classList.add(DRAGOVER_CLASS);
            }));
            templateData.disposables.add(event_1.domEvent(container, DOM.EventType.DRAG_LEAVE)(event => {
                if (!event.relatedTarget || !DOM.isAncestor(event.relatedTarget, container)) {
                    container.classList.remove(DRAGOVER_CLASS);
                }
            }));
        }
    }
    exports.CellDragAndDropController = CellDragAndDropController;
    let CellLanguageStatusBarItem = /** @class */ (() => {
        let CellLanguageStatusBarItem = class CellLanguageStatusBarItem extends lifecycle_1.Disposable {
            constructor(container, modeService, instantiationService) {
                super();
                this.container = container;
                this.modeService = modeService;
                this.instantiationService = instantiationService;
                this.labelElement = DOM.append(container, $('.cell-language-picker'));
                this.labelElement.tabIndex = -1; // allows screen readers to read title, but still prevents tab focus.
                this._register(DOM.addDisposableListener(this.labelElement, DOM.EventType.CLICK, () => {
                    this.instantiationService.invokeFunction(accessor => {
                        new coreActions_1.ChangeCellLanguageAction().run(accessor, { notebookEditor: this._editor, cell: this._cell });
                    });
                }));
                this._register(this.cellDisposables = new lifecycle_1.DisposableStore());
            }
            update(cell, editor) {
                this.cellDisposables.clear();
                this._cell = cell;
                this._editor = editor;
                this.render();
                this.cellDisposables.add(this._cell.model.onDidChangeLanguage(() => this.render()));
            }
            render() {
                this.labelElement.textContent = this.modeService.getLanguageName(this._cell.language);
            }
        };
        CellLanguageStatusBarItem = __decorate([
            __param(1, modeService_1.IModeService),
            __param(2, instantiation_1.IInstantiationService)
        ], CellLanguageStatusBarItem);
        return CellLanguageStatusBarItem;
    })();
    exports.CellLanguageStatusBarItem = CellLanguageStatusBarItem;
    class EditorTextRenderer {
        getRichText(editor, modelRange) {
            const model = editor.getModel();
            if (!model) {
                return null;
            }
            const colorMap = this._getDefaultColorMap();
            const fontInfo = editor.getOptions().get(36 /* fontInfo */);
            const fontFamily = fontInfo.fontFamily === editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily ? fontInfo.fontFamily : `'${fontInfo.fontFamily}', ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`;
            return `<div style="`
                + `color: ${colorMap[1 /* DefaultForeground */]};`
                + `background-color: ${colorMap[2 /* DefaultBackground */]};`
                + `font-family: ${fontFamily};`
                + `font-weight: ${fontInfo.fontWeight};`
                + `font-size: ${fontInfo.fontSize}px;`
                + `line-height: ${fontInfo.lineHeight}px;`
                + `white-space: pre;`
                + `">`
                + this._getRichTextLines(model, modelRange, colorMap)
                + '</div>';
        }
        _getRichTextLines(model, modelRange, colorMap) {
            const startLineNumber = modelRange.startLineNumber;
            const startColumn = modelRange.startColumn;
            const endLineNumber = modelRange.endLineNumber;
            const endColumn = modelRange.endColumn;
            const tabSize = model.getOptions().tabSize;
            let result = '';
            for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
                const lineTokens = model.getLineTokens(lineNumber);
                const lineContent = lineTokens.getLineContent();
                const startOffset = (lineNumber === startLineNumber ? startColumn - 1 : 0);
                const endOffset = (lineNumber === endLineNumber ? endColumn - 1 : lineContent.length);
                if (lineContent === '') {
                    result += '<br>';
                }
                else {
                    result += textToHtmlTokenizer_1.tokenizeLineToHTML(lineContent, lineTokens.inflate(), colorMap, startOffset, endOffset, tabSize, platform.isWindows);
                }
            }
            return result;
        }
        _getDefaultColorMap() {
            let colorMap = modes.TokenizationRegistry.getColorMap();
            let result = ['#000000'];
            if (colorMap) {
                for (let i = 1, len = colorMap.length; i < len; i++) {
                    result[i] = color_1.Color.Format.CSS.formatHex(colorMap[i]);
                }
            }
            return result;
        }
    }
    class CodeCellDragImageRenderer {
        getDragImage(templateData) {
            let dragImage = this._getDragImage(templateData);
            if (!dragImage) {
                // TODO I don't think this can happen
                dragImage = document.createElement('div');
                dragImage.textContent = '1 cell';
            }
            return dragImage;
        }
        _getDragImage(templateData) {
            const dragImageContainer = DOM.$('.cell-drag-image.monaco-list-row.focused.code-cell-row');
            dragImageContainer.innerHTML = templateData.container.innerHTML;
            const editorContainer = dragImageContainer.querySelector('.cell-editor-container');
            if (!editorContainer) {
                return null;
            }
            const focusIndicator = dragImageContainer.querySelector('.notebook-cell-focus-indicator');
            if (focusIndicator) {
                focusIndicator.style.height = '40px';
            }
            const richEditorText = new EditorTextRenderer().getRichText(templateData.editor, new range_1.Range(1, 1, 1, 1000));
            if (!richEditorText) {
                return null;
            }
            editorContainer.innerHTML = richEditorText;
            return dragImageContainer;
        }
    }
    let CellEditorStatusBar = /** @class */ (() => {
        let CellEditorStatusBar = class CellEditorStatusBar {
            constructor(container, instantiationService) {
                this.statusBarContainer = DOM.append(container, $('.cell-statusbar-container'));
                const leftStatusBarItems = DOM.append(this.statusBarContainer, $('.cell-status-left'));
                const rightStatusBarItems = DOM.append(this.statusBarContainer, $('.cell-status-right'));
                this.cellRunStatusContainer = DOM.append(leftStatusBarItems, $('.cell-run-status'));
                this.cellStatusMessageContainer = DOM.append(leftStatusBarItems, $('.cell-status-message'));
                this.languageStatusBarItem = instantiationService.createInstance(CellLanguageStatusBarItem, rightStatusBarItems);
            }
        };
        CellEditorStatusBar = __decorate([
            __param(1, instantiation_1.IInstantiationService)
        ], CellEditorStatusBar);
        return CellEditorStatusBar;
    })();
    let CodeCellRenderer = /** @class */ (() => {
        let CodeCellRenderer = class CodeCellRenderer extends AbstractCellRenderer {
            constructor(notebookEditor, contextKeyService, renderedEditors, dndController, contextMenuService, configurationService, instantiationService, keybindingService, notificationService) {
                super(instantiationService, notebookEditor, contextMenuService, configurationService, keybindingService, notificationService, contextKeyService, 'python', dndController);
                this.notebookEditor = notebookEditor;
                this.contextKeyService = contextKeyService;
                this.renderedEditors = renderedEditors;
            }
            get templateId() {
                return CodeCellRenderer.TEMPLATE_ID;
            }
            renderTemplate(container) {
                container.classList.add('code-cell-row');
                container.tabIndex = 0;
                const disposables = new lifecycle_1.DisposableStore();
                const toolbar = disposables.add(this.createToolbar(container));
                const focusIndicator = DOM.append(container, DOM.$('.notebook-cell-focus-indicator'));
                focusIndicator.setAttribute('draggable', 'true');
                const cellContainer = DOM.append(container, $('.cell.code'));
                const runButtonContainer = DOM.append(cellContainer, $('.run-button-container'));
                const runToolbar = this.createToolbar(runButtonContainer);
                disposables.add(runToolbar);
                const executionOrderLabel = DOM.append(runButtonContainer, $('div.execution-count-label'));
                const editorPart = DOM.append(cellContainer, $('.cell-editor-part'));
                const editorContainer = DOM.append(editorPart, $('.cell-editor-container'));
                const editor = this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, editorContainer, Object.assign(Object.assign({}, this.editorOptions.value), { dimension: {
                        width: 0,
                        height: 0
                    } }), {});
                disposables.add(this.editorOptions.onDidChange(newValue => editor.updateOptions(newValue)));
                const progressBar = new progressbar_1.ProgressBar(editorPart);
                progressBar.hide();
                disposables.add(progressBar);
                const statusBar = this.instantiationService.createInstance(CellEditorStatusBar, editorPart);
                const insertionIndicatorTop = DOM.append(container, DOM.$('.notebook-cell-insertion-indicator-top'));
                const outputContainer = DOM.append(container, $('.output'));
                const bottomCellContainer = DOM.append(container, $('.cell-bottom-toolbar-container'));
                const templateData = {
                    insertionIndicatorTop,
                    container,
                    cellContainer,
                    statusBarContainer: statusBar.statusBarContainer,
                    cellRunStatusContainer: statusBar.cellRunStatusContainer,
                    cellStatusMessageContainer: statusBar.cellStatusMessageContainer,
                    languageStatusBarItem: statusBar.languageStatusBarItem,
                    progressBar,
                    focusIndicator,
                    toolbar,
                    runToolbar,
                    runButtonContainer,
                    executionOrderLabel,
                    outputContainer,
                    editor,
                    disposables,
                    elementDisposables: new lifecycle_1.DisposableStore(),
                    bottomCellContainer,
                    toJSON: () => { return {}; }
                };
                this.dndController.addListeners(templateData, () => new CodeCellDragImageRenderer().getDragImage(templateData));
                return templateData;
            }
            updateForRunState(element, templateData, runStateKey) {
                runStateKey.set(notebookBrowser_1.CellRunState[element.runState]);
                if (element.runState === notebookBrowser_1.CellRunState.Running) {
                    templateData.progressBar.infinite().show(500);
                    templateData.runToolbar.setActions([
                        this.instantiationService.createInstance(coreActions_1.CancelCellAction)
                    ])();
                }
                else {
                    templateData.progressBar.hide();
                    templateData.runToolbar.setActions([
                        this.instantiationService.createInstance(coreActions_1.ExecuteCellAction)
                    ])();
                }
            }
            updateForMetadata(element, templateData, cellEditableKey, cellRunnableKey) {
                const metadata = element.getEvaluatedMetadata(this.notebookEditor.viewModel.notebookDocument.metadata);
                DOM.toggleClass(templateData.cellContainer, 'runnable', !!metadata.runnable);
                this.renderExecutionOrder(element, templateData);
                cellEditableKey.set(!!metadata.editable);
                cellRunnableKey.set(!!metadata.runnable);
                templateData.cellStatusMessageContainer.textContent = (metadata === null || metadata === void 0 ? void 0 : metadata.statusMessage) || '';
                if (metadata.runState === notebookCommon_1.NotebookCellRunState.Success) {
                    templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(check)');
                }
                else if (metadata.runState === notebookCommon_1.NotebookCellRunState.Error) {
                    templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(error)');
                }
                else if (metadata.runState === notebookCommon_1.NotebookCellRunState.Running) {
                    // TODO should extensions be able to customize the status message while running to show progress?
                    templateData.cellStatusMessageContainer.textContent = nls.localize('cellRunningStatus', "Running");
                    templateData.cellRunStatusContainer.innerHTML = codicons_1.renderCodicons('$(sync~spin)');
                }
                else {
                    templateData.cellRunStatusContainer.innerHTML = '';
                }
            }
            renderExecutionOrder(element, templateData) {
                var _a, _b;
                const hasExecutionOrder = (_a = this.notebookEditor.viewModel.notebookDocument.metadata) === null || _a === void 0 ? void 0 : _a.hasExecutionOrder;
                if (hasExecutionOrder) {
                    const executionOrdeerLabel = typeof ((_b = element.metadata) === null || _b === void 0 ? void 0 : _b.executionOrder) === 'number' ? `[${element.metadata.executionOrder}]` :
                        '[ ]';
                    templateData.executionOrderLabel.innerText = executionOrdeerLabel;
                }
                else {
                    templateData.executionOrderLabel.innerText = '';
                }
            }
            updateForHover(element, templateData) {
                DOM.toggleClass(templateData.container, 'cell-output-hover', element.outputIsHovered);
            }
            renderElement(element, index, templateData, height) {
                this.commonRenderElement(element, index, templateData);
                templateData.currentRenderedCell = element;
                if (height === undefined) {
                    return;
                }
                templateData.outputContainer.innerHTML = '';
                const elementDisposables = templateData.elementDisposables;
                elementDisposables.add(this.instantiationService.createInstance(codeCell_1.CodeCell, this.notebookEditor, element, templateData));
                this.renderedEditors.set(element, templateData.editor);
                templateData.focusIndicator.style.height = `${element.layoutInfo.indicatorHeight}px`;
                elementDisposables.add(element.onDidChangeLayout(() => {
                    templateData.focusIndicator.style.height = `${element.layoutInfo.indicatorHeight}px`;
                }));
                const contextKeyService = this.contextKeyService.createScoped(templateData.container);
                const runStateKey = notebookBrowser_1.NOTEBOOK_CELL_RUN_STATE.bindTo(contextKeyService);
                runStateKey.set(notebookBrowser_1.CellRunState[element.runState]);
                this.updateForRunState(element, templateData, runStateKey);
                elementDisposables.add(element.onDidChangeState((e) => {
                    if (e.runStateChanged) {
                        this.updateForRunState(element, templateData, runStateKey);
                    }
                }));
                const cellHasOutputsContext = notebookBrowser_1.NOTEBOOK_CELL_HAS_OUTPUTS.bindTo(contextKeyService);
                cellHasOutputsContext.set(element.outputs.length > 0);
                elementDisposables.add(element.onDidChangeOutputs(() => {
                    cellHasOutputsContext.set(element.outputs.length > 0);
                }));
                notebookBrowser_1.NOTEBOOK_CELL_TYPE.bindTo(contextKeyService).set('code');
                notebookBrowser_1.NOTEBOOK_VIEW_TYPE.bindTo(contextKeyService).set(element.viewType);
                const metadata = element.getEvaluatedMetadata(this.notebookEditor.viewModel.notebookDocument.metadata);
                const cellEditableKey = notebookBrowser_1.NOTEBOOK_CELL_EDITABLE.bindTo(contextKeyService);
                cellEditableKey.set(!!metadata.editable);
                const cellRunnableKey = notebookBrowser_1.NOTEBOOK_CELL_RUNNABLE.bindTo(contextKeyService);
                cellRunnableKey.set(!!metadata.runnable);
                this.updateForMetadata(element, templateData, cellEditableKey, cellRunnableKey);
                elementDisposables.add(element.onDidChangeState((e) => {
                    if (e.metadataChanged) {
                        this.updateForMetadata(element, templateData, cellEditableKey, cellRunnableKey);
                    }
                    if (e.outputIsHoveredChanged) {
                        this.updateForHover(element, templateData);
                    }
                }));
                this.setupCellToolbarActions(contextKeyService, templateData, elementDisposables);
                const toolbarContext = {
                    cell: element,
                    cellTemplate: templateData,
                    notebookEditor: this.notebookEditor,
                    $mid: 12
                };
                templateData.toolbar.context = toolbarContext;
                templateData.runToolbar.context = toolbarContext;
                this.setupBetweenCellToolbarActions(element, templateData, elementDisposables, toolbarContext);
                templateData.languageStatusBarItem.update(element, this.notebookEditor);
            }
            disposeTemplate(templateData) {
                templateData.disposables.clear();
            }
            disposeElement(element, index, templateData, height) {
                templateData.elementDisposables.clear();
                this.renderedEditors.delete(element);
                templateData.focusIndicator.style.height = 'initial';
            }
        };
        CodeCellRenderer.TEMPLATE_ID = 'code_cell';
        CodeCellRenderer = __decorate([
            __param(4, contextView_1.IContextMenuService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, instantiation_1.IInstantiationService),
            __param(7, keybinding_1.IKeybindingService),
            __param(8, notification_1.INotificationService)
        ], CodeCellRenderer);
        return CodeCellRenderer;
    })();
    exports.CodeCellRenderer = CodeCellRenderer;
});
//# sourceMappingURL=cellRenderer.js.map