/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/common/strings", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/editor/contrib/quickOpen/quickOpen", "vs/editor/standalone/browser/quickOpen/editorQuickOpen", "vs/editor/common/standaloneStrings", "vs/css!./quickOutline"], function (require, exports, cancellation_1, filters_1, strings, quickOpenModel_1, editorExtensions_1, range_1, editorContextKeys_1, modes_1, quickOpen_1, editorQuickOpen_1, standaloneStrings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SCOPE_PREFIX = ':';
    class SymbolEntry extends quickOpenModel_1.QuickOpenEntryGroup {
        constructor(name, type, description, range, highlights, editor, decorator) {
            super();
            this.name = name;
            this.type = type;
            this.description = description;
            this.range = range;
            this.setHighlights(highlights);
            this.editor = editor;
            this.decorator = decorator;
        }
        getLabel() {
            return this.name;
        }
        getAriaLabel() {
            return strings.format(standaloneStrings_1.QuickOutlineNLS.entryAriaLabel, this.name);
        }
        getIcon() {
            return this.type;
        }
        getDescription() {
            return this.description;
        }
        getType() {
            return this.type;
        }
        getRange() {
            return this.range;
        }
        run(mode, context) {
            if (mode === 1 /* OPEN */) {
                return this.runOpen(context);
            }
            return this.runPreview();
        }
        runOpen(_context) {
            // Apply selection and focus
            let range = this.toSelection();
            this.editor.setSelection(range);
            this.editor.revealRangeInCenter(range, 0 /* Smooth */);
            this.editor.focus();
            return true;
        }
        runPreview() {
            // Select Outline Position
            let range = this.toSelection();
            this.editor.revealRangeInCenter(range, 0 /* Smooth */);
            // Decorate if possible
            this.decorator.decorateLine(this.range, this.editor);
            return false;
        }
        toSelection() {
            return new range_1.Range(this.range.startLineNumber, this.range.startColumn || 1, this.range.startLineNumber, this.range.startColumn || 1);
        }
    }
    exports.SymbolEntry = SymbolEntry;
    class QuickOutlineAction extends editorQuickOpen_1.BaseEditorQuickOpenAction {
        constructor() {
            super(standaloneStrings_1.QuickOutlineNLS.quickOutlineActionInput, {
                id: 'editor.action.quickOutline',
                label: standaloneStrings_1.QuickOutlineNLS.quickOutlineActionLabel,
                alias: 'Go to Symbol...',
                precondition: editorContextKeys_1.EditorContextKeys.hasDocumentSymbolProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 45 /* KEY_O */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    group: 'navigation',
                    order: 3
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return undefined;
            }
            const model = editor.getModel();
            if (!modes_1.DocumentSymbolProviderRegistry.has(model)) {
                return undefined;
            }
            // Resolve outline
            return quickOpen_1.getDocumentSymbols(model, true, cancellation_1.CancellationToken.None).then((result) => {
                if (result.length === 0) {
                    return;
                }
                this._run(editor, result);
            });
        }
        _run(editor, result) {
            this._show(this.getController(editor), {
                getModel: (value) => {
                    return new quickOpenModel_1.QuickOpenModel(this.toQuickOpenEntries(editor, result, value));
                },
                getAutoFocus: (searchValue) => {
                    // Remove any type pattern (:) from search value as needed
                    if (searchValue.indexOf(SCOPE_PREFIX) === 0) {
                        searchValue = searchValue.substr(SCOPE_PREFIX.length);
                    }
                    return {
                        autoFocusPrefixMatch: searchValue,
                        autoFocusFirstEntry: !!searchValue
                    };
                }
            });
        }
        symbolEntry(name, type, description, range, highlights, editor, decorator) {
            return new SymbolEntry(name, type, description, range_1.Range.lift(range), highlights, editor, decorator);
        }
        toQuickOpenEntries(editor, flattened, searchValue) {
            const controller = this.getController(editor);
            let results = [];
            // Convert to Entries
            let normalizedSearchValue = searchValue;
            if (searchValue.indexOf(SCOPE_PREFIX) === 0) {
                normalizedSearchValue = normalizedSearchValue.substr(SCOPE_PREFIX.length);
            }
            for (const element of flattened) {
                let label = strings.trim(element.name);
                // Check for meatch
                let highlights = filters_1.matchesFuzzy(normalizedSearchValue, label);
                if (highlights) {
                    // Show parent scope as description
                    let description = undefined;
                    if (element.containerName) {
                        description = element.containerName;
                    }
                    // Add
                    results.push(this.symbolEntry(label, modes_1.symbolKindToCssClass(element.kind), description, element.range, highlights, editor, controller));
                }
            }
            // Sort properly if actually searching
            if (searchValue) {
                if (searchValue.indexOf(SCOPE_PREFIX) === 0) {
                    results = results.sort(this.sortScoped.bind(this, searchValue.toLowerCase()));
                }
                else {
                    results = results.sort(this.sortNormal.bind(this, searchValue.toLowerCase()));
                }
            }
            // Mark all type groups
            if (results.length > 0 && searchValue.indexOf(SCOPE_PREFIX) === 0) {
                let currentType = null;
                let currentResult = null;
                let typeCounter = 0;
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    // Found new type
                    if (currentType !== result.getType()) {
                        // Update previous result with count
                        if (currentResult) {
                            currentResult.setGroupLabel(this.typeToLabel(currentType || '', typeCounter));
                        }
                        currentType = result.getType();
                        currentResult = result;
                        typeCounter = 1;
                        result.setShowBorder(i > 0);
                    }
                    // Existing type, keep counting
                    else {
                        typeCounter++;
                    }
                }
                // Update previous result with count
                if (currentResult) {
                    currentResult.setGroupLabel(this.typeToLabel(currentType || '', typeCounter));
                }
            }
            // Mark first entry as outline
            else if (results.length > 0) {
                results[0].setGroupLabel(strings.format(standaloneStrings_1.QuickOutlineNLS._symbols_, results.length));
            }
            return results;
        }
        typeToLabel(type, count) {
            switch (type) {
                case 'module': return strings.format(standaloneStrings_1.QuickOutlineNLS._modules_, count);
                case 'class': return strings.format(standaloneStrings_1.QuickOutlineNLS._class_, count);
                case 'interface': return strings.format(standaloneStrings_1.QuickOutlineNLS._interface_, count);
                case 'method': return strings.format(standaloneStrings_1.QuickOutlineNLS._method_, count);
                case 'function': return strings.format(standaloneStrings_1.QuickOutlineNLS._function_, count);
                case 'property': return strings.format(standaloneStrings_1.QuickOutlineNLS._property_, count);
                case 'variable': return strings.format(standaloneStrings_1.QuickOutlineNLS._variable_, count);
                case 'var': return strings.format(standaloneStrings_1.QuickOutlineNLS._variable2_, count);
                case 'constructor': return strings.format(standaloneStrings_1.QuickOutlineNLS._constructor_, count);
                case 'call': return strings.format(standaloneStrings_1.QuickOutlineNLS._call_, count);
            }
            return type;
        }
        sortNormal(searchValue, elementA, elementB) {
            let elementAName = elementA.getLabel().toLowerCase();
            let elementBName = elementB.getLabel().toLowerCase();
            // Compare by name
            let r = elementAName.localeCompare(elementBName);
            if (r !== 0) {
                return r;
            }
            // If name identical sort by range instead
            let elementARange = elementA.getRange();
            let elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        }
        sortScoped(searchValue, elementA, elementB) {
            // Remove scope char
            searchValue = searchValue.substr(SCOPE_PREFIX.length);
            // Sort by type first if scoped search
            let elementAType = elementA.getType();
            let elementBType = elementB.getType();
            let r = elementAType.localeCompare(elementBType);
            if (r !== 0) {
                return r;
            }
            // Special sort when searching in scoped mode
            if (searchValue) {
                let elementAName = elementA.getLabel().toLowerCase();
                let elementBName = elementB.getLabel().toLowerCase();
                // Compare by name
                let r = elementAName.localeCompare(elementBName);
                if (r !== 0) {
                    return r;
                }
            }
            // Default to sort by range
            let elementARange = elementA.getRange();
            let elementBRange = elementB.getRange();
            return elementARange.startLineNumber - elementBRange.startLineNumber;
        }
    }
    exports.QuickOutlineAction = QuickOutlineAction;
    editorExtensions_1.registerEditorAction(QuickOutlineAction);
});
//# sourceMappingURL=quickOutline.js.map