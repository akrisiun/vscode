/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/view/viewEvents", "vs/editor/common/viewModel/prefixSumComputer", "vs/editor/common/viewModel/viewModel"], function (require, exports, position_1, range_1, textModel_1, viewEvents, prefixSumComputer_1, viewModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutputPosition {
        constructor(outputLineIndex, outputOffset) {
            this.outputLineIndex = outputLineIndex;
            this.outputOffset = outputOffset;
        }
    }
    exports.OutputPosition = OutputPosition;
    class CoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._lines.convertViewPositionToModelPosition(viewPosition.lineNumber, viewPosition.column);
        }
        convertViewRangeToModelRange(viewRange) {
            let start = this._lines.convertViewPositionToModelPosition(viewRange.startLineNumber, viewRange.startColumn);
            let end = this._lines.convertViewPositionToModelPosition(viewRange.endLineNumber, viewRange.endColumn);
            return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        validateViewPosition(viewPosition, expectedModelPosition) {
            return this._lines.validateViewPosition(viewPosition.lineNumber, viewPosition.column, expectedModelPosition);
        }
        validateViewRange(viewRange, expectedModelRange) {
            const validViewStart = this._lines.validateViewPosition(viewRange.startLineNumber, viewRange.startColumn, expectedModelRange.getStartPosition());
            const validViewEnd = this._lines.validateViewPosition(viewRange.endLineNumber, viewRange.endColumn, expectedModelRange.getEndPosition());
            return new range_1.Range(validViewStart.lineNumber, validViewStart.column, validViewEnd.lineNumber, validViewEnd.column);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition) {
            return this._lines.convertModelPositionToViewPosition(modelPosition.lineNumber, modelPosition.column);
        }
        convertModelRangeToViewRange(modelRange) {
            return this._lines.convertModelRangeToViewRange(modelRange);
        }
        modelPositionIsVisible(modelPosition) {
            return this._lines.modelPositionIsVisible(modelPosition.lineNumber, modelPosition.column);
        }
    }
    exports.CoordinatesConverter = CoordinatesConverter;
    var IndentGuideRepeatOption;
    (function (IndentGuideRepeatOption) {
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockNone"] = 0] = "BlockNone";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockSubsequent"] = 1] = "BlockSubsequent";
        IndentGuideRepeatOption[IndentGuideRepeatOption["BlockAll"] = 2] = "BlockAll";
    })(IndentGuideRepeatOption || (IndentGuideRepeatOption = {}));
    class SplitLinesCollection {
        constructor(model, linePositionMapperFactory, tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent) {
            this.model = model;
            this._validModelVersionId = -1;
            this.tabSize = tabSize;
            this.wrappingColumn = wrappingColumn;
            this.columnsForFullWidthChar = columnsForFullWidthChar;
            this.wrappingIndent = wrappingIndent;
            this.linePositionMapperFactory = linePositionMapperFactory;
            this._constructLines(true);
        }
        dispose() {
            this.hiddenAreasIds = this.model.deltaDecorations(this.hiddenAreasIds, []);
        }
        createCoordinatesConverter() {
            return new CoordinatesConverter(this);
        }
        _ensureValidState() {
            let modelVersion = this.model.getVersionId();
            if (modelVersion !== this._validModelVersionId) {
                // This is pretty bad, it means we lost track of the model...
                throw new Error(`ViewModel is out of sync with Model!`);
            }
            if (this.lines.length !== this.model.getLineCount()) {
                // This is pretty bad, it means we lost track of the model...
                this._constructLines(false);
            }
        }
        _constructLines(resetHiddenAreas) {
            this.lines = [];
            if (resetHiddenAreas) {
                this.hiddenAreasIds = [];
            }
            let linesContent = this.model.getLinesContent();
            let lineCount = linesContent.length;
            let values = new Uint32Array(lineCount);
            let hiddenAreas = this.hiddenAreasIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
            for (let i = 0; i < lineCount; i++) {
                let lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : lineCount + 2;
                }
                let isInHiddenArea = (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd);
                let line = createSplitLine(this.linePositionMapperFactory, linesContent[i], this.tabSize, this.wrappingColumn, this.columnsForFullWidthChar, this.wrappingIndent, !isInHiddenArea);
                values[i] = line.getViewLineCount();
                this.lines[i] = line;
            }
            this._validModelVersionId = this.model.getVersionId();
            this.prefixSumComputer = new prefixSumComputer_1.PrefixSumComputerWithCache(values);
        }
        getHiddenAreas() {
            return this.hiddenAreasIds.map((decId) => {
                return this.model.getDecorationRange(decId);
            });
        }
        _reduceRanges(_ranges) {
            if (_ranges.length === 0) {
                return [];
            }
            let ranges = _ranges.map(r => this.model.validateRange(r)).sort(range_1.Range.compareRangesUsingStarts);
            let result = [];
            let currentRangeStart = ranges[0].startLineNumber;
            let currentRangeEnd = ranges[0].endLineNumber;
            for (let i = 1, len = ranges.length; i < len; i++) {
                let range = ranges[i];
                if (range.startLineNumber > currentRangeEnd + 1) {
                    result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
                    currentRangeStart = range.startLineNumber;
                    currentRangeEnd = range.endLineNumber;
                }
                else if (range.endLineNumber > currentRangeEnd) {
                    currentRangeEnd = range.endLineNumber;
                }
            }
            result.push(new range_1.Range(currentRangeStart, 1, currentRangeEnd, 1));
            return result;
        }
        setHiddenAreas(_ranges) {
            let newRanges = this._reduceRanges(_ranges);
            // BEGIN TODO@Martin: Please stop calling this method on each model change!
            let oldRanges = this.hiddenAreasIds.map((areaId) => this.model.getDecorationRange(areaId)).sort(range_1.Range.compareRangesUsingStarts);
            if (newRanges.length === oldRanges.length) {
                let hasDifference = false;
                for (let i = 0; i < newRanges.length; i++) {
                    if (!newRanges[i].equalsRange(oldRanges[i])) {
                        hasDifference = true;
                        break;
                    }
                }
                if (!hasDifference) {
                    return false;
                }
            }
            // END TODO@Martin: Please stop calling this method on each model change!
            let newDecorations = [];
            for (const newRange of newRanges) {
                newDecorations.push({
                    range: newRange,
                    options: textModel_1.ModelDecorationOptions.EMPTY
                });
            }
            this.hiddenAreasIds = this.model.deltaDecorations(this.hiddenAreasIds, newDecorations);
            let hiddenAreas = newRanges;
            let hiddenAreaStart = 1, hiddenAreaEnd = 0;
            let hiddenAreaIdx = -1;
            let nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.lines.length + 2;
            let hasVisibleLine = false;
            for (let i = 0; i < this.lines.length; i++) {
                let lineNumber = i + 1;
                if (lineNumber === nextLineNumberToUpdateHiddenArea) {
                    hiddenAreaIdx++;
                    hiddenAreaStart = hiddenAreas[hiddenAreaIdx].startLineNumber;
                    hiddenAreaEnd = hiddenAreas[hiddenAreaIdx].endLineNumber;
                    nextLineNumberToUpdateHiddenArea = (hiddenAreaIdx + 1 < hiddenAreas.length) ? hiddenAreaEnd + 1 : this.lines.length + 2;
                }
                let lineChanged = false;
                if (lineNumber >= hiddenAreaStart && lineNumber <= hiddenAreaEnd) {
                    // Line should be hidden
                    if (this.lines[i].isVisible()) {
                        this.lines[i] = this.lines[i].setVisible(false);
                        lineChanged = true;
                    }
                }
                else {
                    hasVisibleLine = true;
                    // Line should be visible
                    if (!this.lines[i].isVisible()) {
                        this.lines[i] = this.lines[i].setVisible(true);
                        lineChanged = true;
                    }
                }
                if (lineChanged) {
                    let newOutputLineCount = this.lines[i].getViewLineCount();
                    this.prefixSumComputer.changeValue(i, newOutputLineCount);
                }
            }
            if (!hasVisibleLine) {
                // Cannot have everything be hidden => reveal everything!
                this.setHiddenAreas([]);
            }
            return true;
        }
        modelPositionIsVisible(modelLineNumber, _modelColumn) {
            if (modelLineNumber < 1 || modelLineNumber > this.lines.length) {
                // invalid arguments
                return false;
            }
            return this.lines[modelLineNumber - 1].isVisible();
        }
        setTabSize(newTabSize) {
            if (this.tabSize === newTabSize) {
                return false;
            }
            this.tabSize = newTabSize;
            this._constructLines(false);
            return true;
        }
        setWrappingSettings(wrappingIndent, wrappingColumn, columnsForFullWidthChar) {
            if (this.wrappingIndent === wrappingIndent && this.wrappingColumn === wrappingColumn && this.columnsForFullWidthChar === columnsForFullWidthChar) {
                return false;
            }
            this.wrappingIndent = wrappingIndent;
            this.wrappingColumn = wrappingColumn;
            this.columnsForFullWidthChar = columnsForFullWidthChar;
            this._constructLines(false);
            return true;
        }
        onModelFlushed() {
            this._constructLines(true);
        }
        onModelLinesDeleted(versionId, fromLineNumber, toLineNumber) {
            if (versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            let outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.prefixSumComputer.getAccumulatedValue(fromLineNumber - 2) + 1);
            let outputToLineNumber = this.prefixSumComputer.getAccumulatedValue(toLineNumber - 1);
            this.lines.splice(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            this.prefixSumComputer.removeValues(fromLineNumber - 1, toLineNumber - fromLineNumber + 1);
            return new viewEvents.ViewLinesDeletedEvent(outputFromLineNumber, outputToLineNumber);
        }
        onModelLinesInserted(versionId, fromLineNumber, _toLineNumber, text) {
            if (versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return null;
            }
            let hiddenAreas = this.getHiddenAreas();
            let isInHiddenArea = false;
            let testPosition = new position_1.Position(fromLineNumber, 1);
            for (const hiddenArea of hiddenAreas) {
                if (hiddenArea.containsPosition(testPosition)) {
                    isInHiddenArea = true;
                    break;
                }
            }
            let outputFromLineNumber = (fromLineNumber === 1 ? 1 : this.prefixSumComputer.getAccumulatedValue(fromLineNumber - 2) + 1);
            let totalOutputLineCount = 0;
            let insertLines = [];
            let insertPrefixSumValues = new Uint32Array(text.length);
            for (let i = 0, len = text.length; i < len; i++) {
                let line = createSplitLine(this.linePositionMapperFactory, text[i], this.tabSize, this.wrappingColumn, this.columnsForFullWidthChar, this.wrappingIndent, !isInHiddenArea);
                insertLines.push(line);
                let outputLineCount = line.getViewLineCount();
                totalOutputLineCount += outputLineCount;
                insertPrefixSumValues[i] = outputLineCount;
            }
            // TODO@Alex: use arrays.arrayInsert
            this.lines = this.lines.slice(0, fromLineNumber - 1).concat(insertLines).concat(this.lines.slice(fromLineNumber - 1));
            this.prefixSumComputer.insertValues(fromLineNumber - 1, insertPrefixSumValues);
            return new viewEvents.ViewLinesInsertedEvent(outputFromLineNumber, outputFromLineNumber + totalOutputLineCount - 1);
        }
        onModelLineChanged(versionId, lineNumber, newText) {
            if (versionId <= this._validModelVersionId) {
                // Here we check for versionId in case the lines were reconstructed in the meantime.
                // We don't want to apply stale change events on top of a newer read model state.
                return [false, null, null, null];
            }
            let lineIndex = lineNumber - 1;
            let oldOutputLineCount = this.lines[lineIndex].getViewLineCount();
            let isVisible = this.lines[lineIndex].isVisible();
            let line = createSplitLine(this.linePositionMapperFactory, newText, this.tabSize, this.wrappingColumn, this.columnsForFullWidthChar, this.wrappingIndent, isVisible);
            this.lines[lineIndex] = line;
            let newOutputLineCount = this.lines[lineIndex].getViewLineCount();
            let lineMappingChanged = false;
            let changeFrom = 0;
            let changeTo = -1;
            let insertFrom = 0;
            let insertTo = -1;
            let deleteFrom = 0;
            let deleteTo = -1;
            if (oldOutputLineCount > newOutputLineCount) {
                changeFrom = (lineNumber === 1 ? 1 : this.prefixSumComputer.getAccumulatedValue(lineNumber - 2) + 1);
                changeTo = changeFrom + newOutputLineCount - 1;
                deleteFrom = changeTo + 1;
                deleteTo = deleteFrom + (oldOutputLineCount - newOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else if (oldOutputLineCount < newOutputLineCount) {
                changeFrom = (lineNumber === 1 ? 1 : this.prefixSumComputer.getAccumulatedValue(lineNumber - 2) + 1);
                changeTo = changeFrom + oldOutputLineCount - 1;
                insertFrom = changeTo + 1;
                insertTo = insertFrom + (newOutputLineCount - oldOutputLineCount) - 1;
                lineMappingChanged = true;
            }
            else {
                changeFrom = (lineNumber === 1 ? 1 : this.prefixSumComputer.getAccumulatedValue(lineNumber - 2) + 1);
                changeTo = changeFrom + newOutputLineCount - 1;
            }
            this.prefixSumComputer.changeValue(lineIndex, newOutputLineCount);
            const viewLinesChangedEvent = (changeFrom <= changeTo ? new viewEvents.ViewLinesChangedEvent(changeFrom, changeTo) : null);
            const viewLinesInsertedEvent = (insertFrom <= insertTo ? new viewEvents.ViewLinesInsertedEvent(insertFrom, insertTo) : null);
            const viewLinesDeletedEvent = (deleteFrom <= deleteTo ? new viewEvents.ViewLinesDeletedEvent(deleteFrom, deleteTo) : null);
            return [lineMappingChanged, viewLinesChangedEvent, viewLinesInsertedEvent, viewLinesDeletedEvent];
        }
        acceptVersionId(versionId) {
            this._validModelVersionId = versionId;
            if (this.lines.length === 1 && !this.lines[0].isVisible()) {
                // At least one line must be visible => reset hidden areas
                this.setHiddenAreas([]);
            }
        }
        getViewLineCount() {
            this._ensureValidState();
            return this.prefixSumComputer.getTotalValue();
        }
        _toValidViewLineNumber(viewLineNumber) {
            if (viewLineNumber < 1) {
                return 1;
            }
            let viewLineCount = this.getViewLineCount();
            if (viewLineNumber > viewLineCount) {
                return viewLineCount;
            }
            return viewLineNumber;
        }
        /**
         * Gives a hint that a lot of requests are about to come in for these line numbers.
         */
        warmUpLookupCache(viewStartLineNumber, viewEndLineNumber) {
            this.prefixSumComputer.warmUpCache(viewStartLineNumber - 1, viewEndLineNumber - 1);
        }
        getActiveIndentGuide(viewLineNumber, minLineNumber, maxLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            minLineNumber = this._toValidViewLineNumber(minLineNumber);
            maxLineNumber = this._toValidViewLineNumber(maxLineNumber);
            const modelPosition = this.convertViewPositionToModelPosition(viewLineNumber, this.getViewLineMinColumn(viewLineNumber));
            const modelMinPosition = this.convertViewPositionToModelPosition(minLineNumber, this.getViewLineMinColumn(minLineNumber));
            const modelMaxPosition = this.convertViewPositionToModelPosition(maxLineNumber, this.getViewLineMinColumn(maxLineNumber));
            const result = this.model.getActiveIndentGuide(modelPosition.lineNumber, modelMinPosition.lineNumber, modelMaxPosition.lineNumber);
            const viewStartPosition = this.convertModelPositionToViewPosition(result.startLineNumber, 1);
            const viewEndPosition = this.convertModelPositionToViewPosition(result.endLineNumber, this.model.getLineMaxColumn(result.endLineNumber));
            return {
                startLineNumber: viewStartPosition.lineNumber,
                endLineNumber: viewEndPosition.lineNumber,
                indent: result.indent
            };
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            this._ensureValidState();
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            const modelStart = this.convertViewPositionToModelPosition(viewStartLineNumber, this.getViewLineMinColumn(viewStartLineNumber));
            const modelEnd = this.convertViewPositionToModelPosition(viewEndLineNumber, this.getViewLineMaxColumn(viewEndLineNumber));
            let result = [];
            let resultRepeatCount = [];
            let resultRepeatOption = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.lines[modelLineIndex];
                if (line.isVisible()) {
                    let viewLineStartIndex = line.getViewLineNumberOfModelPosition(0, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    let viewLineEndIndex = line.getViewLineNumberOfModelPosition(0, this.model.getLineMaxColumn(modelLineIndex + 1));
                    let count = viewLineEndIndex - viewLineStartIndex + 1;
                    let option = 0 /* BlockNone */;
                    if (count > 1 && line.getViewLineMinColumn(this.model, modelLineIndex + 1, viewLineEndIndex) === 1) {
                        // wrapped lines should block indent guides
                        option = (viewLineStartIndex === 0 ? 1 /* BlockSubsequent */ : 2 /* BlockAll */);
                    }
                    resultRepeatCount.push(count);
                    resultRepeatOption.push(option);
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, 0);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        result = result.concat(this.model.getLinesIndentGuides(reqStart.lineNumber, modelLineIndex));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.getLinesIndentGuides(reqStart.lineNumber, modelEnd.lineNumber));
                reqStart = null;
            }
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            let viewIndents = new Array(viewLineCount);
            let currIndex = 0;
            for (let i = 0, len = result.length; i < len; i++) {
                let value = result[i];
                let count = Math.min(viewLineCount - currIndex, resultRepeatCount[i]);
                let option = resultRepeatOption[i];
                let blockAtIndex;
                if (option === 2 /* BlockAll */) {
                    blockAtIndex = 0;
                }
                else if (option === 1 /* BlockSubsequent */) {
                    blockAtIndex = 1;
                }
                else {
                    blockAtIndex = count;
                }
                for (let j = 0; j < count; j++) {
                    if (j === blockAtIndex) {
                        value = 0;
                    }
                    viewIndents[currIndex++] = value;
                }
            }
            return viewIndents;
        }
        getViewLineContent(viewLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            return this.lines[lineIndex].getViewLineContent(this.model, lineIndex + 1, remainder);
        }
        getViewLineLength(viewLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            return this.lines[lineIndex].getViewLineLength(this.model, lineIndex + 1, remainder);
        }
        getViewLineMinColumn(viewLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            return this.lines[lineIndex].getViewLineMinColumn(this.model, lineIndex + 1, remainder);
        }
        getViewLineMaxColumn(viewLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            return this.lines[lineIndex].getViewLineMaxColumn(this.model, lineIndex + 1, remainder);
        }
        getViewLineData(viewLineNumber) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            return this.lines[lineIndex].getViewLineData(this.model, lineIndex + 1, remainder);
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            this._ensureValidState();
            viewStartLineNumber = this._toValidViewLineNumber(viewStartLineNumber);
            viewEndLineNumber = this._toValidViewLineNumber(viewEndLineNumber);
            let start = this.prefixSumComputer.getIndexOf(viewStartLineNumber - 1);
            let viewLineNumber = viewStartLineNumber;
            let startModelLineIndex = start.index;
            let startRemainder = start.remainder;
            let result = [];
            for (let modelLineIndex = startModelLineIndex, len = this.model.getLineCount(); modelLineIndex < len; modelLineIndex++) {
                let line = this.lines[modelLineIndex];
                if (!line.isVisible()) {
                    continue;
                }
                let fromViewLineIndex = (modelLineIndex === startModelLineIndex ? startRemainder : 0);
                let remainingViewLineCount = line.getViewLineCount() - fromViewLineIndex;
                let lastLine = false;
                if (viewLineNumber + remainingViewLineCount > viewEndLineNumber) {
                    lastLine = true;
                    remainingViewLineCount = viewEndLineNumber - viewLineNumber + 1;
                }
                let toViewLineIndex = fromViewLineIndex + remainingViewLineCount;
                line.getViewLinesData(this.model, modelLineIndex + 1, fromViewLineIndex, toViewLineIndex, viewLineNumber - viewStartLineNumber, needed, result);
                viewLineNumber += remainingViewLineCount;
                if (lastLine) {
                    break;
                }
            }
            return result;
        }
        validateViewPosition(viewLineNumber, viewColumn, expectedModelPosition) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            let line = this.lines[lineIndex];
            let minColumn = line.getViewLineMinColumn(this.model, lineIndex + 1, remainder);
            let maxColumn = line.getViewLineMaxColumn(this.model, lineIndex + 1, remainder);
            if (viewColumn < minColumn) {
                viewColumn = minColumn;
            }
            if (viewColumn > maxColumn) {
                viewColumn = maxColumn;
            }
            let computedModelColumn = line.getModelColumnOfViewPosition(remainder, viewColumn);
            let computedModelPosition = this.model.validatePosition(new position_1.Position(lineIndex + 1, computedModelColumn));
            if (computedModelPosition.equals(expectedModelPosition)) {
                return new position_1.Position(viewLineNumber, viewColumn);
            }
            return this.convertModelPositionToViewPosition(expectedModelPosition.lineNumber, expectedModelPosition.column);
        }
        convertViewPositionToModelPosition(viewLineNumber, viewColumn) {
            this._ensureValidState();
            viewLineNumber = this._toValidViewLineNumber(viewLineNumber);
            let r = this.prefixSumComputer.getIndexOf(viewLineNumber - 1);
            let lineIndex = r.index;
            let remainder = r.remainder;
            let inputColumn = this.lines[lineIndex].getModelColumnOfViewPosition(remainder, viewColumn);
            // console.log('out -> in ' + viewLineNumber + ',' + viewColumn + ' ===> ' + (lineIndex+1) + ',' + inputColumn);
            return this.model.validatePosition(new position_1.Position(lineIndex + 1, inputColumn));
        }
        convertModelPositionToViewPosition(_modelLineNumber, _modelColumn) {
            this._ensureValidState();
            const validPosition = this.model.validatePosition(new position_1.Position(_modelLineNumber, _modelColumn));
            const inputLineNumber = validPosition.lineNumber;
            const inputColumn = validPosition.column;
            let lineIndex = inputLineNumber - 1, lineIndexChanged = false;
            while (lineIndex > 0 && !this.lines[lineIndex].isVisible()) {
                lineIndex--;
                lineIndexChanged = true;
            }
            if (lineIndex === 0 && !this.lines[lineIndex].isVisible()) {
                // Could not reach a real line
                // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + 1 + ',' + 1);
                return new position_1.Position(1, 1);
            }
            const deltaLineNumber = 1 + (lineIndex === 0 ? 0 : this.prefixSumComputer.getAccumulatedValue(lineIndex - 1));
            let r;
            if (lineIndexChanged) {
                r = this.lines[lineIndex].getViewPositionOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1));
            }
            else {
                r = this.lines[inputLineNumber - 1].getViewPositionOfModelPosition(deltaLineNumber, inputColumn);
            }
            // console.log('in -> out ' + inputLineNumber + ',' + inputColumn + ' ===> ' + r.lineNumber + ',' + r);
            return r;
        }
        convertModelRangeToViewRange(modelRange) {
            let start = this.convertModelPositionToViewPosition(modelRange.startLineNumber, modelRange.startColumn);
            let end = this.convertModelPositionToViewPosition(modelRange.endLineNumber, modelRange.endColumn);
            if (modelRange.startLineNumber === modelRange.endLineNumber && start.lineNumber !== end.lineNumber) {
                // This is a single line range that ends up taking more lines due to wrapping
                if (end.column === this.getViewLineMinColumn(end.lineNumber)) {
                    // the end column lands on the first column of the next line
                    return new range_1.Range(start.lineNumber, start.column, end.lineNumber - 1, this.getViewLineMaxColumn(end.lineNumber - 1));
                }
            }
            return new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        _getViewLineNumberForModelPosition(inputLineNumber, inputColumn) {
            let lineIndex = inputLineNumber - 1;
            if (this.lines[lineIndex].isVisible()) {
                // this model line is visible
                const deltaLineNumber = 1 + (lineIndex === 0 ? 0 : this.prefixSumComputer.getAccumulatedValue(lineIndex - 1));
                return this.lines[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, inputColumn);
            }
            // this model line is not visible
            while (lineIndex > 0 && !this.lines[lineIndex].isVisible()) {
                lineIndex--;
            }
            if (lineIndex === 0 && !this.lines[lineIndex].isVisible()) {
                // Could not reach a real line
                return 1;
            }
            const deltaLineNumber = 1 + (lineIndex === 0 ? 0 : this.prefixSumComputer.getAccumulatedValue(lineIndex - 1));
            return this.lines[lineIndex].getViewLineNumberOfModelPosition(deltaLineNumber, this.model.getLineMaxColumn(lineIndex + 1));
        }
        getAllOverviewRulerDecorations(ownerId, filterOutValidation, theme) {
            const decorations = this.model.getOverviewRulerDecorations(ownerId, filterOutValidation);
            const result = new OverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.overviewRuler;
                const lane = opts ? opts.position : 0;
                if (lane === 0) {
                    continue;
                }
                const color = opts.getColor(theme);
                const viewStartLineNumber = this._getViewLineNumberForModelPosition(decoration.range.startLineNumber, decoration.range.startColumn);
                const viewEndLineNumber = this._getViewLineNumberForModelPosition(decoration.range.endLineNumber, decoration.range.endColumn);
                result.accept(color, viewStartLineNumber, viewEndLineNumber, lane);
            }
            return result.result;
        }
        getDecorationsInRange(range, ownerId, filterOutValidation) {
            const modelStart = this.convertViewPositionToModelPosition(range.startLineNumber, range.startColumn);
            const modelEnd = this.convertViewPositionToModelPosition(range.endLineNumber, range.endColumn);
            if (modelEnd.lineNumber - modelStart.lineNumber <= range.endLineNumber - range.startLineNumber) {
                // most likely there are no hidden lines => fast path
                // fetch decorations from column 1 to cover the case of wrapped lines that have whole line decorations at column 1
                return this.model.getDecorationsInRange(new range_1.Range(modelStart.lineNumber, 1, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation);
            }
            let result = [];
            const modelStartLineIndex = modelStart.lineNumber - 1;
            const modelEndLineIndex = modelEnd.lineNumber - 1;
            let reqStart = null;
            for (let modelLineIndex = modelStartLineIndex; modelLineIndex <= modelEndLineIndex; modelLineIndex++) {
                const line = this.lines[modelLineIndex];
                if (line.isVisible()) {
                    // merge into previous request
                    if (reqStart === null) {
                        reqStart = new position_1.Position(modelLineIndex + 1, modelLineIndex === modelStartLineIndex ? modelStart.column : 1);
                    }
                }
                else {
                    // hit invisible line => flush request
                    if (reqStart !== null) {
                        const maxLineColumn = this.model.getLineMaxColumn(modelLineIndex);
                        result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelLineIndex, maxLineColumn), ownerId, filterOutValidation));
                        reqStart = null;
                    }
                }
            }
            if (reqStart !== null) {
                result = result.concat(this.model.getDecorationsInRange(new range_1.Range(reqStart.lineNumber, reqStart.column, modelEnd.lineNumber, modelEnd.column), ownerId, filterOutValidation));
                reqStart = null;
            }
            result.sort((a, b) => {
                const res = range_1.Range.compareRangesUsingStarts(a.range, b.range);
                if (res === 0) {
                    if (a.id < b.id) {
                        return -1;
                    }
                    if (a.id > b.id) {
                        return 1;
                    }
                    return 0;
                }
                return res;
            });
            // Eliminate duplicate decorations that might have intersected our visible ranges multiple times
            let finalResult = [], finalResultLen = 0;
            let prevDecId = null;
            for (const dec of result) {
                const decId = dec.id;
                if (prevDecId === decId) {
                    // skip
                    continue;
                }
                prevDecId = decId;
                finalResult[finalResultLen++] = dec;
            }
            return finalResult;
        }
    }
    exports.SplitLinesCollection = SplitLinesCollection;
    class VisibleIdentitySplitLine {
        constructor() {
        }
        isVisible() {
            return true;
        }
        setVisible(isVisible) {
            if (isVisible) {
                return this;
            }
            return InvisibleIdentitySplitLine.INSTANCE;
        }
        getViewLineCount() {
            return 1;
        }
        getViewLineContent(model, modelLineNumber, _outputLineIndex) {
            return model.getLineContent(modelLineNumber);
        }
        getViewLineLength(model, modelLineNumber, _outputLineIndex) {
            return model.getLineLength(modelLineNumber);
        }
        getViewLineMinColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMinColumn(modelLineNumber);
        }
        getViewLineMaxColumn(model, modelLineNumber, _outputLineIndex) {
            return model.getLineMaxColumn(modelLineNumber);
        }
        getViewLineData(model, modelLineNumber, _outputLineIndex) {
            let lineTokens = model.getLineTokens(modelLineNumber);
            let lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, lineTokens.inflate());
        }
        getViewLinesData(model, modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, globalStartIndex, needed, result) {
            if (!needed[globalStartIndex]) {
                result[globalStartIndex] = null;
                return;
            }
            result[globalStartIndex] = this.getViewLineData(model, modelLineNumber, 0);
        }
        getModelColumnOfViewPosition(_outputLineIndex, outputColumn) {
            return outputColumn;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn) {
            return new position_1.Position(deltaLineNumber, inputColumn);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, _inputColumn) {
            return deltaLineNumber;
        }
    }
    VisibleIdentitySplitLine.INSTANCE = new VisibleIdentitySplitLine();
    class InvisibleIdentitySplitLine {
        constructor() {
        }
        isVisible() {
            return false;
        }
        setVisible(isVisible) {
            if (!isVisible) {
                return this;
            }
            return VisibleIdentitySplitLine.INSTANCE;
        }
        getViewLineCount() {
            return 0;
        }
        getViewLineContent(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineLength(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMinColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineMaxColumn(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLineData(_model, _modelLineNumber, _outputLineIndex) {
            throw new Error('Not supported');
        }
        getViewLinesData(_model, _modelLineNumber, _fromOuputLineIndex, _toOutputLineIndex, _globalStartIndex, _needed, _result) {
            throw new Error('Not supported');
        }
        getModelColumnOfViewPosition(_outputLineIndex, _outputColumn) {
            throw new Error('Not supported');
        }
        getViewPositionOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
        getViewLineNumberOfModelPosition(_deltaLineNumber, _inputColumn) {
            throw new Error('Not supported');
        }
    }
    InvisibleIdentitySplitLine.INSTANCE = new InvisibleIdentitySplitLine();
    class SplitLine {
        constructor(positionMapper, isVisible) {
            this.positionMapper = positionMapper;
            this.wrappedIndent = this.positionMapper.getWrappedLinesIndent();
            this.wrappedIndentLength = this.wrappedIndent.length;
            this.outputLineCount = this.positionMapper.getOutputLineCount();
            this._isVisible = isVisible;
        }
        isVisible() {
            return this._isVisible;
        }
        setVisible(isVisible) {
            this._isVisible = isVisible;
            return this;
        }
        getViewLineCount() {
            if (!this._isVisible) {
                return 0;
            }
            return this.outputLineCount;
        }
        getInputStartOffsetOfOutputLineIndex(outputLineIndex) {
            return this.positionMapper.getInputOffsetOfOutputPosition(outputLineIndex, 0);
        }
        getInputEndOffsetOfOutputLineIndex(model, modelLineNumber, outputLineIndex) {
            if (outputLineIndex + 1 === this.outputLineCount) {
                return model.getLineMaxColumn(modelLineNumber) - 1;
            }
            return this.positionMapper.getInputOffsetOfOutputPosition(outputLineIndex + 1, 0);
        }
        getViewLineContent(model, modelLineNumber, outputLineIndex) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            let startOffset = this.getInputStartOffsetOfOutputLineIndex(outputLineIndex);
            let endOffset = this.getInputEndOffsetOfOutputLineIndex(model, modelLineNumber, outputLineIndex);
            let r = model.getValueInRange({
                startLineNumber: modelLineNumber,
                startColumn: startOffset + 1,
                endLineNumber: modelLineNumber,
                endColumn: endOffset + 1
            });
            if (outputLineIndex > 0) {
                r = this.wrappedIndent + r;
            }
            return r;
        }
        getViewLineLength(model, modelLineNumber, outputLineIndex) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            let startOffset = this.getInputStartOffsetOfOutputLineIndex(outputLineIndex);
            let endOffset = this.getInputEndOffsetOfOutputLineIndex(model, modelLineNumber, outputLineIndex);
            let r = endOffset - startOffset;
            if (outputLineIndex > 0) {
                r = this.wrappedIndent.length + r;
            }
            return r;
        }
        getViewLineMinColumn(_model, _modelLineNumber, outputLineIndex) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            if (outputLineIndex > 0) {
                return this.wrappedIndentLength + 1;
            }
            return 1;
        }
        getViewLineMaxColumn(model, modelLineNumber, outputLineIndex) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            return this.getViewLineContent(model, modelLineNumber, outputLineIndex).length + 1;
        }
        getViewLineData(model, modelLineNumber, outputLineIndex) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            let startOffset = this.getInputStartOffsetOfOutputLineIndex(outputLineIndex);
            let endOffset = this.getInputEndOffsetOfOutputLineIndex(model, modelLineNumber, outputLineIndex);
            let lineContent = model.getValueInRange({
                startLineNumber: modelLineNumber,
                startColumn: startOffset + 1,
                endLineNumber: modelLineNumber,
                endColumn: endOffset + 1
            });
            if (outputLineIndex > 0) {
                lineContent = this.wrappedIndent + lineContent;
            }
            let minColumn = (outputLineIndex > 0 ? this.wrappedIndentLength + 1 : 1);
            let maxColumn = lineContent.length + 1;
            let continuesWithWrappedLine = (outputLineIndex + 1 < this.getViewLineCount());
            let deltaStartIndex = 0;
            if (outputLineIndex > 0) {
                deltaStartIndex = this.wrappedIndentLength;
            }
            let lineTokens = model.getLineTokens(modelLineNumber);
            return new viewModel_1.ViewLineData(lineContent, continuesWithWrappedLine, minColumn, maxColumn, lineTokens.sliceAndInflate(startOffset, endOffset, deltaStartIndex));
        }
        getViewLinesData(model, modelLineNumber, fromOuputLineIndex, toOutputLineIndex, globalStartIndex, needed, result) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            for (let outputLineIndex = fromOuputLineIndex; outputLineIndex < toOutputLineIndex; outputLineIndex++) {
                let globalIndex = globalStartIndex + outputLineIndex - fromOuputLineIndex;
                if (!needed[globalIndex]) {
                    result[globalIndex] = null;
                    continue;
                }
                result[globalIndex] = this.getViewLineData(model, modelLineNumber, outputLineIndex);
            }
        }
        getModelColumnOfViewPosition(outputLineIndex, outputColumn) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            let adjustedColumn = outputColumn - 1;
            if (outputLineIndex > 0) {
                if (adjustedColumn < this.wrappedIndentLength) {
                    adjustedColumn = 0;
                }
                else {
                    adjustedColumn -= this.wrappedIndentLength;
                }
            }
            return this.positionMapper.getInputOffsetOfOutputPosition(outputLineIndex, adjustedColumn) + 1;
        }
        getViewPositionOfModelPosition(deltaLineNumber, inputColumn) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            let r = this.positionMapper.getOutputPositionOfInputOffset(inputColumn - 1);
            let outputLineIndex = r.outputLineIndex;
            let outputColumn = r.outputOffset + 1;
            if (outputLineIndex > 0) {
                outputColumn += this.wrappedIndentLength;
            }
            //		console.log('in -> out ' + deltaLineNumber + ',' + inputColumn + ' ===> ' + (deltaLineNumber+outputLineIndex) + ',' + outputColumn);
            return new position_1.Position(deltaLineNumber + outputLineIndex, outputColumn);
        }
        getViewLineNumberOfModelPosition(deltaLineNumber, inputColumn) {
            if (!this._isVisible) {
                throw new Error('Not supported');
            }
            const r = this.positionMapper.getOutputPositionOfInputOffset(inputColumn - 1);
            return (deltaLineNumber + r.outputLineIndex);
        }
    }
    exports.SplitLine = SplitLine;
    function createSplitLine(linePositionMapperFactory, text, tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent, isVisible) {
        let positionMapper = linePositionMapperFactory.createLineMapping(text, tabSize, wrappingColumn, columnsForFullWidthChar, wrappingIndent);
        if (positionMapper === null) {
            // No mapping needed
            if (isVisible) {
                return VisibleIdentitySplitLine.INSTANCE;
            }
            return InvisibleIdentitySplitLine.INSTANCE;
        }
        else {
            return new SplitLine(positionMapper, isVisible);
        }
    }
    class IdentityCoordinatesConverter {
        constructor(lines) {
            this._lines = lines;
        }
        _validPosition(pos) {
            return this._lines.model.validatePosition(pos);
        }
        _validRange(range) {
            return this._lines.model.validateRange(range);
        }
        // View -> Model conversion and related methods
        convertViewPositionToModelPosition(viewPosition) {
            return this._validPosition(viewPosition);
        }
        convertViewRangeToModelRange(viewRange) {
            return this._validRange(viewRange);
        }
        validateViewPosition(_viewPosition, expectedModelPosition) {
            return this._validPosition(expectedModelPosition);
        }
        validateViewRange(_viewRange, expectedModelRange) {
            return this._validRange(expectedModelRange);
        }
        // Model -> View conversion and related methods
        convertModelPositionToViewPosition(modelPosition) {
            return this._validPosition(modelPosition);
        }
        convertModelRangeToViewRange(modelRange) {
            return this._validRange(modelRange);
        }
        modelPositionIsVisible(modelPosition) {
            const lineCount = this._lines.model.getLineCount();
            if (modelPosition.lineNumber < 1 || modelPosition.lineNumber > lineCount) {
                // invalid arguments
                return false;
            }
            return true;
        }
    }
    exports.IdentityCoordinatesConverter = IdentityCoordinatesConverter;
    class IdentityLinesCollection {
        constructor(model) {
            this.model = model;
        }
        dispose() {
        }
        createCoordinatesConverter() {
            return new IdentityCoordinatesConverter(this);
        }
        getHiddenAreas() {
            return [];
        }
        setHiddenAreas(_ranges) {
            return false;
        }
        setTabSize(_newTabSize) {
            return false;
        }
        setWrappingSettings(_wrappingIndent, _wrappingColumn, _columnsForFullWidthChar) {
            return false;
        }
        onModelFlushed() {
        }
        onModelLinesDeleted(_versionId, fromLineNumber, toLineNumber) {
            return new viewEvents.ViewLinesDeletedEvent(fromLineNumber, toLineNumber);
        }
        onModelLinesInserted(_versionId, fromLineNumber, toLineNumber, _text) {
            return new viewEvents.ViewLinesInsertedEvent(fromLineNumber, toLineNumber);
        }
        onModelLineChanged(_versionId, lineNumber, _newText) {
            return [false, new viewEvents.ViewLinesChangedEvent(lineNumber, lineNumber), null, null];
        }
        acceptVersionId(_versionId) {
        }
        getViewLineCount() {
            return this.model.getLineCount();
        }
        warmUpLookupCache(_viewStartLineNumber, _viewEndLineNumber) {
        }
        getActiveIndentGuide(viewLineNumber, _minLineNumber, _maxLineNumber) {
            return {
                startLineNumber: viewLineNumber,
                endLineNumber: viewLineNumber,
                indent: 0
            };
        }
        getViewLinesIndentGuides(viewStartLineNumber, viewEndLineNumber) {
            const viewLineCount = viewEndLineNumber - viewStartLineNumber + 1;
            let result = new Array(viewLineCount);
            for (let i = 0; i < viewLineCount; i++) {
                result[i] = 0;
            }
            return result;
        }
        getViewLineContent(viewLineNumber) {
            return this.model.getLineContent(viewLineNumber);
        }
        getViewLineLength(viewLineNumber) {
            return this.model.getLineLength(viewLineNumber);
        }
        getViewLineMinColumn(viewLineNumber) {
            return this.model.getLineMinColumn(viewLineNumber);
        }
        getViewLineMaxColumn(viewLineNumber) {
            return this.model.getLineMaxColumn(viewLineNumber);
        }
        getViewLineData(viewLineNumber) {
            let lineTokens = this.model.getLineTokens(viewLineNumber);
            let lineContent = lineTokens.getLineContent();
            return new viewModel_1.ViewLineData(lineContent, false, 1, lineContent.length + 1, lineTokens.inflate());
        }
        getViewLinesData(viewStartLineNumber, viewEndLineNumber, needed) {
            const lineCount = this.model.getLineCount();
            viewStartLineNumber = Math.min(Math.max(1, viewStartLineNumber), lineCount);
            viewEndLineNumber = Math.min(Math.max(1, viewEndLineNumber), lineCount);
            let result = [];
            for (let lineNumber = viewStartLineNumber; lineNumber <= viewEndLineNumber; lineNumber++) {
                let idx = lineNumber - viewStartLineNumber;
                if (!needed[idx]) {
                    result[idx] = null;
                }
                result[idx] = this.getViewLineData(lineNumber);
            }
            return result;
        }
        getAllOverviewRulerDecorations(ownerId, filterOutValidation, theme) {
            const decorations = this.model.getOverviewRulerDecorations(ownerId, filterOutValidation);
            const result = new OverviewRulerDecorations();
            for (const decoration of decorations) {
                const opts = decoration.options.overviewRuler;
                const lane = opts ? opts.position : 0;
                if (lane === 0) {
                    continue;
                }
                const color = opts.getColor(theme);
                const viewStartLineNumber = decoration.range.startLineNumber;
                const viewEndLineNumber = decoration.range.endLineNumber;
                result.accept(color, viewStartLineNumber, viewEndLineNumber, lane);
            }
            return result.result;
        }
        getDecorationsInRange(range, ownerId, filterOutValidation) {
            return this.model.getDecorationsInRange(range, ownerId, filterOutValidation);
        }
    }
    exports.IdentityLinesCollection = IdentityLinesCollection;
    class OverviewRulerDecorations {
        constructor() {
            this.result = Object.create(null);
        }
        accept(color, startLineNumber, endLineNumber, lane) {
            let prev = this.result[color];
            if (prev) {
                const prevLane = prev[prev.length - 3];
                const prevEndLineNumber = prev[prev.length - 1];
                if (prevLane === lane && prevEndLineNumber + 1 >= startLineNumber) {
                    // merge into prev
                    if (endLineNumber > prevEndLineNumber) {
                        prev[prev.length - 1] = endLineNumber;
                    }
                    return;
                }
                // push
                prev.push(lane, startLineNumber, endLineNumber);
            }
            else {
                this.result[color] = [lane, startLineNumber, endLineNumber];
            }
        }
    }
});
//# sourceMappingURL=splitLinesCollection.js.map