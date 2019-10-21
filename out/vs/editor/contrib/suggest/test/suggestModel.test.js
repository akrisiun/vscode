define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/controller/coreCommands", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/core/token", "vs/editor/common/editorCommon", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/common/modes/nullMode", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/suggest/suggestController", "vs/editor/contrib/suggest/suggestModel", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/mocks/mockMode", "vs/platform/instantiation/common/serviceCollection", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/editor/contrib/suggest/suggestMemory", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/test/common/mockKeybindingService"], function (require, exports, assert, lifecycle_1, uri_1, coreCommands_1, editOperation_1, range_1, selection_1, token_1, editorCommon_1, textModel_1, modes_1, languageConfigurationRegistry_1, nullMode_1, snippetController2_1, suggestController_1, suggestModel_1, testCodeEditor_1, mockMode_1, serviceCollection_1, storage_1, telemetry_1, telemetryUtils_1, suggestMemory_1, keybinding_1, mockKeybindingService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function mock() {
        return function () { };
    }
    exports.mock = mock;
    function createMockEditor(model) {
        let editor = testCodeEditor_1.createTestCodeEditor({
            model: model,
            serviceCollection: new serviceCollection_1.ServiceCollection([telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService], [storage_1.IStorageService, new storage_1.InMemoryStorageService()], [keybinding_1.IKeybindingService, new mockKeybindingService_1.MockKeybindingService()], [suggestMemory_1.ISuggestMemoryService, new class {
                    memorize() {
                    }
                    select() {
                        return -1;
                    }
                }]),
        });
        editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
        return editor;
    }
    suite('SuggestModel - Context', function () {
        const OUTER_LANGUAGE_ID = new modes_1.LanguageIdentifier('outerMode', 3);
        const INNER_LANGUAGE_ID = new modes_1.LanguageIdentifier('innerMode', 4);
        class OuterMode extends mockMode_1.MockMode {
            constructor() {
                super(OUTER_LANGUAGE_ID);
                this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {}));
                this._register(modes_1.TokenizationRegistry.register(this.getLanguageIdentifier().language, {
                    getInitialState: () => nullMode_1.NULL_STATE,
                    tokenize: undefined,
                    tokenize2: (line, state) => {
                        const tokensArr = [];
                        let prevLanguageId = undefined;
                        for (let i = 0; i < line.length; i++) {
                            const languageId = (line.charAt(i) === 'x' ? INNER_LANGUAGE_ID : OUTER_LANGUAGE_ID);
                            if (prevLanguageId !== languageId) {
                                tokensArr.push(i);
                                tokensArr.push((languageId.id << 0 /* LANGUAGEID_OFFSET */));
                            }
                            prevLanguageId = languageId;
                        }
                        const tokens = new Uint32Array(tokensArr.length);
                        for (let i = 0; i < tokens.length; i++) {
                            tokens[i] = tokensArr[i];
                        }
                        return new token_1.TokenizationResult2(tokens, state);
                    }
                }));
            }
        }
        class InnerMode extends mockMode_1.MockMode {
            constructor() {
                super(INNER_LANGUAGE_ID);
                this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {}));
            }
        }
        const assertAutoTrigger = (model, offset, expected, message) => {
            const pos = model.getPositionAt(offset);
            const editor = createMockEditor(model);
            editor.setPosition(pos);
            assert.equal(suggestModel_1.LineContext.shouldAutoTrigger(editor), expected, message);
            editor.dispose();
        };
        let disposables = [];
        setup(() => {
            disposables = [];
        });
        teardown(function () {
            lifecycle_1.dispose(disposables);
            disposables = [];
        });
        test('Context - shouldAutoTrigger', function () {
            const model = textModel_1.TextModel.createFromString('Das Pferd frisst keinen Gurkensalat - Philipp Reis 1861.\nWer hat\'s erfunden?');
            disposables.push(model);
            assertAutoTrigger(model, 3, true, 'end of word, Das|');
            assertAutoTrigger(model, 4, false, 'no word Das |');
            assertAutoTrigger(model, 1, false, 'middle of word D|as');
            assertAutoTrigger(model, 55, false, 'number, 1861|');
        });
        test('shouldAutoTrigger at embedded language boundaries', () => {
            const outerMode = new OuterMode();
            const innerMode = new InnerMode();
            disposables.push(outerMode, innerMode);
            const model = textModel_1.TextModel.createFromString('a<xx>a<x>', undefined, outerMode.getLanguageIdentifier());
            disposables.push(model);
            assertAutoTrigger(model, 1, true, 'a|<x — should trigger at end of word');
            assertAutoTrigger(model, 2, false, 'a<|x — should NOT trigger at start of word');
            assertAutoTrigger(model, 3, false, 'a<x|x —  should NOT trigger in middle of word');
            assertAutoTrigger(model, 4, true, 'a<xx|> — should trigger at boundary between languages');
            assertAutoTrigger(model, 5, false, 'a<xx>|a — should NOT trigger at start of word');
            assertAutoTrigger(model, 6, true, 'a<xx>a|< — should trigger at end of word');
            assertAutoTrigger(model, 8, true, 'a<xx>a<x|> — should trigger at end of word at boundary');
        });
    });
    suite('SuggestModel - TriggerAndCancelOracle', function () {
        function getDefaultSuggestRange(model, position) {
            const wordUntil = model.getWordUntilPosition(position);
            return new range_1.Range(position.lineNumber, wordUntil.startColumn, position.lineNumber, wordUntil.endColumn);
        }
        const alwaysEmptySupport = {
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: []
                };
            }
        };
        const alwaysSomethingSupport = {
            provideCompletionItems(doc, pos) {
                return {
                    incomplete: false,
                    suggestions: [{
                            label: doc.getWordUntilPosition(pos).word,
                            kind: 9 /* Property */,
                            insertText: 'foofoo',
                            range: getDefaultSuggestRange(doc, pos)
                        }]
                };
            }
        };
        let disposables = [];
        let model;
        setup(function () {
            disposables = lifecycle_1.dispose(disposables);
            model = textModel_1.TextModel.createFromString('abc def', undefined, undefined, uri_1.URI.parse('test:somefile.ttt'));
            disposables.push(model);
        });
        function withOracle(callback) {
            return new Promise((resolve, reject) => {
                const editor = createMockEditor(model);
                const oracle = new suggestModel_1.SuggestModel(editor, new class extends mock() {
                    computeWordRanges() {
                        return Promise.resolve({});
                    }
                });
                disposables.push(oracle, editor);
                try {
                    resolve(callback(oracle, editor));
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        function assertEvent(event, action, assert) {
            return new Promise((resolve, reject) => {
                const sub = event(e => {
                    sub.dispose();
                    try {
                        resolve(assert(e));
                    }
                    catch (err) {
                        reject(err);
                    }
                });
                try {
                    action();
                }
                catch (err) {
                    sub.dispose();
                    reject(err);
                }
            });
        }
        test('events - cancel/trigger', function () {
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.equal(event.auto, true);
                        return assertEvent(model.onDidCancel, function () {
                            model.cancel();
                        }, function (event) {
                            assert.equal(event.retrigger, false);
                        });
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.equal(event.auto, true);
                    }),
                    assertEvent(model.onDidTrigger, function () {
                        model.trigger({ auto: false, shy: false });
                    }, function (event) {
                        assert.equal(event.auto, false);
                    })
                ]);
            });
        });
        test('events - suggest/empty', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysEmptySupport));
            return withOracle(model => {
                return Promise.all([
                    assertEvent(model.onDidCancel, function () {
                        model.trigger({ auto: true, shy: false });
                    }, function (event) {
                        assert.equal(event.retrigger, false);
                    }),
                    assertEvent(model.onDidSuggest, function () {
                        model.trigger({ auto: false, shy: false });
                    }, function (event) {
                        assert.equal(event.auto, false);
                        assert.equal(event.isFrozen, false);
                        assert.equal(event.completionModel.items.length, 0);
                    })
                ]);
            });
        });
        test('trigger - on type', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'd' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('#17400: Keep filtering suggestModel.ts after space', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'My Table',
                                kind: 9 /* Property */,
                                insertText: 'My Table',
                                range: getDefaultSuggestRange(doc, pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    // make sure completionModel starts here!
                    model.trigger({ auto: true, shy: false });
                }, event => {
                    return assertEvent(model.onDidSuggest, () => {
                        editor.setPosition({ lineNumber: 1, column: 1 });
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'My' });
                    }, event => {
                        assert.equal(event.auto, true);
                        assert.equal(event.completionModel.items.length, 1);
                        const [first] = event.completionModel.items;
                        assert.equal(first.completion.label, 'My Table');
                        return assertEvent(model.onDidSuggest, () => {
                            editor.setPosition({ lineNumber: 1, column: 3 });
                            editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' ' });
                        }, event => {
                            assert.equal(event.auto, true);
                            assert.equal(event.completionModel.items.length, 1);
                            const [first] = event.completionModel.items;
                            assert.equal(first.completion.label, 'My Table');
                        });
                    });
                });
            });
        });
        test('#21484: Trigger character always force a new completion session', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'foo.bar',
                                kind: 9 /* Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'boom',
                                kind: 9 /* Property */,
                                insertText: 'boom',
                                range: range_1.Range.fromPositions(pos.delta(0, doc.getLineContent(pos.lineNumber)[pos.column - 2] === '.' ? 0 : -1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'foo' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.completion.label, 'foo.bar');
                    return assertEvent(model.onDidSuggest, () => {
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: '.' });
                    }, event => {
                        assert.equal(event.auto, true);
                        assert.equal(event.completionModel.items.length, 2);
                        const [first, second] = event.completionModel.items;
                        assert.equal(first.completion.label, 'foo.bar');
                        assert.equal(second.completion.label, 'boom');
                    });
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [1/2]', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.equal(event.auto, false);
                    assert.equal(event.isFrozen, false);
                    assert.equal(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: '+' });
                    }, event => {
                        assert.equal(event.retrigger, false);
                    });
                });
            });
        });
        test('Intellisense Completion doesn\'t respect space after equal sign (.html file), #29353 [2/2]', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                editor.getModel().setValue('fo');
                editor.setPosition({ lineNumber: 1, column: 3 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.equal(event.auto, false);
                    assert.equal(event.isFrozen, false);
                    assert.equal(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ' ' });
                    }, event => {
                        assert.equal(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (1/2)', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo',
                                kind: 9 /* Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.equal(event.auto, false);
                    assert.equal(event.completionModel.incomplete.size, 1);
                    assert.equal(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidCancel, () => {
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ';' });
                    }, event => {
                        assert.equal(event.retrigger, false);
                    });
                });
            });
        });
        test('Incomplete suggestion results cause re-triggering when typing w/o further context, #28400 (2/2)', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'foo;',
                                kind: 9 /* Property */,
                                insertText: 'foo',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            return withOracle((model, editor) => {
                editor.getModel().setValue('foo');
                editor.setPosition({ lineNumber: 1, column: 4 });
                return assertEvent(model.onDidSuggest, () => {
                    model.trigger({ auto: false, shy: false });
                }, event => {
                    assert.equal(event.auto, false);
                    assert.equal(event.completionModel.incomplete.size, 1);
                    assert.equal(event.completionModel.items.length, 1);
                    return assertEvent(model.onDidSuggest, () => {
                        // while we cancel incrementally enriching the set of
                        // completions we still filter against those that we have
                        // until now
                        editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: ';' });
                    }, event => {
                        assert.equal(event.auto, false);
                        assert.equal(event.completionModel.incomplete.size, 1);
                        assert.equal(event.completionModel.items.length, 1);
                    });
                });
            });
        });
        test('Trigger character is provided in suggest context', function () {
            let triggerCharacter = '';
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                triggerCharacters: ['.'],
                provideCompletionItems(doc, pos, context) {
                    assert.equal(context.triggerKind, 1 /* TriggerCharacter */);
                    triggerCharacter = context.triggerCharacter;
                    return {
                        incomplete: false,
                        suggestions: [
                            {
                                label: 'foo.bar',
                                kind: 9 /* Property */,
                                insertText: 'foo.bar',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }
                        ]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'foo.' });
                }, event => {
                    assert.equal(triggerCharacter, '.');
                });
            });
        });
        test('Mac press and hold accent character insertion does not update suggestions, #35269', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'abc',
                                kind: 9 /* Property */,
                                insertText: 'abc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }, {
                                label: 'äbc',
                                kind: 9 /* Property */,
                                insertText: 'äbc',
                                range: range_1.Range.fromPositions(pos.with(undefined, 1), pos)
                            }]
                    };
                }
            }));
            model.setValue('');
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 1 });
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'a' });
                }, event => {
                    assert.equal(event.completionModel.items.length, 1);
                    assert.equal(event.completionModel.items[0].completion.label, 'abc');
                    return assertEvent(model.onDidSuggest, () => {
                        editor.executeEdits('test', [editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 2), 'ä')]);
                    }, event => {
                        // suggest model changed to äbc
                        assert.equal(event.completionModel.items.length, 1);
                        assert.equal(event.completionModel.items[0].completion.label, 'äbc');
                    });
                });
            });
        });
        test('Backspace should not always cancel code completion, #36491', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 4 });
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'd' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.provider, alwaysSomethingSupport);
                });
                await assertEvent(model.onDidSuggest, () => {
                    coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, editor, null);
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Text changes for completion CodeAction are affected by the completion #39893', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                label: 'bar',
                                kind: 9 /* Property */,
                                insertText: 'bar',
                                range: range_1.Range.fromPositions(pos.delta(0, -2), pos),
                                additionalTextEdits: [{
                                        text: ', bar',
                                        range: { startLineNumber: 1, endLineNumber: 1, startColumn: 17, endColumn: 17 }
                                    }]
                            }]
                    };
                }
            }));
            model.setValue('ba; import { foo } from "./b"');
            return withOracle(async (sugget, editor) => {
                class TestCtrl extends suggestController_1.SuggestController {
                    _insertSuggestion(item, flags = 0) {
                        super._insertSuggestion(item, flags);
                    }
                }
                const ctrl = editor.registerAndInstantiateContribution(TestCtrl.ID, TestCtrl);
                editor.registerAndInstantiateContribution(snippetController2_1.SnippetController2.ID, snippetController2_1.SnippetController2);
                await assertEvent(sugget.onDidSuggest, () => {
                    editor.setPosition({ lineNumber: 1, column: 3 });
                    sugget.trigger({ auto: false, shy: false });
                }, event => {
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.completion.label, 'bar');
                    ctrl._insertSuggestion({ item: first, index: 0, model: event.completionModel });
                });
                assert.equal(model.getValue(), 'bar; import { foo, bar } from "./b"');
            });
        });
        test('Completion unexpectedly triggers on second keypress of an edit group in a snippet #43523', function () {
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, alwaysSomethingSupport));
            return withOracle((model, editor) => {
                return assertEvent(model.onDidSuggest, () => {
                    editor.setValue('d');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 2));
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'e' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 1);
                    const [first] = event.completionModel.items;
                    assert.equal(first.provider, alwaysSomethingSupport);
                });
            });
        });
        test('Fails to render completion details #47988', function () {
            let disposeA = 0;
            let disposeB = 0;
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: true,
                        suggestions: [{
                                kind: 23 /* Folder */,
                                label: 'CompleteNot',
                                insertText: 'Incomplete',
                                sortText: 'a',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeA += 1; }
                    };
                }
            }));
            disposables.push(modes_1.CompletionProviderRegistry.register({ scheme: 'test' }, {
                provideCompletionItems(doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                kind: 23 /* Folder */,
                                label: 'Complete',
                                insertText: 'Complete',
                                sortText: 'z',
                                range: getDefaultSuggestRange(doc, pos)
                            }],
                        dispose() { disposeB += 1; }
                    };
                },
                resolveCompletionItem(doc, pos, item) {
                    return item;
                },
            }));
            return withOracle(async (model, editor) => {
                await assertEvent(model.onDidSuggest, () => {
                    editor.setValue('');
                    editor.setSelection(new selection_1.Selection(1, 1, 1, 1));
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'c' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 2);
                    assert.equal(disposeA, 0);
                    assert.equal(disposeB, 0);
                });
                await assertEvent(model.onDidSuggest, () => {
                    editor.trigger('keyboard', editorCommon_1.Handler.Type, { text: 'o' });
                }, event => {
                    assert.equal(event.auto, true);
                    assert.equal(event.completionModel.items.length, 2);
                    // clean up
                    model.clear();
                    assert.equal(disposeA, 2); // provide got called two times!
                    assert.equal(disposeB, 1);
                });
            });
        });
    });
});
//# sourceMappingURL=suggestModel.test.js.map