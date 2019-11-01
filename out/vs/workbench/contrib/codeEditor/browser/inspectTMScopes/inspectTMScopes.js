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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/services/modeService", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/services/textMate/common/TMHelper", "vs/workbench/services/textMate/common/textMateService", "vs/workbench/services/themes/common/workbenchThemeService", "vs/css!./inspectTMScopes"], function (require, exports, nls, dom, color_1, lifecycle_1, strings_1, editorExtensions_1, modes_1, modeService_1, notification_1, colorRegistry_1, themeService_1, TMHelper_1, textMateService_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectTMScopesController = class InspectTMScopesController extends lifecycle_1.Disposable {
        constructor(editor, textMateService, modeService, themeService, notificationService) {
            super();
            this._editor = editor;
            this._textMateService = textMateService;
            this._themeService = themeService;
            this._modeService = modeService;
            this._notificationService = notificationService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(this._editor.onKeyUp((e) => e.keyCode === 9 /* Escape */ && this.stop()));
        }
        static get(editor) {
            return editor.getContribution(InspectTMScopesController.ID);
        }
        getId() {
            return InspectTMScopesController.ID;
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
            this._widget = new InspectTMScopesWidget(this._editor, this._textMateService, this._modeService, this._themeService, this._notificationService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
        toggle() {
            if (!this._widget) {
                this.launch();
            }
            else {
                this.stop();
            }
        }
    };
    InspectTMScopesController.ID = 'editor.contrib.inspectTMScopes';
    InspectTMScopesController = __decorate([
        __param(1, textMateService_1.ITextMateService),
        __param(2, modeService_1.IModeService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, notification_1.INotificationService)
    ], InspectTMScopesController);
    class InspectTMScopes extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTMScopes',
                label: nls.localize('inspectTMScopes', "Developer: Inspect TM Scopes"),
                alias: 'Developer: Inspect TM Scopes',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            let controller = InspectTMScopesController.get(editor);
            if (controller) {
                controller.toggle();
            }
        }
    }
    function renderTokenText(tokenText) {
        if (tokenText.length > 40) {
            tokenText = tokenText.substr(0, 20) + '…' + tokenText.substr(tokenText.length - 20);
        }
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
    class InspectTMScopesWidget extends lifecycle_1.Disposable {
        constructor(editor, textMateService, modeService, themeService, notificationService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._isDisposed = false;
            this._editor = editor;
            this._modeService = modeService;
            this._themeService = themeService;
            this._notificationService = notificationService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'tm-inspect-widget';
            this._grammar = textMateService.createGrammar(this._model.getLanguageIdentifier().language);
            this._beginCompute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._beginCompute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._isDisposed = true;
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        getId() {
            return InspectTMScopesWidget._ID;
        }
        _beginCompute(position) {
            dom.clearNode(this._domNode);
            this._domNode.appendChild(document.createTextNode(nls.localize('inspectTMScopesWidget.loading', "Loading...")));
            this._grammar.then((grammar) => this._compute(grammar, position), (err) => {
                this._notificationService.warn(err);
                setTimeout(() => {
                    InspectTMScopesController.get(this._editor).stop();
                });
            });
        }
        _compute(grammar, position) {
            if (this._isDisposed) {
                return;
            }
            let data = this._getTokensAtLine(grammar, position.lineNumber);
            let token1Index = 0;
            for (let i = data.tokens1.length - 1; i >= 0; i--) {
                let t = data.tokens1[i];
                if (position.column - 1 >= t.startIndex) {
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
            let tokenStartIndex = data.tokens1[token1Index].startIndex;
            let tokenEndIndex = data.tokens1[token1Index].endIndex;
            let tokenText = this._model.getLineContent(position.lineNumber).substring(tokenStartIndex, tokenEndIndex);
            result += `<h2 class="tm-token">${renderTokenText(tokenText)}<span class="tm-token-length">(${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'})</span></h2>`;
            result += `<hr class="tm-metadata-separator" style="clear:both"/>`;
            let metadata = this._decodeMetadata(data.tokens2[(token2Index << 1) + 1]);
            result += `<table class="tm-metadata-table"><tbody>`;
            result += `<tr><td class="tm-metadata-key">language</td><td class="tm-metadata-value">${strings_1.escape(metadata.languageIdentifier.language)}</td></tr>`;
            result += `<tr><td class="tm-metadata-key">token type</td><td class="tm-metadata-value">${this._tokenTypeToString(metadata.tokenType)}</td></tr>`;
            result += `<tr><td class="tm-metadata-key">font style</td><td class="tm-metadata-value">${this._fontStyleToString(metadata.fontStyle)}</td></tr>`;
            result += `<tr><td class="tm-metadata-key">foreground</td><td class="tm-metadata-value">${color_1.Color.Format.CSS.formatHexA(metadata.foreground)}</td></tr>`;
            result += `<tr><td class="tm-metadata-key">background</td><td class="tm-metadata-value">${color_1.Color.Format.CSS.formatHexA(metadata.background)}</td></tr>`;
            if (metadata.background.isOpaque() && metadata.foreground.isOpaque()) {
                result += `<tr><td class="tm-metadata-key">contrast ratio</td><td class="tm-metadata-value">${metadata.background.getContrastRatio(metadata.foreground).toFixed(2)}</td></tr>`;
            }
            else {
                result += '<tr><td class="tm-metadata-key">Contrast ratio cannot be precise for colors that use transparency</td><td class="tm-metadata-value"></td></tr>';
            }
            result += `</tbody></table>`;
            let theme = this._themeService.getColorTheme();
            result += `<hr class="tm-metadata-separator"/>`;
            let matchingRule = TMHelper_1.findMatchingThemeRule(theme, data.tokens1[token1Index].scopes, false);
            if (matchingRule) {
                result += `<code class="tm-theme-selector">${matchingRule.rawSelector}\n${JSON.stringify(matchingRule.settings, null, '\t')}</code>`;
            }
            else {
                result += `<span class="tm-theme-selector">No theme selector.</span>`;
            }
            result += `<hr class="tm-metadata-separator"/>`;
            result += `<ul>`;
            for (let i = data.tokens1[token1Index].scopes.length - 1; i >= 0; i--) {
                result += `<li>${strings_1.escape(data.tokens1[token1Index].scopes[i])}</li>`;
            }
            result += `</ul>`;
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
        _getTokensAtLine(grammar, lineNumber) {
            let stateBeforeLine = this._getStateBeforeLine(grammar, lineNumber);
            let tokenizationResult1 = grammar.tokenizeLine(this._model.getLineContent(lineNumber), stateBeforeLine);
            let tokenizationResult2 = grammar.tokenizeLine2(this._model.getLineContent(lineNumber), stateBeforeLine);
            return {
                startState: stateBeforeLine,
                tokens1: tokenizationResult1.tokens,
                tokens2: tokenizationResult2.tokens,
                endState: tokenizationResult1.ruleStack
            };
        }
        _getStateBeforeLine(grammar, lineNumber) {
            let state = null;
            for (let i = 1; i < lineNumber; i++) {
                let tokenizationResult = grammar.tokenizeLine(this._model.getLineContent(i), state);
                state = tokenizationResult.ruleStack;
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
    InspectTMScopesWidget._ID = 'editor.contrib.inspectTMScopesWidget';
    editorExtensions_1.registerEditorContribution(InspectTMScopesController);
    editorExtensions_1.registerEditorAction(InspectTMScopes);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (border) {
            let borderWidth = theme.type === themeService_1.HIGH_CONTRAST ? 2 : 1;
            collector.addRule(`.monaco-editor .tm-inspect-widget { border: ${borderWidth}px solid ${border}; }`);
            collector.addRule(`.monaco-editor .tm-inspect-widget .tm-metadata-separator { background-color: ${border}; }`);
        }
        const background = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (background) {
            collector.addRule(`.monaco-editor .tm-inspect-widget { background-color: ${background}; }`);
        }
    });
});
//# sourceMappingURL=inspectTMScopes.js.map