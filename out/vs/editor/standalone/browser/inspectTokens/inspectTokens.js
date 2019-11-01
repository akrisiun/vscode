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
define(["require", "exports", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/modes/nullMode", "vs/editor/common/services/modeService", "vs/editor/standalone/common/standaloneThemeService", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/standaloneStrings", "vs/css!./inspectTokens"], function (require, exports, color_1, lifecycle_1, strings_1, editorExtensions_1, modes_1, nullMode_1, modeService_1, standaloneThemeService_1, colorRegistry_1, themeService_1, standaloneStrings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectTokensController = class InspectTokensController extends lifecycle_1.Disposable {
        constructor(editor, standaloneColorService, modeService) {
            super();
            this._editor = editor;
            this._modeService = modeService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(modes_1.TokenizationRegistry.onDidChange((e) => this.stop()));
        }
        static get(editor) {
            return editor.getContribution(InspectTokensController.ID);
        }
        getId() {
            return InspectTokensController.ID;
        }
        dispose() {
            this.stop();
            super.dispose();
        }
        launch() {
            if (this._widget) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            this._widget = new InspectTokensWidget(this._editor, this._modeService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
    };
    InspectTokensController.ID = 'editor.contrib.inspectTokens';
    InspectTokensController = __decorate([
        __param(1, standaloneThemeService_1.IStandaloneThemeService),
        __param(2, modeService_1.IModeService)
    ], InspectTokensController);
    class InspectTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTokens',
                label: standaloneStrings_1.InspectTokensNLS.inspectTokensAction,
                alias: 'Developer: Inspect Tokens',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            let controller = InspectTokensController.get(editor);
            if (controller) {
                controller.launch();
            }
        }
    }
    function renderTokenText(tokenText) {
        let result = '';
        for (let charIndex = 0, len = tokenText.length; charIndex < len; charIndex++) {
            let charCode = tokenText.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* Tab */:
                    result += '&rarr;';
                    break;
                case 32 /* Space */:
                    result += '&middot;';
                    break;
                case 60 /* LessThan */:
                    result += '&lt;';
                    break;
                case 62 /* GreaterThan */:
                    result += '&gt;';
                    break;
                case 38 /* Ampersand */:
                    result += '&amp;';
                    break;
                default:
                    result += String.fromCharCode(charCode);
            }
        }
        return result;
    }
    function getSafeTokenizationSupport(languageIdentifier) {
        let tokenizationSupport = modes_1.TokenizationRegistry.get(languageIdentifier.language);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        return {
            getInitialState: () => nullMode_1.NULL_STATE,
            tokenize: (line, state, deltaOffset) => nullMode_1.nullTokenize(languageIdentifier.language, line, state, deltaOffset),
            tokenize2: (line, state, deltaOffset) => nullMode_1.nullTokenize2(languageIdentifier.id, line, state, deltaOffset)
        };
    }
    class InspectTokensWidget extends lifecycle_1.Disposable {
        constructor(editor, modeService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._editor = editor;
            this._modeService = modeService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'tokens-inspect-widget';
            this._tokenizationSupport = getSafeTokenizationSupport(this._model.getLanguageIdentifier());
            this._compute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._compute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        getId() {
            return InspectTokensWidget._ID;
        }
        _compute(position) {
            let data = this._getTokensAtLine(position.lineNumber);
            let token1Index = 0;
            for (let i = data.tokens1.length - 1; i >= 0; i--) {
                let t = data.tokens1[i];
                if (position.column - 1 >= t.offset) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (data.tokens2.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= data.tokens2[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            let result = '';
            let lineContent = this._model.getLineContent(position.lineNumber);
            let tokenText = '';
            if (token1Index < data.tokens1.length) {
                let tokenStartIndex = data.tokens1[token1Index].offset;
                let tokenEndIndex = token1Index + 1 < data.tokens1.length ? data.tokens1[token1Index + 1].offset : lineContent.length;
                tokenText = lineContent.substring(tokenStartIndex, tokenEndIndex);
            }
            result += `<h2 class="tm-token">${renderTokenText(tokenText)}<span class="tm-token-length">(${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'})</span></h2>`;
            result += `<hr class="tokens-inspect-separator" style="clear:both"/>`;
            let metadata = this._decodeMetadata(data.tokens2[(token2Index << 1) + 1]);
            result += `<table class="tm-metadata-table"><tbody>`;
            result += `<tr><td class="tm-metadata-key">language</td><td class="tm-metadata-value">${strings_1.escape(metadata.languageIdentifier.language)}</td>`;
            result += `<tr><td class="tm-metadata-key">token type</td><td class="tm-metadata-value">${this._tokenTypeToString(metadata.tokenType)}</td>`;
            result += `<tr><td class="tm-metadata-key">font style</td><td class="tm-metadata-value">${this._fontStyleToString(metadata.fontStyle)}</td>`;
            result += `<tr><td class="tm-metadata-key">foreground</td><td class="tm-metadata-value">${color_1.Color.Format.CSS.formatHex(metadata.foreground)}</td>`;
            result += `<tr><td class="tm-metadata-key">background</td><td class="tm-metadata-value">${color_1.Color.Format.CSS.formatHex(metadata.background)}</td>`;
            result += `</tbody></table>`;
            result += `<hr class="tokens-inspect-separator"/>`;
            if (token1Index < data.tokens1.length) {
                result += `<span class="tm-token-type">${strings_1.escape(data.tokens1[token1Index].type)}</span>`;
            }
            this._domNode.innerHTML = result;
            this._editor.layoutContentWidget(this);
        }
        _decodeMetadata(metadata) {
            let colorMap = modes_1.TokenizationRegistry.getColorMap();
            let languageId = modes_1.TokenMetadata.getLanguageId(metadata);
            let tokenType = modes_1.TokenMetadata.getTokenType(metadata);
            let fontStyle = modes_1.TokenMetadata.getFontStyle(metadata);
            let foreground = modes_1.TokenMetadata.getForeground(metadata);
            let background = modes_1.TokenMetadata.getBackground(metadata);
            return {
                languageIdentifier: this._modeService.getLanguageIdentifier(languageId),
                tokenType: tokenType,
                fontStyle: fontStyle,
                foreground: colorMap[foreground],
                background: colorMap[background]
            };
        }
        _tokenTypeToString(tokenType) {
            switch (tokenType) {
                case 0 /* Other */: return 'Other';
                case 1 /* Comment */: return 'Comment';
                case 2 /* String */: return 'String';
                case 4 /* RegEx */: return 'RegEx';
            }
            return '??';
        }
        _fontStyleToString(fontStyle) {
            let r = '';
            if (fontStyle & 1 /* Italic */) {
                r += 'italic ';
            }
            if (fontStyle & 2 /* Bold */) {
                r += 'bold ';
            }
            if (fontStyle & 4 /* Underline */) {
                r += 'underline ';
            }
            if (r.length === 0) {
                r = '---';
            }
            return r;
        }
        _getTokensAtLine(lineNumber) {
            let stateBeforeLine = this._getStateBeforeLine(lineNumber);
            let tokenizationResult1 = this._tokenizationSupport.tokenize(this._model.getLineContent(lineNumber), stateBeforeLine, 0);
            let tokenizationResult2 = this._tokenizationSupport.tokenize2(this._model.getLineContent(lineNumber), stateBeforeLine, 0);
            return {
                startState: stateBeforeLine,
                tokens1: tokenizationResult1.tokens,
                tokens2: tokenizationResult2.tokens,
                endState: tokenizationResult1.endState
            };
        }
        _getStateBeforeLine(lineNumber) {
            let state = this._tokenizationSupport.getInitialState();
            for (let i = 1; i < lineNumber; i++) {
                let tokenizationResult = this._tokenizationSupport.tokenize(this._model.getLineContent(i), state, 0);
                state = tokenizationResult.endState;
            }
            return state;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._editor.getPosition(),
                preference: [2 /* BELOW */, 1 /* ABOVE */]
            };
        }
    }
    InspectTokensWidget._ID = 'editor.contrib.inspectTokensWidget';
    editorExtensions_1.registerEditorContribution(InspectTokensController);
    editorExtensions_1.registerEditorAction(InspectTokens);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (border) {
            let borderWidth = theme.type === themeService_1.HIGH_CONTRAST ? 2 : 1;
            collector.addRule(`.monaco-editor .tokens-inspect-widget { border: ${borderWidth}px solid ${border}; }`);
            collector.addRule(`.monaco-editor .tokens-inspect-widget .tokens-inspect-separator { background-color: ${border}; }`);
        }
        const background = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (background) {
            collector.addRule(`.monaco-editor .tokens-inspect-widget { background-color: ${background}; }`);
        }
    });
});
//# sourceMappingURL=inspectTokens.js.map