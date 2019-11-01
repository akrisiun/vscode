/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/modes", "vs/editor/common/modes/languageConfigurationRegistry", "vs/editor/test/browser/testCommand", "vs/editor/test/common/editorTestUtils", "vs/editor/test/common/mocks/mockMode", "vs/editor/test/common/modes/supports/javascriptOnEnterRules"], function (require, exports, assert, shiftCommand_1, range_1, selection_1, modes_1, languageConfigurationRegistry_1, testCommand_1, editorTestUtils_1, mockMode_1, javascriptOnEnterRules_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Create single edit operation
     */
    function createSingleEditOp(text, positionLineNumber, positionColumn, selectionLineNumber = positionLineNumber, selectionColumn = positionColumn) {
        return {
            range: new range_1.Range(selectionLineNumber, selectionColumn, positionLineNumber, positionColumn),
            text: text
        };
    }
    exports.createSingleEditOp = createSingleEditOp;
    class DocBlockCommentMode extends mockMode_1.MockMode {
        constructor() {
            super(DocBlockCommentMode._id);
            this._register(languageConfigurationRegistry_1.LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
                brackets: [
                    ['(', ')'],
                    ['{', '}'],
                    ['[', ']']
                ],
                onEnterRules: javascriptOnEnterRules_1.javascriptOnEnterRules
            }));
        }
    }
    DocBlockCommentMode._id = new modes_1.LanguageIdentifier('commentMode', 3);
    function testShiftCommand(lines, languageIdentifier, useTabStops, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, languageIdentifier, selection, (sel) => new shiftCommand_1.ShiftCommand(sel, {
            isUnshift: false,
            tabSize: 4,
            indentSize: 4,
            insertSpaces: false,
            useTabStops: useTabStops,
        }), expectedLines, expectedSelection);
    }
    function testUnshiftCommand(lines, languageIdentifier, useTabStops, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, languageIdentifier, selection, (sel) => new shiftCommand_1.ShiftCommand(sel, {
            isUnshift: true,
            tabSize: 4,
            indentSize: 4,
            insertSpaces: false,
            useTabStops: useTabStops,
        }), expectedLines, expectedSelection);
    }
    function withDockBlockCommentMode(callback) {
        let mode = new DocBlockCommentMode();
        callback(mode);
        mode.dispose();
    }
    suite('Editor Commands - ShiftCommand', () => {
        // --------- shift
        test('Bug 9503: Shifting without any selection', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 1, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 2, 1, 2));
        });
        test('shift on single line selection 1', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 3, 1, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 4, 1, 1));
        });
        test('shift on single line selection 2', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 1, 3), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 1, 4));
        });
        test('simple shift', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
        });
        test('shifting on two separate lines', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
            testShiftCommand([
                '\tMy First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 3, 1), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 3, 1));
        });
        test('shifting on two lines', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 2, 2, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 3, 2, 2));
        });
        test('shifting on two lines again', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 2, 1, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 2, 1, 3));
        });
        test('shifting at end of file', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 2), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '\t123'
            ], new selection_1.Selection(4, 1, 5, 3));
        });
        test('issue #1120 TAB should not indent empty lines in a multi-line selection', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 2), [
                '\tMy First Line',
                '\t\t\tMy Second Line',
                '\t\tThird Line',
                '',
                '\t123'
            ], new selection_1.Selection(1, 1, 5, 3));
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 1), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '\t',
                '123'
            ], new selection_1.Selection(4, 1, 5, 1));
        });
        // --------- unshift
        test('unshift on single line selection 1', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 3, 2, 1), [
                'My First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 3, 2, 1));
        });
        test('unshift on single line selection 2', () => {
            testShiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 2, 3), [
                'My First Line',
                '\t\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 2, 3));
        });
        test('simple unshift', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 2, 1), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 2, 1));
        });
        test('unshifting on two lines 1', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 2, 2, 2), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 2, 2, 2));
        });
        test('unshifting on two lines 2', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 3, 2, 1), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 2, 2, 1));
        });
        test('unshifting at the end of the file', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(4, 1, 5, 2), [
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(4, 1, 5, 2));
        });
        test('unshift many times + shift', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                'My First Line',
                '\tMy Second Line',
                'Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 5, 4));
            testUnshiftCommand([
                'My First Line',
                '\tMy Second Line',
                'Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                'My First Line',
                'My Second Line',
                'Third Line',
                '',
                '123'
            ], new selection_1.Selection(1, 1, 5, 4));
            testShiftCommand([
                'My First Line',
                'My Second Line',
                'Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(1, 1, 5, 4), [
                '\tMy First Line',
                '\tMy Second Line',
                '\tThird Line',
                '',
                '\t123'
            ], new selection_1.Selection(1, 1, 5, 5));
        });
        test('Bug 9119: Unshift from first column doesn\'t work', () => {
            testUnshiftCommand([
                'My First Line',
                '\t\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], null, true, new selection_1.Selection(2, 1, 2, 1), [
                'My First Line',
                '\tMy Second Line',
                '    Third Line',
                '',
                '123'
            ], new selection_1.Selection(2, 1, 2, 1));
        });
        test('issue #348: indenting around doc block comments', () => {
            withDockBlockCommentMode((mode) => {
                testShiftCommand([
                    '',
                    '/**',
                    ' * a doc comment',
                    ' */',
                    'function hello() {}'
                ], mode.getLanguageIdentifier(), true, new selection_1.Selection(1, 1, 5, 20), [
                    '',
                    '\t/**',
                    '\t * a doc comment',
                    '\t */',
                    '\tfunction hello() {}'
                ], new selection_1.Selection(1, 1, 5, 21));
                testUnshiftCommand([
                    '',
                    '/**',
                    ' * a doc comment',
                    ' */',
                    'function hello() {}'
                ], mode.getLanguageIdentifier(), true, new selection_1.Selection(1, 1, 5, 20), [
                    '',
                    '/**',
                    ' * a doc comment',
                    ' */',
                    'function hello() {}'
                ], new selection_1.Selection(1, 1, 5, 20));
                testUnshiftCommand([
                    '\t',
                    '\t/**',
                    '\t * a doc comment',
                    '\t */',
                    '\tfunction hello() {}'
                ], mode.getLanguageIdentifier(), true, new selection_1.Selection(1, 1, 5, 21), [
                    '',
                    '/**',
                    ' * a doc comment',
                    ' */',
                    'function hello() {}'
                ], new selection_1.Selection(1, 1, 5, 20));
            });
        });
        test('issue #1609: Wrong indentation of block comments', () => {
            withDockBlockCommentMode((mode) => {
                testShiftCommand([
                    '',
                    '/**',
                    ' * test',
                    ' *',
                    ' * @type {number}',
                    ' */',
                    'var foo = 0;'
                ], mode.getLanguageIdentifier(), true, new selection_1.Selection(1, 1, 7, 13), [
                    '',
                    '\t/**',
                    '\t * test',
                    '\t *',
                    '\t * @type {number}',
                    '\t */',
                    '\tvar foo = 0;'
                ], new selection_1.Selection(1, 1, 7, 14));
            });
        });
        test('issue #1620: a) Line indent doesn\'t handle leading whitespace properly', () => {
            testCommand_1.testCommand([
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: false,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false
            }), [
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: b) Line indent doesn\'t handle leading whitespace properly', () => {
            testCommand_1.testCommand([
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false
            }), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: c) Line indent doesn\'t handle leading whitespace properly', () => {
            testCommand_1.testCommand([
                '       Written | Numeric',
                '           one | 1',
                '           two | 2',
                '         three | 3',
                '          four | 4',
                '          five | 5',
                '           six | 6',
                '         seven | 7',
                '         eight | 8',
                '          nine | 9',
                '           ten | 10',
                '        eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                useTabStops: false
            }), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue #1620: d) Line indent doesn\'t handle leading whitespace properly', () => {
            testCommand_1.testCommand([
                '\t   Written | Numeric',
                '\t       one | 1',
                '\t       two | 2',
                '\t     three | 3',
                '\t      four | 4',
                '\t      five | 5',
                '\t       six | 6',
                '\t     seven | 7',
                '\t     eight | 8',
                '\t      nine | 9',
                '\t       ten | 10',
                '\t    eleven | 11',
                '',
            ], null, new selection_1.Selection(1, 1, 13, 1), (sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: true,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: true,
                useTabStops: false
            }), [
                '   Written | Numeric',
                '       one | 1',
                '       two | 2',
                '     three | 3',
                '      four | 4',
                '      five | 5',
                '       six | 6',
                '     seven | 7',
                '     eight | 8',
                '      nine | 9',
                '       ten | 10',
                '    eleven | 11',
                '',
            ], new selection_1.Selection(1, 1, 13, 1));
        });
        test('issue Microsoft/monaco-editor#443: Indentation of a single row deletes selected text in some cases', () => {
            testCommand_1.testCommand([
                'Hello world!',
                'another line'
            ], null, new selection_1.Selection(1, 1, 1, 13), (sel) => new shiftCommand_1.ShiftCommand(sel, {
                isUnshift: false,
                tabSize: 4,
                indentSize: 4,
                insertSpaces: false,
                useTabStops: true
            }), [
                '\tHello world!',
                'another line'
            ], new selection_1.Selection(1, 1, 1, 14));
        });
        test('bug #16815:Shift+Tab doesn\'t go back to tabstop', () => {
            let repeatStr = (str, cnt) => {
                let r = '';
                for (let i = 0; i < cnt; i++) {
                    r += str;
                }
                return r;
            };
            let testOutdent = (tabSize, indentSize, insertSpaces, lineText, expectedIndents) => {
                const oneIndent = insertSpaces ? repeatStr(' ', indentSize) : '\t';
                let expectedIndent = repeatStr(oneIndent, expectedIndents);
                if (lineText.length > 0) {
                    _assertUnshiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], [createSingleEditOp(expectedIndent, 1, 1, 1, lineText.length + 1)]);
                }
                else {
                    _assertUnshiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], []);
                }
            };
            let testIndent = (tabSize, indentSize, insertSpaces, lineText, expectedIndents) => {
                const oneIndent = insertSpaces ? repeatStr(' ', indentSize) : '\t';
                let expectedIndent = repeatStr(oneIndent, expectedIndents);
                _assertShiftCommand(tabSize, indentSize, insertSpaces, [lineText + 'aaa'], [createSingleEditOp(expectedIndent, 1, 1, 1, lineText.length + 1)]);
            };
            let testIndentation = (tabSize, indentSize, lineText, expectedOnOutdent, expectedOnIndent) => {
                testOutdent(tabSize, indentSize, true, lineText, expectedOnOutdent);
                testOutdent(tabSize, indentSize, false, lineText, expectedOnOutdent);
                testIndent(tabSize, indentSize, true, lineText, expectedOnIndent);
                testIndent(tabSize, indentSize, false, lineText, expectedOnIndent);
            };
            // insertSpaces: true
            // 0 => 0
            testIndentation(4, 4, '', 0, 1);
            // 1 => 0
            testIndentation(4, 4, '\t', 0, 2);
            testIndentation(4, 4, ' ', 0, 1);
            testIndentation(4, 4, ' \t', 0, 2);
            testIndentation(4, 4, '  ', 0, 1);
            testIndentation(4, 4, '  \t', 0, 2);
            testIndentation(4, 4, '   ', 0, 1);
            testIndentation(4, 4, '   \t', 0, 2);
            testIndentation(4, 4, '    ', 0, 2);
            // 2 => 1
            testIndentation(4, 4, '\t\t', 1, 3);
            testIndentation(4, 4, '\t ', 1, 2);
            testIndentation(4, 4, '\t \t', 1, 3);
            testIndentation(4, 4, '\t  ', 1, 2);
            testIndentation(4, 4, '\t  \t', 1, 3);
            testIndentation(4, 4, '\t   ', 1, 2);
            testIndentation(4, 4, '\t   \t', 1, 3);
            testIndentation(4, 4, '\t    ', 1, 3);
            testIndentation(4, 4, ' \t\t', 1, 3);
            testIndentation(4, 4, ' \t ', 1, 2);
            testIndentation(4, 4, ' \t \t', 1, 3);
            testIndentation(4, 4, ' \t  ', 1, 2);
            testIndentation(4, 4, ' \t  \t', 1, 3);
            testIndentation(4, 4, ' \t   ', 1, 2);
            testIndentation(4, 4, ' \t   \t', 1, 3);
            testIndentation(4, 4, ' \t    ', 1, 3);
            testIndentation(4, 4, '  \t\t', 1, 3);
            testIndentation(4, 4, '  \t ', 1, 2);
            testIndentation(4, 4, '  \t \t', 1, 3);
            testIndentation(4, 4, '  \t  ', 1, 2);
            testIndentation(4, 4, '  \t  \t', 1, 3);
            testIndentation(4, 4, '  \t   ', 1, 2);
            testIndentation(4, 4, '  \t   \t', 1, 3);
            testIndentation(4, 4, '  \t    ', 1, 3);
            testIndentation(4, 4, '   \t\t', 1, 3);
            testIndentation(4, 4, '   \t ', 1, 2);
            testIndentation(4, 4, '   \t \t', 1, 3);
            testIndentation(4, 4, '   \t  ', 1, 2);
            testIndentation(4, 4, '   \t  \t', 1, 3);
            testIndentation(4, 4, '   \t   ', 1, 2);
            testIndentation(4, 4, '   \t   \t', 1, 3);
            testIndentation(4, 4, '   \t    ', 1, 3);
            testIndentation(4, 4, '    \t', 1, 3);
            testIndentation(4, 4, '     ', 1, 2);
            testIndentation(4, 4, '     \t', 1, 3);
            testIndentation(4, 4, '      ', 1, 2);
            testIndentation(4, 4, '      \t', 1, 3);
            testIndentation(4, 4, '       ', 1, 2);
            testIndentation(4, 4, '       \t', 1, 3);
            testIndentation(4, 4, '        ', 1, 3);
            // 3 => 2
            testIndentation(4, 4, '         ', 2, 3);
            function _assertUnshiftCommand(tabSize, indentSize, insertSpaces, text, expected) {
                return editorTestUtils_1.withEditorModel(text, (model) => {
                    let op = new shiftCommand_1.ShiftCommand(new selection_1.Selection(1, 1, text.length + 1, 1), {
                        isUnshift: true,
                        tabSize: tabSize,
                        indentSize: indentSize,
                        insertSpaces: insertSpaces,
                        useTabStops: true
                    });
                    let actual = testCommand_1.getEditOperation(model, op);
                    assert.deepEqual(actual, expected);
                });
            }
            function _assertShiftCommand(tabSize, indentSize, insertSpaces, text, expected) {
                return editorTestUtils_1.withEditorModel(text, (model) => {
                    let op = new shiftCommand_1.ShiftCommand(new selection_1.Selection(1, 1, text.length + 1, 1), {
                        isUnshift: false,
                        tabSize: tabSize,
                        indentSize: indentSize,
                        insertSpaces: insertSpaces,
                        useTabStops: true
                    });
                    let actual = testCommand_1.getEditOperation(model, op);
                    assert.deepEqual(actual, expected);
                });
            }
        });
    });
});
//# sourceMappingURL=shiftCommand.test.js.map