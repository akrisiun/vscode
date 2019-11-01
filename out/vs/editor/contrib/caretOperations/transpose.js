/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/replaceCommand", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys"], function (require, exports, nls, strings_1, editorExtensions_1, replaceCommand_1, position_1, range_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TransposeLettersAction extends editorExtensions_1.EditorAction {
        positionLeftOf(start, model) {
            let column = start.column;
            let lineNumber = start.lineNumber;
            if (column > model.getLineMinColumn(lineNumber)) {
                if (strings_1.isLowSurrogate(model.getLineContent(lineNumber).charCodeAt(column - 2))) {
                    // character before column is a low surrogate
                    column = column - 2;
                }
                else {
                    column = column - 1;
                }
            }
            else if (lineNumber > 1) {
                lineNumber = lineNumber - 1;
                column = model.getLineMaxColumn(lineNumber);
            }
            return new position_1.Position(lineNumber, column);
        }
        positionRightOf(start, model) {
            let column = start.column;
            let lineNumber = start.lineNumber;
            if (column < model.getLineMaxColumn(lineNumber)) {
                if (strings_1.isHighSurrogate(model.getLineContent(lineNumber).charCodeAt(column - 1))) {
                    // character after column is a high surrogate
                    column = column + 2;
                }
                else {
                    column = column + 1;
                }
            }
            else if (lineNumber < model.getLineCount()) {
                lineNumber = lineNumber + 1;
                column = 0;
            }
            return new position_1.Position(lineNumber, column);
        }
        constructor() {
            super({
                id: 'editor.action.transposeLetters',
                label: nls.localize('transposeLetters.label', "Transpose Letters"),
                alias: 'Transpose Letters',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    mac: {
                        primary: 256 /* WinCtrl */ | 50 /* KEY_T */
                    },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let model = editor.getModel();
            let commands = [];
            let selections = editor.getSelections();
            for (let selection of selections) {
                if (!selection.isEmpty()) {
                    continue;
                }
                let lineNumber = selection.startLineNumber;
                let column = selection.startColumn;
                let lastColumn = model.getLineMaxColumn(lineNumber);
                if (lineNumber === 1 && (column === 1 || (column === 2 && lastColumn === 2))) {
                    // at beginning of file, nothing to do
                    continue;
                }
                // handle special case: when at end of line, transpose left two chars
                // otherwise, transpose left and right chars
                let endPosition = (column === lastColumn) ?
                    selection.getPosition() :
                    this.positionRightOf(selection.getPosition(), model);
                let middlePosition = this.positionLeftOf(endPosition, model);
                let beginPosition = this.positionLeftOf(middlePosition, model);
                let leftChar = model.getValueInRange(range_1.Range.fromPositions(beginPosition, middlePosition));
                let rightChar = model.getValueInRange(range_1.Range.fromPositions(middlePosition, endPosition));
                let replaceRange = range_1.Range.fromPositions(beginPosition, endPosition);
                commands.push(new replaceCommand_1.ReplaceCommand(replaceRange, rightChar + leftChar));
            }
            if (commands.length > 0) {
                editor.pushUndoStop();
                editor.executeCommands(this.id, commands);
                editor.pushUndoStop();
            }
        }
    }
    editorExtensions_1.registerEditorAction(TransposeLettersAction);
});
//# sourceMappingURL=transpose.js.map