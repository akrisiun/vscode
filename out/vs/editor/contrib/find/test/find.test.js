/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/contrib/find/findController", "vs/editor/test/browser/testCodeEditor"], function (require, exports, assert, position_1, range_1, findController_1, testCodeEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Find', () => {
        test('search string at position', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC DEF',
                '0123 456'
            ], {}, (editor, cursor) => {
                // The cursor is at the very top, of the file, at the first ABC
                let searchStringAtTop = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringAtTop, 'ABC');
                // Move cursor to the end of ABC
                editor.setPosition(new position_1.Position(1, 3));
                let searchStringAfterABC = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringAfterABC, 'ABC');
                // Move cursor to DEF
                editor.setPosition(new position_1.Position(1, 5));
                let searchStringInsideDEF = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringInsideDEF, 'DEF');
            });
        });
        test('search string with selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC DEF',
                '0123 456'
            ], {}, (editor, cursor) => {
                // Select A of ABC
                editor.setSelection(new range_1.Range(1, 1, 1, 2));
                let searchStringSelectionA = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionA, 'A');
                // Select BC of ABC
                editor.setSelection(new range_1.Range(1, 2, 1, 4));
                let searchStringSelectionBC = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionBC, 'BC');
                // Select BC DE
                editor.setSelection(new range_1.Range(1, 2, 1, 7));
                let searchStringSelectionBCDE = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionBCDE, 'BC DE');
            });
        });
        test('search string with multiline selection', () => {
            testCodeEditor_1.withTestCodeEditor([
                'ABC DEF',
                '0123 456'
            ], {}, (editor, cursor) => {
                // Select first line and newline
                editor.setSelection(new range_1.Range(1, 1, 2, 1));
                let searchStringSelectionWholeLine = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionWholeLine, null);
                // Select first line and chunk of second
                editor.setSelection(new range_1.Range(1, 1, 2, 4));
                let searchStringSelectionTwoLines = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionTwoLines, null);
                // Select end of first line newline and and chunk of second
                editor.setSelection(new range_1.Range(1, 7, 2, 4));
                let searchStringSelectionSpanLines = findController_1.getSelectionSearchString(editor);
                assert.equal(searchStringSelectionSpanLines, null);
            });
        });
    });
});
//# sourceMappingURL=find.test.js.map