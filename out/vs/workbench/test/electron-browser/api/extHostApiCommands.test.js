/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/errors", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/editor/common/model/textModel", "./testRPCProtocol", "vs/platform/markers/common/markerService", "vs/platform/markers/common/markers", "vs/platform/commands/common/commands", "vs/editor/common/services/modelService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/browser/mainThreadLanguageFeatures", "vs/workbench/api/common/extHostApiCommands", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/browser/mainThreadCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDiagnostics", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/workbench/contrib/search/browser/search.contribution"], function (require, exports, assert, errors_1, instantiationServiceMock_1, uri_1, types, textModel_1, testRPCProtocol_1, markerService_1, markers_1, commands_1, modelService_1, extHostLanguageFeatures_1, mainThreadLanguageFeatures_1, extHostApiCommands_1, extHostCommands_1, mainThreadCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, extHost_protocol_1, extHostDiagnostics_1, log_1, extensions_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultSelector = { scheme: 'far' };
    const model = textModel_1.TextModel.createFromString([
        'This is the first line',
        'This is the second line',
        'This is the third line',
    ].join('\n'), undefined, undefined, uri_1.URI.parse('far://testing/file.b'));
    let rpcProtocol;
    let extHost;
    let mainThread;
    let commands;
    let disposables = [];
    let originalErrorHandler;
    function assertRejects(fn, message = 'Expected rejection') {
        return fn().then(() => assert.ok(false, message), _err => assert.ok(true));
    }
    suite('ExtHostLanguageFeatureCommands', function () {
        suiteSetup(() => {
            originalErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            errors_1.setUnexpectedErrorHandler(() => { });
            // Use IInstantiationService to get typechecking when instantiating
            let inst;
            {
                let instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
                instantiationService.stub(commands_1.ICommandService, {
                    _serviceBrand: undefined,
                    executeCommand(id, args) {
                        const command = commands_1.CommandsRegistry.getCommands().get(id);
                        if (!command) {
                            return Promise.reject(new Error(id + ' NOT known'));
                        }
                        const { handler } = command;
                        return Promise.resolve(instantiationService.invokeFunction(handler, args));
                    }
                });
                instantiationService.stub(markers_1.IMarkerService, new markerService_1.MarkerService());
                instantiationService.stub(modelService_1.IModelService, {
                    _serviceBrand: undefined,
                    getModel() { return model; },
                    createModel() { throw new Error(); },
                    updateModel() { throw new Error(); },
                    setMode() { throw new Error(); },
                    destroyModel() { throw new Error(); },
                    getModels() { throw new Error(); },
                    onModelAdded: undefined,
                    onModelModeChanged: undefined,
                    onModelRemoved: undefined,
                    getCreationOptions() { throw new Error(); }
                });
                inst = instantiationService;
            }
            const extHostDocumentsAndEditors = new extHostDocumentsAndEditors_1.ExtHostDocumentsAndEditors(rpcProtocol);
            extHostDocumentsAndEditors.$acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        isDirty: false,
                        versionId: model.getVersionId(),
                        modeId: model.getLanguageIdentifier().language,
                        uri: model.uri,
                        lines: model.getValue().split(model.getEOL()),
                        EOL: model.getEOL(),
                    }]
            });
            const extHostDocuments = new extHostDocuments_1.ExtHostDocuments(rpcProtocol, extHostDocumentsAndEditors);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDocuments, extHostDocuments);
            commands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService());
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, commands);
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, inst.createInstance(mainThreadCommands_1.MainThreadCommands, rpcProtocol));
            extHostApiCommands_1.ExtHostApiCommands.register(commands);
            const diagnostics = new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, diagnostics);
            extHost = new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, null, extHostDocuments, commands, diagnostics, new log_1.NullLogService());
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, extHost);
            mainThread = rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadLanguageFeatures, inst.createInstance(mainThreadLanguageFeatures_1.MainThreadLanguageFeatures, rpcProtocol));
            return rpcProtocol.sync();
        });
        suiteTeardown(() => {
            errors_1.setUnexpectedErrorHandler(originalErrorHandler);
            model.dispose();
            mainThread.dispose();
        });
        teardown(() => {
            disposables = lifecycle_1.dispose(disposables);
            return rpcProtocol.sync();
        });
        // --- workspace symbols
        test('WorkspaceSymbols, invalid arguments', function () {
            let promises = [
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeWorkspaceSymbolProvider', true))
            ];
            return Promise.all(promises);
        });
        test('WorkspaceSymbols, back and forth', function () {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols(query) {
                    return [
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/first')),
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/second'))
                    ];
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols(query) {
                    return [
                        new types.SymbolInformation(query, types.SymbolKind.Array, new types.Range(0, 0, 1, 1), uri_1.URI.parse('far://testing/first'))
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeWorkspaceSymbolProvider', 'testing').then(value => {
                    for (let info of value) {
                        assert.ok(info instanceof types.SymbolInformation);
                        assert.equal(info.name, 'testing');
                        assert.equal(info.kind, types.SymbolKind.Array);
                    }
                    assert.equal(value.length, 3);
                });
            });
        });
        test('executeWorkspaceSymbolProvider should accept empty string, #39522', async function () {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('hello', types.SymbolKind.Array, new types.Range(0, 0, 0, 0), uri_1.URI.parse('foo:bar'))];
                }
            }));
            await rpcProtocol.sync();
            let symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '');
            assert.equal(symbols.length, 1);
            await rpcProtocol.sync();
            symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '*');
            assert.equal(symbols.length, 1);
        });
        // --- definition
        test('Definition, invalid arguments', function () {
            let promises = [
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeDefinitionProvider', true, false))
            ];
            return Promise.all(promises);
        });
        test('Definition, back and forth', function () {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return new types.Location(doc.uri, new types.Range(0, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.equal(values.length, 4);
                    for (let v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        // --- declaration
        test('Declaration, back and forth', function () {
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    return new types.Location(doc.uri, new types.Range(0, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDeclaration(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDeclarationProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.equal(values.length, 4);
                    for (let v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        // --- type definition
        test('Type Definition, invalid arguments', function () {
            const promises = [
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider')),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', null)),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', undefined)),
                assertRejects(() => commands.executeCommand('vscode.executeTypeDefinitionProvider', true, false))
            ];
            return Promise.all(promises);
        });
        test('Type Definition, back and forth', function () {
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    return new types.Location(doc.uri, new types.Range(0, 0, 0, 0));
                }
            }));
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideTypeDefinition(doc) {
                    return [
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                        new types.Location(doc.uri, new types.Range(0, 0, 0, 0)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeTypeDefinitionProvider', model.uri, new types.Position(0, 0)).then(values => {
                    assert.equal(values.length, 4);
                    for (const v of values) {
                        assert.ok(v.uri instanceof uri_1.URI);
                        assert.ok(v.range instanceof types.Range);
                    }
                });
            });
        });
        // --- references
        test('reference search, back and forth', function () {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideReferences() {
                    return [
                        new types.Location(uri_1.URI.parse('some:uri/path'), new types.Range(0, 1, 0, 5))
                    ];
                }
            }));
            return commands.executeCommand('vscode.executeReferenceProvider', model.uri, new types.Position(0, 0)).then(values => {
                assert.equal(values.length, 1);
                let [first] = values;
                assert.equal(first.uri.toString(), 'some:uri/path');
                assert.equal(first.range.start.line, 0);
                assert.equal(first.range.start.character, 1);
                assert.equal(first.range.end.line, 0);
                assert.equal(first.range.end.character, 5);
            });
        });
        // --- outline
        test('Outline, back and forth', function () {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    return [
                        new types.SymbolInformation('testing1', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0)),
                        new types.SymbolInformation('testing2', types.SymbolKind.Enum, new types.Range(0, 1, 0, 3)),
                    ];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentSymbolProvider', model.uri).then(values => {
                    assert.equal(values.length, 2);
                    let [first, second] = values;
                    assert.ok(first instanceof types.SymbolInformation);
                    assert.ok(second instanceof types.SymbolInformation);
                    assert.equal(first.name, 'testing2');
                    assert.equal(second.name, 'testing1');
                });
            });
        });
        test('vscode.executeDocumentSymbolProvider command only returns SymbolInformation[] rather than DocumentSymbol[] #57984', function () {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    return [
                        new types.SymbolInformation('SymbolInformation', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0))
                    ];
                }
            }));
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentSymbols() {
                    let root = new types.DocumentSymbol('DocumentSymbol', 'DocumentSymbol#detail', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0), new types.Range(1, 0, 1, 0));
                    root.children = [new types.DocumentSymbol('DocumentSymbol#child', 'DocumentSymbol#detail#child', types.SymbolKind.Enum, new types.Range(1, 0, 1, 0), new types.Range(1, 0, 1, 0))];
                    return [root];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentSymbolProvider', model.uri).then(values => {
                    assert.equal(values.length, 2);
                    let [first, second] = values;
                    assert.ok(first instanceof types.SymbolInformation);
                    assert.ok(!(first instanceof types.DocumentSymbol));
                    assert.ok(second instanceof types.SymbolInformation);
                    assert.equal(first.name, 'DocumentSymbol');
                    assert.equal(first.children.length, 1);
                    assert.equal(second.name, 'SymbolInformation');
                });
            });
        });
        // --- suggest
        test('Suggest, back and forth', function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    let a = new types.CompletionItem('item1');
                    let b = new types.CompletionItem('item2');
                    b.textEdit = types.TextEdit.replace(new types.Range(0, 4, 0, 8), 'foo'); // overwite after
                    let c = new types.CompletionItem('item3');
                    c.textEdit = types.TextEdit.replace(new types.Range(0, 1, 0, 6), 'foobar'); // overwite before & after
                    // snippet string!
                    let d = new types.CompletionItem('item4');
                    d.range = new types.Range(0, 1, 0, 4); // overwite before
                    d.insertText = new types.SnippetString('foo$0bar');
                    return [a, b, c, d];
                }
            }, []));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4)).then(list => {
                    assert.ok(list instanceof types.CompletionList);
                    let values = list.items;
                    assert.ok(Array.isArray(values));
                    assert.equal(values.length, 4);
                    let [first, second, third, fourth] = values;
                    assert.equal(first.label, 'item1');
                    assert.equal(first.textEdit.newText, 'item1');
                    assert.equal(first.textEdit.range.start.line, 0);
                    assert.equal(first.textEdit.range.start.character, 0);
                    assert.equal(first.textEdit.range.end.line, 0);
                    assert.equal(first.textEdit.range.end.character, 4);
                    assert.equal(second.label, 'item2');
                    assert.equal(second.textEdit.newText, 'foo');
                    assert.equal(second.textEdit.range.start.line, 0);
                    assert.equal(second.textEdit.range.start.character, 4);
                    assert.equal(second.textEdit.range.end.line, 0);
                    assert.equal(second.textEdit.range.end.character, 8);
                    assert.equal(third.label, 'item3');
                    assert.equal(third.textEdit.newText, 'foobar');
                    assert.equal(third.textEdit.range.start.line, 0);
                    assert.equal(third.textEdit.range.start.character, 1);
                    assert.equal(third.textEdit.range.end.line, 0);
                    assert.equal(third.textEdit.range.end.character, 6);
                    assert.equal(fourth.label, 'item4');
                    assert.equal(fourth.textEdit, undefined);
                    assert.equal(fourth.range.start.line, 0);
                    assert.equal(fourth.range.start.character, 1);
                    assert.equal(fourth.range.end.line, 0);
                    assert.equal(fourth.range.end.character, 4);
                    assert.ok(fourth.insertText instanceof types.SnippetString);
                    assert.equal(fourth.insertText.value, 'foo$0bar');
                });
            });
        });
        test('Suggest, return CompletionList !array', function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    let a = new types.CompletionItem('item1');
                    let b = new types.CompletionItem('item2');
                    return new types.CompletionList([a, b], true);
                }
            }, []));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4)).then(list => {
                    assert.ok(list instanceof types.CompletionList);
                    assert.equal(list.isIncomplete, true);
                });
            });
        });
        test('Suggest, resolve completion items', async function () {
            let resolveCount = 0;
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    let a = new types.CompletionItem('item1');
                    let b = new types.CompletionItem('item2');
                    let c = new types.CompletionItem('item3');
                    let d = new types.CompletionItem('item4');
                    return new types.CompletionList([a, b, c, d], false);
                },
                resolveCompletionItem(item) {
                    resolveCount += 1;
                    return item;
                }
            }, []));
            await rpcProtocol.sync();
            let list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined, 2 // maxItemsToResolve
            );
            assert.ok(list instanceof types.CompletionList);
            assert.equal(resolveCount, 2);
        });
        test('"vscode.executeCompletionItemProvider" doesnot return a preselect field #53749', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    let a = new types.CompletionItem('item1');
                    a.preselect = true;
                    let b = new types.CompletionItem('item2');
                    let c = new types.CompletionItem('item3');
                    c.preselect = true;
                    let d = new types.CompletionItem('item4');
                    return new types.CompletionList([a, b, c, d], false);
                }
            }, []));
            await rpcProtocol.sync();
            let list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined);
            assert.ok(list instanceof types.CompletionList);
            assert.equal(list.items.length, 4);
            let [a, b, c, d] = list.items;
            assert.equal(a.preselect, true);
            assert.equal(b.preselect, undefined);
            assert.equal(c.preselect, true);
            assert.equal(d.preselect, undefined);
        });
        test('executeCompletionItemProvider doesn\'t capture commitCharacters #58228', async function () {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCompletionItems() {
                    let a = new types.CompletionItem('item1');
                    a.commitCharacters = ['a', 'b'];
                    let b = new types.CompletionItem('item2');
                    return new types.CompletionList([a, b], false);
                }
            }, []));
            await rpcProtocol.sync();
            let list = await commands.executeCommand('vscode.executeCompletionItemProvider', model.uri, new types.Position(0, 4), undefined);
            assert.ok(list instanceof types.CompletionList);
            assert.equal(list.items.length, 2);
            let [a, b] = list.items;
            assert.deepEqual(a.commitCharacters, ['a', 'b']);
            assert.equal(b.commitCharacters, undefined);
        });
        // --- signatureHelp
        test('Parameter Hints, back and forth', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp(_document, _position, _token, context) {
                    return {
                        activeSignature: 0,
                        activeParameter: 1,
                        signatures: [
                            {
                                label: 'abc',
                                documentation: `${context.triggerKind === 1 /* vscode.SignatureHelpTriggerKind.Invoke */ ? 'invoked' : 'unknown'} ${context.triggerCharacter}`,
                                parameters: []
                            }
                        ]
                    };
                }
            }, []));
            await rpcProtocol.sync();
            const firstValue = await commands.executeCommand('vscode.executeSignatureHelpProvider', model.uri, new types.Position(0, 1), ',');
            assert.strictEqual(firstValue.activeSignature, 0);
            assert.strictEqual(firstValue.activeParameter, 1);
            assert.strictEqual(firstValue.signatures.length, 1);
            assert.strictEqual(firstValue.signatures[0].label, 'abc');
            assert.strictEqual(firstValue.signatures[0].documentation, 'invoked ,');
        });
        // --- quickfix
        test('QuickFix, back and forth', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [{ command: 'testing', title: 'Title', arguments: [1, 2, true] }];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, new types.Range(0, 0, 1, 1)).then(value => {
                    assert.equal(value.length, 1);
                    let [first] = value;
                    assert.equal(first.title, 'Title');
                    assert.equal(first.command, 'testing');
                    assert.deepEqual(first.arguments, [1, 2, true]);
                });
            });
        });
        test('vscode.executeCodeActionProvider results seem to be missing their `command` property #45124', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, range) {
                    return [{
                            command: {
                                arguments: [document, range],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                        }];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, new types.Range(0, 0, 1, 1)).then(value => {
                    assert.equal(value.length, 1);
                    const [first] = value;
                    assert.ok(first.command);
                    assert.equal(first.command.command, 'command');
                    assert.equal(first.command.title, 'command_title');
                    assert.equal(first.kind.value, 'foo');
                    assert.equal(first.title, 'title');
                });
            });
        });
        test('vscode.executeCodeActionProvider passes Range to provider although Selection is passed in #77997', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, rangeOrSelection) {
                    return [{
                            command: {
                                arguments: [document, rangeOrSelection],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                        }];
                }
            }));
            const selection = new types.Selection(0, 0, 1, 1);
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, selection).then(value => {
                    assert.equal(value.length, 1);
                    const [first] = value;
                    assert.ok(first.command);
                    assert.ok(first.command.arguments[1] instanceof types.Selection);
                    assert.ok(first.command.arguments[1].isEqual(selection));
                });
            });
        });
        test('vscode.executeCodeActionProvider results seem to be missing their `isPreferred` property #78098', function () {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions(document, rangeOrSelection) {
                    return [{
                            command: {
                                arguments: [document, rangeOrSelection],
                                command: 'command',
                                title: 'command_title',
                            },
                            kind: types.CodeActionKind.Empty.append('foo'),
                            title: 'title',
                            isPreferred: true
                        }];
                }
            }));
            const selection = new types.Selection(0, 0, 1, 1);
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeActionProvider', model.uri, selection).then(value => {
                    assert.equal(value.length, 1);
                    const [first] = value;
                    assert.equal(first.isPreferred, true);
                });
            });
        });
        // --- code lens
        test('CodeLens, back and forth', function () {
            const complexArg = {
                foo() { },
                bar() { },
                big: extHost
            };
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 1, 1), { title: 'Title', command: 'cmd', arguments: [1, true, complexArg] })];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeCodeLensProvider', model.uri).then(value => {
                    assert.equal(value.length, 1);
                    const [first] = value;
                    assert.equal(first.command.title, 'Title');
                    assert.equal(first.command.command, 'cmd');
                    assert.equal(first.command.arguments[0], 1);
                    assert.equal(first.command.arguments[1], true);
                    assert.equal(first.command.arguments[2], complexArg);
                });
            });
        });
        test('CodeLens, resolve', async function () {
            let resolveCount = 0;
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeLenses() {
                    return [
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1)),
                        new types.CodeLens(new types.Range(0, 0, 1, 1), { title: 'Already resolved', command: 'fff' })
                    ];
                },
                resolveCodeLens(codeLens) {
                    codeLens.command = { title: resolveCount.toString(), command: 'resolved' };
                    resolveCount += 1;
                    return codeLens;
                }
            }));
            await rpcProtocol.sync();
            let value = await commands.executeCommand('vscode.executeCodeLensProvider', model.uri, 2);
            assert.equal(value.length, 3); // the resolve argument defines the number of results being returned
            assert.equal(resolveCount, 2);
            resolveCount = 0;
            value = await commands.executeCommand('vscode.executeCodeLensProvider', model.uri);
            assert.equal(value.length, 4);
            assert.equal(resolveCount, 0);
        });
        test('Links, back and forth', function () {
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 0, 20), uri_1.URI.parse('foo:bar'))];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeLinkProvider', model.uri).then(value => {
                    assert.equal(value.length, 1);
                    let [first] = value;
                    assert.equal(first.target + '', 'foo:bar');
                    assert.equal(first.range.start.line, 0);
                    assert.equal(first.range.start.character, 0);
                    assert.equal(first.range.end.line, 0);
                    assert.equal(first.range.end.character, 20);
                });
            });
        });
        test('Color provider', function () {
            disposables.push(extHost.registerColorProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideDocumentColors() {
                    return [new types.ColorInformation(new types.Range(0, 0, 0, 20), new types.Color(0.1, 0.2, 0.3, 0.4))];
                },
                provideColorPresentations() {
                    const cp = new types.ColorPresentation('#ABC');
                    cp.textEdit = types.TextEdit.replace(new types.Range(1, 0, 1, 20), '#ABC');
                    cp.additionalTextEdits = [types.TextEdit.insert(new types.Position(2, 20), '*')];
                    return [cp];
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeDocumentColorProvider', model.uri).then(value => {
                    assert.equal(value.length, 1);
                    let [first] = value;
                    assert.equal(first.color.red, 0.1);
                    assert.equal(first.color.green, 0.2);
                    assert.equal(first.color.blue, 0.3);
                    assert.equal(first.color.alpha, 0.4);
                    assert.equal(first.range.start.line, 0);
                    assert.equal(first.range.start.character, 0);
                    assert.equal(first.range.end.line, 0);
                    assert.equal(first.range.end.character, 20);
                });
            }).then(() => {
                const color = new types.Color(0.5, 0.6, 0.7, 0.8);
                const range = new types.Range(0, 0, 0, 20);
                return commands.executeCommand('vscode.executeColorPresentationProvider', color, { uri: model.uri, range }).then(value => {
                    assert.equal(value.length, 1);
                    let [first] = value;
                    assert.equal(first.label, '#ABC');
                    assert.equal(first.textEdit.newText, '#ABC');
                    assert.equal(first.textEdit.range.start.line, 1);
                    assert.equal(first.textEdit.range.start.character, 0);
                    assert.equal(first.textEdit.range.end.line, 1);
                    assert.equal(first.textEdit.range.end.character, 20);
                    assert.equal(first.additionalTextEdits.length, 1);
                    assert.equal(first.additionalTextEdits[0].range.start.line, 2);
                    assert.equal(first.additionalTextEdits[0].range.start.character, 20);
                    assert.equal(first.additionalTextEdits[0].range.end.line, 2);
                    assert.equal(first.additionalTextEdits[0].range.end.character, 20);
                });
            });
        });
        test('"TypeError: e.onCancellationRequested is not a function" calling hover provider in Insiders #54174', function () {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideHover() {
                    return new types.Hover('fofofofo');
                }
            }));
            return rpcProtocol.sync().then(() => {
                return commands.executeCommand('vscode.executeHoverProvider', model.uri, new types.Position(1, 1)).then(value => {
                    assert.equal(value.length, 1);
                    assert.equal(value[0].contents.length, 1);
                });
            });
        });
        // --- selection ranges
        test('Selection Range, back and forth', async function () {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideSelectionRanges() {
                    return [
                        new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 2, 0, 20))),
                    ];
                }
            }));
            await rpcProtocol.sync();
            let value = await commands.executeCommand('vscode.executeSelectionRangeProvider', model.uri, [new types.Position(0, 10)]);
            assert.equal(value.length, 1);
            assert.ok(value[0].parent);
        });
        // --- call hierarcht
        test('Call Hierarchy, back and forth', async function () {
            disposables.push(extHost.registerCallHierarchyProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCallHierarchyIncomingCalls(document, position, token) {
                    return [
                        new types.CallHierarchyIncomingCall(new types.CallHierarchyItem(types.SymbolKind.Array, 'IN', '', document.uri, new types.Range(0, 0, 2, 0), new types.Range(0, 0, 2, 0)), [new types.Range(0, 0, 0, 0)]),
                    ];
                }
                provideCallHierarchyOutgoingCalls(document, position, token) {
                    return [
                        new types.CallHierarchyOutgoingCall(new types.CallHierarchyItem(types.SymbolKind.Array, 'OUT', '', document.uri, new types.Range(0, 0, 2, 0), new types.Range(0, 0, 2, 0)), [new types.Range(0, 0, 0, 0)]),
                    ];
                }
            }));
            await rpcProtocol.sync();
            let incoming = await commands.executeCommand('vscode.executeCallHierarchyProviderIncomingCalls', model.uri, new types.Position(0, 10));
            assert.equal(incoming.length, 1);
            assert.ok(incoming[0].source instanceof types.CallHierarchyItem);
            assert.equal(incoming[0].source.name, 'IN');
            let outgoing = await commands.executeCommand('vscode.executeCallHierarchyProviderOutgoingCalls', model.uri, new types.Position(0, 10));
            assert.equal(outgoing.length, 1);
            assert.ok(outgoing[0].target instanceof types.CallHierarchyItem);
            assert.equal(outgoing[0].target.name, 'OUT');
        });
    });
});
//# sourceMappingURL=extHostApiCommands.test.js.map