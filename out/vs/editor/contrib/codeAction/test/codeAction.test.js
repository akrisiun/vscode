define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/types", "vs/platform/markers/common/markers", "vs/base/common/cancellation", "vs/platform/progress/common/progress", "vs/editor/test/common/editorTestUtils"], function (require, exports, assert, lifecycle_1, uri_1, range_1, modes, codeAction_1, types_1, markers_1, cancellation_1, progress_1, editorTestUtils_1) {
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
            model = editorTestUtils_1.createTextModel('test1\ntest2\ntest3', undefined, langId, uri);
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
            const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 2 /* Manual */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 6);
            assert.deepEqual(actions, expected);
        });
        test('getCodeActions should filter by scope', async function () {
            const provider = staticCodeActionProvider({ title: 'a', kind: 'a' }, { title: 'b', kind: 'b' }, { title: 'a.b', kind: 'a.b' });
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */, filter: { include: new types_1.CodeActionKind('a') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 2);
                assert.strictEqual(actions[0].title, 'a');
                assert.strictEqual(actions[1].title, 'a.b');
            }
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */, filter: { include: new types_1.CodeActionKind('a.b') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'a.b');
            }
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */, filter: { include: new types_1.CodeActionKind('a.b.c') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
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
            const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */, filter: { include: new types_1.CodeActionKind('a') } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.equal(actions.length, 1);
            assert.strictEqual(actions[0].title, 'a');
        });
        test('getCodeActions should not return source code action by default', async function () {
            const provider = staticCodeActionProvider({ title: 'a', kind: types_1.CodeActionKind.Source.value }, { title: 'b', kind: 'b' });
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */ }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'b');
            }
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), { type: 1 /* Auto */, filter: { include: types_1.CodeActionKind.Source, includeSourceActions: true } }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'a');
            }
        });
        test('getCodeActions should support filtering out some requested source code actions #84602', async function () {
            const provider = staticCodeActionProvider({ title: 'a', kind: types_1.CodeActionKind.Source.value }, { title: 'b', kind: types_1.CodeActionKind.Source.append('test').value }, { title: 'c', kind: 'c' });
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), {
                    type: 1 /* Auto */, filter: {
                        include: types_1.CodeActionKind.Source.append('test'),
                        excludes: [types_1.CodeActionKind.Source],
                        includeSourceActions: true,
                    }
                }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'b');
            }
        });
        test('getCodeActions no invoke a provider that has been excluded #84602', async function () {
            const baseType = types_1.CodeActionKind.Refactor;
            const subType = types_1.CodeActionKind.Refactor.append('sub');
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', staticCodeActionProvider({ title: 'a', kind: baseType.value })));
            let didInvoke = false;
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', new class {
                constructor() {
                    this.providedCodeActionKinds = [subType.value];
                }
                provideCodeActions() {
                    didInvoke = true;
                    return {
                        actions: [
                            { title: 'x', kind: subType.value }
                        ],
                        dispose: () => { }
                    };
                }
            }));
            {
                const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), {
                    type: 1 /* Auto */, filter: {
                        include: baseType,
                        excludes: [subType],
                    }
                }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
                assert.strictEqual(didInvoke, false);
                assert.equal(actions.length, 1);
                assert.strictEqual(actions[0].title, 'a');
            }
        });
        test('getCodeActions should not invoke code action providers filtered out by providedCodeActionKinds', async function () {
            let wasInvoked = false;
            const provider = new class {
                constructor() {
                    this.providedCodeActionKinds = [types_1.CodeActionKind.Refactor.value];
                }
                provideCodeActions() {
                    wasInvoked = true;
                    return { actions: [], dispose: () => { } };
                }
            };
            disposables.add(modes.CodeActionProviderRegistry.register('fooLang', provider));
            const { validActions: actions } = await codeAction_1.getCodeActions(model, new range_1.Range(1, 1, 2, 1), {
                type: 1 /* Auto */,
                filter: {
                    include: types_1.CodeActionKind.QuickFix
                }
            }, progress_1.Progress.None, cancellation_1.CancellationToken.None);
            assert.strictEqual(actions.length, 0);
            assert.strictEqual(wasInvoked, false);
        });
    });
});
//# sourceMappingURL=codeAction.test.js.map