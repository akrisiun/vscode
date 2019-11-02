/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/base/common/async", "./extHost.protocol", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/arrays", "vs/base/common/types", "vs/editor/common/core/selection", "vs/base/common/lifecycle"], function (require, exports, uri_1, objects_1, typeConvert, extHostTypes_1, async_1, extHostProtocol, strings_1, range_1, arrays_1, types_1, selection_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // --- adapter
    class DocumentSymbolAdapter {
        constructor(documents, provider) {
            this._documents = documents;
            this._provider = provider;
        }
        provideDocumentSymbols(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentSymbols(doc, token)).then(value => {
                if (arrays_1.isFalsyOrEmpty(value)) {
                    return undefined;
                }
                else if (value[0] instanceof extHostTypes_1.DocumentSymbol) {
                    return value.map(typeConvert.DocumentSymbol.from);
                }
                else {
                    return DocumentSymbolAdapter._asDocumentSymbolTree(value);
                }
            });
        }
        static _asDocumentSymbolTree(infos) {
            // first sort by start (and end) and then loop over all elements
            // and build a tree based on containment.
            infos = infos.slice(0).sort((a, b) => {
                let res = a.location.range.start.compareTo(b.location.range.start);
                if (res === 0) {
                    res = b.location.range.end.compareTo(a.location.range.end);
                }
                return res;
            });
            const res = [];
            const parentStack = [];
            for (const info of infos) {
                const element = {
                    name: info.name || '!!MISSING: name!!',
                    kind: typeConvert.SymbolKind.from(info.kind),
                    tags: info.tags ? info.tags.map(typeConvert.SymbolTag.from) : [],
                    detail: '',
                    containerName: info.containerName,
                    range: typeConvert.Range.from(info.location.range),
                    selectionRange: typeConvert.Range.from(info.location.range),
                    children: []
                };
                while (true) {
                    if (parentStack.length === 0) {
                        parentStack.push(element);
                        res.push(element);
                        break;
                    }
                    const parent = parentStack[parentStack.length - 1];
                    if (range_1.Range.containsRange(parent.range, element.range) && !range_1.Range.equalsRange(parent.range, element.range)) {
                        if (parent.children) {
                            parent.children.push(element);
                        }
                        parentStack.push(element);
                        break;
                    }
                    parentStack.pop();
                }
            }
            return res;
        }
    }
    class CodeLensAdapter {
        constructor(_documents, _commands, _provider) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._cache = new Cache('CodeLens');
            this._disposables = new Map();
        }
        provideCodeLenses(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideCodeLenses(doc, token)).then(lenses => {
                if (!lenses || token.isCancellationRequested) {
                    return undefined;
                }
                const cacheId = this._cache.add(lenses);
                const disposables = new lifecycle_1.DisposableStore();
                this._disposables.set(cacheId, disposables);
                const result = {
                    cacheId,
                    lenses: [],
                };
                for (let i = 0; i < lenses.length; i++) {
                    result.lenses.push({
                        cacheId: [cacheId, i],
                        range: typeConvert.Range.from(lenses[i].range),
                        command: this._commands.toInternal(lenses[i].command, disposables)
                    });
                }
                return result;
            });
        }
        resolveCodeLens(symbol, token) {
            const lens = symbol.cacheId && this._cache.get(...symbol.cacheId);
            if (!lens) {
                return Promise.resolve(undefined);
            }
            let resolve;
            if (typeof this._provider.resolveCodeLens !== 'function' || lens.isResolved) {
                resolve = Promise.resolve(lens);
            }
            else {
                resolve = async_1.asPromise(() => this._provider.resolveCodeLens(lens, token));
            }
            return resolve.then(newLens => {
                if (token.isCancellationRequested) {
                    return undefined;
                }
                const disposables = symbol.cacheId && this._disposables.get(symbol.cacheId[0]);
                if (!disposables) {
                    // We've already been disposed of
                    return undefined;
                }
                newLens = newLens || lens;
                symbol.command = this._commands.toInternal(newLens.command || CodeLensAdapter._badCmd, disposables);
                return symbol;
            });
        }
        releaseCodeLenses(cachedId) {
            lifecycle_1.dispose(this._disposables.get(cachedId));
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
    }
    CodeLensAdapter._badCmd = { command: 'missing', title: '!!MISSING: command!!' };
    function convertToLocationLinks(value) {
        return value ? arrays_1.asArray(value).map(typeConvert.DefinitionLink.from) : [];
    }
    class DefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDefinition(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class DeclarationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDeclaration(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDeclaration(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class ImplementationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideImplementation(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideImplementation(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class TypeDefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideTypeDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideTypeDefinition(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class HoverAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideHover(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideHover(doc, pos, token)).then(value => {
                if (!value || arrays_1.isFalsyOrEmpty(value.contents)) {
                    return undefined;
                }
                if (!value.range) {
                    value.range = doc.getWordRangeAtPosition(pos);
                }
                if (!value.range) {
                    value.range = new extHostTypes_1.Range(pos, pos);
                }
                return typeConvert.Hover.from(value);
            });
        }
    }
    class DocumentHighlightAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentHighlights(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDocumentHighlights(doc, pos, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.DocumentHighlight.from);
                }
                return undefined;
            });
        }
    }
    class ReferenceAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideReferences(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideReferences(doc, pos, context, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.location.from);
                }
                return undefined;
            });
        }
    }
    class CodeActionAdapter {
        constructor(_documents, _commands, _diagnostics, _provider, _logService, _extensionId) {
            this._documents = _documents;
            this._commands = _commands;
            this._diagnostics = _diagnostics;
            this._provider = _provider;
            this._logService = _logService;
            this._extensionId = _extensionId;
            this._cache = new Cache('CodeAction');
            this._disposables = new Map();
        }
        provideCodeActions(resource, rangeOrSelection, context, token) {
            const doc = this._documents.getDocument(resource);
            const ran = selection_1.Selection.isISelection(rangeOrSelection)
                ? typeConvert.Selection.to(rangeOrSelection)
                : typeConvert.Range.to(rangeOrSelection);
            const allDiagnostics = [];
            for (const diagnostic of this._diagnostics.getDiagnostics(resource)) {
                if (ran.intersection(diagnostic.range)) {
                    const newLen = allDiagnostics.push(diagnostic);
                    if (newLen > CodeActionAdapter._maxCodeActionsPerFile) {
                        break;
                    }
                }
            }
            const codeActionContext = {
                diagnostics: allDiagnostics,
                only: context.only ? new extHostTypes_1.CodeActionKind(context.only) : undefined
            };
            return async_1.asPromise(() => this._provider.provideCodeActions(doc, ran, codeActionContext, token)).then((commandsOrActions) => {
                if (!arrays_1.isNonEmptyArray(commandsOrActions) || token.isCancellationRequested) {
                    return undefined;
                }
                const cacheId = this._cache.add(commandsOrActions);
                const disposables = new lifecycle_1.DisposableStore();
                this._disposables.set(cacheId, disposables);
                const actions = [];
                for (const candidate of commandsOrActions) {
                    if (!candidate) {
                        continue;
                    }
                    if (CodeActionAdapter._isCommand(candidate)) {
                        // old school: synthetic code action
                        actions.push({
                            _isSynthetic: true,
                            title: candidate.title,
                            command: this._commands.toInternal(candidate, disposables),
                        });
                    }
                    else {
                        if (codeActionContext.only) {
                            if (!candidate.kind) {
                                this._logService.warn(`${this._extensionId.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action does not have a 'kind'. Code action will be dropped. Please set 'CodeAction.kind'.`);
                            }
                            else if (!codeActionContext.only.contains(candidate.kind)) {
                                this._logService.warn(`${this._extensionId.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action is of kind '${candidate.kind.value}'. Code action will be dropped. Please check 'CodeActionContext.only' to only return requested code actions.`);
                            }
                        }
                        // new school: convert code action
                        actions.push({
                            title: candidate.title,
                            command: candidate.command && this._commands.toInternal(candidate.command, disposables),
                            diagnostics: candidate.diagnostics && candidate.diagnostics.map(typeConvert.Diagnostic.from),
                            edit: candidate.edit && typeConvert.WorkspaceEdit.from(candidate.edit),
                            kind: candidate.kind && candidate.kind.value,
                            isPreferred: candidate.isPreferred,
                        });
                    }
                }
                return { cacheId, actions };
            });
        }
        releaseCodeActions(cachedId) {
            lifecycle_1.dispose(this._disposables.get(cachedId));
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
        static _isCommand(thing) {
            return typeof thing.command === 'string' && typeof thing.title === 'string';
        }
    }
    CodeActionAdapter._maxCodeActionsPerFile = 1000;
    class DocumentFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentFormattingEdits(resource, options, token) {
            const document = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentFormattingEdits(document, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class RangeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentRangeFormattingEdits(resource, range, options, token) {
            const document = this._documents.getDocument(resource);
            const ran = typeConvert.Range.to(range);
            return async_1.asPromise(() => this._provider.provideDocumentRangeFormattingEdits(document, ran, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class OnTypeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this.autoFormatTriggerCharacters = []; // not here
        }
        provideOnTypeFormattingEdits(resource, position, ch, options, token) {
            const document = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideOnTypeFormattingEdits(document, pos, ch, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class NavigateTypeAdapter {
        constructor(provider) {
            this._symbolCache = new Map();
            this._resultCache = new Map();
            this._provider = provider;
        }
        provideWorkspaceSymbols(search, token) {
            const result = extHostProtocol.IdObject.mixin({ symbols: [] });
            return async_1.asPromise(() => this._provider.provideWorkspaceSymbols(search, token)).then(value => {
                if (arrays_1.isNonEmptyArray(value)) {
                    for (const item of value) {
                        if (!item) {
                            // drop
                            continue;
                        }
                        if (!item.name) {
                            console.warn('INVALID SymbolInformation, lacks name', item);
                            continue;
                        }
                        const symbol = extHostProtocol.IdObject.mixin(typeConvert.WorkspaceSymbol.from(item));
                        this._symbolCache.set(symbol._id, item);
                        result.symbols.push(symbol);
                    }
                }
            }).then(() => {
                if (result.symbols.length > 0) {
                    this._resultCache.set(result._id, [result.symbols[0]._id, result.symbols[result.symbols.length - 1]._id]);
                }
                return result;
            });
        }
        async resolveWorkspaceSymbol(symbol, token) {
            if (typeof this._provider.resolveWorkspaceSymbol !== 'function') {
                return symbol;
            }
            const item = this._symbolCache.get(symbol._id);
            if (item) {
                const value = await async_1.asPromise(() => this._provider.resolveWorkspaceSymbol(item, token));
                return value && objects_1.mixin(symbol, typeConvert.WorkspaceSymbol.from(value), true);
            }
            return undefined;
        }
        releaseWorkspaceSymbols(id) {
            const range = this._resultCache.get(id);
            if (range) {
                for (let [from, to] = range; from <= to; from++) {
                    this._symbolCache.delete(from);
                }
                this._resultCache.delete(id);
            }
        }
    }
    class RenameAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        static supportsResolving(provider) {
            return typeof provider.prepareRename === 'function';
        }
        provideRenameEdits(resource, position, newName, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideRenameEdits(doc, pos, newName, token)).then(value => {
                if (!value) {
                    return undefined;
                }
                return typeConvert.WorkspaceEdit.from(value);
            }, err => {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, edits: undefined };
                }
                else {
                    // generic error
                    return Promise.reject(err);
                }
            });
        }
        resolveRenameLocation(resource, position, token) {
            if (typeof this._provider.prepareRename !== 'function') {
                return Promise.resolve(undefined);
            }
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.prepareRename(doc, pos, token)).then(rangeOrLocation => {
                let range;
                let text;
                if (extHostTypes_1.Range.isRange(rangeOrLocation)) {
                    range = rangeOrLocation;
                    text = doc.getText(rangeOrLocation);
                }
                else if (types_1.isObject(rangeOrLocation)) {
                    range = rangeOrLocation.range;
                    text = rangeOrLocation.placeholder;
                }
                if (!range) {
                    return undefined;
                }
                if (range.start.line > pos.line || range.end.line < pos.line) {
                    console.warn('INVALID rename location: position line must be within range start/end lines');
                    return undefined;
                }
                return { range: typeConvert.Range.from(range), text };
            }, err => {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, range: undefined, text: undefined };
                }
                else {
                    return Promise.reject(err);
                }
            });
        }
        static _asMessage(err) {
            if (typeof err === 'string') {
                return err;
            }
            else if (err instanceof Error && typeof err.message === 'string') {
                return err.message;
            }
            else {
                return undefined;
            }
        }
    }
    class SuggestAdapter {
        constructor(documents, commands, provider) {
            this._cache = new Cache('CompletionItem');
            this._disposables = new Map();
            this._documents = documents;
            this._commands = commands;
            this._provider = provider;
        }
        static supportsResolving(provider) {
            return typeof provider.resolveCompletionItem === 'function';
        }
        provideCompletionItems(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            // The default insert/replace ranges. It's important to compute them
            // before asynchronously asking the provider for its results. See
            // https://github.com/microsoft/vscode/issues/83400#issuecomment-546851421
            const replaceRange = doc.getWordRangeAtPosition(pos) || new extHostTypes_1.Range(pos, pos);
            const insertRange = replaceRange.with({ end: pos });
            return async_1.asPromise(() => this._provider.provideCompletionItems(doc, pos, token, typeConvert.CompletionContext.to(context))).then(value => {
                if (!value) {
                    // undefined and null are valid results
                    return undefined;
                }
                if (token.isCancellationRequested) {
                    // cancelled -> return without further ado, esp no caching
                    // of results as they will leak
                    return undefined;
                }
                const list = Array.isArray(value) ? new extHostTypes_1.CompletionList(value) : value;
                // keep result for providers that support resolving
                const pid = SuggestAdapter.supportsResolving(this._provider) ? this._cache.add(list.items) : this._cache.add([]);
                const disposables = new lifecycle_1.DisposableStore();
                this._disposables.set(pid, disposables);
                const result = {
                    x: pid,
                    b: [],
                    a: { replace: typeConvert.Range.from(replaceRange), insert: typeConvert.Range.from(insertRange) },
                    c: list.isIncomplete || undefined
                };
                for (let i = 0; i < list.items.length; i++) {
                    const suggestion = this._convertCompletionItem(list.items[i], pos, [pid, i]);
                    // check for bad completion item
                    // for the converter did warn
                    if (suggestion) {
                        result.b.push(suggestion);
                    }
                }
                return result;
            });
        }
        resolveCompletionItem(_resource, position, id, token) {
            if (typeof this._provider.resolveCompletionItem !== 'function') {
                return Promise.resolve(undefined);
            }
            const item = this._cache.get(...id);
            if (!item) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => this._provider.resolveCompletionItem(item, token)).then(resolvedItem => {
                if (!resolvedItem) {
                    return undefined;
                }
                const pos = typeConvert.Position.to(position);
                return this._convertCompletionItem(resolvedItem, pos, id);
            });
        }
        releaseCompletionItems(id) {
            lifecycle_1.dispose(this._disposables.get(id));
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _convertCompletionItem(item, position, id) {
            if (typeof item.label !== 'string' || item.label.length === 0) {
                console.warn('INVALID text edit -> must have at least a label');
                return undefined;
            }
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const result = {
                //
                x: id,
                //
                ["a" /* label */]: item.label,
                ["b" /* kind */]: typeConvert.CompletionItemKind.from(item.kind),
                ["n" /* kindModifier */]: item.tags && item.tags.map(typeConvert.CompletionItemTag.from),
                ["c" /* detail */]: item.detail,
                ["d" /* documentation */]: typeof item.documentation === 'undefined' ? undefined : typeConvert.MarkdownString.fromStrict(item.documentation),
                ["e" /* sortText */]: item.sortText,
                ["f" /* filterText */]: item.filterText,
                ["g" /* preselect */]: item.preselect,
                ["i" /* insertTextRules */]: item.keepWhitespace ? 1 /* KeepWhitespace */ : 0,
                ["k" /* commitCharacters */]: item.commitCharacters,
                ["l" /* additionalTextEdits */]: item.additionalTextEdits && item.additionalTextEdits.map(typeConvert.TextEdit.from),
                ["m" /* command */]: this._commands.toInternal(item.command, disposables),
            };
            // 'insertText'-logic
            if (item.textEdit) {
                result["h" /* insertText */] = item.textEdit.newText;
            }
            else if (typeof item.insertText === 'string') {
                result["h" /* insertText */] = item.insertText;
            }
            else if (item.insertText instanceof extHostTypes_1.SnippetString) {
                result["h" /* insertText */] = item.insertText.value;
                result["i" /* insertTextRules */] |= 4 /* InsertAsSnippet */;
            }
            // 'overwrite[Before|After]'-logic
            let range;
            if (item.textEdit) {
                range = item.textEdit.range;
            }
            else if (item.range) {
                range = item.range;
            }
            else if (item.range2) {
                range = item.range2;
            }
            if (range) {
                if (extHostTypes_1.Range.isRange(range)) {
                    if (!SuggestAdapter._isValidRangeForCompletion(range, position)) {
                        console.trace('INVALID range -> must be single line and on the same line');
                        return undefined;
                    }
                    result["j" /* range */] = typeConvert.Range.from(range);
                }
                else {
                    if (!SuggestAdapter._isValidRangeForCompletion(range.insert, position)
                        || !SuggestAdapter._isValidRangeForCompletion(range.replace, position)
                        || !range.insert.start.isEqual(range.replace.start)
                        || !range.replace.contains(range.insert)) {
                        console.trace('INVALID range -> must be single line, on the same line, insert range must be a prefix of replace range');
                        return undefined;
                    }
                    result["j" /* range */] = {
                        insert: typeConvert.Range.from(range.insert),
                        replace: typeConvert.Range.from(range.replace)
                    };
                }
            }
            return result;
        }
        static _isValidRangeForCompletion(range, position) {
            return range.isSingleLine || range.start.line === position.line;
        }
    }
    class SignatureHelpAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new Cache('SignatureHelp');
        }
        provideSignatureHelp(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const vscodeContext = this.reviveContext(context);
            return async_1.asPromise(() => this._provider.provideSignatureHelp(doc, pos, token, vscodeContext)).then(value => {
                if (value) {
                    const id = this._cache.add([value]);
                    return Object.assign(Object.assign({}, typeConvert.SignatureHelp.from(value)), { id });
                }
                return undefined;
            });
        }
        reviveContext(context) {
            let activeSignatureHelp = undefined;
            if (context.activeSignatureHelp) {
                const revivedSignatureHelp = typeConvert.SignatureHelp.to(context.activeSignatureHelp);
                const saved = this._cache.get(context.activeSignatureHelp.id, 0);
                if (saved) {
                    activeSignatureHelp = saved;
                    activeSignatureHelp.activeSignature = revivedSignatureHelp.activeSignature;
                    activeSignatureHelp.activeParameter = revivedSignatureHelp.activeParameter;
                }
                else {
                    activeSignatureHelp = revivedSignatureHelp;
                }
            }
            return Object.assign(Object.assign({}, context), { activeSignatureHelp });
        }
        releaseSignatureHelp(id) {
            this._cache.delete(id);
        }
    }
    class Cache {
        constructor(id) {
            this.id = id;
            this._data = new Map();
            this._idPool = 1;
        }
        add(item) {
            const id = this._idPool++;
            this._data.set(id, item);
            this.logDebugInfo();
            return id;
        }
        get(pid, id) {
            return this._data.has(pid) ? this._data.get(pid)[id] : undefined;
        }
        delete(id) {
            this._data.delete(id);
            this.logDebugInfo();
        }
        logDebugInfo() {
            if (!Cache.enableDebugLogging) {
                return;
            }
            console.log(`${this.id} cache size — ${this._data.size}`);
        }
    }
    Cache.enableDebugLogging = false;
    class LinkProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new Cache('DocumentLink');
        }
        provideLinks(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentLinks(doc, token)).then(links => {
                if (!Array.isArray(links) || links.length === 0) {
                    // bad result
                    return undefined;
                }
                if (token.isCancellationRequested) {
                    // cancelled -> return without further ado, esp no caching
                    // of results as they will leak
                    return undefined;
                }
                if (typeof this._provider.resolveDocumentLink !== 'function') {
                    // no resolve -> no caching
                    return { links: links.map(typeConvert.DocumentLink.from) };
                }
                else {
                    // cache links for future resolving
                    const pid = this._cache.add(links);
                    const result = { links: [], id: pid };
                    for (let i = 0; i < links.length; i++) {
                        const dto = typeConvert.DocumentLink.from(links[i]);
                        dto.cacheId = [pid, i];
                        result.links.push(dto);
                    }
                    return result;
                }
            });
        }
        resolveLink(id, token) {
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                return Promise.resolve(undefined);
            }
            const item = this._cache.get(...id);
            if (!item) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => this._provider.resolveDocumentLink(item, token)).then(value => {
                return value && typeConvert.DocumentLink.from(value) || undefined;
            });
        }
        releaseLinks(id) {
            this._cache.delete(id);
        }
    }
    class ColorProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideColors(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentColors(doc, token)).then(colors => {
                if (!Array.isArray(colors)) {
                    return [];
                }
                const colorInfos = colors.map(ci => {
                    return {
                        color: typeConvert.Color.from(ci.color),
                        range: typeConvert.Range.from(ci.range)
                    };
                });
                return colorInfos;
            });
        }
        provideColorPresentations(resource, raw, token) {
            const document = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(raw.range);
            const color = typeConvert.Color.to(raw.color);
            return async_1.asPromise(() => this._provider.provideColorPresentations(color, { document, range }, token)).then(value => {
                if (!Array.isArray(value)) {
                    return undefined;
                }
                return value.map(typeConvert.ColorPresentation.from);
            });
        }
    }
    class FoldingProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideFoldingRanges(resource, context, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideFoldingRanges(doc, context, token)).then(ranges => {
                if (!Array.isArray(ranges)) {
                    return undefined;
                }
                return ranges.map(typeConvert.FoldingRange.from);
            });
        }
    }
    class SelectionRangeAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideSelectionRanges(resource, pos, token) {
            const document = this._documents.getDocument(resource);
            const positions = pos.map(typeConvert.Position.to);
            return async_1.asPromise(() => this._provider.provideSelectionRanges(document, positions, token)).then(allProviderRanges => {
                if (!arrays_1.isNonEmptyArray(allProviderRanges)) {
                    return [];
                }
                if (allProviderRanges.length !== positions.length) {
                    console.warn('BAD selection ranges, provider must return ranges for each position');
                    return [];
                }
                const allResults = [];
                for (let i = 0; i < positions.length; i++) {
                    const oneResult = [];
                    allResults.push(oneResult);
                    let last = positions[i];
                    let selectionRange = allProviderRanges[i];
                    while (true) {
                        if (!selectionRange.range.contains(last)) {
                            throw new Error('INVALID selection range, must contain the previous range');
                        }
                        oneResult.push(typeConvert.SelectionRange.from(selectionRange));
                        if (!selectionRange.parent) {
                            break;
                        }
                        last = selectionRange.range;
                        selectionRange = selectionRange.parent;
                    }
                }
                return allResults;
            });
        }
    }
    class CallHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = 0;
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const item = await this._provider.prepareCallHierarchy(doc, pos, token);
            if (!item) {
                return undefined;
            }
            const sessionId = String.fromCharCode(this._idPool++);
            this._cache.set(sessionId, []);
            return { sessionId, root: this._cacheAndConvertItem(sessionId, item) };
        }
        async provideCallsTo(itemId, token) {
            const item = this._itemFromCache(itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyIncomingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => [this._cacheAndConvertItem(itemId, call.from), call.fromRanges.map(typeConvert.Range.from)]);
        }
        async provideCallsFrom(itemId, token) {
            const item = this._itemFromCache(itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyOutgoingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => [this._cacheAndConvertItem(itemId, call.to), call.fromRanges.map(typeConvert.Range.from)]);
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId.charAt(0));
        }
        _cacheAndConvertItem(itemOrSessionId, item) {
            const sessionId = itemOrSessionId.charAt(0);
            const array = this._cache.get(sessionId);
            const dto = {
                id: sessionId + String.fromCharCode(array.length),
                name: item.name,
                detail: item.detail,
                kind: typeConvert.SymbolKind.from(item.kind),
                uri: item.uri,
                range: typeConvert.Range.from(item.range),
                selectionRange: typeConvert.Range.from(item.selectionRange),
            };
            array.push(item);
            return dto;
        }
        _itemFromCache(itemId) {
            const sessionId = itemId.charAt(0);
            const array = this._cache.get(sessionId);
            if (!array) {
                return undefined;
            }
            return array[itemId.charCodeAt(1)];
        }
    }
    class AdapterData {
        constructor(adapter, extension) {
            this.adapter = adapter;
            this.extension = extension;
        }
    }
    class ExtHostLanguageFeatures {
        constructor(mainContext, uriTransformer, documents, commands, diagnostics, logService) {
            this._adapter = new Map();
            this._uriTransformer = uriTransformer;
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadLanguageFeatures);
            this._documents = documents;
            this._commands = commands;
            this._diagnostics = diagnostics;
            this._logService = logService;
        }
        _transformDocumentSelector(selector) {
            return arrays_1.coalesce(arrays_1.asArray(selector).map(sel => this._doTransformDocumentSelector(sel)));
        }
        _doTransformDocumentSelector(selector) {
            if (typeof selector === 'string') {
                return {
                    $serialized: true,
                    language: selector
                };
            }
            if (selector) {
                return {
                    $serialized: true,
                    language: selector.language,
                    scheme: this._transformScheme(selector.scheme),
                    pattern: typeof selector.pattern === 'undefined' ? undefined : typeConvert.GlobPattern.from(selector.pattern),
                    exclusive: selector.exclusive
                };
            }
            return undefined;
        }
        _transformScheme(scheme) {
            if (this._uriTransformer && typeof scheme === 'string') {
                return this._uriTransformer.transformOutgoingScheme(scheme);
            }
            return scheme;
        }
        _createDisposable(handle) {
            return new extHostTypes_1.Disposable(() => {
                this._adapter.delete(handle);
                this._proxy.$unregister(handle);
            });
        }
        _nextHandle() {
            return ExtHostLanguageFeatures._handlePool++;
        }
        _withAdapter(handle, ctor, callback, fallbackValue) {
            const data = this._adapter.get(handle);
            if (!data) {
                return Promise.resolve(fallbackValue);
            }
            if (data.adapter instanceof ctor) {
                let t1;
                if (data.extension) {
                    t1 = Date.now();
                    this._logService.trace(`[${data.extension.identifier.value}] INVOKE provider '${ctor.name}'`);
                }
                const p = callback(data.adapter, data.extension);
                const extension = data.extension;
                if (extension) {
                    Promise.resolve(p).then(() => this._logService.trace(`[${extension.identifier.value}] provider DONE after ${Date.now() - t1}ms`), err => {
                        this._logService.error(`[${extension.identifier.value}] provider FAILED`);
                        this._logService.error(err);
                    });
                }
                return p;
            }
            return Promise.reject(new Error('no adapter found'));
        }
        _addNewAdapter(adapter, extension) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(adapter, extension));
            return handle;
        }
        static _extLabel(ext) {
            return ext.displayName || ext.name;
        }
        // --- outline
        registerDocumentSymbolProvider(extension, selector, provider, metadata) {
            const handle = this._addNewAdapter(new DocumentSymbolAdapter(this._documents, provider), extension);
            const displayName = (metadata && metadata.label) || ExtHostLanguageFeatures._extLabel(extension);
            this._proxy.$registerDocumentSymbolProvider(handle, this._transformDocumentSelector(selector), displayName);
            return this._createDisposable(handle);
        }
        $provideDocumentSymbols(handle, resource, token) {
            return this._withAdapter(handle, DocumentSymbolAdapter, adapter => adapter.provideDocumentSymbols(uri_1.URI.revive(resource), token), undefined);
        }
        // --- code lens
        registerCodeLensProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeCodeLenses === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new CodeLensAdapter(this._documents, this._commands.converter, provider), extension));
            this._proxy.$registerCodeLensSupport(handle, this._transformDocumentSelector(selector), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeCodeLenses(_ => this._proxy.$emitCodeLensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideCodeLenses(handle, resource, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.provideCodeLenses(uri_1.URI.revive(resource), token), undefined);
        }
        $resolveCodeLens(handle, symbol, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.resolveCodeLens(symbol, token), undefined);
        }
        $releaseCodeLenses(handle, cacheId) {
            this._withAdapter(handle, CodeLensAdapter, adapter => Promise.resolve(adapter.releaseCodeLenses(cacheId)), undefined);
        }
        // --- declaration
        registerDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, DefinitionAdapter, adapter => adapter.provideDefinition(uri_1.URI.revive(resource), position, token), []);
        }
        registerDeclarationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DeclarationAdapter(this._documents, provider), extension);
            this._proxy.$registerDeclarationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDeclaration(handle, resource, position, token) {
            return this._withAdapter(handle, DeclarationAdapter, adapter => adapter.provideDeclaration(uri_1.URI.revive(resource), position, token), []);
        }
        registerImplementationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ImplementationAdapter(this._documents, provider), extension);
            this._proxy.$registerImplementationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideImplementation(handle, resource, position, token) {
            return this._withAdapter(handle, ImplementationAdapter, adapter => adapter.provideImplementation(uri_1.URI.revive(resource), position, token), []);
        }
        registerTypeDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeDefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideTypeDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, TypeDefinitionAdapter, adapter => adapter.provideTypeDefinition(uri_1.URI.revive(resource), position, token), []);
        }
        // --- extra info
        registerHoverProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new HoverAdapter(this._documents, provider), extension);
            this._proxy.$registerHoverProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideHover(handle, resource, position, token) {
            return this._withAdapter(handle, HoverAdapter, adapter => adapter.provideHover(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- occurrences
        registerDocumentHighlightProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentHighlightAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentHighlightProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentHighlights(handle, resource, position, token) {
            return this._withAdapter(handle, DocumentHighlightAdapter, adapter => adapter.provideDocumentHighlights(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- references
        registerReferenceProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ReferenceAdapter(this._documents, provider), extension);
            this._proxy.$registerReferenceSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideReferences(handle, resource, position, context, token) {
            return this._withAdapter(handle, ReferenceAdapter, adapter => adapter.provideReferences(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        // --- quick fix
        registerCodeActionProvider(extension, selector, provider, metadata) {
            const handle = this._addNewAdapter(new CodeActionAdapter(this._documents, this._commands.converter, this._diagnostics, provider, this._logService, extension.identifier), extension);
            this._proxy.$registerQuickFixSupport(handle, this._transformDocumentSelector(selector), (metadata && metadata.providedCodeActionKinds) ? metadata.providedCodeActionKinds.map(kind => kind.value) : undefined);
            return this._createDisposable(handle);
        }
        $provideCodeActions(handle, resource, rangeOrSelection, context, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.provideCodeActions(uri_1.URI.revive(resource), rangeOrSelection, context, token), undefined);
        }
        $releaseCodeActions(handle, cacheId) {
            this._withAdapter(handle, CodeActionAdapter, adapter => Promise.resolve(adapter.releaseCodeActions(cacheId)), undefined);
        }
        // --- formatting
        registerDocumentFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentFormattingEdits(handle, resource, options, token) {
            return this._withAdapter(handle, DocumentFormattingAdapter, adapter => adapter.provideDocumentFormattingEdits(uri_1.URI.revive(resource), options, token), undefined);
        }
        registerDocumentRangeFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RangeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerRangeFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeFormattingEdits(handle, resource, range, options, token) {
            return this._withAdapter(handle, RangeFormattingAdapter, adapter => adapter.provideDocumentRangeFormattingEdits(uri_1.URI.revive(resource), range, options, token), undefined);
        }
        registerOnTypeFormattingEditProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new OnTypeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerOnTypeFormattingSupport(handle, this._transformDocumentSelector(selector), triggerCharacters, extension.identifier);
            return this._createDisposable(handle);
        }
        $provideOnTypeFormattingEdits(handle, resource, position, ch, options, token) {
            return this._withAdapter(handle, OnTypeFormattingAdapter, adapter => adapter.provideOnTypeFormattingEdits(uri_1.URI.revive(resource), position, ch, options, token), undefined);
        }
        // --- navigate types
        registerWorkspaceSymbolProvider(extension, provider) {
            const handle = this._addNewAdapter(new NavigateTypeAdapter(provider), extension);
            this._proxy.$registerNavigateTypeSupport(handle);
            return this._createDisposable(handle);
        }
        $provideWorkspaceSymbols(handle, search, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.provideWorkspaceSymbols(search, token), { symbols: [] });
        }
        $resolveWorkspaceSymbol(handle, symbol, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.resolveWorkspaceSymbol(symbol, token), undefined);
        }
        $releaseWorkspaceSymbols(handle, id) {
            this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.releaseWorkspaceSymbols(id), undefined);
        }
        // --- rename
        registerRenameProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RenameAdapter(this._documents, provider), extension);
            this._proxy.$registerRenameSupport(handle, this._transformDocumentSelector(selector), RenameAdapter.supportsResolving(provider));
            return this._createDisposable(handle);
        }
        $provideRenameEdits(handle, resource, position, newName, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.provideRenameEdits(uri_1.URI.revive(resource), position, newName, token), undefined);
        }
        $resolveRenameLocation(handle, resource, position, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.resolveRenameLocation(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- suggestion
        registerCompletionItemProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new SuggestAdapter(this._documents, this._commands.converter, provider), extension);
            this._proxy.$registerSuggestSupport(handle, this._transformDocumentSelector(selector), triggerCharacters, SuggestAdapter.supportsResolving(provider), extension.identifier);
            return this._createDisposable(handle);
        }
        $provideCompletionItems(handle, resource, position, context, token) {
            return this._withAdapter(handle, SuggestAdapter, adapter => adapter.provideCompletionItems(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        $resolveCompletionItem(handle, resource, position, id, token) {
            return this._withAdapter(handle, SuggestAdapter, adapter => adapter.resolveCompletionItem(uri_1.URI.revive(resource), position, id, token), undefined);
        }
        $releaseCompletionItems(handle, id) {
            this._withAdapter(handle, SuggestAdapter, adapter => adapter.releaseCompletionItems(id), undefined);
        }
        // --- parameter hints
        registerSignatureHelpProvider(extension, selector, provider, metadataOrTriggerChars) {
            const metadata = Array.isArray(metadataOrTriggerChars)
                ? { triggerCharacters: metadataOrTriggerChars, retriggerCharacters: [] }
                : metadataOrTriggerChars;
            const handle = this._addNewAdapter(new SignatureHelpAdapter(this._documents, provider), extension);
            this._proxy.$registerSignatureHelpProvider(handle, this._transformDocumentSelector(selector), metadata);
            return this._createDisposable(handle);
        }
        $provideSignatureHelp(handle, resource, position, context, token) {
            return this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.provideSignatureHelp(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        $releaseSignatureHelp(handle, id) {
            this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.releaseSignatureHelp(id), undefined);
        }
        // --- links
        registerDocumentLinkProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentLinkProvider(handle, this._transformDocumentSelector(selector), typeof provider.resolveDocumentLink === 'function');
            return this._createDisposable(handle);
        }
        $provideDocumentLinks(handle, resource, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.provideLinks(uri_1.URI.revive(resource), token), undefined);
        }
        $resolveDocumentLink(handle, id, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.resolveLink(id, token), undefined);
        }
        $releaseDocumentLinks(handle, id) {
            this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.releaseLinks(id), undefined);
        }
        registerColorProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ColorProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentColorProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentColors(handle, resource, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColors(uri_1.URI.revive(resource), token), []);
        }
        $provideColorPresentations(handle, resource, colorInfo, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColorPresentations(uri_1.URI.revive(resource), colorInfo, token), undefined);
        }
        registerFoldingRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new FoldingProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerFoldingRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideFoldingRanges(handle, resource, context, token) {
            return this._withAdapter(handle, FoldingProviderAdapter, adapter => adapter.provideFoldingRanges(uri_1.URI.revive(resource), context, token), undefined);
        }
        // --- smart select
        registerSelectionRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new SelectionRangeAdapter(this._documents, provider), extension);
            this._proxy.$registerSelectionRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideSelectionRanges(handle, resource, positions, token) {
            return this._withAdapter(handle, SelectionRangeAdapter, adapter => adapter.provideSelectionRanges(uri_1.URI.revive(resource), positions, token), []);
        }
        // --- call hierarchy
        registerCallHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new CallHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerCallHierarchyProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $prepareCallHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined);
        }
        $provideCallHierarchyIncomingCalls(handle, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsTo(itemId, token), undefined);
        }
        $provideCallHierarchyOutgoingCalls(handle, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsFrom(itemId, token), undefined);
        }
        $releaseCallHierarchy(handle, sessionId) {
            this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined);
        }
        // --- configuration
        static _serializeRegExp(regExp) {
            return {
                pattern: regExp.source,
                flags: strings_1.regExpFlags(regExp),
            };
        }
        static _serializeIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _serializeOnEnterRule(onEnterRule) {
            return {
                beforeText: ExtHostLanguageFeatures._serializeRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.afterText) : undefined,
                oneLineAboveText: onEnterRule.oneLineAboveText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.oneLineAboveText) : undefined,
                action: onEnterRule.action
            };
        }
        static _serializeOnEnterRules(onEnterRules) {
            return onEnterRules.map(ExtHostLanguageFeatures._serializeOnEnterRule);
        }
        setLanguageConfiguration(languageId, configuration) {
            let { wordPattern } = configuration;
            // check for a valid word pattern
            if (wordPattern && strings_1.regExpLeadsToEndlessLoop(wordPattern)) {
                throw new Error(`Invalid language configuration: wordPattern '${wordPattern}' is not allowed to match the empty string.`);
            }
            // word definition
            if (wordPattern) {
                this._documents.setWordDefinitionFor(languageId, wordPattern);
            }
            else {
                this._documents.setWordDefinitionFor(languageId, undefined);
            }
            const handle = this._nextHandle();
            const serializedConfiguration = {
                comments: configuration.comments,
                brackets: configuration.brackets,
                wordPattern: configuration.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(configuration.wordPattern) : undefined,
                indentationRules: configuration.indentationRules ? ExtHostLanguageFeatures._serializeIndentationRule(configuration.indentationRules) : undefined,
                onEnterRules: configuration.onEnterRules ? ExtHostLanguageFeatures._serializeOnEnterRules(configuration.onEnterRules) : undefined,
                __electricCharacterSupport: configuration.__electricCharacterSupport,
                __characterPairSupport: configuration.__characterPairSupport,
            };
            this._proxy.$setLanguageConfiguration(handle, languageId, serializedConfiguration);
            return this._createDisposable(handle);
        }
    }
    exports.ExtHostLanguageFeatures = ExtHostLanguageFeatures;
    ExtHostLanguageFeatures._handlePool = 0;
});
//# sourceMappingURL=extHostLanguageFeatures.js.map