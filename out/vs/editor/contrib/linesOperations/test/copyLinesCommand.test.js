/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/selection", "vs/editor/contrib/linesOperations/copyLinesCommand", "vs/editor/test/browser/testCommand", "vs/editor/test/browser/testCodeEditor", "vs/editor/contrib/linesOperations/linesOperations"], function (require, exports, assert, selection_1, copyLinesCommand_1, testCommand_1, testCodeEditor_1, linesOperations_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function testCopyLinesDownCommand(lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, null, selection, (sel) => new copyLinesCommand_1.CopyLinesCommand(sel, true), expectedLines, expectedSelection);
    }
    function testCopyLinesUpCommand(lines, selection, expectedLines, expectedSelection) {
        testCommand_1.testCommand(lines, null, selection, (sel) => new copyLinesCommand_1.CopyLinesCommand(sel, false), expectedLines, expectedSelection);
    }
    suite('Editor Contrib - Copy Lines Command', () => {
        test('copy first line down', function () {
            testCopyLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 3, 2, 1));
        });
        test('copy first line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(1, 3, 1, 1));
        });
        test('copy last line down', function () {
            testCopyLinesDownCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(6, 3, 6, 1));
        });
        test('copy last line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(5, 3, 5, 1));
        });
        test('issue #1322: copy line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 3, 11), [
                'first',
                'second line',
                'third line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(3, 11, 3, 11));
        });
        test('issue #1322: copy last line up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth',
                'fifth'
            ], new selection_1.Selection(5, 6, 5, 6));
        });
        test('copy many lines up', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 3, 2, 1), [
                'first',
                'second line',
                'third line',
                'fourth line',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(4, 3, 2, 1));
        });
        test('ignore empty selection', function () {
            testCopyLinesUpCommand([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1), [
                'first',
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], new selection_1.Selection(2, 1, 1, 1));
        });
    });
    suite('Editor Contrib - Duplicate Selection', () => {
        const duplicateSelectionAction = new linesOperations_1.DuplicateSelectionAction();
        function testDuplicateSelectionAction(lines, selections, expectedLines, expectedSelections) {
            testCodeEditor_1.withTestCodeEditor(lines.join('\n'), {}, (editor, cursor) => {
                editor.setSelections(selections);
                duplicateSelectionAction.run(null, editor, {});
                assert.deepEqual(editor.getValue(), expectedLines.join('\n'));
                assert.deepEqual(editor.getSelections().map(s => s.toString()), expectedSelections.map(s => s.toString()));
            });
        }
        test('empty selection', function () {
            testDuplicateSelectionAction([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 2, 2, 2), new selection_1.Selection(3, 2, 3, 2)], [
                'first',
                'second line',
                'second line',
                'third line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(3, 2, 3, 2), new selection_1.Selection(5, 2, 5, 2)]);
        });
        test('with selection', function () {
            testDuplicateSelectionAction([
                'first',
                'second line',
                'third line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 1, 2, 4), new selection_1.Selection(3, 1, 3, 4)], [
                'first',
                'secsecond line',
                'thithird line',
                'fourth line',
                'fifth'
            ], [new selection_1.Selection(2, 4, 2, 7), new selection_1.Selection(3, 4, 3, 7)]);
        });
    });
});
//# sourceMappingURL=copyLinesCommand.test.js.map