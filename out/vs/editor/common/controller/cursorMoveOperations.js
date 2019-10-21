/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/controller/cursorCommon", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, cursorCommon_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CursorPosition {
        constructor(lineNumber, column, leftoverVisibleColumns) {
            this.lineNumber = lineNumber;
            this.column = column;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
        }
    }
    exports.CursorPosition = CursorPosition;
    class MoveOperations {
        static left(config, model, lineNumber, column) {
            if (column > model.getLineMinColumn(lineNumber)) {
                if (cursorCommon_1.CursorColumns.isLowSurrogate(model, lineNumber, column - 2)) {
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
            return new CursorPosition(lineNumber, column, 0);
        }
        static moveLeft(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move left without selection cancels selection and puts cursor at the beginning of the selection
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                let r = MoveOperations.left(config, model, cursor.position.lineNumber, cursor.position.column - (noOfColumns - 1));
                lineNumber = r.lineNumber;
                column = r.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static right(config, model, lineNumber, column) {
            if (column < model.getLineMaxColumn(lineNumber)) {
                if (cursorCommon_1.CursorColumns.isHighSurrogate(model, lineNumber, column - 1)) {
                    // character after column is a high surrogate
                    column = column + 2;
                }
                else {
                    column = column + 1;
                }
            }
            else if (lineNumber < model.getLineCount()) {
                lineNumber = lineNumber + 1;
                column = model.getLineMinColumn(lineNumber);
            }
            return new CursorPosition(lineNumber, column, 0);
        }
        static moveRight(config, model, cursor, inSelectionMode, noOfColumns) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move right without selection cancels selection and puts cursor at the end of the selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                let r = MoveOperations.right(config, model, cursor.position.lineNumber, cursor.position.column + (noOfColumns - 1));
                lineNumber = r.lineNumber;
                column = r.column;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static down(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnLastLine) {
            const currentVisibleColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize) + leftoverVisibleColumns;
            lineNumber = lineNumber + count;
            let lineCount = model.getLineCount();
            if (lineNumber > lineCount) {
                lineNumber = lineCount;
                if (allowMoveOnLastLine) {
                    column = model.getLineMaxColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                    if (cursorCommon_1.CursorColumns.isInsideSurrogatePair(model, lineNumber, column)) {
                        column = column - 1;
                    }
                }
            }
            else {
                column = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, currentVisibleColumn);
                if (cursorCommon_1.CursorColumns.isInsideSurrogatePair(model, lineNumber, column)) {
                    column = column - 1;
                }
            }
            leftoverVisibleColumns = currentVisibleColumn - cursorCommon_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize);
            return new CursorPosition(lineNumber, column, leftoverVisibleColumns);
        }
        static moveDown(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move down acts relative to the end of selection
                lineNumber = cursor.selection.endLineNumber;
                column = cursor.selection.endColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            let r = MoveOperations.down(config, model, lineNumber, column, cursor.leftoverVisibleColumns, linesCount, true);
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateDown(config, model, cursor) {
            let selection = cursor.selection;
            let selectionStart = MoveOperations.down(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            let position = MoveOperations.down(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static up(config, model, lineNumber, column, leftoverVisibleColumns, count, allowMoveOnFirstLine) {
            const currentVisibleColumn = cursorCommon_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize) + leftoverVisibleColumns;
            lineNumber = lineNumber - count;
            if (lineNumber < 1) {
                lineNumber = 1;
                if (allowMoveOnFirstLine) {
                    column = model.getLineMinColumn(lineNumber);
                }
                else {
                    column = Math.min(model.getLineMaxColumn(lineNumber), column);
                    if (cursorCommon_1.CursorColumns.isInsideSurrogatePair(model, lineNumber, column)) {
                        column = column - 1;
                    }
                }
            }
            else {
                column = cursorCommon_1.CursorColumns.columnFromVisibleColumn2(config, model, lineNumber, currentVisibleColumn);
                if (cursorCommon_1.CursorColumns.isInsideSurrogatePair(model, lineNumber, column)) {
                    column = column - 1;
                }
            }
            leftoverVisibleColumns = currentVisibleColumn - cursorCommon_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(lineNumber), column, config.tabSize);
            return new CursorPosition(lineNumber, column, leftoverVisibleColumns);
        }
        static moveUp(config, model, cursor, inSelectionMode, linesCount) {
            let lineNumber, column;
            if (cursor.hasSelection() && !inSelectionMode) {
                // If we are in selection mode, move up acts relative to the beginning of selection
                lineNumber = cursor.selection.startLineNumber;
                column = cursor.selection.startColumn;
            }
            else {
                lineNumber = cursor.position.lineNumber;
                column = cursor.position.column;
            }
            let r = MoveOperations.up(config, model, lineNumber, column, cursor.leftoverVisibleColumns, linesCount, true);
            return cursor.move(inSelectionMode, r.lineNumber, r.column, r.leftoverVisibleColumns);
        }
        static translateUp(config, model, cursor) {
            let selection = cursor.selection;
            let selectionStart = MoveOperations.up(config, model, selection.selectionStartLineNumber, selection.selectionStartColumn, cursor.selectionStartLeftoverVisibleColumns, 1, false);
            let position = MoveOperations.up(config, model, selection.positionLineNumber, selection.positionColumn, cursor.leftoverVisibleColumns, 1, false);
            return new cursorCommon_1.SingleCursorState(new range_1.Range(selectionStart.lineNumber, selectionStart.column, selectionStart.lineNumber, selectionStart.column), selectionStart.leftoverVisibleColumns, new position_1.Position(position.lineNumber, position.column), position.leftoverVisibleColumns);
        }
        static moveToBeginningOfLine(config, model, cursor, inSelectionMode) {
            let lineNumber = cursor.position.lineNumber;
            let minColumn = model.getLineMinColumn(lineNumber);
            let firstNonBlankColumn = model.getLineFirstNonWhitespaceColumn(lineNumber) || minColumn;
            let column;
            let relevantColumnNumber = cursor.position.column;
            if (relevantColumnNumber === firstNonBlankColumn) {
                column = minColumn;
            }
            else {
                column = firstNonBlankColumn;
            }
            return cursor.move(inSelectionMode, lineNumber, column, 0);
        }
        static moveToEndOfLine(config, model, cursor, inSelectionMode) {
            let lineNumber = cursor.position.lineNumber;
            let maxColumn = model.getLineMaxColumn(lineNumber);
            return cursor.move(inSelectionMode, lineNumber, maxColumn, 0);
        }
        static moveToBeginningOfBuffer(config, model, cursor, inSelectionMode) {
            return cursor.move(inSelectionMode, 1, 1, 0);
        }
        static moveToEndOfBuffer(config, model, cursor, inSelectionMode) {
            let lastLineNumber = model.getLineCount();
            let lastColumn = model.getLineMaxColumn(lastLineNumber);
            return cursor.move(inSelectionMode, lastLineNumber, lastColumn, 0);
        }
    }
    exports.MoveOperations = MoveOperations;
});
//# sourceMappingURL=cursorMoveOperations.js.map