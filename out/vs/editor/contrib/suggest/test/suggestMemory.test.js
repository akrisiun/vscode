/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/contrib/suggest/suggestMemory", "vs/editor/common/model/textModel", "vs/editor/contrib/suggest/test/completionModel.test"], function (require, exports, assert, suggestMemory_1, textModel_1, completionModel_test_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SuggestMemories', function () {
        let pos;
        let buffer;
        let items;
        setup(function () {
            pos = { lineNumber: 1, column: 1 };
            buffer = textModel_1.TextModel.createFromString('This is some text.\nthis.\nfoo: ,');
            items = [
                completionModel_test_1.createSuggestItem('foo', 0),
                completionModel_test_1.createSuggestItem('bar', 0)
            ];
        });
        test('AbstractMemory, select', function () {
            const mem = new class extends suggestMemory_1.Memory {
                memorize(model, pos, item) {
                    throw new Error('Method not implemented.');
                }
                toJSON() {
                    throw new Error('Method not implemented.');
                }
                fromJSON(data) {
                    throw new Error('Method not implemented.');
                }
            };
            let item1 = completionModel_test_1.createSuggestItem('fazz', 0);
            let item2 = completionModel_test_1.createSuggestItem('bazz', 0);
            let item3 = completionModel_test_1.createSuggestItem('bazz', 0);
            let item4 = completionModel_test_1.createSuggestItem('bazz', 0);
            item1.completion.preselect = false;
            item2.completion.preselect = true;
            item3.completion.preselect = true;
            assert.equal(mem.select(buffer, pos, [item1, item2, item3, item4]), 1);
        });
        test('[No|Prefix|LRU]Memory honor selection boost', function () {
            let item1 = completionModel_test_1.createSuggestItem('fazz', 0);
            let item2 = completionModel_test_1.createSuggestItem('bazz', 0);
            let item3 = completionModel_test_1.createSuggestItem('bazz', 0);
            let item4 = completionModel_test_1.createSuggestItem('bazz', 0);
            item1.completion.preselect = false;
            item2.completion.preselect = true;
            item3.completion.preselect = true;
            let items = [item1, item2, item3, item4];
            assert.equal(new suggestMemory_1.NoMemory().select(buffer, pos, items), 1);
            assert.equal(new suggestMemory_1.LRUMemory().select(buffer, pos, items), 1);
            assert.equal(new suggestMemory_1.PrefixMemory().select(buffer, pos, items), 1);
        });
        test('NoMemory', () => {
            const mem = new suggestMemory_1.NoMemory();
            assert.equal(mem.select(buffer, pos, items), 0);
            assert.equal(mem.select(buffer, pos, []), 0);
            mem.memorize(buffer, pos, items[0]);
            mem.memorize(buffer, pos, null);
        });
        test('LRUMemory', () => {
            pos = { lineNumber: 2, column: 6 };
            const mem = new suggestMemory_1.LRUMemory();
            mem.memorize(buffer, pos, items[1]);
            assert.equal(mem.select(buffer, pos, items), 1);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 3 }, items), 0);
            mem.memorize(buffer, pos, items[0]);
            assert.equal(mem.select(buffer, pos, items), 0);
            assert.equal(mem.select(buffer, pos, [
                completionModel_test_1.createSuggestItem('new', 0),
                completionModel_test_1.createSuggestItem('bar', 0)
            ]), 1);
            assert.equal(mem.select(buffer, pos, [
                completionModel_test_1.createSuggestItem('new1', 0),
                completionModel_test_1.createSuggestItem('new2', 0)
            ]), 0);
        });
        test('`"editor.suggestSelection": "recentlyUsed"` should be a little more sticky #78571', function () {
            let item1 = completionModel_test_1.createSuggestItem('gamma', 0);
            let item2 = completionModel_test_1.createSuggestItem('game', 0);
            items = [item1, item2];
            let mem = new suggestMemory_1.LRUMemory();
            buffer.setValue('    foo.');
            mem.memorize(buffer, { lineNumber: 1, column: 1 }, item2);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 2 }, items), 0); // leading whitespace -> ignore recent items
            mem.memorize(buffer, { lineNumber: 1, column: 9 }, item2);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 9 }, items), 1); // foo.
            buffer.setValue('    foo.g');
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 10 }, items), 1); // foo.g, 'gamma' and 'game' have the same score
            item1.score = [10, 0, 0];
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 10 }, items), 0); // foo.g, 'gamma' has higher score
        });
        test('intellisense is not showing top options first #43429', function () {
            // ensure we don't memorize for whitespace prefixes
            pos = { lineNumber: 2, column: 6 };
            const mem = new suggestMemory_1.LRUMemory();
            mem.memorize(buffer, pos, items[1]);
            assert.equal(mem.select(buffer, pos, items), 1);
            assert.equal(mem.select(buffer, { lineNumber: 3, column: 5 }, items), 0); // foo: |,
            assert.equal(mem.select(buffer, { lineNumber: 3, column: 6 }, items), 1); // foo: ,|
        });
        test('PrefixMemory', () => {
            const mem = new suggestMemory_1.PrefixMemory();
            buffer.setValue('constructor');
            const item0 = completionModel_test_1.createSuggestItem('console', 0);
            const item1 = completionModel_test_1.createSuggestItem('const', 0);
            const item2 = completionModel_test_1.createSuggestItem('constructor', 0);
            const item3 = completionModel_test_1.createSuggestItem('constant', 0);
            const items = [item0, item1, item2, item3];
            mem.memorize(buffer, { lineNumber: 1, column: 2 }, item1); // c -> const
            mem.memorize(buffer, { lineNumber: 1, column: 3 }, item0); // co -> console
            mem.memorize(buffer, { lineNumber: 1, column: 4 }, item2); // con -> constructor
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 1 }, items), 0);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 2 }, items), 1);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 3 }, items), 0);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 4 }, items), 2);
            assert.equal(mem.select(buffer, { lineNumber: 1, column: 7 }, items), 2); // find substr
        });
    });
});
//# sourceMappingURL=suggestMemory.test.js.map