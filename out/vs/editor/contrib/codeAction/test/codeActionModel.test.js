/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/contrib/codeAction/codeActionModel", "vs/editor/test/browser/testCodeEditor", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/markers/common/markerService"], function (require, exports, assert, lifecycle_1, uri_1, textModel_1, modes, codeActionModel_1, testCodeEditor_1, mockKeybindingService_1, markerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const testProvider = {
        provideCodeActions() {
            return {
                actions: [
                    { title: 'test', command: { id: 'test-command', title: 'test', arguments: [] } }
                ],
                dispose() { }
            };
        }
    };
    suite('CodeActionModel', () => {
        const languageIdentifier = new modes.LanguageIdentifier('foo-lang', 3);
        let uri = uri_1.URI.parse('untitled:path');
        let model;
        let markerService;
        let editor;
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.clear();
            markerService = new markerService_1.MarkerService();
            model = textModel_1.TextModel.createFromString('foobar  foo bar\nfarboo far boo', undefined, languageIdentifier, uri);
            editor = testCodeEditor_1.createTestCodeEditor({ model: model });
            editor.setPosition({ lineNumber: 1, column: 1 });
        });
        teardown(() => {
            disposables.clear();
            editor.dispose();
            model.dispose();
            markerService.dispose();
        });
        test('Orcale -> marker added', done => {
            const reg = modes.CodeActionProviderRegistry.register(languageIdentifier.language, testProvider);
            disposables.add(reg);
            const contextKeys = new mockKeybindingService_1.MockContextKeyService();
            const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, markerService, contextKeys, undefined));
            disposables.add(model.onDidChangeState((e) => {
                assert.equal(e.trigger.type, 'auto');
                assert.ok(e.actions);
                e.actions.then(fixes => {
                    model.dispose();
                    assert.equal(fixes.actions.length, 1);
                    done();
                }, done);
            }));
            // start here
            markerService.changeOne('fake', uri, [{
                    startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                    message: 'error',
                    severity: 1,
                    code: '',
                    source: ''
                }]);
        });
        test('Orcale -> position changed', () => {
            const reg = modes.CodeActionProviderRegistry.register(languageIdentifier.language, testProvider);
            disposables.add(reg);
            markerService.changeOne('fake', uri, [{
                    startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                    message: 'error',
                    severity: 1,
                    code: '',
                    source: ''
                }]);
            editor.setPosition({ lineNumber: 2, column: 1 });
            return new Promise((resolve, reject) => {
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    assert.equal(e.trigger.type, 'auto');
                    assert.ok(e.actions);
                    e.actions.then(fixes => {
                        model.dispose();
                        assert.equal(fixes.actions.length, 1);
                        resolve(undefined);
                    }, reject);
                }));
                // start here
                editor.setPosition({ lineNumber: 1, column: 1 });
            });
        });
        test('Lightbulb is in the wrong place, #29933', async function () {
            const reg = modes.CodeActionProviderRegistry.register(languageIdentifier.language, {
                provideCodeActions(_doc, _range) {
                    return { actions: [], dispose() { } };
                }
            });
            disposables.add(reg);
            editor.getModel().setValue('// @ts-check\n2\ncon\n');
            markerService.changeOne('fake', uri, [{
                    startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 4,
                    message: 'error',
                    severity: 1,
                    code: '',
                    source: ''
                }]);
            // case 1 - drag selection over multiple lines -> range of enclosed marker, position or marker
            await new Promise(resolve => {
                const contextKeys = new mockKeybindingService_1.MockContextKeyService();
                const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, markerService, contextKeys, undefined));
                disposables.add(model.onDidChangeState((e) => {
                    assert.equal(e.trigger.type, 'auto');
                    const selection = e.rangeOrSelection;
                    assert.deepEqual(selection.selectionStartLineNumber, 1);
                    assert.deepEqual(selection.selectionStartColumn, 1);
                    assert.deepEqual(selection.endLineNumber, 4);
                    assert.deepEqual(selection.endColumn, 1);
                    assert.deepEqual(e.position, { lineNumber: 3, column: 1 });
                    model.dispose();
                    resolve(undefined);
                }, 5));
                editor.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 1 });
            });
        });
        test('Orcale -> should only auto trigger once for cursor and marker update right after each other', done => {
            const reg = modes.CodeActionProviderRegistry.register(languageIdentifier.language, testProvider);
            disposables.add(reg);
            let triggerCount = 0;
            const contextKeys = new mockKeybindingService_1.MockContextKeyService();
            const model = disposables.add(new codeActionModel_1.CodeActionModel(editor, markerService, contextKeys, undefined));
            disposables.add(model.onDidChangeState((e) => {
                assert.equal(e.trigger.type, 'auto');
                ++triggerCount;
                // give time for second trigger before completing test
                setTimeout(() => {
                    model.dispose();
                    assert.strictEqual(triggerCount, 1);
                    done();
                }, 50);
            }, 5 /*delay*/));
            markerService.changeOne('fake', uri, [{
                    startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 6,
                    message: 'error',
                    severity: 1,
                    code: '',
                    source: ''
                }]);
            editor.setSelection({ startLineNumber: 1, startColumn: 1, endLineNumber: 4, endColumn: 1 });
        });
    });
});
//# sourceMappingURL=codeActionModel.test.js.map