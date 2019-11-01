/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/editOperation", "vs/editor/common/core/range"], function (require, exports, editOperation_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SortLinesCommand {
        constructor(selection, descending) {
            this.selection = selection;
            this.descending = descending;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            let op = sortLines(model, this.selection, this.descending);
            if (op) {
                builder.addEditOperation(op.range, op.text);
            }
            this.selectionId = builder.trackSelection(this.selection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
        static canRun(model, selection, descending) {
            if (model === null) {
                return false;
            }
            let data = getSortData(model, selection, descending);
            if (!data) {
                return false;
            }
            for (let i = 0, len = data.before.length; i < len; i++) {
                if (data.before[i] !== data.after[i]) {
                    return true;
                }
            }
            return false;
        }
    }
    exports.SortLinesCommand = SortLinesCommand;
    function getSortData(model, selection, descending) {
        let startLineNumber = selection.startLineNumber;
        let endLineNumber = selection.endLineNumber;
        if (selection.endColumn === 1) {
            endLineNumber--;
        }
        // Nothing to sort if user didn't select anything.
        if (startLineNumber >= endLineNumber) {
            return null;
        }
        let linesToSort = [];
        // Get the contents of the selection to be sorted.
        for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
            linesToSort.push(model.getLineContent(lineNumber));
        }
        let sorted = linesToSort.slice(0);
        sorted.sort((a, b) => {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        // If descending, reverse the order.
        if (descending === true) {
            sorted = sorted.reverse();
        }
        return {
            startLineNumber: startLineNumber,
            endLineNumber: endLineNumber,
            before: linesToSort,
            after: sorted
        };
    }
    /**
     * Generate commands for sorting lines on a model.
     */
    function sortLines(model, selection, descending) {
        let data = getSortData(model, selection, descending);
        if (!data) {
            return null;
        }
        return editOperation_1.EditOperation.replace(new range_1.Range(data.startLineNumber, 1, data.endLineNumber, model.getLineMaxColumn(data.endLineNumber)), data.after.join('\n'));
    }
});
//# sourceMappingURL=sortLinesCommand.js.map