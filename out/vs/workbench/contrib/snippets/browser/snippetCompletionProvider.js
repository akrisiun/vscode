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
define(["require", "exports", "vs/base/common/htmlContent", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/services/modeService", "vs/editor/contrib/snippet/snippetParser", "vs/nls", "vs/workbench/contrib/snippets/browser/snippets.contribution", "vs/base/common/filters"], function (require, exports, htmlContent_1, strings_1, range_1, modeService_1, snippetParser_1, nls_1, snippets_contribution_1, filters_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SnippetCompletion {
        constructor(snippet, range) {
            this.snippet = snippet;
            this.label = snippet.prefix;
            this.detail = nls_1.localize('detail.snippet', "{0} ({1})", snippet.description || snippet.name, snippet.source);
            this.insertText = snippet.codeSnippet;
            this.range = range;
            this.sortText = `${snippet.snippetSource === 3 /* Extension */ ? 'z' : 'a'}-${snippet.prefix}`;
            this.kind = 25 /* Snippet */;
            this.insertTextRules = 4 /* InsertAsSnippet */;
        }
        resolve() {
            this.documentation = new htmlContent_1.MarkdownString().appendCodeblock('', new snippetParser_1.SnippetParser().text(this.snippet.codeSnippet));
            return this;
        }
        static compareByLabel(a, b) {
            return strings_1.compare(a.label, b.label);
        }
    }
    exports.SnippetCompletion = SnippetCompletion;
    let SnippetCompletionProvider = class SnippetCompletionProvider {
        constructor(_modeService, _snippets) {
            this._modeService = _modeService;
            this._snippets = _snippets;
            this._debugDisplayName = 'snippetCompletions';
            //
        }
        provideCompletionItems(model, position, context) {
            if (position.column >= SnippetCompletionProvider._maxPrefix) {
                return undefined;
            }
            if (context.triggerKind === 1 /* TriggerCharacter */ && context.triggerCharacter === ' ') {
                // no snippets when suggestions have been triggered by space
                return undefined;
            }
            const languageId = this._getLanguageIdAtPosition(model, position);
            return this._snippets.getSnippets(languageId).then(snippets => {
                let suggestions;
                let pos = { lineNumber: position.lineNumber, column: 1 };
                let lineOffsets = [];
                let linePrefixLow = model.getLineContent(position.lineNumber).substr(0, position.column - 1).toLowerCase();
                let endsInWhitespace = linePrefixLow.match(/\s$/);
                while (pos.column < position.column) {
                    let word = model.getWordAtPosition(pos);
                    if (word) {
                        // at a word
                        lineOffsets.push(word.startColumn - 1);
                        pos.column = word.endColumn + 1;
                        if (word.endColumn - 1 < linePrefixLow.length && !/\s/.test(linePrefixLow[word.endColumn - 1])) {
                            lineOffsets.push(word.endColumn - 1);
                        }
                    }
                    else if (!/\s/.test(linePrefixLow[pos.column - 1])) {
                        // at a none-whitespace character
                        lineOffsets.push(pos.column - 1);
                        pos.column += 1;
                    }
                    else {
                        // always advance!
                        pos.column += 1;
                    }
                }
                let availableSnippets = new Set();
                snippets.forEach(availableSnippets.add, availableSnippets);
                suggestions = [];
                for (let start of lineOffsets) {
                    availableSnippets.forEach(snippet => {
                        if (filters_1.isPatternInWord(linePrefixLow, start, linePrefixLow.length, snippet.prefixLow, 0, snippet.prefixLow.length)) {
                            suggestions.push(new SnippetCompletion(snippet, range_1.Range.fromPositions(position.delta(0, -(linePrefixLow.length - start)), position)));
                            availableSnippets.delete(snippet);
                        }
                    });
                }
                if (endsInWhitespace || lineOffsets.length === 0) {
                    // add remaing snippets when the current prefix ends in whitespace or when no
                    // interesting positions have been found
                    availableSnippets.forEach(snippet => {
                        suggestions.push(new SnippetCompletion(snippet, range_1.Range.fromPositions(position)));
                    });
                }
                // dismbiguate suggestions with same labels
                suggestions.sort(SnippetCompletion.compareByLabel);
                for (let i = 0; i < suggestions.length; i++) {
                    let item = suggestions[i];
                    let to = i + 1;
                    for (; to < suggestions.length && item.label === suggestions[to].label; to++) {
                        suggestions[to].label = nls_1.localize('snippetSuggest.longLabel', "{0}, {1}", suggestions[to].label, suggestions[to].snippet.name);
                    }
                    if (to > i + 1) {
                        suggestions[i].label = nls_1.localize('snippetSuggest.longLabel', "{0}, {1}", suggestions[i].label, suggestions[i].snippet.name);
                        i = to;
                    }
                }
                return { suggestions };
            });
        }
        resolveCompletionItem(model, position, item) {
            return (item instanceof SnippetCompletion) ? item.resolve() : item;
        }
        _getLanguageIdAtPosition(model, position) {
            // validate the `languageId` to ensure this is a user
            // facing language with a name and the chance to have
            // snippets, else fall back to the outer language
            model.tokenizeIfCheap(position.lineNumber);
            let languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (languageIdentifier && !this._modeService.getLanguageName(languageIdentifier.language)) {
                languageId = model.getLanguageIdentifier().id;
            }
            return languageId;
        }
    };
    SnippetCompletionProvider._maxPrefix = 10000;
    SnippetCompletionProvider = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, snippets_contribution_1.ISnippetsService)
    ], SnippetCompletionProvider);
    exports.SnippetCompletionProvider = SnippetCompletionProvider;
});
//# sourceMappingURL=snippetCompletionProvider.js.map