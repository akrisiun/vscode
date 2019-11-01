/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "./apiCommands", "vs/base/common/arrays"], function (require, exports, uri_1, typeConverters, types, apiCommands_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostApiCommands {
        constructor(commands) {
            this._disposables = [];
            this._commands = commands;
        }
        static register(commands) {
            return new ExtHostApiCommands(commands).registerCommands();
        }
        registerCommands() {
            this._register('vscode.executeWorkspaceSymbolProvider', this._executeWorkspaceSymbolProvider, {
                description: 'Execute all workspace symbol provider.',
                args: [{ name: 'query', description: 'Search string', constraint: String }],
                returns: 'A promise that resolves to an array of SymbolInformation-instances.'
            });
            this._register('vscode.executeDefinitionProvider', this._executeDefinitionProvider, {
                description: 'Execute all definition provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position of a symbol', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Location-instances.'
            });
            this._register('vscode.executeDeclarationProvider', this._executeDeclaraionProvider, {
                description: 'Execute all declaration provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position of a symbol', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Location-instances.'
            });
            this._register('vscode.executeTypeDefinitionProvider', this._executeTypeDefinitionProvider, {
                description: 'Execute all type definition providers.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position of a symbol', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Location-instances.'
            });
            this._register('vscode.executeImplementationProvider', this._executeImplementationProvider, {
                description: 'Execute all implementation providers.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position of a symbol', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Location-instance.'
            });
            this._register('vscode.executeHoverProvider', this._executeHoverProvider, {
                description: 'Execute all hover provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position of a symbol', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Hover-instances.'
            });
            this._register('vscode.executeDocumentHighlights', this._executeDocumentHighlights, {
                description: 'Execute document highlight provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of DocumentHighlight-instances.'
            });
            this._register('vscode.executeReferenceProvider', this._executeReferenceProvider, {
                description: 'Execute reference provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position }
                ],
                returns: 'A promise that resolves to an array of Location-instances.'
            });
            this._register('vscode.executeDocumentRenameProvider', this._executeDocumentRenameProvider, {
                description: 'Execute rename provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                    { name: 'newName', description: 'The new symbol name', constraint: String }
                ],
                returns: 'A promise that resolves to a WorkspaceEdit.'
            });
            this._register('vscode.executeSignatureHelpProvider', this._executeSignatureHelpProvider, {
                description: 'Execute signature help provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                    { name: 'triggerCharacter', description: '(optional) Trigger signature help when the user types the character, like `,` or `(`', constraint: (value) => value === undefined || typeof value === 'string' }
                ],
                returns: 'A promise that resolves to SignatureHelp.'
            });
            this._register('vscode.executeDocumentSymbolProvider', this._executeDocumentSymbolProvider, {
                description: 'Execute document symbol provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI }
                ],
                returns: 'A promise that resolves to an array of SymbolInformation and DocumentSymbol instances.'
            });
            this._register('vscode.executeCompletionItemProvider', this._executeCompletionItemProvider, {
                description: 'Execute completion item provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                    { name: 'triggerCharacter', description: '(optional) Trigger completion when the user types the character, like `,` or `(`', constraint: (value) => value === undefined || typeof value === 'string' },
                    { name: 'itemResolveCount', description: '(optional) Number of completions to resolve (too large numbers slow down completions)', constraint: (value) => value === undefined || typeof value === 'number' }
                ],
                returns: 'A promise that resolves to a CompletionList-instance.'
            });
            this._register('vscode.executeCodeActionProvider', this._executeCodeActionProvider, {
                description: 'Execute code action provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'rangeOrSelection', description: 'Range in a text document. Some refactoring provider requires Selection object.', constraint: types.Range },
                    { name: 'kind', description: '(optional) Code action kind to return code actions for', constraint: (value) => !value || typeof value.value === 'string' },
                ],
                returns: 'A promise that resolves to an array of Command-instances.'
            });
            this._register('vscode.executeCodeLensProvider', this._executeCodeLensProvider, {
                description: 'Execute CodeLens provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'itemResolveCount', description: '(optional) Number of lenses that should be resolved and returned. Will only return resolved lenses, will impact performance)', constraint: (value) => value === undefined || typeof value === 'number' }
                ],
                returns: 'A promise that resolves to an array of CodeLens-instances.'
            });
            this._register('vscode.executeFormatDocumentProvider', this._executeFormatDocumentProvider, {
                description: 'Execute document format provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'options', description: 'Formatting options' }
                ],
                returns: 'A promise that resolves to an array of TextEdits.'
            });
            this._register('vscode.executeFormatRangeProvider', this._executeFormatRangeProvider, {
                description: 'Execute range format provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'range', description: 'Range in a text document', constraint: types.Range },
                    { name: 'options', description: 'Formatting options' }
                ],
                returns: 'A promise that resolves to an array of TextEdits.'
            });
            this._register('vscode.executeFormatOnTypeProvider', this._executeFormatOnTypeProvider, {
                description: 'Execute document format provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                    { name: 'ch', description: 'Character that got typed', constraint: String },
                    { name: 'options', description: 'Formatting options' }
                ],
                returns: 'A promise that resolves to an array of TextEdits.'
            });
            this._register('vscode.executeLinkProvider', this._executeDocumentLinkProvider, {
                description: 'Execute document link provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI }
                ],
                returns: 'A promise that resolves to an array of DocumentLink-instances.'
            });
            this._register('vscode.executeCallHierarchyProviderIncomingCalls', this._executeCallHierarchyIncomingCallsProvider, {
                description: 'Execute call hierarchy provider for incoming calls',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                ],
                returns: 'A promise that resolves to an array of CallHierarchyIncomingCall-instances.'
            });
            this._register('vscode.executeCallHierarchyProviderOutgoingCalls', this._executeCallHierarchyOutgoingCallsProvider, {
                description: 'Execute call hierarchy provider for outgoing calls',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'position', description: 'Position in a text document', constraint: types.Position },
                ],
                returns: 'A promise that resolves to an array of CallHierarchyOutgoingCall-instances.'
            });
            this._register('vscode.executeDocumentColorProvider', this._executeDocumentColorProvider, {
                description: 'Execute document color provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                ],
                returns: 'A promise that resolves to an array of ColorInformation objects.'
            });
            this._register('vscode.executeColorPresentationProvider', this._executeColorPresentationProvider, {
                description: 'Execute color presentation provider.',
                args: [
                    { name: 'color', description: 'The color to show and insert', constraint: types.Color },
                    { name: 'context', description: 'Context object with uri and range' }
                ],
                returns: 'A promise that resolves to an array of ColorPresentation objects.'
            });
            this._register('vscode.executeSelectionRangeProvider', this._executeSelectionRangeProvider, {
                description: 'Execute selection range provider.',
                args: [
                    { name: 'uri', description: 'Uri of a text document', constraint: uri_1.URI },
                    { name: 'positions', description: 'Positions in a text document', constraint: Array.isArray }
                ],
                returns: 'A promise that resolves to an array of ranges.'
            });
            const adjustHandler = (handler) => {
                return (...args) => {
                    return handler(this._commands, ...args);
                };
            };
            this._register(apiCommands_1.OpenFolderAPICommand.ID, adjustHandler(apiCommands_1.OpenFolderAPICommand.execute), {
                description: 'Open a folder or workspace in the current window or new window depending on the newWindow argument. Note that opening in the same window will shutdown the current extension host process and start a new one on the given folder/workspace unless the newWindow parameter is set to true.',
                args: [
                    { name: 'uri', description: '(optional) Uri of the folder or workspace file to open. If not provided, a native dialog will ask the user for the folder', constraint: (value) => value === undefined || value instanceof uri_1.URI },
                    { name: 'options', description: '(optional) Options. Object with the following properties: `forceNewWindow `: Whether to open the folder/workspace in a new window or the same. Defaults to opening in the same window. `noRecentEntry`: Whether the opened URI will appear in the \'Open Recent\' list. Defaults to true. Note, for backward compatibility, options can also be of type boolean, representing the `forceNewWindow` setting.', constraint: (value) => value === undefined || typeof value === 'object' || typeof value === 'boolean' }
                ]
            });
            this._register(apiCommands_1.DiffAPICommand.ID, adjustHandler(apiCommands_1.DiffAPICommand.execute), {
                description: 'Opens the provided resources in the diff editor to compare their contents.',
                args: [
                    { name: 'left', description: 'Left-hand side resource of the diff editor', constraint: uri_1.URI },
                    { name: 'right', description: 'Right-hand side resource of the diff editor', constraint: uri_1.URI },
                    { name: 'title', description: '(optional) Human readable title for the diff editor', constraint: (v) => v === undefined || typeof v === 'string' },
                    { name: 'options', description: '(optional) Editor options, see vscode.TextDocumentShowOptions' }
                ]
            });
            this._register(apiCommands_1.OpenAPICommand.ID, adjustHandler(apiCommands_1.OpenAPICommand.execute), {
                description: 'Opens the provided resource in the editor. Can be a text or binary file, or a http(s) url. If you need more control over the options for opening a text file, use vscode.window.showTextDocument instead.',
                args: [
                    { name: 'resource', description: 'Resource to open', constraint: uri_1.URI },
                    { name: 'columnOrOptions', description: '(optional) Either the column in which to open or editor options, see vscode.TextDocumentShowOptions', constraint: (v) => v === undefined || typeof v === 'number' || typeof v === 'object' }
                ]
            });
            this._register(apiCommands_1.RemoveFromRecentlyOpenedAPICommand.ID, adjustHandler(apiCommands_1.RemoveFromRecentlyOpenedAPICommand.execute), {
                description: 'Removes an entry with the given path from the recently opened list.',
                args: [
                    { name: 'path', description: 'Path to remove from recently opened.', constraint: (value) => typeof value === 'string' }
                ]
            });
            this._register(apiCommands_1.SetEditorLayoutAPICommand.ID, adjustHandler(apiCommands_1.SetEditorLayoutAPICommand.execute), {
                description: 'Sets the editor layout. The layout is described as object with an initial (optional) orientation (0 = horizontal, 1 = vertical) and an array of editor groups within. Each editor group can have a size and another array of editor groups that will be laid out orthogonal to the orientation. If editor group sizes are provided, their sum must be 1 to be applied per row or column. Example for a 2x2 grid: `{ orientation: 0, groups: [{ groups: [{}, {}], size: 0.5 }, { groups: [{}, {}], size: 0.5 }] }`',
                args: [
                    { name: 'layout', description: 'The editor layout to set.', constraint: (value) => typeof value === 'object' && Array.isArray(value.groups) }
                ]
            });
            this._register(apiCommands_1.OpenIssueReporter.ID, adjustHandler(apiCommands_1.OpenIssueReporter.execute), {
                description: 'Opens the issue reporter with the provided extension id as the selected source',
                args: [
                    { name: 'extensionId', description: 'extensionId to report an issue on', constraint: (value) => typeof value === 'string' }
                ]
            });
        }
        // --- command impl
        _register(id, handler, description) {
            const disposable = this._commands.registerCommand(false, id, handler, this, description);
            this._disposables.push(disposable);
        }
        /**
         * Execute workspace symbol provider.
         *
         * @param query Search string to match query symbol names
         * @return A promise that resolves to an array of symbol information.
         */
        _executeWorkspaceSymbolProvider(query) {
            return this._commands.executeCommand('_executeWorkspaceSymbolProvider', { query }).then(value => {
                const result = [];
                if (Array.isArray(value)) {
                    for (let tuple of value) {
                        result.push(...tuple[1].map(typeConverters.WorkspaceSymbol.to));
                    }
                }
                return result;
            });
        }
        _executeDefinitionProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeDefinitionProvider', args)
                .then(tryMapWith(typeConverters.location.to));
        }
        _executeDeclaraionProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeDeclarationProvider', args)
                .then(tryMapWith(typeConverters.location.to));
        }
        _executeTypeDefinitionProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeTypeDefinitionProvider', args)
                .then(tryMapWith(typeConverters.location.to));
        }
        _executeImplementationProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeImplementationProvider', args)
                .then(tryMapWith(typeConverters.location.to));
        }
        _executeHoverProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeHoverProvider', args)
                .then(tryMapWith(typeConverters.Hover.to));
        }
        _executeDocumentHighlights(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeDocumentHighlights', args)
                .then(tryMapWith(typeConverters.DocumentHighlight.to));
        }
        _executeReferenceProvider(resource, position) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position)
            };
            return this._commands.executeCommand('_executeReferenceProvider', args)
                .then(tryMapWith(typeConverters.location.to));
        }
        _executeDocumentRenameProvider(resource, position, newName) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position),
                newName
            };
            return this._commands.executeCommand('_executeDocumentRenameProvider', args).then(value => {
                if (!value) {
                    return undefined;
                }
                if (value.rejectReason) {
                    return Promise.reject(new Error(value.rejectReason));
                }
                return typeConverters.WorkspaceEdit.to(value);
            });
        }
        _executeSignatureHelpProvider(resource, position, triggerCharacter) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position),
                triggerCharacter
            };
            return this._commands.executeCommand('_executeSignatureHelpProvider', args).then(value => {
                if (value) {
                    return typeConverters.SignatureHelp.to(value);
                }
                return undefined;
            });
        }
        _executeCompletionItemProvider(resource, position, triggerCharacter, maxItemsToResolve) {
            const args = {
                resource,
                position: position && typeConverters.Position.from(position),
                triggerCharacter,
                maxItemsToResolve
            };
            return this._commands.executeCommand('_executeCompletionItemProvider', args).then(result => {
                if (result) {
                    const items = result.suggestions.map(suggestion => typeConverters.CompletionItem.to(suggestion));
                    return new types.CompletionList(items, result.incomplete);
                }
                return undefined;
            });
        }
        _executeDocumentColorProvider(resource) {
            const args = {
                resource
            };
            return this._commands.executeCommand('_executeDocumentColorProvider', args).then(result => {
                if (result) {
                    return result.map(ci => ({ range: typeConverters.Range.to(ci.range), color: typeConverters.Color.to(ci.color) }));
                }
                return [];
            });
        }
        _executeSelectionRangeProvider(resource, positions) {
            const pos = positions.map(typeConverters.Position.from);
            const args = {
                resource,
                position: pos[0],
                positions: pos
            };
            return this._commands.executeCommand('_executeSelectionRangeProvider', args).then(result => {
                return result.map(ranges => {
                    let node;
                    for (const range of ranges.reverse()) {
                        node = new types.SelectionRange(typeConverters.Range.to(range), node);
                    }
                    return node;
                });
            });
        }
        _executeColorPresentationProvider(color, context) {
            const args = {
                resource: context.uri,
                color: typeConverters.Color.from(color),
                range: typeConverters.Range.from(context.range),
            };
            return this._commands.executeCommand('_executeColorPresentationProvider', args).then(result => {
                if (result) {
                    return result.map(typeConverters.ColorPresentation.to);
                }
                return [];
            });
        }
        _executeDocumentSymbolProvider(resource) {
            const args = {
                resource
            };
            return this._commands.executeCommand('_executeDocumentSymbolProvider', args).then((value) => {
                if (arrays_1.isFalsyOrEmpty(value)) {
                    return undefined;
                }
                class MergedInfo extends types.SymbolInformation {
                    static to(symbol) {
                        const res = new MergedInfo(symbol.name, typeConverters.SymbolKind.to(symbol.kind), symbol.containerName || '', new types.Location(resource, typeConverters.Range.to(symbol.range)));
                        res.detail = symbol.detail;
                        res.range = res.location.range;
                        res.selectionRange = typeConverters.Range.to(symbol.selectionRange);
                        res.children = symbol.children ? symbol.children.map(MergedInfo.to) : [];
                        return res;
                    }
                }
                return value.map(MergedInfo.to);
            });
        }
        _executeCodeActionProvider(resource, rangeOrSelection, kind) {
            const args = {
                resource,
                rangeOrSelection: types.Selection.isSelection(rangeOrSelection)
                    ? typeConverters.Selection.from(rangeOrSelection)
                    : typeConverters.Range.from(rangeOrSelection),
                kind
            };
            return this._commands.executeCommand('_executeCodeActionProvider', args)
                .then(tryMapWith(codeAction => {
                if (codeAction._isSynthetic) {
                    if (!codeAction.command) {
                        throw new Error('Synthetic code actions must have a command');
                    }
                    return this._commands.converter.fromInternal(codeAction.command);
                }
                else {
                    const ret = new types.CodeAction(codeAction.title, codeAction.kind ? new types.CodeActionKind(codeAction.kind) : undefined);
                    if (codeAction.edit) {
                        ret.edit = typeConverters.WorkspaceEdit.to(codeAction.edit);
                    }
                    if (codeAction.command) {
                        ret.command = this._commands.converter.fromInternal(codeAction.command);
                    }
                    ret.isPreferred = codeAction.isPreferred;
                    return ret;
                }
            }));
        }
        _executeCodeLensProvider(resource, itemResolveCount) {
            const args = { resource, itemResolveCount };
            return this._commands.executeCommand('_executeCodeLensProvider', args)
                .then(tryMapWith(item => {
                return new types.CodeLens(typeConverters.Range.to(item.range), item.command ? this._commands.converter.fromInternal(item.command) : undefined);
            }));
        }
        _executeFormatDocumentProvider(resource, options) {
            const args = {
                resource,
                options
            };
            return this._commands.executeCommand('_executeFormatDocumentProvider', args)
                .then(tryMapWith(edit => new types.TextEdit(typeConverters.Range.to(edit.range), edit.text)));
        }
        _executeFormatRangeProvider(resource, range, options) {
            const args = {
                resource,
                range: typeConverters.Range.from(range),
                options
            };
            return this._commands.executeCommand('_executeFormatRangeProvider', args)
                .then(tryMapWith(edit => new types.TextEdit(typeConverters.Range.to(edit.range), edit.text)));
        }
        _executeFormatOnTypeProvider(resource, position, ch, options) {
            const args = {
                resource,
                position: typeConverters.Position.from(position),
                ch,
                options
            };
            return this._commands.executeCommand('_executeFormatOnTypeProvider', args)
                .then(tryMapWith(edit => new types.TextEdit(typeConverters.Range.to(edit.range), edit.text)));
        }
        _executeDocumentLinkProvider(resource) {
            return this._commands.executeCommand('_executeLinkProvider', resource)
                .then(tryMapWith(typeConverters.DocumentLink.to));
        }
        async _executeCallHierarchyIncomingCallsProvider(resource, position) {
            const args = { resource, position: typeConverters.Position.from(position) };
            const calls = await this._commands.executeCommand('_executeCallHierarchyIncomingCalls', args);
            const result = [];
            for (const call of calls) {
                result.push(new types.CallHierarchyIncomingCall(typeConverters.CallHierarchyItem.to(call.source), call.sourceRanges.map(typeConverters.Range.to)));
            }
            return result;
        }
        async _executeCallHierarchyOutgoingCallsProvider(resource, position) {
            const args = { resource, position: typeConverters.Position.from(position) };
            const calls = await this._commands.executeCommand('_executeCallHierarchyOutgoingCalls', args);
            const result = [];
            for (const call of calls) {
                result.push(new types.CallHierarchyOutgoingCall(typeConverters.CallHierarchyItem.to(call.target), call.sourceRanges.map(typeConverters.Range.to)));
            }
            return result;
        }
    }
    exports.ExtHostApiCommands = ExtHostApiCommands;
    function tryMapWith(f) {
        return (value) => {
            if (Array.isArray(value)) {
                return value.map(f);
            }
            return undefined;
        };
    }
});
//# sourceMappingURL=extHostApiCommands.js.map