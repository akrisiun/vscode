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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/editor/common/model", "vs/platform/quickOpen/common/quickOpen", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorBrowser", "vs/base/common/event"], function (require, exports, nls, types, quickOpenModel_1, quickopen_1, model_1, quickOpen_1, editorColorRegistry_1, themeService_1, editorService_1, editorBrowser_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GOTO_LINE_PREFIX = ':';
    let GotoLineAction = class GotoLineAction extends quickopen_1.QuickOpenAction {
        constructor(actionId, actionLabel, _quickOpenService, editorService) {
            super(actionId, actionLabel, exports.GOTO_LINE_PREFIX, _quickOpenService);
            this._quickOpenService = _quickOpenService;
            this.editorService = editorService;
        }
        run() {
            let activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (!activeTextEditorWidget) {
                return Promise.resolve();
            }
            if (editorBrowser_1.isDiffEditor(activeTextEditorWidget)) {
                activeTextEditorWidget = activeTextEditorWidget.getModifiedEditor();
            }
            let restoreOptions = null;
            if (editorBrowser_1.isCodeEditor(activeTextEditorWidget)) {
                const options = activeTextEditorWidget.getOptions();
                const lineNumbers = options.get(47 /* lineNumbers */);
                if (lineNumbers.renderType === 2 /* Relative */) {
                    activeTextEditorWidget.updateOptions({
                        lineNumbers: 'on'
                    });
                    restoreOptions = {
                        lineNumbers: 'relative'
                    };
                }
            }
            const result = super.run();
            if (restoreOptions) {
                event_1.Event.once(this._quickOpenService.onHide)(() => {
                    activeTextEditorWidget.updateOptions(restoreOptions);
                });
            }
            return result;
        }
    };
    GotoLineAction.ID = 'workbench.action.gotoLine';
    GotoLineAction.LABEL = nls.localize('gotoLine', "Go to Line...");
    GotoLineAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, editorService_1.IEditorService)
    ], GotoLineAction);
    exports.GotoLineAction = GotoLineAction;
    class GotoLineEntry extends quickopen_1.EditorQuickOpenEntry {
        constructor(line, editorService, handler) {
            super(editorService);
            this.parseInput(line);
            this.handler = handler;
        }
        parseInput(line) {
            const numbers = line.split(/,|:|#/).map(part => parseInt(part, 10)).filter(part => !isNaN(part));
            const endLine = this.getMaxLineNumber() + 1;
            this.column = numbers[1];
            this.line = numbers[0] > 0 ? numbers[0] : endLine + numbers[0];
        }
        getLabel() {
            // Inform user about valid range if input is invalid
            const maxLineNumber = this.getMaxLineNumber();
            if (this.editorService.activeTextEditorWidget && this.invalidRange(maxLineNumber)) {
                const position = this.editorService.activeTextEditorWidget.getPosition();
                if (position) {
                    if (maxLineNumber > 0) {
                        return nls.localize('gotoLineLabelEmptyWithLimit', "Current Line: {0}, Column: {1}. Type a line number between 1 and {2} to navigate to.", position.lineNumber, position.column, maxLineNumber);
                    }
                    return nls.localize('gotoLineLabelEmpty', "Current Line: {0}, Column: {1}. Type a line number to navigate to.", position.lineNumber, position.column);
                }
            }
            // Input valid, indicate action
            return this.column ? nls.localize('gotoLineColumnLabel', "Go to line {0} and column {1}.", this.line, this.column) : nls.localize('gotoLineLabel', "Go to line {0}.", this.line);
        }
        invalidRange(maxLineNumber = this.getMaxLineNumber()) {
            return !this.line || !types.isNumber(this.line) || (maxLineNumber > 0 && types.isNumber(this.line) && this.line > maxLineNumber) || this.line < 0;
        }
        getMaxLineNumber() {
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (!activeTextEditorWidget) {
                return -1;
            }
            let model = activeTextEditorWidget.getModel();
            if (model && model.modified && model.original) {
                model = model.modified; // Support for diff editor models
            }
            return model && types.isFunction(model.getLineCount) ? model.getLineCount() : -1;
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen(context);
            }
            return this.runPreview();
        }
        getInput() {
            return this.editorService.activeEditor;
        }
        getOptions(pinned) {
            return {
                selection: this.toSelection(),
                pinned
            };
        }
        runOpen(context) {
            // No-op if range is not valid
            if (this.invalidRange()) {
                return false;
            }
            // Check for sideBySide use
            const sideBySide = context.keymods.ctrlCmd;
            if (sideBySide) {
                this.editorService.openEditor(this.getInput(), this.getOptions(context.keymods.alt), editorService_1.SIDE_GROUP);
            }
            // Apply selection and focus
            const range = this.toSelection();
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                activeTextEditorWidget.setSelection(range);
                activeTextEditorWidget.revealRangeInCenter(range, 0 /* Smooth */);
            }
            return true;
        }
        runPreview() {
            // No-op if range is not valid
            if (this.invalidRange()) {
                this.handler.clearDecorations();
                return false;
            }
            // Select Line Position
            const range = this.toSelection();
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (activeTextEditorWidget) {
                activeTextEditorWidget.revealRangeInCenter(range, 0 /* Smooth */);
                // Decorate if possible
                if (this.editorService.activeControl && types.isFunction(activeTextEditorWidget.changeDecorations)) {
                    this.handler.decorateOutline(range, activeTextEditorWidget, this.editorService.activeControl.group);
                }
            }
            return false;
        }
        toSelection() {
            return {
                startLineNumber: this.line,
                startColumn: this.column || 1,
                endLineNumber: this.line,
                endColumn: this.column || 1
            };
        }
    }
    let GotoLineHandler = class GotoLineHandler extends quickopen_1.QuickOpenHandler {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this.rangeHighlightDecorationId = null;
            this.lastKnownEditorViewState = null;
        }
        getAriaLabel() {
            if (this.editorService.activeTextEditorWidget) {
                const position = this.editorService.activeTextEditorWidget.getPosition();
                if (position) {
                    return nls.localize('gotoLineLabelEmpty', "Current Line: {0}, Column: {1}. Type a line number to navigate to.", position.lineNumber, position.column);
                }
            }
            return nls.localize('cannotRunGotoLine', "Open a text file first to go to a line.");
        }
        getResults(searchValue, token) {
            searchValue = searchValue.trim();
            // Remember view state to be able to restore on cancel
            if (!this.lastKnownEditorViewState) {
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                if (activeTextEditorWidget) {
                    this.lastKnownEditorViewState = activeTextEditorWidget.saveViewState();
                }
            }
            return Promise.resolve(new quickOpenModel_1.QuickOpenModel([new GotoLineEntry(searchValue, this.editorService, this)]));
        }
        canRun() {
            const canRun = !!this.editorService.activeTextEditorWidget;
            return canRun ? true : nls.localize('cannotRunGotoLine', "Open a text file first to go to a line.");
        }
        decorateOutline(range, editor, group) {
            editor.changeDecorations(changeAccessor => {
                const deleteDecorations = [];
                if (this.rangeHighlightDecorationId) {
                    deleteDecorations.push(this.rangeHighlightDecorationId.lineDecorationId);
                    deleteDecorations.push(this.rangeHighlightDecorationId.rangeHighlightId);
                    this.rangeHighlightDecorationId = null;
                }
                const newDecorations = [
                    // rangeHighlight at index 0
                    {
                        range: range,
                        options: {
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    // lineDecoration at index 1
                    {
                        range: range,
                        options: {
                            overviewRuler: {
                                color: themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                const decorations = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                const rangeHighlightId = decorations[0];
                const lineDecorationId = decorations[1];
                this.rangeHighlightDecorationId = {
                    groupId: group.id,
                    rangeHighlightId: rangeHighlightId,
                    lineDecorationId: lineDecorationId,
                };
            });
        }
        clearDecorations() {
            const rangeHighlightDecorationId = this.rangeHighlightDecorationId;
            if (rangeHighlightDecorationId) {
                this.editorService.visibleControls.forEach(editor => {
                    if (editor.group && editor.group.id === rangeHighlightDecorationId.groupId) {
                        const editorControl = editor.getControl();
                        editorControl.changeDecorations(changeAccessor => {
                            changeAccessor.deltaDecorations([
                                rangeHighlightDecorationId.lineDecorationId,
                                rangeHighlightDecorationId.rangeHighlightId
                            ], []);
                        });
                    }
                });
                this.rangeHighlightDecorationId = null;
            }
        }
        onClose(canceled) {
            // Clear Highlight Decorations if present
            this.clearDecorations();
            // Restore selection if canceled
            if (canceled && this.lastKnownEditorViewState) {
                const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
                if (activeTextEditorWidget) {
                    activeTextEditorWidget.restoreViewState(this.lastKnownEditorViewState);
                }
            }
            this.lastKnownEditorViewState = null;
        }
        getAutoFocus(searchValue) {
            return {
                autoFocusFirstEntry: searchValue.trim().length > 0
            };
        }
    };
    GotoLineHandler.ID = 'workbench.picker.line';
    GotoLineHandler = __decorate([
        __param(0, editorService_1.IEditorService)
    ], GotoLineHandler);
    exports.GotoLineHandler = GotoLineHandler;
});
//# sourceMappingURL=gotoLineHandler.js.map