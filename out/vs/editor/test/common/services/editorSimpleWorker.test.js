/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/services/editorSimpleWorker"], function (require, exports, assert, range_1, editorSimpleWorker_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorSimpleWorker', () => {
        class WorkerWithModels extends editorSimpleWorker_1.EditorSimpleWorker {
            getModel(uri) {
                return this._getModel(uri);
            }
            addModel(lines, eol = '\n') {
                const uri = 'test:file#' + Date.now();
                this.acceptNewModel({
                    url: uri,
                    versionId: 1,
                    lines: lines,
                    EOL: eol
                });
                return this._getModel(uri);
            }
        }
        let worker;
        let model;
        setup(() => {
            worker = new WorkerWithModels(null, null);
            model = worker.addModel([
                'This is line one',
                'and this is line number two',
                'it is followed by #3',
                'and finished with the fourth.',
            ]);
        });
        function assertPositionAt(offset, line, column) {
            let position = model.positionAt(offset);
            assert.equal(position.lineNumber, line);
            assert.equal(position.column, column);
        }
        function assertOffsetAt(lineNumber, column, offset) {
            let actual = model.offsetAt({ lineNumber, column });
            assert.equal(actual, offset);
        }
        test('ICommonModel#offsetAt', () => {
            assertOffsetAt(1, 1, 0);
            assertOffsetAt(1, 2, 1);
            assertOffsetAt(1, 17, 16);
            assertOffsetAt(2, 1, 17);
            assertOffsetAt(2, 4, 20);
            assertOffsetAt(3, 1, 45);
            assertOffsetAt(5, 30, 95);
            assertOffsetAt(5, 31, 95);
            assertOffsetAt(5, Number.MAX_VALUE, 95);
            assertOffsetAt(6, 30, 95);
            assertOffsetAt(Number.MAX_VALUE, 30, 95);
            assertOffsetAt(Number.MAX_VALUE, Number.MAX_VALUE, 95);
        });
        test('ICommonModel#positionAt', () => {
            assertPositionAt(0, 1, 1);
            assertPositionAt(Number.MIN_VALUE, 1, 1);
            assertPositionAt(1, 1, 2);
            assertPositionAt(16, 1, 17);
            assertPositionAt(17, 2, 1);
            assertPositionAt(20, 2, 4);
            assertPositionAt(45, 3, 1);
            assertPositionAt(95, 4, 30);
            assertPositionAt(96, 4, 30);
            assertPositionAt(99, 4, 30);
            assertPositionAt(Number.MAX_VALUE, 4, 30);
        });
        test('ICommonModel#validatePosition, issue #15882', function () {
            let model = worker.addModel(['{"id": "0001","type": "donut","name": "Cake","image":{"url": "images/0001.jpg","width": 200,"height": 200},"thumbnail":{"url": "images/thumbnails/0001.jpg","width": 32,"height": 32}}']);
            assert.equal(model.offsetAt({ lineNumber: 1, column: 2 }), 1);
        });
        test('MoreMinimal', () => {
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: 'This is line One', range: new range_1.Range(1, 1, 1, 17) }]).then(edits => {
                assert.equal(edits.length, 1);
                const [first] = edits;
                assert.equal(first.text, 'O');
                assert.deepEqual(first.range, { startLineNumber: 1, startColumn: 14, endLineNumber: 1, endColumn: 15 });
            });
        });
        test('MoreMinimal, issue #15385 newline changes only', function () {
            let model = worker.addModel([
                '{',
                '\t"a":1',
                '}'
            ], '\n');
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '{\r\n\t"a":1\r\n}', range: new range_1.Range(1, 1, 3, 2) }]).then(edits => {
                assert.equal(edits.length, 0);
            });
        });
        test('MoreMinimal, issue #15385 newline changes and other', function () {
            let model = worker.addModel([
                '{',
                '\t"a":1',
                '}'
            ], '\n');
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '{\r\n\t"b":1\r\n}', range: new range_1.Range(1, 1, 3, 2) }]).then(edits => {
                assert.equal(edits.length, 1);
                const [first] = edits;
                assert.equal(first.text, 'b');
                assert.deepEqual(first.range, { startLineNumber: 2, startColumn: 3, endLineNumber: 2, endColumn: 4 });
            });
        });
        test('MoreMinimal, issue #15385 newline changes and other', function () {
            let model = worker.addModel([
                'package main',
                'func foo() {',
                '}' // 3
            ]);
            return worker.computeMoreMinimalEdits(model.uri.toString(), [{ text: '\n', range: new range_1.Range(3, 2, 4, 1000) }]).then(edits => {
                assert.equal(edits.length, 1);
                const [first] = edits;
                assert.equal(first.text, '\n');
                assert.deepEqual(first.range, { startLineNumber: 3, startColumn: 2, endLineNumber: 3, endColumn: 2 });
            });
        });
        test('ICommonModel#getValueInRange, issue #17424', function () {
            let model = worker.addModel([
                'package main',
                'func foo() {',
                '}' // 3
            ]);
            const value = model.getValueInRange({ startLineNumber: 3, startColumn: 1, endLineNumber: 4, endColumn: 1 });
            assert.equal(value, '}');
        });
        test('textualSuggest, issue #17785', function () {
            let model = worker.addModel([
                'foobar',
                'f f' // 2
            ]);
            return worker.textualSuggest(model.uri.toString(), { lineNumber: 2, column: 2 }, '[a-z]+', 'img').then((result) => {
                if (!result) {
                    assert.ok(false);
                    return;
                }
                const { suggestions } = result;
                assert.equal(suggestions.length, 1);
                assert.equal(suggestions[0].label, 'foobar');
            });
        });
        test('get words via iterator, issue #46930', function () {
            let model = worker.addModel([
                'one line',
                'two line',
                '',
                'past empty',
                'single',
                '',
                'and now we are done'
            ]);
            let words = [];
            for (let iter = model.createWordIterator(/[a-z]+/img), e = iter.next(); !e.done; e = iter.next()) {
                words.push(e.value);
            }
            assert.deepEqual(words, ['one', 'line', 'two', 'line', 'past', 'empty', 'single', 'and', 'now', 'we', 'are', 'done']);
        });
    });
});
//# sourceMappingURL=editorSimpleWorker.test.js.map