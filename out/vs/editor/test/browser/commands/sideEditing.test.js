/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/controller/cursor", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/model/textModel", "vs/editor/common/viewModel/viewModelImpl", "vs/editor/test/browser/testCodeEditor", "vs/editor/test/common/mocks/testConfiguration"], function (require, exports, assert, cursor_1, editOperation_1, position_1, range_1, selection_1, textModel_1, viewModelImpl_1, testCodeEditor_1, testConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testCommand(lines, selections, edits, expectedLines, expectedSelections) {
        testCodeEditor_1.withTestCodeEditor(lines, {}, (editor, cursor) => {
            const model = editor.getModel();
            cursor.setSelections('tests', selections);
            model.applyEdits(edits);
            assert.deepEqual(model.getLinesContent(), expectedLines);
            let actualSelections = cursor.getSelections();
            assert.deepEqual(actualSelections.map(s => s.toString()), expectedSelections.map(s => s.toString()));
        });
    }
    suite('Editor Side Editing - collapsed selection', () => {
        test('replace at selection', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 1)], [
                editOperation_1.EditOperation.replace(new selection_1.Selection(1, 1, 1, 1), 'something ')
            ], [
                'something first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 11)]);
        });
        test('replace at selection 2', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 6)], [
                editOperation_1.EditOperation.replace(new selection_1.Selection(1, 1, 1, 6), 'something')
            ], [
                'something',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 10)]);
        });
        test('insert at selection', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 1, 1, 1)], [
                editOperation_1.EditOperation.insert(new position_1.Position(1, 1), 'something ')
            ], [
                'something first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 11, 1, 11)]);
        });
        test('insert at selection sitting on max column', () => {
            testCommand([
                'first',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(1, 6, 1, 6)], [
                editOperation_1.EditOperation.insert(new position_1.Position(1, 6), ' something\nnew ')
            ], [
                'first something',
                'new ',
                'second line',
                'third line',
                'fourth'
            ], [new selection_1.Selection(2, 5, 2, 5)]);
        });
        test('issue #3994: replace on top of selection', () => {
            testCommand([
                '$obj = New-Object "system.col"'
            ], [new selection_1.Selection(1, 30, 1, 30)], [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(1, 19, 1, 31), '"System.Collections"')
            ], [
                '$obj = New-Object "System.Collections"'
            ], [new selection_1.Selection(1, 39, 1, 39)]);
        });
        test('issue #15267: Suggestion that adds a line - cursor goes to the wrong line ', () => {
            testCommand([
                'package main',
                '',
                'import (',
                '	"fmt"',
                ')',
                '',
                'func main(',
                '	fmt.Println(strings.Con)',
                '}'
            ], [new selection_1.Selection(8, 25, 8, 25)], [
                editOperation_1.EditOperation.replaceMove(new range_1.Range(5, 1, 5, 1), '\t\"strings\"\n')
            ], [
                'package main',
                '',
                'import (',
                '	"fmt"',
                '	"strings"',
                ')',
                '',
                'func main(',
                '	fmt.Println(strings.Con)',
                '}'
            ], [new selection_1.Selection(9, 25, 9, 25)]);
        });
        test('issue #15236: Selections broke after deleting text using vscode.TextEditor.edit ', () => {
            testCommand([
                'foofoofoo, foofoofoo, bar'
            ], [new selection_1.Selection(1, 1, 1, 10), new selection_1.Selection(1, 12, 1, 21)], [
                editOperation_1.EditOperation.replace(new range_1.Range(1, 1, 1, 10), ''),
                editOperation_1.EditOperation.replace(new range_1.Range(1, 12, 1, 21), ''),
            ], [
                ', , bar'
            ], [new selection_1.Selection(1, 1, 1, 1), new selection_1.Selection(1, 3, 1, 3)]);
        });
    });
    suite('SideEditing', () => {
        const LINES = [
            'My First Line',
            'My Second Line',
            'Third Line'
        ];
        function _runTest(selection, editRange, editText, editForceMoveMarkers, expected, msg) {
            const model = textModel_1.TextModel.createFromString(LINES.join('\n'));
            const config = new testConfiguration_1.TestConfiguration({});
            const viewModel = new viewModelImpl_1.ViewModel(0, config, model, null);
            const cursor = new cursor_1.Cursor(config, model, viewModel);
            cursor.setSelections('tests', [selection]);
            model.applyEdits([{
                    range: editRange,
                    text: editText,
                    forceMoveMarkers: editForceMoveMarkers
                }]);
            const actual = cursor.getSelection();
            assert.deepEqual(actual.toString(), expected.toString(), msg);
            cursor.dispose();
            viewModel.dispose();
            config.dispose();
            model.dispose();
        }
        function runTest(selection, editRange, editText, expected) {
            const sel1 = new selection_1.Selection(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
            _runTest(sel1, editRange, editText, false, expected[0][0], '0-0-regular-no-force');
            _runTest(sel1, editRange, editText, true, expected[1][0], '1-0-regular-force');
            // RTL selection
            const sel2 = new selection_1.Selection(selection.endLineNumber, selection.endColumn, selection.startLineNumber, selection.startColumn);
            _runTest(sel2, editRange, editText, false, expected[0][1], '0-1-inverse-no-force');
            _runTest(sel2, editRange, editText, true, expected[1][1], '1-1-inverse-force');
        }
        suite('insert', () => {
            suite('collapsed sel', () => {
                test('before', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 3), 'xx', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('equal', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 4), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 4, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('after', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 5), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('before', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 3), 'xx', [
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 4), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('inside', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 5), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 9), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('after', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 10), 'xx', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('delete', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), '', [
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), '', [
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 2), new selection_1.Selection(1, 2, 1, 2)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), '', [
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), '', [
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                        [new selection_1.Selection(1, 2, 1, 7), new selection_1.Selection(1, 7, 1, 2)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), '', [
                        [new selection_1.Selection(1, 3, 1, 7), new selection_1.Selection(1, 7, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 7), new selection_1.Selection(1, 7, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), '', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), '', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), '', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), '', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), '', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), '', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), '', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), '', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('replace short', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), 'c', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), 'c', [
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 3), new selection_1.Selection(1, 3, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), 'c', [
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), 'c', [
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                        [new selection_1.Selection(1, 3, 1, 8), new selection_1.Selection(1, 8, 1, 3)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 8), new selection_1.Selection(1, 8, 1, 5)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 5), new selection_1.Selection(1, 5, 1, 4)],
                        [new selection_1.Selection(1, 5, 1, 5), new selection_1.Selection(1, 5, 1, 5)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), 'c', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), 'c', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), 'c', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 6, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), 'c', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 10), new selection_1.Selection(1, 10, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), 'c', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
        suite('replace long', () => {
            suite('collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 1, 1, 3), 'cccc', [
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 2, 1, 4), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 6), new selection_1.Selection(1, 4, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 6), new selection_1.Selection(1, 6, 1, 6)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 3, 1, 5), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start >= range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 4, 1, 6), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 4), new range_1.Range(1, 5, 1, 7), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 4), new selection_1.Selection(1, 4, 1, 4)],
                    ]);
                });
            });
            suite('non-collapsed dec', () => {
                test('edit.end < range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 1, 1, 3), 'cccc', [
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('edit.end <= range.start', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 2, 1, 4), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 6, 1, 11), new selection_1.Selection(1, 11, 1, 6)],
                    ]);
                });
                test('edit.start < range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 5), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 11), new selection_1.Selection(1, 11, 1, 7)],
                    ]);
                });
                test('edit.start < range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start < range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 3, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 7), new selection_1.Selection(1, 7, 1, 4)],
                        [new selection_1.Selection(1, 7, 1, 7), new selection_1.Selection(1, 7, 1, 7)],
                    ]);
                });
                test('edit.start == range.start && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 6), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 11), new selection_1.Selection(1, 11, 1, 8)],
                    ]);
                });
                test('edit.start == range.start && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start == range.start && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 4, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 8), new selection_1.Selection(1, 8, 1, 4)],
                        [new selection_1.Selection(1, 8, 1, 8), new selection_1.Selection(1, 8, 1, 8)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end < range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 7), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 11), new selection_1.Selection(1, 11, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 9), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start > range.start && edit.start < range.end && edit.end > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 5, 1, 10), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
                test('edit.start == range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 9, 1, 11), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 13), new selection_1.Selection(1, 13, 1, 4)],
                    ]);
                });
                test('edit.start > range.end', () => {
                    runTest(new range_1.Range(1, 4, 1, 9), new range_1.Range(1, 10, 1, 11), 'cccc', [
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                        [new selection_1.Selection(1, 4, 1, 9), new selection_1.Selection(1, 9, 1, 4)],
                    ]);
                });
            });
        });
    });
});
//# sourceMappingURL=sideEditing.test.js.map