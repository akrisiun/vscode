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
define(["require", "exports", "vs/base/common/arrays", "vs/nls", "vs/base/common/async", "vs/base/common/types", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/workbench/contrib/search/browser/openFileHandler", "vs/workbench/contrib/search/browser/openSymbolHandler", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/base/parts/quickopen/common/quickOpenScorer", "vs/platform/notification/common/notification", "vs/base/common/errors"], function (require, exports, arrays, nls, async_1, types, quickOpenModel_1, quickopen_1, openFileHandler_1, openSymbolHandler, instantiation_1, configuration_1, quickOpenScorer_1, notification_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenSymbolHandler = openSymbolHandler.OpenSymbolHandler; // OpenSymbolHandler is used from an extension and must be in the main bundle file so it can load
    let OpenAnythingHandler = class OpenAnythingHandler extends quickopen_1.QuickOpenHandler {
        constructor(notificationService, instantiationService, configurationService) {
            super();
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.scorerCache = Object.create(null);
            this.searchDelayer = new async_1.ThrottledDelayer(OpenAnythingHandler.TYPING_SEARCH_DELAY);
            this.openSymbolHandler = instantiationService.createInstance(exports.OpenSymbolHandler);
            this.openFileHandler = instantiationService.createInstance(openFileHandler_1.OpenFileHandler);
            this.updateHandlers(this.configurationService.getValue());
            this.registerListeners();
        }
        registerListeners() {
            this.configurationService.onDidChangeConfiguration(e => this.updateHandlers(this.configurationService.getValue()));
        }
        updateHandlers(configuration) {
            this.includeSymbols = configuration && configuration.search && configuration.search.quickOpen && configuration.search.quickOpen.includeSymbols;
            // Files
            this.openFileHandler.setOptions({
                forceUseIcons: this.includeSymbols // only need icons for file results if we mix with symbol results
            });
            // Symbols
            this.openSymbolHandler.setOptions({
                skipDelay: true,
                skipLocalSymbols: true,
                skipSorting: true // we sort combined with file results
            });
        }
        getResults(searchValue, token) {
            this.isClosed = false; // Treat this call as the handler being in use
            // Find a suitable range from the pattern looking for ":" and "#"
            const searchWithRange = this.extractRange(searchValue);
            if (searchWithRange) {
                searchValue = searchWithRange.search; // ignore range portion in query
            }
            // Prepare search for scoring
            const query = quickOpenScorer_1.prepareQuery(searchValue);
            if (!query.value) {
                return Promise.resolve(new quickOpenModel_1.QuickOpenModel()); // Respond directly to empty search
            }
            // The throttler needs a factory for its promises
            const resultsPromise = () => {
                const resultPromises = [];
                // File Results
                const filePromise = this.openFileHandler.getResults(query.original, token, OpenAnythingHandler.MAX_DISPLAYED_RESULTS);
                resultPromises.push(filePromise);
                // Symbol Results (unless disabled or a range or absolute path is specified)
                if (this.includeSymbols && !searchWithRange) {
                    resultPromises.push(this.openSymbolHandler.getResults(query.original, token));
                }
                // Join and sort unified
                return Promise.all(resultPromises).then(results => {
                    // If the quick open widget has been closed meanwhile, ignore the result
                    if (this.isClosed || token.isCancellationRequested) {
                        return Promise.resolve(new quickOpenModel_1.QuickOpenModel());
                    }
                    // Combine results.
                    const mergedResults = [].concat(...results.map(r => r.entries));
                    // Sort
                    const compare = (elementA, elementB) => quickOpenScorer_1.compareItemsByScore(elementA, elementB, query, true, quickOpenModel_1.QuickOpenItemAccessor, this.scorerCache);
                    const viewResults = arrays.top(mergedResults, compare, OpenAnythingHandler.MAX_DISPLAYED_RESULTS);
                    // Apply range and highlights to file entries
                    viewResults.forEach(entry => {
                        if (entry instanceof openFileHandler_1.FileEntry) {
                            entry.setRange(searchWithRange ? searchWithRange.range : null);
                            const itemScore = quickOpenScorer_1.scoreItem(entry, query, true, quickOpenModel_1.QuickOpenItemAccessor, this.scorerCache);
                            entry.setHighlights(itemScore.labelMatch || [], itemScore.descriptionMatch);
                        }
                    });
                    return Promise.resolve(new quickOpenModel_1.QuickOpenModel(viewResults));
                }, error => {
                    if (!errors_1.isPromiseCanceledError(error)) {
                        let message;
                        if (error.message) {
                            message = error.message.replace(/[\*_\[\]]/g, '\\$&');
                        }
                        else {
                            message = error;
                        }
                        this.notificationService.error(message);
                    }
                    return null;
                });
            };
            // Trigger through delayer to prevent accumulation while the user is typing (except when expecting results to come from cache)
            return this.hasShortResponseTime() ? resultsPromise() : this.searchDelayer.trigger(resultsPromise, OpenAnythingHandler.TYPING_SEARCH_DELAY);
        }
        hasShortResponseTime() {
            if (!this.includeSymbols) {
                return this.openFileHandler.hasShortResponseTime();
            }
            return this.openFileHandler.hasShortResponseTime() && this.openSymbolHandler.hasShortResponseTime();
        }
        extractRange(value) {
            if (!value) {
                return null;
            }
            let range = null;
            // Find Line/Column number from search value using RegExp
            const patternMatch = OpenAnythingHandler.LINE_COLON_PATTERN.exec(value);
            if (patternMatch && patternMatch.length > 1) {
                const startLineNumber = parseInt(patternMatch[1], 10);
                // Line Number
                if (types.isNumber(startLineNumber)) {
                    range = {
                        startLineNumber: startLineNumber,
                        startColumn: 1,
                        endLineNumber: startLineNumber,
                        endColumn: 1
                    };
                    // Column Number
                    if (patternMatch.length > 3) {
                        const startColumn = parseInt(patternMatch[3], 10);
                        if (types.isNumber(startColumn)) {
                            range = {
                                startLineNumber: range.startLineNumber,
                                startColumn: startColumn,
                                endLineNumber: range.endLineNumber,
                                endColumn: startColumn
                            };
                        }
                    }
                }
                // User has typed "something:" or "something#" without a line number, in this case treat as start of file
                else if (patternMatch[1] === '') {
                    range = {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: 1
                    };
                }
            }
            if (patternMatch && range) {
                return {
                    search: value.substr(0, patternMatch.index),
                    range: range
                };
            }
            return null;
        }
        getGroupLabel() {
            return this.includeSymbols ? nls.localize('fileAndTypeResults', "file and symbol results") : nls.localize('fileResults', "file results");
        }
        getAutoFocus(searchValue) {
            return {
                autoFocusFirstEntry: true
            };
        }
        onOpen() {
            this.openSymbolHandler.onOpen();
            this.openFileHandler.onOpen();
        }
        onClose(canceled) {
            this.isClosed = true;
            // Clear Cache
            this.scorerCache = Object.create(null);
            // Propagate
            this.openSymbolHandler.onClose(canceled);
            this.openFileHandler.onClose(canceled);
        }
    };
    OpenAnythingHandler.ID = 'workbench.picker.anything';
    OpenAnythingHandler.LINE_COLON_PATTERN = /[#:\(](\d*)([#:,](\d*))?\)?\s*$/;
    OpenAnythingHandler.TYPING_SEARCH_DELAY = 200; // This delay accommodates for the user typing a word and then stops typing to start searching
    OpenAnythingHandler.MAX_DISPLAYED_RESULTS = 512;
    OpenAnythingHandler = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService)
    ], OpenAnythingHandler);
    exports.OpenAnythingHandler = OpenAnythingHandler;
});
//# sourceMappingURL=openAnythingHandler.js.map