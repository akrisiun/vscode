define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/modes", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/codeActionTrigger", "vs/platform/markers/common/markers", "vs/base/common/cancellation"], function (require, exports, assert, lifecycle_1, uri_1, range_1, textModel_1, modes, codeAction_1, codeActionTrigger_1, markers_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function staticCodeActionProvider(...actions) {
        return new class {
            provideCodeActions() {
                return {
                    actions: actions,
                    dispose: () => { }
                };
            }
        };
    }
    suite('CodeAction', () => {
        let langId = new modes.LanguageIdentifier('fooLang', 17);
        let uri = uri_1.URI.parse('untitled:path');
        let model;
        const disposables = new lifecycle_1.DisposableStore();
        let testData = {
            diagnostics: {
                abc: {
                    title: 'bTitle',
                    diagnostics: [{
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 2,
                            endColumn: 1,
                            severity: markers_1.MarkerSeverity.Error,
                            message: 'abc'
                        }]
                },
                bcd: {
                    title: 'aTitle',
                    diagnostics: [{
                            startLineNumber: 1,
                            startColumn: 1,
                            endLineNumber: 2,
                            endColumn: 1,
                            severity: markers_1.MarkerSeverity.Error,
                            message: 'bcd'
                        }]
                }
            },
            command: {
                abc: {
                    command: new class {
                    },
                    title: 'Extract to inner function in function "test"'
                }
            },
            spelling: {
                bcd: {
                    diagnostics: [],
                    edit: new class {
                    },
                    title: 'abc'
                }
            },
            tsLint: {
                abc: {
                    $ident: 57,
                    arguments: [],
                    id: '_internal_command_delegation',
                    title: 'abc'
                },
                bcd: {
                    $ident: 47,
                    arguments: [],
                    id: '_internal_command_delegation',
                    title: 'bcd'
                }
            }
        };
        setup(function () {
            disposables.clear();
            model = textModel_1.TextModel.createFromString('test1\ntest2\ntest3', undefined, langId, uri);
            disposables.add(model);
        });
        teardown(function () {
            disposables.clear();
        });
        test('CodeActions are sorted by type, #38623', async function () {
            const provider = staticCodeActionProvider(testData.command.abc, testData.diagnostics.bcd, testData.spelling.bcd, testData.tsLint.bcd, testData.tsLint.abc, testData.diagnostics.abc);
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            const expected = [
                // CodeActions with a diagnostics array are shown first ordered by diagnostics.message
                testData.diagnostics.abc,
                testData.diagnostics.bcd,
                // CodeActions without diagnostics are shown in the given order without any further sorting
                testData.command.abc,
                testData.spelling.bcd,
                testData.tsLint.bcd,
                testData.tsLint.abc
            ];
            const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'manual' }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 6);
            assert.deepEqual(actions, expected);
        });
        test('getCodeActions should filter by scope', async function () {
            const provider = staticCodeActionProvider({ title: 'a', kind: 'a' }, { title: 'b', kind: 'b' }, { title: 'a.b', kind: 'a.b' });
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            {
                const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto', filter: { kind: new codeActionTrigger_1.CodeActionKind('a') } }, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 2);
                assert.strictEqual(actions[0].title, 'a');
                assert.strictEqual(actions[1].title, 'a.b');
            }
            {
                const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto', filter: { kind: new codeActionTrigger_1.CodeActionKind('a.b') } }, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'a.b');
            }
            {
                const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto', filter: { kind: new codeActionTrigger_1.CodeActionKind('a.b.c') } }, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 0);
            }
        });
        test('getCodeActions should forward requested scope to providers', async function () {
            const provider = new class {
                provideCodeActions(_model, _range, context, _token) {
                    return {
                        actions: [
                            { title: context.only || '', kind: context.only }
                        ],
                        dispose: () => { }
                    };
                }
            };
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto', filter: { kind: new codeActionTrigger_1.CodeActionKind('a') } }, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 1);
            assert.strictEqual(actions[0].title, 'a');
        });
        test('getCodeActions should not return source code action by default', async function () {
            const provider = staticCodeActionProvider({ title: 'a', kind: codeActionTrigger_1.CodeActionKind.Source.value }, { title: 'b', kind: 'b' });
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            {
                const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto' }, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'b');
            }
            {
                const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 'auto', filter: { kind: codeActionTrigger_1.CodeActionKind.Source, includeSourceActions: true } }, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'a');
            }
        });
        test('getCodeActions should not invoke code action providers filtered out by providedCodeActionKinds', async function () {
            let wasInvoked = false;
            const provider = new class {
                constructor() {
                    this.providedCodeActionKinds = [codeActionTrigger_1.CodeActionKind.Refactor.value];
                }
                provideCodeActions() {
                    wasInvoked = true;
                    return { actions: [], dispose: () => { } };
                }
            };
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            const { actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), {
                type: 'auto',
                filter: {
                    kind: codeActionTrigger_1.CodeActionKind.QuickFix
                }
            }, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 0);
            assert.strictEqual(wasInvoked, false);
        });
    });
});
//# sourceMappingURL=codeAction.test.js.map