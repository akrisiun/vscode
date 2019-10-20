/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Represent whitespaces in between lines and provide fast CRUD management methods.
     * The whitespaces are sorted ascending by `afterLineNumber`.
     */
    class WhitespaceComputer {
        constructor() {
            this._instanceId = strings.singleLetterHash(++WhitespaceComputer.INSTANCE_COUNT);
            this._heights = [];
            this._minWidths = [];
            this._ids = [];
            this._afterLineNumbers = [];
            this._ordinals = [];
            this._prefixSum = [];
            this._prefixSumValidIndex = -1;
            this._whitespaceId2Index = {};
            this._lastWhitespaceId = 0;
            this._minWidth = -1; /* marker for not being computed */
        }
        /**
         * Find the insertion index for a new value inside a sorted array of values.
         * If the value is already present in the sorted array, the insertion index will be after the already existing value.
         */
        static findInsertionIndex(sortedArray, value, ordinals, valueOrdinal) {
            let low = 0;
            let high = sortedArray.length;
            while (low < high) {
                let mid = ((low + high) >>> 1);
                if (value === sortedArray[mid]) {
                    if (valueOrdinal < ordinals[mid]) {
                        high = mid;
                    }
                    else {
                        low = mid + 1;
                    }
                }
                else if (value < sortedArray[mid]) {
                    high = mid;
                }
                else {
                    low = mid + 1;
                }
            }
            return low;
        }
        /**
         * Insert a new whitespace of a certain height after a line number.
         * The whitespace has a "sticky" characteristic.
         * Irrespective of edits above or below `afterLineNumber`, the whitespace will follow the initial line.
         *
         * @param afterLineNumber The conceptual position of this whitespace. The whitespace will follow this line as best as possible even when deleting/inserting lines above/below.
         * @param heightInPx The height of the whitespace, in pixels.
         * @return An id that can be used later to mutate or delete the whitespace
         */
        insertWhitespace(afterLineNumber, ordinal, heightInPx, minWidth) {
            afterLineNumber = afterLineNumber | 0;
            ordinal = ordinal | 0;
            heightInPx = heightInPx | 0;
            minWidth = minWidth | 0;
            let id = this._instanceId + (++this._lastWhitespaceId);
            let insertionIndex = WhitespaceComputer.findInsertionIndex(this._afterLineNumbers, afterLineNumber, this._ordinals, ordinal);
            this._insertWhitespaceAtIndex(id, insertionIndex, afterLineNumber, ordinal, heightInPx, minWidth);
            this._minWidth = -1; /* marker for not being computed */
            return id;
        }
        _insertWhitespaceAtIndex(id, insertIndex, afterLineNumber, ordinal, heightInPx, minWidth) {
            insertIndex = insertIndex | 0;
            afterLineNumber = afterLineNumber | 0;
            ordinal = ordinal | 0;
            heightInPx = heightInPx | 0;
            minWidth = minWidth | 0;
            this._heights.splice(insertIndex, 0, heightInPx);
            this._minWidths.splice(insertIndex, 0, minWidth);
            this._ids.splice(insertIndex, 0, id);
            this._afterLineNumbers.splice(insertIndex, 0, afterLineNumber);
            this._ordinals.splice(insertIndex, 0, ordinal);
            this._prefixSum.splice(insertIndex, 0, 0);
            let keys = Object.keys(this._whitespaceId2Index);
            for (let i = 0, len = keys.length; i < len; i++) {
                let sid = keys[i];
                let oldIndex = this._whitespaceId2Index[sid];
                if (oldIndex >= insertIndex) {
                    this._whitespaceId2Index[sid] = oldIndex + 1;
                }
            }
            this._whitespaceId2Index[id] = insertIndex;
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, insertIndex - 1);
        }
        /**
         * Change properties associated with a certain whitespace.
         */
        changeWhitespace(id, newAfterLineNumber, newHeight) {
            newAfterLineNumber = newAfterLineNumber | 0;
            newHeight = newHeight | 0;
            let hasChanges = false;
            hasChanges = this.changeWhitespaceHeight(id, newHeight) || hasChanges;
            hasChanges = this.changeWhitespaceAfterLineNumber(id, newAfterLineNumber) || hasChanges;
            return hasChanges;
        }
        /**
         * Change the height of an existing whitespace
         *
         * @param id The whitespace to change
         * @param newHeightInPx The new height of the whitespace, in pixels
         * @return Returns true if the whitespace is found and if the new height is different than the old height
         */
        changeWhitespaceHeight(id, newHeightInPx) {
            newHeightInPx = newHeightInPx | 0;
            if (this._whitespaceId2Index.hasOwnProperty(id)) {
                let index = this._whitespaceId2Index[id];
                if (this._heights[index] !== newHeightInPx) {
                    this._heights[index] = newHeightInPx;
                    this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, index - 1);
                    return true;
                }
            }
            return false;
        }
        /**
         * Change the line number after which an existing whitespace flows.
         *
         * @param id The whitespace to change
         * @param newAfterLineNumber The new line number the whitespace will follow
         * @return Returns true if the whitespace is found and if the new line number is different than the old line number
         */
        changeWhitespaceAfterLineNumber(id, newAfterLineNumber) {
            newAfterLineNumber = newAfterLineNumber | 0;
            if (this._whitespaceId2Index.hasOwnProperty(id)) {
                let index = this._whitespaceId2Index[id];
                if (this._afterLineNumbers[index] !== newAfterLineNumber) {
                    // `afterLineNumber` changed for this whitespace
                    // Record old ordinal
                    let ordinal = this._ordinals[index];
                    // Record old height
                    let heightInPx = this._heights[index];
                    // Record old min width
                    let minWidth = this._minWidths[index];
                    // Since changing `afterLineNumber` can trigger a reordering, we're gonna remove this whitespace
                    this.removeWhitespace(id);
                    // And add it again
                    let insertionIndex = WhitespaceComputer.findInsertionIndex(this._afterLineNumbers, newAfterLineNumber, this._ordinals, ordinal);
                    this._insertWhitespaceAtIndex(id, insertionIndex, newAfterLineNumber, ordinal, heightInPx, minWidth);
                    return true;
                }
            }
            return false;
        }
        /**
         * Remove an existing whitespace.
         *
         * @param id The whitespace to remove
         * @return Returns true if the whitespace is found and it is removed.
         */
        removeWhitespace(id) {
            if (this._whitespaceId2Index.hasOwnProperty(id)) {
                let index = this._whitespaceId2Index[id];
                delete this._whitespaceId2Index[id];
                this._removeWhitespaceAtIndex(index);
                this._minWidth = -1; /* marker for not being computed */
                return true;
            }
            return false;
        }
        _removeWhitespaceAtIndex(removeIndex) {
            removeIndex = removeIndex | 0;
            this._heights.splice(removeIndex, 1);
            this._minWidths.splice(removeIndex, 1);
            this._ids.splice(removeIndex, 1);
            this._afterLineNumbers.splice(removeIndex, 1);
            this._ordinals.splice(removeIndex, 1);
            this._prefixSum.splice(removeIndex, 1);
            this._prefixSumValidIndex = Math.min(this._prefixSumValidIndex, removeIndex - 1);
            let keys = Object.keys(this._whitespaceId2Index);
            for (let i = 0, len = keys.length; i < len; i++) {
                let sid = keys[i];
                let oldIndex = this._whitespaceId2Index[sid];
                if (oldIndex >= removeIndex) {
                    this._whitespaceId2Index[sid] = oldIndex - 1;
                }
            }
        }
        /**
         * Notify the computer that lines have been deleted (a continuous zone of lines).
         * This gives it a chance to update `afterLineNumber` for whitespaces, giving the "sticky" characteristic.
         *
         * @param fromLineNumber The line number at which the deletion started, inclusive
         * @param toLineNumber The line number at which the deletion ended, inclusive
         */
        onLinesDeleted(fromLineNumber, toLineNumber) {
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            for (let i = 0, len = this._afterLineNumbers.length; i < len; i++) {
                let afterLineNumber = this._afterLineNumbers[i];
                if (fromLineNumber <= afterLineNumber && afterLineNumber <= toLineNumber) {
                    // The line this whitespace was after has been deleted
                    //  => move whitespace to before first deleted line
                    this._afterLineNumbers[i] = fromLineNumber - 1;
                }
                else if (afterLineNumber > toLineNumber) {
                    // The line this whitespace was after has been moved up
                    //  => move whitespace up
                    this._afterLineNumbers[i] -= (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Notify the computer that lines have been inserted (a continuous zone of lines).
         * This gives it a chance to update `afterLineNumber` for whitespaces, giving the "sticky" characteristic.
         *
         * @param fromLineNumber The line number at which the insertion started, inclusive
         * @param toLineNumber The line number at which the insertion ended, inclusive.
         */
        onLinesInserted(fromLineNumber, toLineNumber) {
            fromLineNumber = fromLineNumber | 0;
            toLineNumber = toLineNumber | 0;
            for (let i = 0, len = this._afterLineNumbers.length; i < len; i++) {
                let afterLineNumber = this._afterLineNumbers[i];
                if (fromLineNumber <= afterLineNumber) {
                    this._afterLineNumbers[i] += (toLineNumber - fromLineNumber + 1);
                }
            }
        }
        /**
         * Get the sum of all the whitespaces.
         */
        getTotalHeight() {
            if (this._heights.length === 0) {
                return 0;
            }
            return this.getAccumulatedHeight(this._heights.length - 1);
        }
        /**
         * Return the sum of the heights of the whitespaces at [0..index].
         * This includes the whitespace at `index`.
         *
         * @param index The index of the whitespace.
         * @return The sum of the heights of all whitespaces before the one at `index`, including the one at `index`.
         */
        getAccumulatedHeight(index) {
            index = index | 0;
            let startIndex = Math.max(0, this._prefixSumValidIndex + 1);
            if (startIndex === 0) {
                this._prefixSum[0] = this._heights[0];
                startIndex++;
            }
            for (let i = startIndex; i <= index; i++) {
                this._prefixSum[i] = this._prefixSum[i - 1] + this._heights[i];
            }
            this._prefixSumValidIndex = Math.max(this._prefixSumValidIndex, index);
            return this._prefixSum[index];
        }
        /**
         * Find all whitespaces with `afterLineNumber` < `lineNumber` and return the sum of their heights.
         *
         * @param lineNumber The line number whitespaces should be before.
         * @return The sum of the heights of the whitespaces before `lineNumber`.
         */
        getAccumulatedHeightBeforeLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            let lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            if (lastWhitespaceBeforeLineNumber === -1) {
                return 0;
            }
            return this.getAccumulatedHeight(lastWhitespaceBeforeLineNumber);
        }
        _findLastWhitespaceBeforeLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            // Find the whitespace before line number
            let afterLineNumbers = this._afterLineNumbers;
            let low = 0;
            let high = afterLineNumbers.length - 1;
            while (low <= high) {
                let delta = (high - low) | 0;
                let halfDelta = (delta / 2) | 0;
                let mid = (low + halfDelta) | 0;
                if (afterLineNumbers[mid] < lineNumber) {
                    if (mid + 1 >= afterLineNumbers.length || afterLineNumbers[mid + 1] >= lineNumber) {
                        return mid;
                    }
                    else {
                        low = (mid + 1) | 0;
                    }
                }
                else {
                    high = (mid - 1) | 0;
                }
            }
            return -1;
        }
        _findFirstWhitespaceAfterLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            let lastWhitespaceBeforeLineNumber = this._findLastWhitespaceBeforeLineNumber(lineNumber);
            let firstWhitespaceAfterLineNumber = lastWhitespaceBeforeLineNumber + 1;
            if (firstWhitespaceAfterLineNumber < this._heights.length) {
                return firstWhitespaceAfterLineNumber;
            }
            return -1;
        }
        /**
         * Find the index of the first whitespace which has `afterLineNumber` >= `lineNumber`.
         * @return The index of the first whitespace with `afterLineNumber` >= `lineNumber` or -1 if no whitespace is found.
         */
        getFirstWhitespaceIndexAfterLineNumber(lineNumber) {
            lineNumber = lineNumber | 0;
            return this._findFirstWhitespaceAfterLineNumber(lineNumber);
        }
        /**
         * The number of whitespaces.
         */
        getCount() {
            return this._heights.length;
        }
        /**
         * The maximum min width for all whitespaces.
         */
        getMinWidth() {
            if (this._minWidth === -1) {
                let minWidth = 0;
                for (let i = 0, len = this._minWidths.length; i < len; i++) {
                    minWidth = Math.max(minWidth, this._minWidths[i]);
                }
                this._minWidth = minWidth;
            }
            return this._minWidth;
        }
        /**
         * Get the `afterLineNumber` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `afterLineNumber` of whitespace at `index`.
         */
        getAfterLineNumberForWhitespaceIndex(index) {
            index = index | 0;
            return this._afterLineNumbers[index];
        }
        /**
         * Get the `id` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `id` of whitespace at `index`.
         */
        getIdForWhitespaceIndex(index) {
            index = index | 0;
            return this._ids[index];
        }
        /**
         * Get the `height` for whitespace at index `index`.
         *
         * @param index The index of the whitespace.
         * @return `height` of whitespace at `index`.
         */
        getHeightForWhitespaceIndex(index) {
            index = index | 0;
            return this._heights[index];
        }
        /**
         * Get all whitespaces.
         */
        getWhitespaces(deviceLineHeight) {
            deviceLineHeight = deviceLineHeight | 0;
            let result = [];
            for (let i = 0; i < this._heights.length; i++) {
                result.push({
                    id: this._ids[i],
                    afterLineNumber: this._afterLineNumbers[i],
                    heightInLines: this._heights[i] / deviceLineHeight
                });
            }
            return result;
        }
    }
    exports.WhitespaceComputer = WhitespaceComputer;
    WhitespaceComputer.INSTANCE_COUNT = 0;
});
//# sourceMappingURL=whitespaceComputer.js.map