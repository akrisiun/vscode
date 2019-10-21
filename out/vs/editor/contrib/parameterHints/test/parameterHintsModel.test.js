/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/editorCommon", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/test/browser/testCodeEditor", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/editor/contrib/parameterHints/parameterHintsModel"], function (require, exports, assert, lifecycle_1, uri_1, editorCommon_1, textModel_1, modes, testCodeEditor_1, serviceCollection_1, storage_1, telemetry_1, telemetryUtils_1, parameterHintsModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockFile = uri_1.URI.parse('test:somefile.ttt');
    const mockFileSelector = { scheme: 'test' };
    const emptySigHelp = {
        signatures: [{
                label: 'none',
                parameters: []
            }],
        activeParameter: 0,
        activeSignature: 0
    };
    const emptySigHelpResult = {
        value: emptySigHelp,
        dispose: () => { }
    };
    suite('ParameterHintsModel', () => {
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.clear();
        });
        teardown(() => {
            disposables.clear();
        });
        function createMockEditor(fileContents) {
            const textModel = textModel_1.TextModel.createFromString(fileContents, undefined, undefined, mockFile);
            const editor = testCodeEditor_1.createTestCodeEditor({
                model: textModel,
                serviceCollection: new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [storage_1.IStorageService, new storage_1.InMemoryStorageService()])
            });
            disposables.add(textModel);
            disposables.add(editor);
            return editor;
        }
        test('Provider should get trigger character on type', (done) => {
            const triggerChar = '(';
            const editor = createMockEditor('');
            disposables.add(new parameterHintsModel_1.ParameterHintsModel(editor));
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                    assert.strictEqual(context.triggerCharacter, triggerChar);
                    done();
                    return undefined;
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
        });
        test('Provider should be retriggered if already active', (done) => {
            const triggerChar = '(';
            const editor = createMockEditor('');
            disposables.add(new parameterHintsModel_1.ParameterHintsModel(editor));
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    ++invokeCount;
                    try {
                        if (invokeCount === 1) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, triggerChar);
                            assert.strictEqual(context.isRetrigger, false);
                            assert.strictEqual(context.activeSignatureHelp, undefined);
                            // Retrigger
                            setTimeout(() => editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar }), 50);
                        }
                        else {
                            assert.strictEqual(invokeCount, 2);
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.isRetrigger, true);
                            assert.strictEqual(context.triggerCharacter, triggerChar);
                            assert.strictEqual(context.activeSignatureHelp, emptySigHelp);
                            done();
                        }
                        return emptySigHelpResult;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
        });
        test('Provider should not be retriggered if previous help is canceled first', (done) => {
            const triggerChar = '(';
            const editor = createMockEditor('');
            const hintModel = new parameterHintsModel_1.ParameterHintsModel(editor);
            disposables.add(hintModel);
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        ++invokeCount;
                        if (invokeCount === 1) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, triggerChar);
                            assert.strictEqual(context.isRetrigger, false);
                            assert.strictEqual(context.activeSignatureHelp, undefined);
                            // Cancel and retrigger
                            hintModel.cancel();
                            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
                        }
                        else {
                            assert.strictEqual(invokeCount, 2);
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, triggerChar);
                            assert.strictEqual(context.isRetrigger, true);
                            assert.strictEqual(context.activeSignatureHelp, undefined);
                            done();
                        }
                        return emptySigHelpResult;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
        });
        test('Provider should get last trigger character when triggered multiple times and only be invoked once', (done) => {
            const editor = createMockEditor('');
            disposables.add(new parameterHintsModel_1.ParameterHintsModel(editor, 5));
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = ['a', 'b', 'c'];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        ++invokeCount;
                        assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                        assert.strictEqual(context.isRetrigger, false);
                        assert.strictEqual(context.triggerCharacter, 'c');
                        // Give some time to allow for later triggers
                        setTimeout(() => {
                            assert.strictEqual(invokeCount, 1);
                            done();
                        }, 50);
                        return undefined;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'a' });
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'b' });
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'c' });
        });
        test('Provider should be retriggered if already active', (done) => {
            const editor = createMockEditor('');
            disposables.add(new parameterHintsModel_1.ParameterHintsModel(editor, 5));
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = ['a', 'b'];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        ++invokeCount;
                        if (invokeCount === 1) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, 'a');
                            // retrigger after delay for widget to show up
                            setTimeout(() => editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'b' }), 50);
                        }
                        else if (invokeCount === 2) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.ok(context.isRetrigger);
                            assert.strictEqual(context.triggerCharacter, 'b');
                            done();
                        }
                        else {
                            assert.fail('Unexpected invoke');
                        }
                        return emptySigHelpResult;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'a' });
        });
        test('Should cancel existing request when new request comes in', () => {
            const editor = createMockEditor('abc def');
            const hintsModel = new parameterHintsModel_1.ParameterHintsModel(editor);
            let didRequestCancellationOf = -1;
            let invokeCount = 0;
            const longRunningProvider = new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, token) {
                    try {
                        const count = invokeCount++;
                        token.onCancellationRequested(() => { didRequestCancellationOf = count; });
                        // retrigger on first request
                        if (count === 0) {
                            hintsModel.trigger({ triggerKind: modes.SignatureHelpTriggerKind.Invoke }, 0);
                        }
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve({
                                    value: {
                                        signatures: [{
                                                label: '' + count,
                                                parameters: []
                                            }],
                                        activeParameter: 0,
                                        activeSignature: 0
                                    },
                                    dispose: () => { }
                                });
                            }, 100);
                        });
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            };
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, longRunningProvider));
            hintsModel.trigger({ triggerKind: modes.SignatureHelpTriggerKind.Invoke }, 0);
            assert.strictEqual(-1, didRequestCancellationOf);
            return new Promise((resolve, reject) => hintsModel.onChangedHints(newParamterHints => {
                try {
                    assert.strictEqual(0, didRequestCancellationOf);
                    assert.strictEqual('1', newParamterHints.signatures[0].label);
                    resolve();
                }
                catch (e) {
                    reject(e);
                }
            }));
        });
        test('Provider should be retriggered by retrigger character', (done) => {
            const triggerChar = 'a';
            const retriggerChar = 'b';
            const editor = createMockEditor('');
            disposables.add(new parameterHintsModel_1.ParameterHintsModel(editor, 5));
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [retriggerChar];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        ++invokeCount;
                        if (invokeCount === 1) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, triggerChar);
                            // retrigger after delay for widget to show up
                            setTimeout(() => editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: retriggerChar }), 50);
                        }
                        else if (invokeCount === 2) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.ok(context.isRetrigger);
                            assert.strictEqual(context.triggerCharacter, retriggerChar);
                            done();
                        }
                        else {
                            assert.fail('Unexpected invoke');
                        }
                        return emptySigHelpResult;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            // This should not trigger anything
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: retriggerChar });
            // But a trigger character should
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
        });
        test('should use first result from multiple providers', async () => {
            const triggerChar = 'a';
            const firstProviderId = 'firstProvider';
            const secondProviderId = 'secondProvider';
            const paramterLabel = 'parameter';
            const editor = createMockEditor('');
            const model = new parameterHintsModel_1.ParameterHintsModel(editor, 5);
            disposables.add(model);
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [];
                }
                async provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        if (!context.isRetrigger) {
                            // retrigger after delay for widget to show up
                            setTimeout(() => editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar }), 50);
                            return {
                                value: {
                                    activeParameter: 0,
                                    activeSignature: 0,
                                    signatures: [{
                                            label: firstProviderId,
                                            parameters: [
                                                { label: paramterLabel }
                                            ]
                                        }]
                                },
                                dispose: () => { }
                            };
                        }
                        return undefined;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerChar];
                    this.signatureHelpRetriggerCharacters = [];
                }
                async provideSignatureHelp(_model, _position, _token, context) {
                    if (context.isRetrigger) {
                        return {
                            value: {
                                activeParameter: 0,
                                activeSignature: context.activeSignatureHelp ? context.activeSignatureHelp.activeSignature + 1 : 0,
                                signatures: [{
                                        label: secondProviderId,
                                        parameters: context.activeSignatureHelp ? context.activeSignatureHelp.signatures[0].parameters : []
                                    }]
                            },
                            dispose: () => { }
                        };
                    }
                    return undefined;
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerChar });
            const firstHint = (await getNextHint(model)).value;
            assert.strictEqual(firstHint.signatures[0].label, firstProviderId);
            assert.strictEqual(firstHint.activeSignature, 0);
            assert.strictEqual(firstHint.signatures[0].parameters[0].label, paramterLabel);
            const secondHint = (await getNextHint(model)).value;
            assert.strictEqual(secondHint.signatures[0].label, secondProviderId);
            assert.strictEqual(secondHint.activeSignature, 1);
            assert.strictEqual(secondHint.signatures[0].parameters[0].label, paramterLabel);
        });
        test('Quick typing should use the first trigger character', async () => {
            const editor = createMockEditor('');
            const model = new parameterHintsModel_1.ParameterHintsModel(editor, 50);
            disposables.add(model);
            const triggerCharacter = 'a';
            let invokeCount = 0;
            disposables.add(modes.SignatureHelpProviderRegistry.register(mockFileSelector, new class {
                constructor() {
                    this.signatureHelpTriggerCharacters = [triggerCharacter];
                    this.signatureHelpRetriggerCharacters = [];
                }
                provideSignatureHelp(_model, _position, _token, context) {
                    try {
                        ++invokeCount;
                        if (invokeCount === 1) {
                            assert.strictEqual(context.triggerKind, modes.SignatureHelpTriggerKind.TriggerCharacter);
                            assert.strictEqual(context.triggerCharacter, triggerCharacter);
                        }
                        else {
                            assert.fail('Unexpected invoke');
                        }
                        return emptySigHelpResult;
                    }
                    catch (err) {
                        console.error(err);
                        throw err;
                    }
                }
            }));
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: triggerCharacter });
            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'x' });
            await getNextHint(model);
        });
    });
    function getNextHint(model) {
        return new Promise(resolve => {
            const sub = model.onChangedHints(e => {
                sub.dispose();
                return resolve(e ? { value: e, dispose: () => { } } : undefined);
            });
        });
    }
});
//# sourceMappingURL=parameterHintsModel.test.js.map