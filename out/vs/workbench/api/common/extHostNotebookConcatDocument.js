/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostTypes", "vs/base/common/event", "vs/editor/common/viewModel/prefixSumComputer", "vs/base/common/lifecycle", "vs/editor/common/modes/languageSelector", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/resources"], function (require, exports, types, event_1, prefixSumComputer_1, lifecycle_1, languageSelector_1, notebookCommon_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookConcatDocument = void 0;
    class ExtHostNotebookConcatDocument {
        constructor(extHostNotebooks, extHostDocuments, _notebook, _selector) {
            this._notebook = _notebook;
            this._selector = _selector;
            this._disposables = new lifecycle_1.DisposableStore();
            this._isClosed = false;
            this._versionId = 0;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._init();
            this._disposables.add(extHostDocuments.onDidChangeDocument(e => {
                let cellIdx = this._cells.findIndex(cell => resources_1.isEqual(cell.uri, e.document.uri));
                if (cellIdx >= 0) {
                    this._cellLengths.changeValue(cellIdx, this._cells[cellIdx].document.getText().length + 1);
                    this._cellLines.changeValue(cellIdx, this._cells[cellIdx].document.lineCount);
                    this._versionId += 1;
                    this._onDidChange.fire(undefined);
                }
            }));
            this._disposables.add(extHostNotebooks.onDidChangeNotebookDocument(e => {
                if (e.document === this._notebook) {
                    this._init();
                    this._versionId += 1;
                    this._onDidChange.fire(undefined);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._isClosed = true;
        }
        get isClosed() {
            return this._isClosed;
        }
        _init() {
            this._cells = [];
            const cellLengths = [];
            const cellLineCounts = [];
            for (let cell of this._notebook.cells) {
                if (cell.cellKind === notebookCommon_1.CellKind.Code && (!this._selector || languageSelector_1.score(this._selector, cell.uri, cell.language, true))) {
                    this._cells.push(cell);
                    cellLengths.push(cell.document.getText().length + 1);
                    cellLineCounts.push(cell.document.lineCount);
                }
            }
            this._cellLengths = new prefixSumComputer_1.PrefixSumComputer(new Uint32Array(cellLengths));
            this._cellLines = new prefixSumComputer_1.PrefixSumComputer(new Uint32Array(cellLineCounts));
        }
        get version() {
            return this._versionId;
        }
        getText(range) {
            if (!range) {
                let result = '';
                for (let cell of this._cells) {
                    result += cell.document.getText() + '\n';
                }
                // remove last newline again
                result = result.slice(0, -1);
                return result;
            }
            if (range.isEmpty) {
                return '';
            }
            // get start and end locations and create substrings
            const start = this.locationAt(range.start);
            const end = this.locationAt(range.end);
            const startCell = this._cells.find(cell => resources_1.isEqual(cell.uri, start.uri));
            const endCell = this._cells.find(cell => resources_1.isEqual(cell.uri, end.uri));
            if (!startCell || !endCell) {
                return '';
            }
            else if (startCell === endCell) {
                return startCell.document.getText(new types.Range(start.range.start, end.range.end));
            }
            else {
                let a = startCell.document.getText(new types.Range(start.range.start, new types.Position(startCell.document.lineCount, 0)));
                let b = endCell.document.getText(new types.Range(new types.Position(0, 0), end.range.end));
                return a + '\n' + b;
            }
        }
        offsetAt(position) {
            const idx = this._cellLines.getIndexOf(position.line);
            const offset1 = this._cellLengths.getAccumulatedValue(idx.index - 1);
            const offset2 = this._cells[idx.index].document.offsetAt(position.with(idx.remainder));
            return offset1 + offset2;
        }
        positionAt(locationOrOffset) {
            if (typeof locationOrOffset === 'number') {
                const idx = this._cellLengths.getIndexOf(locationOrOffset);
                const lineCount = this._cellLines.getAccumulatedValue(idx.index - 1);
                return this._cells[idx.index].document.positionAt(idx.remainder).translate(lineCount);
            }
            const idx = this._cells.findIndex(cell => resources_1.isEqual(cell.uri, locationOrOffset.uri));
            if (idx >= 0) {
                let line = this._cellLines.getAccumulatedValue(idx - 1);
                return new types.Position(line + locationOrOffset.range.start.line, locationOrOffset.range.start.character);
            }
            // do better?
            // return undefined;
            return new types.Position(0, 0);
        }
        locationAt(positionOrRange) {
            if (!types.Range.isRange(positionOrRange)) {
                positionOrRange = new types.Range(positionOrRange, positionOrRange);
            }
            const startIdx = this._cellLines.getIndexOf(positionOrRange.start.line);
            let endIdx = startIdx;
            if (!positionOrRange.isEmpty) {
                endIdx = this._cellLines.getIndexOf(positionOrRange.end.line);
            }
            let startPos = new types.Position(startIdx.remainder, positionOrRange.start.character);
            let endPos = new types.Position(endIdx.remainder, positionOrRange.end.character);
            let range = new types.Range(startPos, endPos);
            const startCell = this._cells[startIdx.index];
            return new types.Location(startCell.uri, startCell.document.validateRange(range));
        }
    }
    exports.ExtHostNotebookConcatDocument = ExtHostNotebookConcatDocument;
});
//# sourceMappingURL=extHostNotebookConcatDocument.js.map