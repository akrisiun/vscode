/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./codelensWidget"], function (require, exports, dom, codicons_1, strings_1, range_1, textModel_1, editorColorRegistry_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensWidget = exports.CodeLensHelper = void 0;
    class CodeLensViewZone {
        constructor(afterLineNumber, onHeight) {
            this.afterLineNumber = afterLineNumber;
            this._onHeight = onHeight;
            this.heightInLines = 1;
            this.suppressMouseDown = true;
            this.domNode = document.createElement('div');
        }
        onComputedHeight(height) {
            if (this._lastHeight === undefined) {
                this._lastHeight = height;
            }
            else if (this._lastHeight !== height) {
                this._lastHeight = height;
                this._onHeight();
            }
        }
    }
    let CodeLensContentWidget = /** @class */ (() => {
        class CodeLensContentWidget {
            constructor(editor, className, line) {
                // Editor.IContentWidget.allowEditorOverflow
                this.allowEditorOverflow = false;
                this.suppressMouseDown = true;
                this._commands = new Map();
                this._isEmpty = true;
                this._editor = editor;
                this._id = `codelens.widget-${(CodeLensContentWidget._idPool++)}`;
                this.updatePosition(line);
                this._domNode = document.createElement('span');
                this._domNode.className = `codelens-decoration ${className}`;
            }
            withCommands(lenses, animate) {
                this._commands.clear();
                let innerHtml = '';
                let hasSymbol = false;
                for (let i = 0; i < lenses.length; i++) {
                    const lens = lenses[i];
                    if (!lens) {
                        continue;
                    }
                    hasSymbol = true;
                    if (lens.command) {
                        const title = codicons_1.renderCodicons(strings_1.escape(lens.command.title));
                        if (lens.command.id) {
                            innerHtml += `<a id=${i}>${title}</a>`;
                            this._commands.set(String(i), lens.command);
                        }
                        else {
                            innerHtml += `<span>${title}</span>`;
                        }
                        if (i + 1 < lenses.length) {
                            innerHtml += '<span>&#160;|&#160;</span>';
                        }
                    }
                }
                if (!hasSymbol) {
                    // symbols but no commands
                    this._domNode.innerHTML = '<span>no commands</span>';
                }
                else {
                    // symbols and commands
                    if (!innerHtml) {
                        innerHtml = '&#160;';
                    }
                    this._domNode.innerHTML = innerHtml;
                    if (this._isEmpty && animate) {
                        dom.addClass(this._domNode, 'fadein');
                    }
                    this._isEmpty = false;
                }
            }
            getCommand(link) {
                return link.parentElement === this._domNode
                    ? this._commands.get(link.id)
                    : undefined;
            }
            getId() {
                return this._id;
            }
            getDomNode() {
                return this._domNode;
            }
            updatePosition(line) {
                const column = this._editor.getModel().getLineFirstNonWhitespaceColumn(line);
                this._widgetPosition = {
                    position: { lineNumber: line, column: column },
                    preference: [1 /* ABOVE */]
                };
            }
            getPosition() {
                return this._widgetPosition || null;
            }
        }
        CodeLensContentWidget._idPool = 0;
        return CodeLensContentWidget;
    })();
    class CodeLensHelper {
        constructor() {
            this._removeDecorations = [];
            this._addDecorations = [];
            this._addDecorationsCallbacks = [];
        }
        addDecoration(decoration, callback) {
            this._addDecorations.push(decoration);
            this._addDecorationsCallbacks.push(callback);
        }
        removeDecoration(decorationId) {
            this._removeDecorations.push(decorationId);
        }
        commit(changeAccessor) {
            let resultingDecorations = changeAccessor.deltaDecorations(this._removeDecorations, this._addDecorations);
            for (let i = 0, len = resultingDecorations.length; i < len; i++) {
                this._addDecorationsCallbacks[i](resultingDecorations[i]);
            }
        }
    }
    exports.CodeLensHelper = CodeLensHelper;
    class CodeLensWidget {
        constructor(data, editor, className, helper, viewZoneChangeAccessor, updateCallback) {
            this._isDisposed = false;
            this._editor = editor;
            this._className = className;
            this._data = data;
            // create combined range, track all ranges with decorations,
            // check if there is already something to render
            this._decorationIds = [];
            let range;
            let lenses = [];
            this._data.forEach((codeLensData, i) => {
                if (codeLensData.symbol.command) {
                    lenses.push(codeLensData.symbol);
                }
                helper.addDecoration({
                    range: codeLensData.symbol.range,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                }, id => this._decorationIds[i] = id);
                // the range contains all lenses on this line
                if (!range) {
                    range = range_1.Range.lift(codeLensData.symbol.range);
                }
                else {
                    range = range_1.Range.plusRange(range, codeLensData.symbol.range);
                }
            });
            this._viewZone = new CodeLensViewZone(range.startLineNumber - 1, updateCallback);
            this._viewZoneId = viewZoneChangeAccessor.addZone(this._viewZone);
            if (lenses.length > 0) {
                this._createContentWidgetIfNecessary();
                this._contentWidget.withCommands(lenses, false);
            }
        }
        _createContentWidgetIfNecessary() {
            if (!this._contentWidget) {
                this._contentWidget = new CodeLensContentWidget(this._editor, this._className, this._viewZone.afterLineNumber + 1);
                this._editor.addContentWidget(this._contentWidget);
            }
        }
        dispose(helper, viewZoneChangeAccessor) {
            this._decorationIds.forEach(helper.removeDecoration, helper);
            this._decorationIds = [];
            if (viewZoneChangeAccessor) {
                viewZoneChangeAccessor.removeZone(this._viewZoneId);
            }
            if (this._contentWidget) {
                this._editor.removeContentWidget(this._contentWidget);
                this._contentWidget = undefined;
            }
            this._isDisposed = true;
        }
        isDisposed() {
            return this._isDisposed;
        }
        isValid() {
            return this._decorationIds.some((id, i) => {
                const range = this._editor.getModel().getDecorationRange(id);
                const symbol = this._data[i].symbol;
                return !!(range && range_1.Range.isEmpty(symbol.range) === range.isEmpty());
            });
        }
        updateCodeLensSymbols(data, helper) {
            this._decorationIds.forEach(helper.removeDecoration, helper);
            this._decorationIds = [];
            this._data = data;
            this._data.forEach((codeLensData, i) => {
                helper.addDecoration({
                    range: codeLensData.symbol.range,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                }, id => this._decorationIds[i] = id);
            });
        }
        computeIfNecessary(model) {
            if (!this._viewZone.domNode.hasAttribute('monaco-visible-view-zone')) {
                return null;
            }
            // Read editor current state
            for (let i = 0; i < this._decorationIds.length; i++) {
                const range = model.getDecorationRange(this._decorationIds[i]);
                if (range) {
                    this._data[i].symbol.range = range;
                }
            }
            return this._data;
        }
        updateCommands(symbols) {
            this._createContentWidgetIfNecessary();
            this._contentWidget.withCommands(symbols, true);
            for (let i = 0; i < this._data.length; i++) {
                const resolved = symbols[i];
                if (resolved) {
                    const { symbol } = this._data[i];
                    symbol.command = resolved.command || symbol.command;
                }
            }
        }
        getCommand(link) {
            var _a;
            return (_a = this._contentWidget) === null || _a === void 0 ? void 0 : _a.getCommand(link);
        }
        getLineNumber() {
            const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
            if (range) {
                return range.startLineNumber;
            }
            return -1;
        }
        update(viewZoneChangeAccessor) {
            if (this.isValid()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    this._viewZone.afterLineNumber = range.startLineNumber - 1;
                    viewZoneChangeAccessor.layoutZone(this._viewZoneId);
                    if (this._contentWidget) {
                        this._contentWidget.updatePosition(range.startLineNumber);
                        this._editor.layoutContentWidget(this._contentWidget);
                    }
                }
            }
        }
        getItems() {
            return this._data;
        }
    }
    exports.CodeLensWidget = CodeLensWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const codeLensForeground = theme.getColor(editorColorRegistry_1.editorCodeLensForeground);
        if (codeLensForeground) {
            collector.addRule(`.monaco-editor .codelens-decoration { color: ${codeLensForeground}; }`);
            collector.addRule(`.monaco-editor .codelens-decoration .codicon { color: ${codeLensForeground}; }`);
        }
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .codelens-decoration > a:hover { color: ${activeLinkForeground} !important; }`);
            collector.addRule(`.monaco-editor .codelens-decoration > a:hover .codicon { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# sourceMappingURL=codelensWidget.js.map