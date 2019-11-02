/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/browser/ui/codiconLabel/codiconLabel", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./codelensWidget"], function (require, exports, dom, arrays_1, codiconLabel_1, range_1, textModel_1, editorColorRegistry_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    class CodeLensContentWidget {
        constructor(editor, symbolRange, data) {
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = false;
            this.suppressMouseDown = true;
            this._commands = new Map();
            this._id = 'codeLensWidget' + (++CodeLensContentWidget._idPool);
            this._editor = editor;
            this.setSymbolRange(symbolRange);
            this._domNode = document.createElement('span');
            this._domNode.innerHTML = '&nbsp;';
            dom.addClass(this._domNode, 'codelens-decoration');
            this.updateHeight();
            this.withCommands(data.map(data => data.symbol), false);
        }
        updateHeight() {
            const options = this._editor.getOptions();
            const fontInfo = options.get(31 /* fontInfo */);
            const lineHeight = options.get(46 /* lineHeight */);
            this._domNode.style.height = `${Math.round(lineHeight * 1.1)}px`;
            this._domNode.style.lineHeight = `${lineHeight}px`;
            this._domNode.style.fontSize = `${Math.round(fontInfo.fontSize * 0.9)}px`;
            this._domNode.style.paddingRight = `${Math.round(fontInfo.fontSize * 0.45)}px`;
            this._domNode.innerHTML = '&nbsp;';
        }
        withCommands(inSymbols, animate) {
            this._commands.clear();
            const symbols = arrays_1.coalesce(inSymbols);
            if (arrays_1.isFalsyOrEmpty(symbols)) {
                this._domNode.innerHTML = '<span>no commands</span>';
                return;
            }
            let html = [];
            for (let i = 0; i < symbols.length; i++) {
                const command = symbols[i].command;
                if (command) {
                    const title = codiconLabel_1.renderCodicons(command.title);
                    let part;
                    if (command.id) {
                        part = `<a id=${i}>${title}</a>`;
                        this._commands.set(String(i), command);
                    }
                    else {
                        part = `<span>${title}</span>`;
                    }
                    html.push(part);
                }
            }
            const wasEmpty = this._domNode.innerHTML === '' || this._domNode.innerHTML === '&nbsp;';
            this._domNode.innerHTML = html.join('<span>&nbsp;|&nbsp;</span>');
            this._editor.layoutContentWidget(this);
            if (wasEmpty && animate) {
                dom.addClass(this._domNode, 'fadein');
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
        setSymbolRange(range) {
            if (!this._editor.hasModel()) {
                return;
            }
            const lineNumber = range.startLineNumber;
            const column = this._editor.getModel().getLineFirstNonWhitespaceColumn(lineNumber);
            this._widgetPosition = {
                position: { lineNumber: lineNumber, column: column },
                preference: [1 /* ABOVE */]
            };
        }
        getPosition() {
            return this._widgetPosition || null;
        }
        isVisible() {
            return this._domNode.hasAttribute('monaco-visible-content-widget');
        }
    }
    CodeLensContentWidget._idPool = 0;
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
        constructor(data, editor, helper, viewZoneChangeAccessor, updateCallback) {
            this._editor = editor;
            this._data = data;
            this._decorationIds = new Array(this._data.length);
            let range;
            this._data.forEach((codeLensData, i) => {
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
            if (range) {
                this._contentWidget = new CodeLensContentWidget(editor, range, this._data);
                this._viewZone = new CodeLensViewZone(range.startLineNumber - 1, updateCallback);
                this._viewZoneId = viewZoneChangeAccessor.addZone(this._viewZone);
                this._editor.addContentWidget(this._contentWidget);
            }
        }
        dispose(helper, viewZoneChangeAccessor) {
            while (this._decorationIds.length) {
                helper.removeDecoration(this._decorationIds.pop());
            }
            if (viewZoneChangeAccessor) {
                viewZoneChangeAccessor.removeZone(this._viewZoneId);
            }
            this._editor.removeContentWidget(this._contentWidget);
        }
        isValid() {
            if (!this._editor.hasModel()) {
                return false;
            }
            const model = this._editor.getModel();
            return this._decorationIds.some((id, i) => {
                const range = model.getDecorationRange(id);
                const symbol = this._data[i].symbol;
                return !!(range && range_1.Range.isEmpty(symbol.range) === range.isEmpty());
            });
        }
        updateCodeLensSymbols(data, helper) {
            while (this._decorationIds.length) {
                helper.removeDecoration(this._decorationIds.pop());
            }
            this._data = data;
            this._decorationIds = new Array(this._data.length);
            this._data.forEach((codeLensData, i) => {
                helper.addDecoration({
                    range: codeLensData.symbol.range,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                }, id => this._decorationIds[i] = id);
            });
        }
        computeIfNecessary(model) {
            if (!this._contentWidget.isVisible()) {
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
            this._contentWidget.withCommands(symbols, true);
            for (let i = 0; i < this._data.length; i++) {
                const resolved = symbols[i];
                if (resolved) {
                    const { symbol } = this._data[i];
                    symbol.command = resolved.command || symbol.command;
                }
            }
        }
        updateHeight() {
            this._contentWidget.updateHeight();
        }
        getCommand(link) {
            return this._contentWidget.getCommand(link);
        }
        getLineNumber() {
            if (this._editor.hasModel()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    return range.startLineNumber;
                }
            }
            return -1;
        }
        update(viewZoneChangeAccessor) {
            if (this.isValid() && this._editor.hasModel()) {
                const range = this._editor.getModel().getDecorationRange(this._decorationIds[0]);
                if (range) {
                    this._viewZone.afterLineNumber = range.startLineNumber - 1;
                    viewZoneChangeAccessor.layoutZone(this._viewZoneId);
                    this._contentWidget.setSymbolRange(range);
                    this._editor.layoutContentWidget(this._contentWidget);
                }
            }
        }
    }
    exports.CodeLensWidget = CodeLensWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const codeLensForeground = theme.getColor(editorColorRegistry_1.editorCodeLensForeground);
        if (codeLensForeground) {
            collector.addRule(`.monaco-editor .codelens-decoration { color: ${codeLensForeground}; }`);
        }
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .codelens-decoration > a:hover { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# sourceMappingURL=codelensWidget.js.map