/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/objects", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/common/core/position", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/editor/common/core/range", "vs/base/common/filters", "vs/base/common/lifecycle"], function (require, exports, async_1, objects_1, errors_1, editorExtensions_1, modes, position_1, contextkey_1, cancellation_1, range_1, filters_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Context = {
        Visible: new contextkey_1.RawContextKey('suggestWidgetVisible', false),
        MultipleSuggestions: new contextkey_1.RawContextKey('suggestWidgetMultipleSuggestions', false),
        MakesTextEdit: new contextkey_1.RawContextKey('suggestionMakesTextEdit', true),
        AcceptSuggestionsOnEnter: new contextkey_1.RawContextKey('acceptSuggestionOnEnter', true)
    };
    class CompletionItem {
        constructor(position, completion, container, provider, model) {
            this.position = position;
            this.completion = completion;
            this.container = container;
            this.provider = provider;
            // sorting, filtering
            this.score = filters_1.FuzzyScore.Default;
            this.distance = 0;
            // ensure lower-variants (perf)
            this.labelLow = completion.label.toLowerCase();
            this.sortTextLow = completion.sortText && completion.sortText.toLowerCase();
            this.filterTextLow = completion.filterText && completion.filterText.toLowerCase();
            // normalize ranges
            if (range_1.Range.isIRange(completion.range)) {
                this.editStart = new position_1.Position(completion.range.startLineNumber, completion.range.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.endLineNumber, completion.range.endColumn);
            }
            else {
                this.editStart = new position_1.Position(completion.range.insert.startLineNumber, completion.range.insert.startColumn);
                this.editInsertEnd = new position_1.Position(completion.range.insert.endLineNumber, completion.range.insert.endColumn);
                this.editReplaceEnd = new position_1.Position(completion.range.replace.endLineNumber, completion.range.replace.endColumn);
            }
            // create the suggestion resolver
            const { resolveCompletionItem } = provider;
            if (typeof resolveCompletionItem !== 'function') {
                this.resolve = () => Promise.resolve();
            }
            else {
                let cached;
                this.resolve = (token) => {
                    if (!cached) {
                        let isDone = false;
                        cached = Promise.resolve(resolveCompletionItem.call(provider, model, position, completion, token)).then(value => {
                            objects_1.assign(completion, value);
                            isDone = true;
                        }, err => {
                            if (errors_1.isPromiseCanceledError(err)) {
                                // the IPC queue will reject the request with the
                                // cancellation error -> reset cached
                                cached = undefined;
                            }
                        });
                        token.onCancellationRequested(() => {
                            if (!isDone) {
                                // cancellation after the request has been
                                // dispatched -> reset cache
                                cached = undefined;
                            }
                        });
                    }
                    return cached;
                };
            }
        }
    }
    exports.CompletionItem = CompletionItem;
    var SnippetSortOrder;
    (function (SnippetSortOrder) {
        SnippetSortOrder[SnippetSortOrder["Top"] = 0] = "Top";
        SnippetSortOrder[SnippetSortOrder["Inline"] = 1] = "Inline";
        SnippetSortOrder[SnippetSortOrder["Bottom"] = 2] = "Bottom";
    })(SnippetSortOrder = exports.SnippetSortOrder || (exports.SnippetSortOrder = {}));
    class CompletionOptions {
        constructor(snippetSortOrder = 2 /* Bottom */, kindFilter = new Set(), providerFilter = new Set()) {
            this.snippetSortOrder = snippetSortOrder;
            this.kindFilter = kindFilter;
            this.providerFilter = providerFilter;
        }
    }
    exports.CompletionOptions = CompletionOptions;
    CompletionOptions.default = new CompletionOptions();
    let _snippetSuggestSupport;
    function getSnippetSuggestSupport() {
        return _snippetSuggestSupport;
    }
    exports.getSnippetSuggestSupport = getSnippetSuggestSupport;
    function setSnippetSuggestSupport(support) {
        const old = _snippetSuggestSupport;
        _snippetSuggestSupport = support;
        return old;
    }
    exports.setSnippetSuggestSupport = setSnippetSuggestSupport;
    function provideSuggestionItems(model, position, options = CompletionOptions.default, context = { triggerKind: 0 /* Invoke */ }, token = cancellation_1.CancellationToken.None) {
        const word = model.getWordAtPosition(position);
        const defaultReplaceRange = word ? new range_1.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn) : range_1.Range.fromPositions(position);
        const defaultInsertRange = defaultReplaceRange.setEndPosition(position.lineNumber, position.column);
        // const wordUntil = model.getWordUntilPosition(position);
        // const defaultRange = new Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
        position = position.clone();
        // get provider groups, always add snippet suggestion provider
        const supports = modes.CompletionProviderRegistry.orderedGroups(model);
        // add snippets provider unless turned off
        if (!options.kindFilter.has(25 /* Snippet */) && _snippetSuggestSupport) {
            supports.unshift([_snippetSuggestSupport]);
        }
        const allSuggestions = [];
        const disposables = new lifecycle_1.DisposableStore();
        let hasResult = false;
        // add suggestions from contributed providers - providers are ordered in groups of
        // equal score and once a group produces a result the process stops
        const factory = supports.map(supports => () => {
            // for each support in the group ask for suggestions
            return Promise.all(supports.map(provider => {
                if (options.providerFilter.size > 0 && !options.providerFilter.has(provider)) {
                    return undefined;
                }
                return Promise.resolve(provider.provideCompletionItems(model, position, context, token)).then(container => {
                    const len = allSuggestions.length;
                    if (container) {
                        for (let suggestion of container.suggestions || []) {
                            if (!options.kindFilter.has(suggestion.kind)) {
                                // fill in default range when missing
                                if (!suggestion.range) {
                                    suggestion.range = { insert: defaultInsertRange, replace: defaultReplaceRange };
                                }
                                // fill in default sortText when missing
                                if (!suggestion.sortText) {
                                    suggestion.sortText = suggestion.label;
                                }
                                allSuggestions.push(new CompletionItem(position, suggestion, container, provider, model));
                            }
                        }
                        if (lifecycle_1.isDisposable(container)) {
                            disposables.add(container);
                        }
                    }
                    if (len !== allSuggestions.length && provider !== _snippetSuggestSupport) {
                        hasResult = true;
                    }
                }, errors_1.onUnexpectedExternalError);
            }));
        });
        const result = async_1.first(factory, () => {
            // stop on result or cancellation
            return hasResult || token.isCancellationRequested;
        }).then(() => {
            if (token.isCancellationRequested) {
                disposables.dispose();
                return Promise.reject(errors_1.canceled());
            }
            return allSuggestions.sort(getSuggestionComparator(options.snippetSortOrder));
        });
        // result.then(items => {
        // 	console.log(model.getWordUntilPosition(position), items.map(item => `${item.suggestion.label}, type=${item.suggestion.type}, incomplete?${item.container.incomplete}, overwriteBefore=${item.suggestion.overwriteBefore}`));
        // 	return items;
        // }, err => {
        // 	console.warn(model.getWordUntilPosition(position), err);
        // });
        return result;
    }
    exports.provideSuggestionItems = provideSuggestionItems;
    function defaultComparator(a, b) {
        // check with 'sortText'
        if (a.sortTextLow && b.sortTextLow) {
            if (a.sortTextLow < b.sortTextLow) {
                return -1;
            }
            else if (a.sortTextLow > b.sortTextLow) {
                return 1;
            }
        }
        // check with 'label'
        if (a.completion.label < b.completion.label) {
            return -1;
        }
        else if (a.completion.label > b.completion.label) {
            return 1;
        }
        // check with 'type'
        return a.completion.kind - b.completion.kind;
    }
    function snippetUpComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 25 /* Snippet */) {
                return -1;
            }
            else if (b.completion.kind === 25 /* Snippet */) {
                return 1;
            }
        }
        return defaultComparator(a, b);
    }
    function snippetDownComparator(a, b) {
        if (a.completion.kind !== b.completion.kind) {
            if (a.completion.kind === 25 /* Snippet */) {
                return 1;
            }
            else if (b.completion.kind === 25 /* Snippet */) {
                return -1;
            }
        }
        return defaultComparator(a, b);
    }
    const _snippetComparators = new Map();
    _snippetComparators.set(0 /* Top */, snippetUpComparator);
    _snippetComparators.set(2 /* Bottom */, snippetDownComparator);
    _snippetComparators.set(1 /* Inline */, defaultComparator);
    function getSuggestionComparator(snippetConfig) {
        return _snippetComparators.get(snippetConfig);
    }
    exports.getSuggestionComparator = getSuggestionComparator;
    editorExtensions_1.registerDefaultLanguageCommand('_executeCompletionItemProvider', async (model, position, args) => {
        const result = {
            incomplete: false,
            suggestions: []
        };
        const disposables = new lifecycle_1.DisposableStore();
        const resolving = [];
        const maxItemsToResolve = args['maxItemsToResolve'] || 0;
        const items = await provideSuggestionItems(model, position);
        for (const item of items) {
            if (resolving.length < maxItemsToResolve) {
                resolving.push(item.resolve(cancellation_1.CancellationToken.None));
            }
            result.incomplete = result.incomplete || item.container.incomplete;
            result.suggestions.push(item.completion);
            if (lifecycle_1.isDisposable(item.container)) {
                disposables.add(item.container);
            }
        }
        try {
            await Promise.all(resolving);
            return result;
        }
        finally {
            setTimeout(() => disposables.dispose(), 100);
        }
    });
    const _provider = new class {
        constructor() {
            this.onlyOnceSuggestions = [];
        }
        provideCompletionItems() {
            let suggestions = this.onlyOnceSuggestions.slice(0);
            let result = { suggestions };
            this.onlyOnceSuggestions.length = 0;
            return result;
        }
    };
    modes.CompletionProviderRegistry.register('*', _provider);
    function showSimpleSuggestions(editor, suggestions) {
        setTimeout(() => {
            _provider.onlyOnceSuggestions.push(...suggestions);
            editor.getContribution('editor.contrib.suggestController').triggerSuggest(new Set().add(_provider));
        }, 0);
    }
    exports.showSimpleSuggestions = showSimpleSuggestions;
});
//# sourceMappingURL=suggest.js.map