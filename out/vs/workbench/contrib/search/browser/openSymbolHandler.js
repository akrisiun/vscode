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
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/base/common/async", "vs/workbench/browser/quickopen", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/base/common/filters", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/search/common/search", "vs/base/common/resources", "vs/workbench/services/editor/common/editorService", "vs/platform/label/common/label", "vs/base/common/cancellation", "vs/base/common/network", "vs/platform/opener/common/opener"], function (require, exports, nls, errors_1, async_1, quickopen_1, quickOpenModel_1, filters, strings, range_1, modes_1, instantiation_1, configuration_1, search_1, resources_1, editorService_1, label_1, cancellation_1, network_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SymbolEntry = class SymbolEntry extends quickopen_1.EditorQuickOpenEntry {
        constructor(bearing, provider, configurationService, editorService, labelService, openerService) {
            super(editorService);
            this.bearing = bearing;
            this.provider = provider;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.openerService = openerService;
        }
        setScore(score) {
            this.score = score;
        }
        getHighlights() {
            return [this.isDeprecated() ? [] : filters.createMatches(this.score), undefined, undefined];
        }
        getLabel() {
            return this.bearing.name;
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, symbols picker", this.getLabel());
        }
        getDescription() {
            const containerName = this.bearing.containerName;
            if (this.bearing.location.uri) {
                if (containerName) {
                    return `${containerName} — ${resources_1.basename(this.bearing.location.uri)}`;
                }
                return this.labelService.getUriLabel(this.bearing.location.uri, { relative: true });
            }
            return containerName;
        }
        getIcon() {
            return modes_1.SymbolKinds.toCssClassName(this.bearing.kind);
        }
        getLabelOptions() {
            return this.isDeprecated() ? { extraClasses: ['deprecated'] } : undefined;
        }
        getResource() {
            return this.bearing.location.uri;
        }
        isDeprecated() {
            return this.bearing.tags ? this.bearing.tags.indexOf(1 /* Deprecated */) >= 0 : false;
        }
        run(mode, context) {
            // resolve this type bearing if neccessary
            if (!this.bearingResolve && typeof this.provider.resolveWorkspaceSymbol === 'function' && !this.bearing.location.range) {
                this.bearingResolve = Promise.resolve(this.provider.resolveWorkspaceSymbol(this.bearing, cancellation_1.CancellationToken.None)).then(result => {
                    this.bearing = result || this.bearing;
                    return this;
                }, errors_1.onUnexpectedError);
            }
            // open after resolving
            Promise.resolve(this.bearingResolve).then(() => {
                const scheme = this.bearing.location.uri ? this.bearing.location.uri.scheme : undefined;
                if (scheme === network_1.Schemas.http || scheme === network_1.Schemas.https) {
                    if (mode === 1 /* OPEN */ || mode === 2 /* OPEN_IN_BACKGROUND */) {
                        this.openerService.open(this.bearing.location.uri, { fromUserGesture: true }); // support http/https resources (https://github.com/Microsoft/vscode/issues/58924))
                    }
                }
                else {
                    super.run(mode, context);
                }
            });
            // hide if OPEN
            return mode === 1 /* OPEN */;
        }
        getInput() {
            const input = {
                resource: this.bearing.location.uri,
                options: {
                    pinned: !this.configurationService.getValue().workbench.editor.enablePreviewFromQuickOpen
                }
            };
            if (this.bearing.location.range) {
                input.options.selection = range_1.Range.collapseToStart(this.bearing.location.range);
            }
            return input;
        }
        static compare(a, b, searchValue) {
            // order: score, name, kind
            if (a.score && b.score) {
                if (a.score[0] > b.score[0]) {
                    return -1;
                }
                else if (a.score[0] < b.score[0]) {
                    return 1;
                }
            }
            const aName = a.getLabel().toLowerCase();
            const bName = b.getLabel().toLowerCase();
            let res = aName.localeCompare(bName);
            if (res !== 0) {
                return res;
            }
            let aKind = modes_1.SymbolKinds.toCssClassName(a.bearing.kind);
            let bKind = modes_1.SymbolKinds.toCssClassName(b.bearing.kind);
            return aKind.localeCompare(bKind);
        }
    };
    SymbolEntry = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, label_1.ILabelService),
        __param(5, opener_1.IOpenerService)
    ], SymbolEntry);
    let OpenSymbolHandler = class OpenSymbolHandler extends quickopen_1.QuickOpenHandler {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.delayer = new async_1.ThrottledDelayer(OpenSymbolHandler.TYPING_SEARCH_DELAY);
            this.options = Object.create(null);
        }
        setOptions(options) {
            this.options = options;
        }
        canRun() {
            return true;
        }
        async getResults(searchValue, token) {
            searchValue = searchValue.trim();
            let entries;
            if (!this.options.skipDelay) {
                entries = await this.delayer.trigger(() => {
                    if (token.isCancellationRequested) {
                        return Promise.resolve([]);
                    }
                    return this.doGetResults(searchValue, token);
                });
            }
            else {
                entries = await this.doGetResults(searchValue, token);
            }
            return new quickOpenModel_1.QuickOpenModel(entries);
        }
        async doGetResults(searchValue, token) {
            const tuples = await search_1.getWorkspaceSymbols(searchValue, token);
            if (token.isCancellationRequested) {
                return [];
            }
            const result = [];
            for (let tuple of tuples) {
                const [provider, bearings] = tuple;
                this.fillInSymbolEntries(result, provider, bearings, searchValue);
            }
            // Sort (Standalone only)
            if (!this.options.skipSorting) {
                searchValue = searchValue ? strings.stripWildcards(searchValue.toLowerCase()) : searchValue;
                return result.sort((a, b) => SymbolEntry.compare(a, b, searchValue));
            }
            return result;
        }
        fillInSymbolEntries(bucket, provider, types, searchValue) {
            const pattern = strings.stripWildcards(searchValue);
            const patternLow = pattern.toLowerCase();
            // Convert to Entries
            for (let element of types) {
                if (this.options.skipLocalSymbols && !!element.containerName) {
                    continue; // ignore local symbols if we are told so
                }
                const entry = this.instantiationService.createInstance(SymbolEntry, element, provider);
                entry.setScore(filters.fuzzyScore(pattern, patternLow, 0, entry.getLabel(), entry.getLabel().toLowerCase(), 0, true));
                bucket.push(entry);
            }
        }
        getGroupLabel() {
            return nls.localize('symbols', "symbol results");
        }
        getEmptyLabel(searchString) {
            if (searchString.length > 0) {
                return nls.localize('noSymbolsMatching', "No symbols matching");
            }
            return nls.localize('noSymbolsWithoutInput', "Type to search for symbols");
        }
        getAutoFocus(searchValue) {
            return {
                autoFocusFirstEntry: true,
                autoFocusPrefixMatch: searchValue.trim()
            };
        }
    };
    OpenSymbolHandler.ID = 'workbench.picker.symbols';
    OpenSymbolHandler.TYPING_SEARCH_DELAY = 200; // This delay accommodates for the user typing a word and then stops typing to start searching
    OpenSymbolHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], OpenSymbolHandler);
    exports.OpenSymbolHandler = OpenSymbolHandler;
});
//# sourceMappingURL=openSymbolHandler.js.map