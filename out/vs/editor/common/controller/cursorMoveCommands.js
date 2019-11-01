/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/editor/common/controller/cursorCommon", "vs/editor/common/controller/cursorMoveOperations", "vs/editor/common/controller/cursorWordOperations", "vs/editor/common/core/position", "vs/editor/common/core/range"], function (require, exports, types, cursorCommon_1, cursorMoveOperations_1, cursorWordOperations_1, position_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CursorMoveCommands {
        static addCursorDown(context, cursors, useLogicalLine) {
            let result = [], resultLen = 0;
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[resultLen++] = new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
                if (useLogicalLine) {
                    result[resultLen++] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.translateDown(context.config, context.model, cursor.modelState));
                }
                else {
                    result[resultLen++] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.translateDown(context.config, context.viewModel, cursor.viewState));
                }
            }
            return result;
        }
        static addCursorUp(context, cursors, useLogicalLine) {
            let result = [], resultLen = 0;
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[resultLen++] = new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
                if (useLogicalLine) {
                    result[resultLen++] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.translateUp(context.config, context.model, cursor.modelState));
                }
                else {
                    result[resultLen++] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.translateUp(context.config, context.viewModel, cursor.viewState));
                }
            }
            return result;
        }
        static moveToBeginningOfLine(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = this._moveToLineStart(context, cursor, inSelectionMode);
            }
            return result;
        }
        static _moveToLineStart(context, cursor, inSelectionMode) {
            const currentViewStateColumn = cursor.viewState.position.column;
            const currentModelStateColumn = cursor.modelState.position.column;
            const isFirstLineOfWrappedLine = currentViewStateColumn === currentModelStateColumn;
            const currentViewStatelineNumber = cursor.viewState.position.lineNumber;
            const firstNonBlankColumn = context.viewModel.getLineFirstNonWhitespaceColumn(currentViewStatelineNumber);
            const isBeginningOfViewLine = currentViewStateColumn === firstNonBlankColumn;
            if (!isFirstLineOfWrappedLine && !isBeginningOfViewLine) {
                return this._moveToLineStartByView(context, cursor, inSelectionMode);
            }
            else {
                return this._moveToLineStartByModel(context, cursor, inSelectionMode);
            }
        }
        static _moveToLineStartByView(context, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfLine(context.config, context.viewModel, cursor.viewState, inSelectionMode));
        }
        static _moveToLineStartByModel(context, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfLine(context.config, context.model, cursor.modelState, inSelectionMode));
        }
        static moveToEndOfLine(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = this._moveToLineEnd(context, cursor, inSelectionMode);
            }
            return result;
        }
        static _moveToLineEnd(context, cursor, inSelectionMode) {
            const viewStatePosition = cursor.viewState.position;
            const viewModelMaxColumn = context.viewModel.getLineMaxColumn(viewStatePosition.lineNumber);
            const isEndOfViewLine = viewStatePosition.column === viewModelMaxColumn;
            const modelStatePosition = cursor.modelState.position;
            const modelMaxColumn = context.model.getLineMaxColumn(modelStatePosition.lineNumber);
            const isEndLineOfWrappedLine = viewModelMaxColumn - viewStatePosition.column === modelMaxColumn - modelStatePosition.column;
            if (isEndOfViewLine || isEndLineOfWrappedLine) {
                return this._moveToLineEndByModel(context, cursor, inSelectionMode);
            }
            else {
                return this._moveToLineEndByView(context, cursor, inSelectionMode);
            }
        }
        static _moveToLineEndByView(context, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveToEndOfLine(context.config, context.viewModel, cursor.viewState, inSelectionMode));
        }
        static _moveToLineEndByModel(context, cursor, inSelectionMode) {
            return cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToEndOfLine(context.config, context.model, cursor.modelState, inSelectionMode));
        }
        static expandLineSelection(context, cursors) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewSelection = cursor.viewState.selection;
                const startLineNumber = viewSelection.startLineNumber;
                const lineCount = context.viewModel.getLineCount();
                let endLineNumber = viewSelection.endLineNumber;
                let endColumn;
                if (endLineNumber === lineCount) {
                    endColumn = context.viewModel.getLineMaxColumn(lineCount);
                }
                else {
                    endLineNumber++;
                    endColumn = 1;
                }
                result[i] = cursorCommon_1.CursorState.fromViewState(new cursorCommon_1.SingleCursorState(new range_1.Range(startLineNumber, 1, startLineNumber, 1), 0, new position_1.Position(endLineNumber, endColumn), 0));
            }
            return result;
        }
        static moveToBeginningOfBuffer(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToBeginningOfBuffer(context.config, context.model, cursor.modelState, inSelectionMode));
            }
            return result;
        }
        static moveToEndOfBuffer(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveToEndOfBuffer(context.config, context.model, cursor.modelState, inSelectionMode));
            }
            return result;
        }
        static selectAll(context, cursor) {
            const lineCount = context.model.getLineCount();
            const maxColumn = context.model.getLineMaxColumn(lineCount);
            return cursorCommon_1.CursorState.fromModelState(new cursorCommon_1.SingleCursorState(new range_1.Range(1, 1, 1, 1), 0, new position_1.Position(lineCount, maxColumn), 0));
        }
        static line(context, cursor, inSelectionMode, _position, _viewPosition) {
            const position = context.model.validatePosition(_position);
            const viewPosition = (_viewPosition
                ? context.validateViewPosition(new position_1.Position(_viewPosition.lineNumber, _viewPosition.column), position)
                : context.convertModelPositionToViewPosition(position));
            if (!inSelectionMode || !cursor.modelState.hasSelection()) {
                // Entering line selection for the first time
                const lineCount = context.model.getLineCount();
                let selectToLineNumber = position.lineNumber + 1;
                let selectToColumn = 1;
                if (selectToLineNumber > lineCount) {
                    selectToLineNumber = lineCount;
                    selectToColumn = context.model.getLineMaxColumn(selectToLineNumber);
                }
                return cursorCommon_1.CursorState.fromModelState(new cursorCommon_1.SingleCursorState(new range_1.Range(position.lineNumber, 1, selectToLineNumber, selectToColumn), 0, new position_1.Position(selectToLineNumber, selectToColumn), 0));
            }
            // Continuing line selection
            const enteringLineNumber = cursor.modelState.selectionStart.getStartPosition().lineNumber;
            if (position.lineNumber < enteringLineNumber) {
                return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(cursor.modelState.hasSelection(), viewPosition.lineNumber, 1, 0));
            }
            else if (position.lineNumber > enteringLineNumber) {
                const lineCount = context.viewModel.getLineCount();
                let selectToViewLineNumber = viewPosition.lineNumber + 1;
                let selectToViewColumn = 1;
                if (selectToViewLineNumber > lineCount) {
                    selectToViewLineNumber = lineCount;
                    selectToViewColumn = context.viewModel.getLineMaxColumn(selectToViewLineNumber);
                }
                return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(cursor.modelState.hasSelection(), selectToViewLineNumber, selectToViewColumn, 0));
            }
            else {
                const endPositionOfSelectionStart = cursor.modelState.selectionStart.getEndPosition();
                return cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(cursor.modelState.hasSelection(), endPositionOfSelectionStart.lineNumber, endPositionOfSelectionStart.column, 0));
            }
        }
        static word(context, cursor, inSelectionMode, _position) {
            const position = context.model.validatePosition(_position);
            return cursorCommon_1.CursorState.fromModelState(cursorWordOperations_1.WordOperations.word(context.config, context.model, cursor.modelState, inSelectionMode, position));
        }
        static cancelSelection(context, cursor) {
            if (!cursor.modelState.hasSelection()) {
                return new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
            }
            const lineNumber = cursor.viewState.position.lineNumber;
            const column = cursor.viewState.position.column;
            return cursorCommon_1.CursorState.fromViewState(new cursorCommon_1.SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), 0, new position_1.Position(lineNumber, column), 0));
        }
        static moveTo(context, cursor, inSelectionMode, _position, _viewPosition) {
            const position = context.model.validatePosition(_position);
            const viewPosition = (_viewPosition
                ? context.validateViewPosition(new position_1.Position(_viewPosition.lineNumber, _viewPosition.column), position)
                : context.convertModelPositionToViewPosition(position));
            return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(inSelectionMode, viewPosition.lineNumber, viewPosition.column, 0));
        }
        static move(context, cursors, args) {
            const inSelectionMode = args.select;
            const value = args.value;
            switch (args.direction) {
                case 0 /* Left */: {
                    if (args.unit === 4 /* HalfLine */) {
                        // Move left by half the current line length
                        return this._moveHalfLineLeft(context, cursors, inSelectionMode);
                    }
                    else {
                        // Move left by `moveParams.value` columns
                        return this._moveLeft(context, cursors, inSelectionMode, value);
                    }
                }
                case 1 /* Right */: {
                    if (args.unit === 4 /* HalfLine */) {
                        // Move right by half the current line length
                        return this._moveHalfLineRight(context, cursors, inSelectionMode);
                    }
                    else {
                        // Move right by `moveParams.value` columns
                        return this._moveRight(context, cursors, inSelectionMode, value);
                    }
                }
                case 2 /* Up */: {
                    if (args.unit === 2 /* WrappedLine */) {
                        // Move up by view lines
                        return this._moveUpByViewLines(context, cursors, inSelectionMode, value);
                    }
                    else {
                        // Move up by model lines
                        return this._moveUpByModelLines(context, cursors, inSelectionMode, value);
                    }
                }
                case 3 /* Down */: {
                    if (args.unit === 2 /* WrappedLine */) {
                        // Move down by view lines
                        return this._moveDownByViewLines(context, cursors, inSelectionMode, value);
                    }
                    else {
                        // Move down by model lines
                        return this._moveDownByModelLines(context, cursors, inSelectionMode, value);
                    }
                }
                case 4 /* WrappedLineStart */: {
                    // Move to the beginning of the current view line
                    return this._moveToViewMinColumn(context, cursors, inSelectionMode);
                }
                case 5 /* WrappedLineFirstNonWhitespaceCharacter */: {
                    // Move to the first non-whitespace column of the current view line
                    return this._moveToViewFirstNonWhitespaceColumn(context, cursors, inSelectionMode);
                }
                case 6 /* WrappedLineColumnCenter */: {
                    // Move to the "center" of the current view line
                    return this._moveToViewCenterColumn(context, cursors, inSelectionMode);
                }
                case 7 /* WrappedLineEnd */: {
                    // Move to the end of the current view line
                    return this._moveToViewMaxColumn(context, cursors, inSelectionMode);
                }
                case 8 /* WrappedLineLastNonWhitespaceCharacter */: {
                    // Move to the last non-whitespace column of the current view line
                    return this._moveToViewLastNonWhitespaceColumn(context, cursors, inSelectionMode);
                }
                case 9 /* ViewPortTop */: {
                    // Move to the nth line start in the viewport (from the top)
                    const cursor = cursors[0];
                    const visibleModelRange = context.getCompletelyVisibleModelRange();
                    const modelLineNumber = this._firstLineNumberInRange(context.model, visibleModelRange, value);
                    const modelColumn = context.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(context, cursor, inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 11 /* ViewPortBottom */: {
                    // Move to the nth line start in the viewport (from the bottom)
                    const cursor = cursors[0];
                    const visibleModelRange = context.getCompletelyVisibleModelRange();
                    const modelLineNumber = this._lastLineNumberInRange(context.model, visibleModelRange, value);
                    const modelColumn = context.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(context, cursor, inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 10 /* ViewPortCenter */: {
                    // Move to the line start in the viewport center
                    const cursor = cursors[0];
                    const visibleModelRange = context.getCompletelyVisibleModelRange();
                    const modelLineNumber = Math.round((visibleModelRange.startLineNumber + visibleModelRange.endLineNumber) / 2);
                    const modelColumn = context.model.getLineFirstNonWhitespaceColumn(modelLineNumber);
                    return [this._moveToModelPosition(context, cursor, inSelectionMode, modelLineNumber, modelColumn)];
                }
                case 12 /* ViewPortIfOutside */: {
                    // Move to a position inside the viewport
                    const visibleViewRange = context.getCompletelyVisibleViewRange();
                    let result = [];
                    for (let i = 0, len = cursors.length; i < len; i++) {
                        const cursor = cursors[i];
                        result[i] = this.findPositionInViewportIfOutside(context, cursor, visibleViewRange, inSelectionMode);
                    }
                    return result;
                }
            }
            return null;
        }
        static findPositionInViewportIfOutside(context, cursor, visibleViewRange, inSelectionMode) {
            let viewLineNumber = cursor.viewState.position.lineNumber;
            if (visibleViewRange.startLineNumber <= viewLineNumber && viewLineNumber <= visibleViewRange.endLineNumber - 1) {
                // Nothing to do, cursor is in viewport
                return new cursorCommon_1.CursorState(cursor.modelState, cursor.viewState);
            }
            else {
                if (viewLineNumber > visibleViewRange.endLineNumber - 1) {
                    viewLineNumber = visibleViewRange.endLineNumber - 1;
                }
                if (viewLineNumber < visibleViewRange.startLineNumber) {
                    viewLineNumber = visibleViewRange.startLineNumber;
                }
                const viewColumn = context.viewModel.getLineFirstNonWhitespaceColumn(viewLineNumber);
                return this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
        }
        /**
         * Find the nth line start included in the range (from the start).
         */
        static _firstLineNumberInRange(model, range, count) {
            let startLineNumber = range.startLineNumber;
            if (range.startColumn !== model.getLineMinColumn(startLineNumber)) {
                // Move on to the second line if the first line start is not included in the range
                startLineNumber++;
            }
            return Math.min(range.endLineNumber, startLineNumber + count - 1);
        }
        /**
         * Find the nth line start included in the range (from the end).
         */
        static _lastLineNumberInRange(model, range, count) {
            let startLineNumber = range.startLineNumber;
            if (range.startColumn !== model.getLineMinColumn(startLineNumber)) {
                // Move on to the second line if the first line start is not included in the range
                startLineNumber++;
            }
            return Math.max(startLineNumber, range.endLineNumber - count + 1);
        }
        static _moveLeft(context, cursors, inSelectionMode, noOfColumns) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                let newViewState = cursorMoveOperations_1.MoveOperations.moveLeft(context.config, context.viewModel, cursor.viewState, inSelectionMode, noOfColumns);
                if (noOfColumns === 1 && newViewState.position.lineNumber !== cursor.viewState.position.lineNumber) {
                    // moved over to the previous view line
                    const newViewModelPosition = context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(newViewState.position);
                    if (newViewModelPosition.lineNumber === cursor.modelState.position.lineNumber) {
                        // stayed on the same model line => pass wrapping point where 2 view positions map to a single model position
                        newViewState = cursorMoveOperations_1.MoveOperations.moveLeft(context.config, context.viewModel, newViewState, inSelectionMode, 1);
                    }
                }
                result[i] = cursorCommon_1.CursorState.fromViewState(newViewState);
            }
            return result;
        }
        static _moveHalfLineLeft(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const halfLine = Math.round(context.viewModel.getLineContent(viewLineNumber).length / 2);
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveLeft(context.config, context.viewModel, cursor.viewState, inSelectionMode, halfLine));
            }
            return result;
        }
        static _moveRight(context, cursors, inSelectionMode, noOfColumns) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                let newViewState = cursorMoveOperations_1.MoveOperations.moveRight(context.config, context.viewModel, cursor.viewState, inSelectionMode, noOfColumns);
                if (noOfColumns === 1 && newViewState.position.lineNumber !== cursor.viewState.position.lineNumber) {
                    // moved over to the next view line
                    const newViewModelPosition = context.viewModel.coordinatesConverter.convertViewPositionToModelPosition(newViewState.position);
                    if (newViewModelPosition.lineNumber === cursor.modelState.position.lineNumber) {
                        // stayed on the same model line => pass wrapping point where 2 view positions map to a single model position
                        newViewState = cursorMoveOperations_1.MoveOperations.moveRight(context.config, context.viewModel, newViewState, inSelectionMode, 1);
                    }
                }
                result[i] = cursorCommon_1.CursorState.fromViewState(newViewState);
            }
            return result;
        }
        static _moveHalfLineRight(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const halfLine = Math.round(context.viewModel.getLineContent(viewLineNumber).length / 2);
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveRight(context.config, context.viewModel, cursor.viewState, inSelectionMode, halfLine));
            }
            return result;
        }
        static _moveDownByViewLines(context, cursors, inSelectionMode, linesCount) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveDown(context.config, context.viewModel, cursor.viewState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveDownByModelLines(context, cursors, inSelectionMode, linesCount) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveDown(context.config, context.model, cursor.modelState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveUpByViewLines(context, cursors, inSelectionMode, linesCount) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromViewState(cursorMoveOperations_1.MoveOperations.moveUp(context.config, context.viewModel, cursor.viewState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveUpByModelLines(context, cursors, inSelectionMode, linesCount) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                result[i] = cursorCommon_1.CursorState.fromModelState(cursorMoveOperations_1.MoveOperations.moveUp(context.config, context.model, cursor.modelState, inSelectionMode, linesCount));
            }
            return result;
        }
        static _moveToViewPosition(context, cursor, inSelectionMode, toViewLineNumber, toViewColumn) {
            return cursorCommon_1.CursorState.fromViewState(cursor.viewState.move(inSelectionMode, toViewLineNumber, toViewColumn, 0));
        }
        static _moveToModelPosition(context, cursor, inSelectionMode, toModelLineNumber, toModelColumn) {
            return cursorCommon_1.CursorState.fromModelState(cursor.modelState.move(inSelectionMode, toModelLineNumber, toModelColumn, 0));
        }
        static _moveToViewMinColumn(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = context.viewModel.getLineMinColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewFirstNonWhitespaceColumn(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = context.viewModel.getLineFirstNonWhitespaceColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewCenterColumn(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = Math.round((context.viewModel.getLineMaxColumn(viewLineNumber) + context.viewModel.getLineMinColumn(viewLineNumber)) / 2);
                result[i] = this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewMaxColumn(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = context.viewModel.getLineMaxColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
        static _moveToViewLastNonWhitespaceColumn(context, cursors, inSelectionMode) {
            let result = [];
            for (let i = 0, len = cursors.length; i < len; i++) {
                const cursor = cursors[i];
                const viewLineNumber = cursor.viewState.position.lineNumber;
                const viewColumn = context.viewModel.getLineLastNonWhitespaceColumn(viewLineNumber);
                result[i] = this._moveToViewPosition(context, cursor, inSelectionMode, viewLineNumber, viewColumn);
            }
            return result;
        }
    }
    exports.CursorMoveCommands = CursorMoveCommands;
    var CursorMove;
    (function (CursorMove) {
        const isCursorMoveArgs = function (arg) {
            if (!types.isObject(arg)) {
                return false;
            }
            let cursorMoveArg = arg;
            if (!types.isString(cursorMoveArg.to)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.select) && !types.isBoolean(cursorMoveArg.select)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.by) && !types.isString(cursorMoveArg.by)) {
                return false;
            }
            if (!types.isUndefined(cursorMoveArg.value) && !types.isNumber(cursorMoveArg.value)) {
                return false;
            }
            return true;
        };
        CursorMove.description = {
            description: 'Move cursor to a logical position in the view',
            args: [
                {
                    name: 'Cursor move argument object',
                    description: `Property-value pairs that can be passed through this argument:
					* 'to': A mandatory logical position value providing where to move the cursor.
						\`\`\`
						'left', 'right', 'up', 'down'
						'wrappedLineStart', 'wrappedLineEnd', 'wrappedLineColumnCenter'
						'wrappedLineFirstNonWhitespaceCharacter', 'wrappedLineLastNonWhitespaceCharacter'
						'viewPortTop', 'viewPortCenter', 'viewPortBottom', 'viewPortIfOutside'
						\`\`\`
					* 'by': Unit to move. Default is computed based on 'to' value.
						\`\`\`
						'line', 'wrappedLine', 'character', 'halfLine'
						\`\`\`
					* 'value': Number of units to move. Default is '1'.
					* 'select': If 'true' makes the selection. Default is 'false'.
				`,
                    constraint: isCursorMoveArgs,
                    schema: {
                        'type': 'object',
                        'required': ['to'],
                        'properties': {
                            'to': {
                                'type': 'string',
                                'enum': ['left', 'right', 'up', 'down', 'wrappedLineStart', 'wrappedLineEnd', 'wrappedLineColumnCenter', 'wrappedLineFirstNonWhitespaceCharacter', 'wrappedLineLastNonWhitespaceCharacter', 'viewPortTop', 'viewPortCenter', 'viewPortBottom', 'viewPortIfOutside']
                            },
                            'by': {
                                'type': 'string',
                                'enum': ['line', 'wrappedLine', 'character', 'halfLine']
                            },
                            'value': {
                                'type': 'number',
                                'default': 1
                            },
                            'select': {
                                'type': 'boolean',
                                'default': false
                            }
                        }
                    }
                }
            ]
        };
        /**
         * Positions in the view for cursor move command.
         */
        CursorMove.RawDirection = {
            Left: 'left',
            Right: 'right',
            Up: 'up',
            Down: 'down',
            WrappedLineStart: 'wrappedLineStart',
            WrappedLineFirstNonWhitespaceCharacter: 'wrappedLineFirstNonWhitespaceCharacter',
            WrappedLineColumnCenter: 'wrappedLineColumnCenter',
            WrappedLineEnd: 'wrappedLineEnd',
            WrappedLineLastNonWhitespaceCharacter: 'wrappedLineLastNonWhitespaceCharacter',
            ViewPortTop: 'viewPortTop',
            ViewPortCenter: 'viewPortCenter',
            ViewPortBottom: 'viewPortBottom',
            ViewPortIfOutside: 'viewPortIfOutside'
        };
        /**
         * Units for Cursor move 'by' argument
         */
        CursorMove.RawUnit = {
            Line: 'line',
            WrappedLine: 'wrappedLine',
            Character: 'character',
            HalfLine: 'halfLine'
        };
        function parse(args) {
            if (!args.to) {
                // illegal arguments
                return null;
            }
            let direction;
            switch (args.to) {
                case CursorMove.RawDirection.Left:
                    direction = 0 /* Left */;
                    break;
                case CursorMove.RawDirection.Right:
                    direction = 1 /* Right */;
                    break;
                case CursorMove.RawDirection.Up:
                    direction = 2 /* Up */;
                    break;
                case CursorMove.RawDirection.Down:
                    direction = 3 /* Down */;
                    break;
                case CursorMove.RawDirection.WrappedLineStart:
                    direction = 4 /* WrappedLineStart */;
                    break;
                case CursorMove.RawDirection.WrappedLineFirstNonWhitespaceCharacter:
                    direction = 5 /* WrappedLineFirstNonWhitespaceCharacter */;
                    break;
                case CursorMove.RawDirection.WrappedLineColumnCenter:
                    direction = 6 /* WrappedLineColumnCenter */;
                    break;
                case CursorMove.RawDirection.WrappedLineEnd:
                    direction = 7 /* WrappedLineEnd */;
                    break;
                case CursorMove.RawDirection.WrappedLineLastNonWhitespaceCharacter:
                    direction = 8 /* WrappedLineLastNonWhitespaceCharacter */;
                    break;
                case CursorMove.RawDirection.ViewPortTop:
                    direction = 9 /* ViewPortTop */;
                    break;
                case CursorMove.RawDirection.ViewPortBottom:
                    direction = 11 /* ViewPortBottom */;
                    break;
                case CursorMove.RawDirection.ViewPortCenter:
                    direction = 10 /* ViewPortCenter */;
                    break;
                case CursorMove.RawDirection.ViewPortIfOutside:
                    direction = 12 /* ViewPortIfOutside */;
                    break;
                default:
                    // illegal arguments
                    return null;
            }
            let unit = 0 /* None */;
            switch (args.by) {
                case CursorMove.RawUnit.Line:
                    unit = 1 /* Line */;
                    break;
                case CursorMove.RawUnit.WrappedLine:
                    unit = 2 /* WrappedLine */;
                    break;
                case CursorMove.RawUnit.Character:
                    unit = 3 /* Character */;
                    break;
                case CursorMove.RawUnit.HalfLine:
                    unit = 4 /* HalfLine */;
                    break;
            }
            return {
                direction: direction,
                unit: unit,
                select: (!!args.select),
                value: (args.value || 1)
            };
        }
        CursorMove.parse = parse;
        let Direction;
        (function (Direction) {
            Direction[Direction["Left"] = 0] = "Left";
            Direction[Direction["Right"] = 1] = "Right";
            Direction[Direction["Up"] = 2] = "Up";
            Direction[Direction["Down"] = 3] = "Down";
            Direction[Direction["WrappedLineStart"] = 4] = "WrappedLineStart";
            Direction[Direction["WrappedLineFirstNonWhitespaceCharacter"] = 5] = "WrappedLineFirstNonWhitespaceCharacter";
            Direction[Direction["WrappedLineColumnCenter"] = 6] = "WrappedLineColumnCenter";
            Direction[Direction["WrappedLineEnd"] = 7] = "WrappedLineEnd";
            Direction[Direction["WrappedLineLastNonWhitespaceCharacter"] = 8] = "WrappedLineLastNonWhitespaceCharacter";
            Direction[Direction["ViewPortTop"] = 9] = "ViewPortTop";
            Direction[Direction["ViewPortCenter"] = 10] = "ViewPortCenter";
            Direction[Direction["ViewPortBottom"] = 11] = "ViewPortBottom";
            Direction[Direction["ViewPortIfOutside"] = 12] = "ViewPortIfOutside";
        })(Direction = CursorMove.Direction || (CursorMove.Direction = {}));
        let Unit;
        (function (Unit) {
            Unit[Unit["None"] = 0] = "None";
            Unit[Unit["Line"] = 1] = "Line";
            Unit[Unit["WrappedLine"] = 2] = "WrappedLine";
            Unit[Unit["Character"] = 3] = "Character";
            Unit[Unit["HalfLine"] = 4] = "HalfLine";
        })(Unit = CursorMove.Unit || (CursorMove.Unit = {}));
    })(CursorMove = exports.CursorMove || (exports.CursorMove = {}));
});
//# sourceMappingURL=cursorMoveCommands.js.map