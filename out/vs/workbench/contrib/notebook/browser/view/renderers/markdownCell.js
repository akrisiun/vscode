/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/contrib/notebook/browser/constants", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/renderers/sizeObserver", "vs/workbench/contrib/notebook/browser/contrib/fold/foldingModel"], function (require, exports, dom_1, async_1, cancellation_1, codicons_1, lifecycle_1, codeEditorWidget_1, constants_1, notebookBrowser_1, sizeObserver_1, foldingModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatefullMarkdownCell = void 0;
    class StatefullMarkdownCell extends lifecycle_1.Disposable {
        constructor(notebookEditor, viewCell, templateData, editorOptions, renderedEditors, instantiationService) {
            super();
            this.notebookEditor = notebookEditor;
            this.viewCell = viewCell;
            this.templateData = templateData;
            this.editor = null;
            this.markdownContainer = templateData.cellContainer;
            this.editorPart = templateData.editorPart;
            this.editorOptions = editorOptions;
            this.localDisposables = new lifecycle_1.DisposableStore();
            this._register(this.localDisposables);
            this._register(lifecycle_1.toDisposable(() => renderedEditors.delete(this.viewCell)));
            const viewUpdate = () => {
                var _a;
                if (viewCell.editState === notebookBrowser_1.CellEditState.Editing) {
                    // switch to editing mode
                    let editorHeight;
                    dom_1.show(this.editorPart);
                    dom_1.hide(this.markdownContainer);
                    if (this.editor) {
                        editorHeight = this.editor.getContentHeight();
                        // not first time, we don't need to create editor or bind listeners
                        viewCell.attachTextEditor(this.editor);
                        if (notebookEditor.getActiveCell() === viewCell) {
                            this.editor.focus();
                        }
                        this.bindEditorListeners(this.editor.getModel());
                    }
                    else {
                        const width = viewCell.layoutInfo.editorWidth;
                        const lineNum = viewCell.lineCount;
                        const lineHeight = ((_a = viewCell.layoutInfo.fontInfo) === null || _a === void 0 ? void 0 : _a.lineHeight) || 17;
                        editorHeight = Math.max(lineNum, 1) * lineHeight + constants_1.EDITOR_TOP_PADDING + constants_1.EDITOR_BOTTOM_PADDING;
                        this.templateData.editorContainer.innerHTML = '';
                        this.editor = instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.templateData.editorContainer, Object.assign(Object.assign({}, this.editorOptions), { dimension: {
                                width: width,
                                height: editorHeight
                            } }), {});
                        const cts = new cancellation_1.CancellationTokenSource();
                        this._register({ dispose() { cts.dispose(true); } });
                        async_1.raceCancellation(viewCell.resolveTextModel(), cts.token).then(model => {
                            if (!model) {
                                return;
                            }
                            this.editor.setModel(model);
                            if (notebookEditor.getActiveCell() === viewCell) {
                                this.editor.focus();
                            }
                            const realContentHeight = this.editor.getContentHeight();
                            if (realContentHeight !== editorHeight) {
                                this.editor.layout({
                                    width: width,
                                    height: realContentHeight
                                });
                            }
                            viewCell.attachTextEditor(this.editor);
                            if (viewCell.editState === notebookBrowser_1.CellEditState.Editing) {
                                this.editor.focus();
                            }
                            this.bindEditorListeners(model, {
                                width: width,
                                height: editorHeight
                            });
                        });
                    }
                    const clientHeight = this.markdownContainer.clientHeight;
                    const totalHeight = editorHeight + 32 + clientHeight + constants_1.CELL_STATUSBAR_HEIGHT;
                    this.viewCell.totalHeight = totalHeight;
                    notebookEditor.layoutNotebookCell(viewCell, totalHeight);
                    this.editor.focus();
                    renderedEditors.set(this.viewCell, this.editor);
                }
                else {
                    this.viewCell.detachTextEditor();
                    dom_1.hide(this.editorPart);
                    dom_1.show(this.markdownContainer);
                    renderedEditors.delete(this.viewCell);
                    if (this.editor) {
                        // switch from editing mode
                        const clientHeight = templateData.container.clientHeight;
                        this.viewCell.totalHeight = clientHeight;
                        notebookEditor.layoutNotebookCell(viewCell, clientHeight);
                    }
                    else {
                        // first time, readonly mode
                        this.markdownContainer.innerHTML = '';
                        let markdownRenderer = viewCell.getMarkdownRenderer();
                        let renderedHTML = viewCell.getHTML();
                        if (renderedHTML) {
                            this.markdownContainer.appendChild(renderedHTML);
                        }
                        this.localDisposables.add(markdownRenderer.onDidUpdateRender(() => {
                            const clientHeight = templateData.container.clientHeight;
                            this.viewCell.totalHeight = clientHeight;
                            notebookEditor.layoutNotebookCell(viewCell, clientHeight);
                        }));
                        this.localDisposables.add(viewCell.onDidChangeState((e) => {
                            if (!e.contentChanged) {
                                return;
                            }
                            this.markdownContainer.innerHTML = '';
                            let renderedHTML = viewCell.getHTML();
                            if (renderedHTML) {
                                this.markdownContainer.appendChild(renderedHTML);
                            }
                        }));
                        const clientHeight = templateData.container.clientHeight;
                        this.viewCell.totalHeight = clientHeight;
                        notebookEditor.layoutNotebookCell(viewCell, clientHeight);
                    }
                }
            };
            this._register(viewCell.onDidChangeState((e) => {
                if (e.editStateChanged) {
                    this.localDisposables.clear();
                    viewUpdate();
                }
            }));
            const updateForFocusMode = () => {
                var _a;
                if (viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                    (_a = this.editor) === null || _a === void 0 ? void 0 : _a.focus();
                }
                dom_1.toggleClass(templateData.container, 'cell-editor-focus', viewCell.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            };
            this._register(viewCell.onDidChangeState((e) => {
                if (!e.focusModeChanged) {
                    return;
                }
                updateForFocusMode();
            }));
            updateForFocusMode();
            this.foldingState = viewCell.foldingState;
            this.setFoldingIndicator();
            this._register(viewCell.onDidChangeState((e) => {
                if (!e.foldingStateChanged) {
                    return;
                }
                const foldingState = viewCell.foldingState;
                if (foldingState !== this.foldingState) {
                    this.foldingState = foldingState;
                    this.setFoldingIndicator();
                }
            }));
            viewUpdate();
        }
        updateEditorOptions(newValue) {
            this.editorOptions = newValue;
            if (this.editor) {
                this.editor.updateOptions(this.editorOptions);
            }
        }
        setFoldingIndicator() {
            switch (this.foldingState) {
                case foldingModel_1.CellFoldingState.None:
                    this.templateData.foldingIndicator.innerHTML = '';
                    break;
                case foldingModel_1.CellFoldingState.Collapsed:
                    this.templateData.foldingIndicator.innerHTML = codicons_1.renderCodicons('$(chevron-right)');
                    break;
                case foldingModel_1.CellFoldingState.Expanded:
                    this.templateData.foldingIndicator.innerHTML = codicons_1.renderCodicons('$(chevron-down)');
                    break;
                default:
                    break;
            }
        }
        bindEditorListeners(model, dimension) {
            this.localDisposables.add(model.onDidChangeContent(() => {
                this.viewCell.setText(model.getLinesContent());
                let clientHeight = this.markdownContainer.clientHeight;
                this.markdownContainer.innerHTML = '';
                let renderedHTML = this.viewCell.getHTML();
                if (renderedHTML) {
                    this.markdownContainer.appendChild(renderedHTML);
                    clientHeight = this.markdownContainer.clientHeight;
                }
                this.viewCell.totalHeight = this.editor.getContentHeight() + 32 + clientHeight + constants_1.CELL_STATUSBAR_HEIGHT;
                this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
            }));
            this.localDisposables.add(this.editor.onDidContentSizeChange(e => {
                let viewLayout = this.editor.getLayoutInfo();
                if (e.contentHeightChanged) {
                    this.editor.layout({
                        width: viewLayout.width,
                        height: e.contentHeight
                    });
                    const clientHeight = this.markdownContainer.clientHeight;
                    this.viewCell.totalHeight = e.contentHeight + 32 + clientHeight;
                    this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
                }
            }));
            this.localDisposables.add(this.editor.onDidChangeCursorSelection((e) => {
                if (e.source === 'restoreState') {
                    // do not reveal the cell into view if this selection change was caused by restoring editors...
                    return;
                }
                const primarySelection = this.editor.getSelection();
                if (primarySelection) {
                    this.notebookEditor.revealLineInView(this.viewCell, primarySelection.positionLineNumber);
                }
            }));
            let cellWidthResizeObserver = sizeObserver_1.getResizesObserver(this.templateData.editorContainer, dimension, () => {
                let newWidth = cellWidthResizeObserver.getWidth();
                let realContentHeight = this.editor.getContentHeight();
                let layoutInfo = this.editor.getLayoutInfo();
                // the dimension generated by the resize observer are float numbers, let's round it a bit to avoid relayout.
                if (newWidth < layoutInfo.width - 0.3 || layoutInfo.width + 0.3 < newWidth) {
                    this.editor.layout({
                        width: newWidth,
                        height: realContentHeight
                    });
                }
            });
            cellWidthResizeObserver.startObserving();
            this.localDisposables.add(cellWidthResizeObserver);
            let markdownRenderer = this.viewCell.getMarkdownRenderer();
            this.markdownContainer.innerHTML = '';
            let renderedHTML = this.viewCell.getHTML();
            if (renderedHTML) {
                this.markdownContainer.appendChild(renderedHTML);
                this.localDisposables.add(markdownRenderer.onDidUpdateRender(() => {
                    const clientHeight = this.markdownContainer.clientHeight;
                    this.viewCell.totalHeight = clientHeight;
                    this.notebookEditor.layoutNotebookCell(this.viewCell, this.viewCell.layoutInfo.totalHeight);
                }));
            }
            const updateFocusMode = () => this.viewCell.focusMode = this.editor.hasWidgetFocus() ? notebookBrowser_1.CellFocusMode.Editor : notebookBrowser_1.CellFocusMode.Container;
            this.localDisposables.add(this.editor.onDidFocusEditorWidget(() => {
                updateFocusMode();
            }));
            this.localDisposables.add(this.editor.onDidBlurEditorWidget(() => {
                updateFocusMode();
            }));
            updateFocusMode();
        }
        dispose() {
            this.viewCell.detachTextEditor();
            super.dispose();
        }
    }
    exports.StatefullMarkdownCell = StatefullMarkdownCell;
});
//# sourceMappingURL=markdownCell.js.map