/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/selection", "vs/editor/contrib/wordOperations/test/wordTestUtils", "vs/editor/contrib/wordOperations/wordOperations", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, position_1, selection_1, wordTestUtils_1, wordOperations_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WordOperations', () => {
        const _cursorWordStartLeft = new wordOperations_1.CursorWordStartLeft();
        const _cursorWordEndLeft = new wordOperations_1.CursorWordEndLeft();
        const _cursorWordLeft = new wordOperations_1.CursorWordLeft();
        const _cursorWordStartLeftSelect = new wordOperations_1.CursorWordStartLeftSelect();
        const _cursorWordEndLeftSelect = new wordOperations_1.CursorWordEndLeftSelect();
        const _cursorWordLeftSelect = new wordOperations_1.CursorWordLeftSelect();
        const _cursorWordStartRight = new wordOperations_1.CursorWordStartRight();
        const _cursorWordEndRight = new wordOperations_1.CursorWordEndRight();
        const _cursorWordRight = new wordOperations_1.CursorWordRight();
        const _cursorWordStartRightSelect = new wordOperations_1.CursorWordStartRightSelect();
        const _cursorWordEndRightSelect = new wordOperations_1.CursorWordEndRightSelect();
        const _cursorWordRightSelect = new wordOperations_1.CursorWordRightSelect();
        const _cursorWordAccessibilityLeft = new wordOperations_1.CursorWordAccessibilityLeft();
        const _cursorWordAccessibilityLeftSelect = new wordOperations_1.CursorWordAccessibilityLeftSelect();
        const _cursorWordAccessibilityRight = new wordOperations_1.CursorWordAccessibilityRight();
        const _cursorWordAccessibilityRightSelect = new wordOperations_1.CursorWordAccessibilityRightSelect();
        const _deleteWordLeft = new wordOperations_1.DeleteWordLeft();
        const _deleteWordStartLeft = new wordOperations_1.DeleteWordStartLeft();
        const _deleteWordEndLeft = new wordOperations_1.DeleteWordEndLeft();
        const _deleteWordRight = new wordOperations_1.DeleteWordRight();
        const _deleteWordStartRight = new wordOperations_1.DeleteWordStartRight();
        const _deleteWordEndRight = new wordOperations_1.DeleteWordEndRight();
        function runEditorCommand(editor, command) {
            command.runEditorCommand(null, editor, null);
        }
        function cursorWordLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordLeftSelect : _cursorWordLeft);
        }
        function cursorWordAccessibilityLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordAccessibilityLeft : _cursorWordAccessibilityLeftSelect);
        }
        function cursorWordAccessibilityRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordAccessibilityRightSelect : _cursorWordAccessibilityRight);
        }
        function cursorWordStartLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordStartLeftSelect : _cursorWordStartLeft);
        }
        function cursorWordEndLeft(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordEndLeftSelect : _cursorWordEndLeft);
        }
        function cursorWordRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordRightSelect : _cursorWordRight);
        }
        function moveWordEndRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordEndRightSelect : _cursorWordEndRight);
        }
        function moveWordStartRight(editor, inSelectionMode = false) {
            runEditorCommand(editor, inSelectionMode ? _cursorWordStartRightSelect : _cursorWordStartRight);
        }
        function deleteWordLeft(editor) {
            runEditorCommand(editor, _deleteWordLeft);
        }
        function deleteWordStartLeft(editor) {
            runEditorCommand(editor, _deleteWordStartLeft);
        }
        function deleteWordEndLeft(editor) {
            runEditorCommand(editor, _deleteWordEndLeft);
        }
        function deleteWordRight(editor) {
            runEditorCommand(editor, _deleteWordRight);
        }
        function deleteWordStartRight(editor) {
            runEditorCommand(editor, _deleteWordStartRight);
        }
        function deleteWordEndRight(editor) {
            runEditorCommand(editor, _deleteWordEndRight);
        }
        test('cursorWordLeft - simple', () => {
            const EXPECTED = [
                '|    \t|My |First |Line\t ',
                '|\t|My |Second |Line',
                '|    |Third |Line🐶',
                '|',
                '|1',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - with selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                editor.setPosition(new position_1.Position(5, 2));
                cursorWordLeft(editor, true);
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(5, 2, 5, 1));
            });
        });
        test('cursorWordLeft - issue #832', () => {
            const EXPECTED = ['|   |/* |Just |some   |more   |text |a|+= |3 |+|5-|3 |+ |7 |*/  '].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordLeft - issue #48046: Word selection doesn\'t work as usual', () => {
            const EXPECTED = [
                '|deep.|object.|property',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 21), ed => cursorWordLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordLeftSelect - issue #74369: cursorWordLeft and cursorWordLeftSelect do not behave consistently', () => {
            const EXPECTED = [
                '|this.|is.|a.|test',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 15), ed => cursorWordLeft(ed, true), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordStartLeft', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['|   |/* |Just |some   |more   |text |a|+= |3 |+|5|-|3 |+ |7 |*/|  '].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordStartLeft - issue #51119: regression makes VS compatibility impossible', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['|this|.|is|.|a|.|test'].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordEndLeft', () => {
            const EXPECTED = ['|   /*| Just| some|   more|   text| a|+=| 3| +|5|-|3| +| 7| */|  '].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordEndLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordRight - simple', () => {
            const EXPECTED = [
                '    \tMy| First| Line|\t |',
                '\tMy| Second| Line|',
                '    Third| Line🐶|',
                '|',
                '1|',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(5, 2)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordRight - selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                editor.setPosition(new position_1.Position(1, 1));
                cursorWordRight(editor, true);
                assert.deepEqual(editor.getSelection(), new selection_1.Selection(1, 1, 1, 8));
            });
        });
        test('cursorWordRight - issue #832', () => {
            const EXPECTED = [
                '   /*| Just| some|   more|   text| a|+=| 3| +5|-3| +| 7| */|  |',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordRight - issue #41199', () => {
            const EXPECTED = [
                'console|.log|(err|)|',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => cursorWordRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 17)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('moveWordEndRight', () => {
            const EXPECTED = [
                '   /*| Just| some|   more|   text| a|+=| 3| +5|-3| +| 7| */|  |',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => moveWordEndRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('moveWordStartRight', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = [
                '   |/* |Just |some   |more   |text |a|+= |3 |+|5|-|3 |+ |7 |*/  |',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('issue #51119: cursorWordStartRight regression makes VS compatibility impossible', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['this|.|is|.|a|.|test|'].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 15)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('issue #64810: cursorWordStartRight skips first word after newline', () => {
            // This is the behaviour observed in Visual Studio, please do not touch test
            const EXPECTED = ['Hello |World|', '|Hei |mailman|'].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => moveWordStartRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(2, 12)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordAccessibilityLeft', () => {
            const EXPECTED = ['|   /* |Just |some   |more   |text |a+= |3 +|5-|3 + |7 */  '].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 1000), ed => cursorWordAccessibilityLeft(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 1)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('cursorWordAccessibilityRight', () => {
            const EXPECTED = ['   /* Just| some|   more|   text| a|+= 3| +5|-3| + 7| */  |'].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => cursorWordAccessibilityRight(ed), ed => ed.getPosition(), ed => ed.getPosition().equals(new position_1.Position(1, 50)));
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordLeft for non-empty selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setSelection(new selection_1.Selection(3, 7, 3, 9));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(3), '    Thd Line🐶');
                assert.deepEqual(editor.getPosition(), new position_1.Position(3, 7));
            });
        });
        test('deleteWordLeft for cursor at beginning of document', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 1));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(1), '    \tMy First Line\t ');
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 1));
            });
        });
        test('deleteWordLeft for cursor at end of whitespace', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(3, 11));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(3), '    Line🐶');
                assert.deepEqual(editor.getPosition(), new position_1.Position(3, 5));
            });
        });
        test('deleteWordLeft for cursor just behind a word', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 11));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(2), '\tMy  Line');
                assert.deepEqual(editor.getPosition(), new position_1.Position(2, 5));
            });
        });
        test('deleteWordLeft for cursor inside of a word', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 12));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(1), '    \tMy st Line\t ');
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 9));
            });
        });
        test('deleteWordRight for non-empty selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setSelection(new selection_1.Selection(3, 7, 3, 9));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(3), '    Thd Line🐶');
                assert.deepEqual(editor.getPosition(), new position_1.Position(3, 7));
            });
        });
        test('deleteWordRight for cursor at end of document', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(5, 3));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(5), '1');
                assert.deepEqual(editor.getPosition(), new position_1.Position(5, 2));
            });
        });
        test('deleteWordRight for cursor at beggining of whitespace', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(3, 1));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(3), 'Third Line🐶');
                assert.deepEqual(editor.getPosition(), new position_1.Position(3, 1));
            });
        });
        test('deleteWordRight for cursor just before a word', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 5));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(2), '\tMy  Line');
                assert.deepEqual(editor.getPosition(), new position_1.Position(2, 5));
            });
        });
        test('deleteWordRight for cursor inside of a word', () => {
            testCodeEditor_1.withTestCodeEditor([
                '    \tMy First Line\t ',
                '\tMy Second Line',
                '    Third Line🐶',
                '',
                '1',
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 11));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(1), '    \tMy Fi Line\t ');
                assert.deepEqual(editor.getPosition(), new position_1.Position(1, 11));
            });
        });
        test('deleteWordLeft - issue #832', () => {
            const EXPECTED = [
                '|   |/* |Just |some |text |a|+= |3 |+|5 |*/|  ',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 10000), ed => deleteWordLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordStartLeft', () => {
            const EXPECTED = [
                '|   |/* |Just |some |text |a|+= |3 |+|5 |*/  ',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 10000), ed => deleteWordStartLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordEndLeft', () => {
            const EXPECTED = [
                '|   /*| Just| some| text| a|+=| 3| +|5| */|  ',
            ].join('\n');
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1000, 10000), ed => deleteWordEndLeft(ed), ed => ed.getPosition(), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordLeft - issue #24947', () => {
            testCodeEditor_1.withTestCodeEditor([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(1), '{}');
            });
            testCodeEditor_1.withTestCodeEditor([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordStartLeft(editor);
                assert.equal(model.getLineContent(1), '{}');
            });
            testCodeEditor_1.withTestCodeEditor([
                '{',
                '}'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordEndLeft(editor);
                assert.equal(model.getLineContent(1), '{}');
            });
        });
        test('deleteWordRight - issue #832', () => {
            const EXPECTED = '   |/*| Just| some| text| a|+=| 3| +|5|-|3| */|  |';
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => deleteWordRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordRight - issue #3882', () => {
            testCodeEditor_1.withTestCodeEditor([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordStartRight - issue #3882', () => {
            testCodeEditor_1.withTestCodeEditor([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordStartRight(editor);
                assert.equal(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordEndRight - issue #3882', () => {
            testCodeEditor_1.withTestCodeEditor([
                'public void Add( int x,',
                '                 int y )'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 24));
                deleteWordEndRight(editor);
                assert.equal(model.getLineContent(1), 'public void Add( int x,int y )', '001');
            });
        });
        test('deleteWordStartRight', () => {
            const EXPECTED = '   |/* |Just |some |text |a|+= |3 |+|5|-|3 |*/  |';
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => deleteWordStartRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordEndRight', () => {
            const EXPECTED = '   /*| Just| some| text| a|+=| 3| +|5|-|3| */|  |';
            const [text,] = wordTestUtils_1.deserializePipePositions(EXPECTED);
            const actualStops = wordTestUtils_1.testRepeatedActionAndExtractPositions(text, new position_1.Position(1, 1), ed => deleteWordEndRight(ed), ed => new position_1.Position(1, text.length - ed.getValue().length + 1), ed => ed.getValue().length === 0);
            const actual = wordTestUtils_1.serializePipePositions(text, actualStops);
            assert.deepEqual(actual, EXPECTED);
        });
        test('deleteWordRight - issue #3882 (1): Ctrl+Delete removing entire line when used at the end of line', () => {
            testCodeEditor_1.withTestCodeEditor([
                'A line with text.',
                '   And another one'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(1, 18));
                deleteWordRight(editor);
                assert.equal(model.getLineContent(1), 'A line with text.And another one', '001');
            });
        });
        test('deleteWordLeft - issue #3882 (2): Ctrl+Delete removing entire line when used at the end of line', () => {
            testCodeEditor_1.withTestCodeEditor([
                'A line with text.',
                '   And another one'
            ], {}, (editor, _) => {
                const model = editor.getModel();
                editor.setPosition(new position_1.Position(2, 1));
                deleteWordLeft(editor);
                assert.equal(model.getLineContent(1), 'A line with text.   And another one', '001');
            });
        });
    });
});
//# sourceMappingURL=wordOperations.test.js.map