define(["require", "exports", "assert", "vs/base/common/uri", "vs/editor/common/modes", "vs/editor/contrib/suggest/suggest", "vs/editor/common/core/position", "vs/editor/common/model/textModel", "vs/editor/common/core/range"], function (require, exports, assert, uri_1, modes_1, suggest_1, position_1, textModel_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Suggest', function () {
        let model;
        let registration;
        setup(function () {
            model = textModel_1.TextModel.createFromString('FOO\nbar\BAR\nfoo', undefined, undefined, uri_1.URI.parse('foo:bar/path'));
            registration = modes_1.CompletionProviderRegistry.register({ pattern: 'bar/path', scheme: 'foo' }, {
                provideCompletionItems(_doc, pos) {
                    return {
                        incomplete: false,
                        suggestions: [{
                                label: 'aaa',
                                kind: 25 /* Snippet */,
                                insertText: 'aaa',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                label: 'zzz',
                                kind: 25 /* Snippet */,
                                insertText: 'zzz',
                                range: range_1.Range.fromPositions(pos)
                            }, {
                                label: 'fff',
                                kind: 9 /* Property */,
                                insertText: 'fff',
                                range: range_1.Range.fromPositions(pos)
                            }]
                    };
                }
            });
        });
        teardown(() => {
            registration.dispose();
            model.dispose();
        });
        test('sort - snippet inline', async function () {
            const items = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(1 /* Inline */));
            assert.equal(items.length, 3);
            assert.equal(items[0].completion.label, 'aaa');
            assert.equal(items[1].completion.label, 'fff');
            assert.equal(items[2].completion.label, 'zzz');
        });
        test('sort - snippet top', async function () {
            const items = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(0 /* Top */));
            assert.equal(items.length, 3);
            assert.equal(items[0].completion.label, 'aaa');
            assert.equal(items[1].completion.label, 'zzz');
            assert.equal(items[2].completion.label, 'fff');
        });
        test('sort - snippet bottom', async function () {
            const items = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(2 /* Bottom */));
            assert.equal(items.length, 3);
            assert.equal(items[0].completion.label, 'fff');
            assert.equal(items[1].completion.label, 'aaa');
            assert.equal(items[2].completion.label, 'zzz');
        });
        test('sort - snippet none', async function () {
            const items = await suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, new Set().add(25 /* Snippet */)));
            assert.equal(items.length, 1);
            assert.equal(items[0].completion.label, 'fff');
        });
        test('only from', function () {
            const foo = {
                triggerCharacters: [],
                provideCompletionItems() {
                    return {
                        currentWord: '',
                        incomplete: false,
                        suggestions: [{
                                label: 'jjj',
                                type: 'property',
                                insertText: 'jjj'
                            }]
                    };
                }
            };
            const registration = modes_1.CompletionProviderRegistry.register({ pattern: 'bar/path', scheme: 'foo' }, foo);
            suggest_1.provideSuggestionItems(model, new position_1.Position(1, 1), new suggest_1.CompletionOptions(undefined, undefined, new Set().add(foo))).then(items => {
                registration.dispose();
                assert.equal(items.length, 1);
                assert.ok(items[0].provider === foo);
            });
        });
    });
});
//# sourceMappingURL=suggest.test.js.map