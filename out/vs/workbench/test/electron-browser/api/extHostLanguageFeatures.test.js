/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/editor/common/model/textModel", "vs/editor/common/core/position", "vs/editor/common/core/range", "./testRPCProtocol", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/workbench/api/common/extHostLanguageFeatures", "vs/workbench/api/browser/mainThreadLanguageFeatures", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/browser/mainThreadCommands", "vs/workbench/api/common/extHostDocuments", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/editor/contrib/quickOpen/quickOpen", "vs/editor/common/modes", "vs/editor/contrib/codelens/codelens", "vs/editor/contrib/goToDefinition/goToDefinition", "vs/editor/contrib/hover/getHover", "vs/editor/contrib/wordHighlighter/wordHighlighter", "vs/editor/contrib/referenceSearch/referenceSearch", "vs/editor/contrib/codeAction/codeAction", "vs/workbench/contrib/search/common/search", "vs/editor/contrib/rename/rename", "vs/editor/contrib/parameterHints/provideSignatureHelp", "vs/editor/contrib/suggest/suggest", "vs/editor/contrib/format/format", "vs/editor/contrib/links/getLinks", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDiagnostics", "vs/platform/log/common/log", "vs/editor/contrib/colorPicker/color", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/editor/contrib/smartSelect/smartSelect", "vs/workbench/test/electron-browser/api/mock", "vs/base/common/lifecycle", "vs/base/common/types"], function (require, exports, assert, instantiationServiceMock_1, errors_1, uri_1, types, textModel_1, position_1, range_1, testRPCProtocol_1, markers_1, markerService_1, extHostLanguageFeatures_1, mainThreadLanguageFeatures_1, extHostCommands_1, mainThreadCommands_1, extHostDocuments_1, extHostDocumentsAndEditors_1, quickOpen_1, modes, codelens_1, goToDefinition_1, getHover_1, wordHighlighter_1, referenceSearch_1, codeAction_1, search_1, rename_1, provideSignatureHelp_1, suggest_1, format_1, getLinks_1, extHost_protocol_1, extHostDiagnostics_1, log_1, color_1, cancellation_1, extensions_1, smartSelect_1, mock_1, lifecycle_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultSelector = { scheme: 'far' };
    const model = textModel_1.TextModel.createFromString([
        'This is the first line',
        'This is the second line',
        'This is the third line',
    ].join('\n'), undefined, undefined, uri_1.URI.parse('far://testing/file.a'));
    let extHost;
    let mainThread;
    let disposables = [];
    let rpcProtocol;
    let originalErrorHandler;
    suite('ExtHostLanguageFeatures', function () {
        suiteSetup(() => {
            rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            // Use IInstantiationService to get typechecking when instantiating
            let inst;
            {
                let instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                instantiationService.stub(markers_1.IMarkerService, markerService_1.MarkerService);
                inst = instantiationService;
            }
            originalErrorHandler = errors_1.errorHandler.getUnexpectedErrorHandler();
            errors_1.setUnexpectedErrorHandler(() => { });
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
            const commands = new extHostCommands_1.ExtHostCommands(rpcProtocol, new log_1.NullLogService());
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostCommands, commands);
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadCommands, inst.createInstance(mainThreadCommands_1.MainThreadCommands, rpcProtocol));
            const diagnostics = new extHostDiagnostics_1.ExtHostDiagnostics(rpcProtocol);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics, diagnostics);
            extHost = new extHostLanguageFeatures_1.ExtHostLanguageFeatures(rpcProtocol, null, extHostDocuments, commands, diagnostics, new log_1.NullLogService());
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostLanguageFeatures, extHost);
            mainThread = rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadLanguageFeatures, inst.createInstance(mainThreadLanguageFeatures_1.MainThreadLanguageFeatures, rpcProtocol));
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
        // --- outline
        test('DocumentSymbols, register/deregister', async () => {
            assert.equal(modes.DocumentSymbolProviderRegistry.all(model).length, 0);
            let d1 = extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [];
                }
            });
            await rpcProtocol.sync();
            assert.equal(modes.DocumentSymbolProviderRegistry.all(model).length, 1);
            d1.dispose();
            return rpcProtocol.sync();
        });
        test('DocumentSymbols, evil provider', async () => {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    throw new Error('evil document symbol provider');
                }
            }));
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await quickOpen_1.getDocumentSymbols(model, true, cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
        });
        test('DocumentSymbols, data conversion', async () => {
            disposables.push(extHost.registerDocumentSymbolProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentSymbols() {
                    return [new types.SymbolInformation('test', types.SymbolKind.Field, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await quickOpen_1.getDocumentSymbols(model, true, cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let entry = value[0];
            assert.equal(entry.name, 'test');
            assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        // --- code lens
        test('CodeLens, evil provider', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await codelens_1.getCodeLensData(model, cancellation_1.CancellationToken.None);
            assert.equal(value.lenses.length, 1);
        });
        test('CodeLens, do not resolve a resolved lens', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0), { command: 'id', title: 'Title' })];
                }
                resolveCodeLens() {
                    assert.ok(false, 'do not resolve');
                }
            }));
            await rpcProtocol.sync();
            const value = await codelens_1.getCodeLensData(model, cancellation_1.CancellationToken.None);
            assert.equal(value.lenses.length, 1);
            const [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.equal(symbol.command.id, 'id');
            assert.equal(symbol.command.title, 'Title');
        });
        test('CodeLens, missing command', async () => {
            disposables.push(extHost.registerCodeLensProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeLenses() {
                    return [new types.CodeLens(new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await codelens_1.getCodeLensData(model, cancellation_1.CancellationToken.None);
            assert.equal(value.lenses.length, 1);
            let [data] = value.lenses;
            const symbol = await Promise.resolve(data.provider.resolveCodeLens(model, data.symbol, cancellation_1.CancellationToken.None));
            assert.equal(symbol.command.id, 'missing');
            assert.equal(symbol.command.title, '!!MISSING: command!!');
        });
        // --- definition
        test('Definition, data conversion', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await goToDefinition_1.getDefinitionsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.equal(entry.uri.toString(), model.uri.toString());
        });
        test('Definition, one or many', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 1, 1, 1))];
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(1, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await goToDefinition_1.getDefinitionsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 2);
        });
        test('Definition, registration order', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return [new types.Location(uri_1.URI.parse('far://first'), new types.Range(2, 3, 4, 5))];
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(uri_1.URI.parse('far://second'), new types.Range(1, 2, 3, 4));
                }
            }));
            await rpcProtocol.sync();
            const value = await goToDefinition_1.getDefinitionsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 2);
            // let [first, second] = value;
            assert.equal(value[0].uri.authority, 'second');
            assert.equal(value[1].uri.authority, 'first');
        });
        test('Definition, evil provider', async () => {
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    throw new Error('evil provider');
                }
            }));
            disposables.push(extHost.registerDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDefinition() {
                    return new types.Location(model.uri, new types.Range(1, 1, 1, 1));
                }
            }));
            await rpcProtocol.sync();
            const value = await goToDefinition_1.getDefinitionsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
        });
        // -- declaration
        test('Declaration, data conversion', async () => {
            disposables.push(extHost.registerDeclarationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDeclaration() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await goToDefinition_1.getDeclarationsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.equal(entry.uri.toString(), model.uri.toString());
        });
        // --- implementation
        test('Implementation, data conversion', async () => {
            disposables.push(extHost.registerImplementationProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideImplementation() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await goToDefinition_1.getImplementationsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.equal(entry.uri.toString(), model.uri.toString());
        });
        // --- type definition
        test('Type Definition, data conversion', async () => {
            disposables.push(extHost.registerTypeDefinitionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideTypeDefinition() {
                    return [new types.Location(model.uri, new types.Range(1, 2, 3, 4))];
                }
            }));
            await rpcProtocol.sync();
            let value = await goToDefinition_1.getTypeDefinitionsAtPosition(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 4, endColumn: 5 });
            assert.equal(entry.uri.toString(), model.uri.toString());
        });
        // --- extra info
        test('HoverProvider, word range at pos', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            getHover_1.getHover(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.equal(value.length, 1);
                let [entry] = value;
                assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            });
        });
        test('HoverProvider, given range', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello', new types.Range(3, 0, 8, 7));
                }
            }));
            await rpcProtocol.sync();
            getHover_1.getHover(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.equal(value.length, 1);
                let [entry] = value;
                assert.deepEqual(entry.range, { startLineNumber: 4, startColumn: 1, endLineNumber: 9, endColumn: 8 });
            });
        });
        test('HoverProvider, registration order', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered first');
                }
            }));
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('registered second');
                }
            }));
            await rpcProtocol.sync();
            const value = await getHover_1.getHover(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 2);
            let [first, second] = value;
            assert.equal(first.contents[0].value, 'registered second');
            assert.equal(second.contents[0].value, 'registered first');
        });
        test('HoverProvider, evil provider', async () => {
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerHoverProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideHover() {
                    return new types.Hover('Hello');
                }
            }));
            await rpcProtocol.sync();
            getHover_1.getHover(model, new position_1.Position(1, 1), cancellation_1.CancellationToken.None).then(value => {
                assert.equal(value.length, 1);
            });
        });
        // --- occurrences
        test('Occurrences, data conversion', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await wordHighlighter_1.getOccurrencesAtPosition(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            const [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.equal(entry.kind, modes.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 1/2', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [];
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await wordHighlighter_1.getOccurrencesAtPosition(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            const [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 5 });
            assert.equal(entry.kind, modes.DocumentHighlightKind.Text);
        });
        test('Occurrences, order 2/2', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 2))];
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = (await wordHighlighter_1.getOccurrencesAtPosition(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            const [entry] = value;
            assert.deepEqual(entry.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 3 });
            assert.equal(entry.kind, modes.DocumentHighlightKind.Text);
        });
        test('Occurrences, evil provider', async () => {
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerDocumentHighlightProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentHighlights() {
                    return [new types.DocumentHighlight(new types.Range(0, 0, 0, 4))];
                }
            }));
            await rpcProtocol.sync();
            const value = await wordHighlighter_1.getOccurrencesAtPosition(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
        });
        // --- references
        test('References, registration order', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/first'), new types.Range(0, 0, 0, 0))];
                }
            }));
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(uri_1.URI.parse('far://register/second'), new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            let value = await referenceSearch_1.provideReferences(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 2);
            let [first, second] = value;
            assert.equal(first.uri.path, '/second');
            assert.equal(second.uri.path, '/first');
        });
        test('References, data conversion', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Position(0, 0))];
                }
            }));
            await rpcProtocol.sync();
            let value = await referenceSearch_1.provideReferences(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [item] = value;
            assert.deepEqual(item.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.equal(item.uri.toString(), model.uri.toString());
        });
        test('References, evil provider', async () => {
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerReferenceProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideReferences() {
                    return [new types.Location(model.uri, new types.Range(0, 0, 0, 0))];
                }
            }));
            await rpcProtocol.sync();
            const value = await referenceSearch_1.provideReferences(model, new position_1.Position(1, 2), cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
        });
        // --- quick fix
        test('Quick Fix, command data conversion', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        { command: 'test1', title: 'Testing1' },
                        { command: 'test2', title: 'Testing2' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { actions } = await codeAction_1.getCodeActions(model, model.getFullModelRange(), { type: 'manual' }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 2);
            const [first, second] = actions;
            assert.equal(first.title, 'Testing1');
            assert.equal(first.command.id, 'test1');
            assert.equal(second.title, 'Testing2');
            assert.equal(second.command.id, 'test2');
        });
        test('Quick Fix, code action data conversion', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, {
                provideCodeActions() {
                    return [
                        {
                            title: 'Testing1',
                            command: { title: 'Testing1Command', command: 'test1' },
                            kind: types.CodeActionKind.Empty.append('test.scope')
                        }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { actions } = await codeAction_1.getCodeActions(model, model.getFullModelRange(), { type: 'manual' }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 1);
            const [first] = actions;
            assert.equal(first.title, 'Testing1');
            assert.equal(first.command.title, 'Testing1Command');
            assert.equal(first.command.id, 'test1');
            assert.equal(first.kind, 'test.scope');
        });
        test('Cannot read property \'id\' of undefined, #29469', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [
                        undefined,
                        null,
                        { command: 'test', title: 'Testing' }
                    ];
                }
            }));
            await rpcProtocol.sync();
            const { actions } = await codeAction_1.getCodeActions(model, model.getFullModelRange(), { type: 'manual' }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 1);
        });
        test('Quick Fix, evil provider', async () => {
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerCodeActionProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCodeActions() {
                    return [{ command: 'test', title: 'Testing' }];
                }
            }));
            await rpcProtocol.sync();
            const { actions } = await codeAction_1.getCodeActions(model, model.getFullModelRange(), { type: 'manual' }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 1);
        });
        // --- navigate types
        test('Navigate types, evil provider', async () => {
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    throw new Error('evil');
                }
            }));
            disposables.push(extHost.registerWorkspaceSymbolProvider(extensions_1.nullExtensionDescription, new class {
                provideWorkspaceSymbols() {
                    return [new types.SymbolInformation('testing', types.SymbolKind.Array, new types.Range(0, 0, 1, 1))];
                }
            }));
            await rpcProtocol.sync();
            let value = await search_1.getWorkspaceSymbols('');
            assert.equal(value.length, 1);
            const [first] = value;
            const [, symbols] = first;
            assert.equal(symbols.length, 1);
            assert.equal(symbols[0].name, 'testing');
        });
        // --- rename
        test('Rename, evil provider 0/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw new class Foo {
                    };
                }
            }));
            await rpcProtocol.sync();
            try {
                await rename_1.rename(model, new position_1.Position(1, 1), 'newName');
                throw Error();
            }
            catch (err) {
                // expected
            }
        });
        test('Rename, evil provider 1/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            await rpcProtocol.sync();
            const value = await rename_1.rename(model, new position_1.Position(1, 1), 'newName');
            assert.equal(value.rejectReason, 'evil');
        });
        test('Rename, evil provider 2/2', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    throw Error('evil');
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    let edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    return edit;
                }
            }));
            await rpcProtocol.sync();
            const value = await rename_1.rename(model, new position_1.Position(1, 1), 'newName');
            assert.equal(value.edits.length, 1);
        });
        test('Rename, ordering', async () => {
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideRenameEdits() {
                    let edit = new types.WorkspaceEdit();
                    edit.replace(model.uri, new types.Range(0, 0, 0, 0), 'testing');
                    edit.replace(model.uri, new types.Range(1, 0, 1, 0), 'testing');
                    return edit;
                }
            }));
            disposables.push(extHost.registerRenameProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideRenameEdits() {
                    return;
                }
            }));
            await rpcProtocol.sync();
            const value = await rename_1.rename(model, new position_1.Position(1, 1), 'newName');
            // least relevant rename provider
            assert.equal(value.edits.length, 2);
            assert.equal(value.edits[0].edits.length, 1);
            assert.equal(value.edits[1].edits.length, 1);
        });
        // --- parameter hints
        test('Parameter Hints, order', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return undefined;
                }
            }, []));
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    return {
                        signatures: [],
                        activeParameter: 0,
                        activeSignature: 0
                    };
                }
            }, []));
            await rpcProtocol.sync();
            const value = await provideSignatureHelp_1.provideSignatureHelp(model, new position_1.Position(1, 1), { triggerKind: modes.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.ok(value);
        });
        test('Parameter Hints, evil provider', async () => {
            disposables.push(extHost.registerSignatureHelpProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSignatureHelp() {
                    throw new Error('evil');
                }
            }, []));
            await rpcProtocol.sync();
            const value = await provideSignatureHelp_1.provideSignatureHelp(model, new position_1.Position(1, 1), { triggerKind: modes.SignatureHelpTriggerKind.Invoke, isRetrigger: false }, cancellation_1.CancellationToken.None);
            assert.equal(value, undefined);
        });
        // --- suggestions
        test('Suggest, order 1/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing1')];
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing2')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */)));
            assert.equal(value.length, 1);
            assert.equal(value[0].completion.insertText, 'testing2');
        });
        test('Suggest, order 2/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, '*', new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('weak-selector')]; // weaker selector but result
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return []; // stronger selector but not a good result;
                }
            }, []));
            await rpcProtocol.sync();
            const value = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */)));
            assert.equal(value.length, 1);
            assert.equal(value[0].completion.insertText, 'weak-selector');
        });
        test('Suggest, order 2/3', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-1')];
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('strong-2')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */)));
            assert.equal(value.length, 2);
            assert.equal(value[0].completion.insertText, 'strong-1'); // sort by label
            assert.equal(value[1].completion.insertText, 'strong-2');
        });
        test('Suggest, evil provider', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    throw new Error('evil');
                }
            }, []));
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return [new types.CompletionItem('testing')];
                }
            }, []));
            await rpcProtocol.sync();
            const value = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */)));
            assert.equal(value[0].container.incomplete, undefined);
        });
        test('Suggest, CompletionList', async () => {
            disposables.push(extHost.registerCompletionItemProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideCompletionItems() {
                    return new types.CompletionList([new types.CompletionItem('hello')], true);
                }
            }, []));
            await rpcProtocol.sync();
            suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */))).then(value => {
                assert.equal(value[0].container.incomplete, true);
            });
        });
        // --- format
        const NullWorkerService = new class extends mock_1.mock() {
            computeMoreMinimalEdits(resource, edits) {
                return Promise.resolve(types_1.withNullAsUndefined(edits));
            }
        };
        test('Format Doc, data conversion', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing'), types.TextEdit.setEndOfLine(types.EndOfLine.LF)];
                }
            }));
            await rpcProtocol.sync();
            let value = (await format_1.getDocumentFormattingEditsUntilResult(NullWorkerService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.equal(value.length, 2);
            let [first, second] = value;
            assert.equal(first.text, 'testing');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
            assert.equal(second.eol, 0 /* LF */);
            assert.equal(second.text, '');
            assert.deepEqual(second.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Doc, evil provider', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return format_1.getDocumentFormattingEditsUntilResult(NullWorkerService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format Doc, order', async () => {
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return undefined;
                }
            }));
            await rpcProtocol.sync();
            let value = (await format_1.getDocumentFormattingEditsUntilResult(NullWorkerService, model, { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            let [first] = value;
            assert.equal(first.text, 'testing');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, data conversion', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'testing')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await format_1.getDocumentRangeFormattingEditsUntilResult(NullWorkerService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            const [first] = value;
            assert.equal(first.text, 'testing');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Format Range, + format_doc', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), 'range')];
                }
            }));
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(2, 3, 4, 5), 'range2')];
                }
            }));
            disposables.push(extHost.registerDocumentFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 1, 1), 'doc')];
                }
            }));
            await rpcProtocol.sync();
            const value = (await format_1.getDocumentRangeFormattingEditsUntilResult(NullWorkerService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None));
            assert.equal(value.length, 1);
            const [first] = value;
            assert.equal(first.text, 'range2');
            assert.equal(first.range.startLineNumber, 3);
            assert.equal(first.range.startColumn, 4);
            assert.equal(first.range.endLineNumber, 5);
            assert.equal(first.range.endColumn, 6);
        });
        test('Format Range, evil provider', async () => {
            disposables.push(extHost.registerDocumentRangeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentRangeFormattingEdits() {
                    throw new Error('evil');
                }
            }));
            await rpcProtocol.sync();
            return format_1.getDocumentRangeFormattingEditsUntilResult(NullWorkerService, model, new range_1.Range(1, 1, 1, 1), { insertSpaces: true, tabSize: 4 }, cancellation_1.CancellationToken.None);
        });
        test('Format on Type, data conversion', async () => {
            disposables.push(extHost.registerOnTypeFormattingEditProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideOnTypeFormattingEdits() {
                    return [new types.TextEdit(new types.Range(0, 0, 0, 0), arguments[2])];
                }
            }, [';']));
            await rpcProtocol.sync();
            const value = (await format_1.getOnTypeFormattingEdits(NullWorkerService, model, new position_1.Position(1, 1), ';', { insertSpaces: true, tabSize: 2 }));
            assert.equal(value.length, 1);
            const [first] = value;
            assert.equal(first.text, ';');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 });
        });
        test('Links, data conversion', async () => {
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    const link = new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'));
                    link.tooltip = 'tooltip';
                    return [link];
                }
            }));
            await rpcProtocol.sync();
            let { links } = await getLinks_1.getLinks(model, cancellation_1.CancellationToken.None);
            assert.equal(links.length, 1);
            let [first] = links;
            assert.equal(first.url, 'foo:bar#3');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
            assert.equal(first.tooltip, 'tooltip');
        });
        test('Links, evil provider', async () => {
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    return [new types.DocumentLink(new types.Range(0, 0, 1, 1), uri_1.URI.parse('foo:bar#3'))];
                }
            }));
            disposables.push(extHost.registerDocumentLinkProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentLinks() {
                    throw new Error();
                }
            }));
            await rpcProtocol.sync();
            let { links } = await getLinks_1.getLinks(model, cancellation_1.CancellationToken.None);
            assert.equal(links.length, 1);
            let [first] = links;
            assert.equal(first.url, 'foo:bar#3');
            assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 2, endColumn: 2 });
        });
        test('Document colors, data conversion', async () => {
            disposables.push(extHost.registerColorProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideDocumentColors() {
                    return [new types.ColorInformation(new types.Range(0, 0, 0, 20), new types.Color(0.1, 0.2, 0.3, 0.4))];
                }
                provideColorPresentations(color, context) {
                    return [];
                }
            }));
            await rpcProtocol.sync();
            let value = await color_1.getColors(model, cancellation_1.CancellationToken.None);
            assert.equal(value.length, 1);
            let [first] = value;
            assert.deepEqual(first.colorInfo.color, { red: 0.1, green: 0.2, blue: 0.3, alpha: 0.4 });
            assert.deepEqual(first.colorInfo.range, { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 21 });
        });
        // -- selection ranges
        test('Selection Ranges, data conversion', async () => {
            disposables.push(extHost.registerSelectionRangeProvider(extensions_1.nullExtensionDescription, defaultSelector, new class {
                provideSelectionRanges() {
                    return [
                        new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 2, 0, 20))),
                    ];
                }
            }));
            await rpcProtocol.sync();
            smartSelect_1.provideSelectionRanges(model, [new position_1.Position(1, 17)], cancellation_1.CancellationToken.None).then(ranges => {
                assert.equal(ranges.length, 1);
                assert.ok(ranges[0].length >= 2);
            });
        });
        test('Selection Ranges, bad data', async () => {
            try {
                let _a = new types.SelectionRange(new types.Range(0, 10, 0, 18), new types.SelectionRange(new types.Range(0, 11, 0, 18)));
                assert.ok(false, String(_a));
            }
            catch (err) {
                assert.ok(true);
            }
        });
    });
});
//# sourceMappingURL=extHostLanguageFeatures.test.js.map