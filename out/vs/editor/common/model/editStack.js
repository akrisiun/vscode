/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/errors", "vs/editor/common/core/selection", "vs/base/common/uri", "vs/editor/common/model/textChange", "vs/base/common/buffer"], function (require, exports, nls, errors_1, selection_1, uri_1, textChange_1, buffer) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditStack = exports.MultiModelEditStackElement = exports.SingleModelEditStackElement = void 0;
    function uriGetComparisonKey(resource) {
        return resource.toString();
    }
    class SingleModelEditStackData {
        constructor(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes) {
            this.beforeVersionId = beforeVersionId;
            this.afterVersionId = afterVersionId;
            this.beforeEOL = beforeEOL;
            this.afterEOL = afterEOL;
            this.beforeCursorState = beforeCursorState;
            this.afterCursorState = afterCursorState;
            this.changes = changes;
        }
        static create(model, beforeCursorState) {
            const alternativeVersionId = model.getAlternativeVersionId();
            const eol = getModelEOL(model);
            return new SingleModelEditStackData(alternativeVersionId, alternativeVersionId, eol, eol, beforeCursorState, beforeCursorState, []);
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (textChanges.length > 0) {
                this.changes = textChange_1.compressConsecutiveTextChanges(this.changes, textChanges);
            }
            this.afterEOL = afterEOL;
            this.afterVersionId = afterVersionId;
            this.afterCursorState = afterCursorState;
        }
        static _writeSelectionsSize(selections) {
            return 4 + 4 * 4 * (selections ? selections.length : 0);
        }
        static _writeSelections(b, selections, offset) {
            buffer.writeUInt32BE(b, (selections ? selections.length : 0), offset);
            offset += 4;
            if (selections) {
                for (const selection of selections) {
                    buffer.writeUInt32BE(b, selection.selectionStartLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.selectionStartColumn, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionLineNumber, offset);
                    offset += 4;
                    buffer.writeUInt32BE(b, selection.positionColumn, offset);
                    offset += 4;
                }
            }
            return offset;
        }
        static _readSelections(b, offset, dest) {
            const count = buffer.readUInt32BE(b, offset);
            offset += 4;
            for (let i = 0; i < count; i++) {
                const selectionStartLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const selectionStartColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionLineNumber = buffer.readUInt32BE(b, offset);
                offset += 4;
                const positionColumn = buffer.readUInt32BE(b, offset);
                offset += 4;
                dest.push(new selection_1.Selection(selectionStartLineNumber, selectionStartColumn, positionLineNumber, positionColumn));
            }
            return offset;
        }
        serialize() {
            let necessarySize = (+4 // beforeVersionId
                + 4 // afterVersionId
                + 1 // beforeEOL
                + 1 // afterEOL
                + SingleModelEditStackData._writeSelectionsSize(this.beforeCursorState)
                + SingleModelEditStackData._writeSelectionsSize(this.afterCursorState)
                + 4 // change count
            );
            for (const change of this.changes) {
                necessarySize += change.writeSize();
            }
            const b = new Uint8Array(necessarySize);
            let offset = 0;
            buffer.writeUInt32BE(b, this.beforeVersionId, offset);
            offset += 4;
            buffer.writeUInt32BE(b, this.afterVersionId, offset);
            offset += 4;
            buffer.writeUInt8(b, this.beforeEOL, offset);
            offset += 1;
            buffer.writeUInt8(b, this.afterEOL, offset);
            offset += 1;
            offset = SingleModelEditStackData._writeSelections(b, this.beforeCursorState, offset);
            offset = SingleModelEditStackData._writeSelections(b, this.afterCursorState, offset);
            buffer.writeUInt32BE(b, this.changes.length, offset);
            offset += 4;
            for (const change of this.changes) {
                offset = change.write(b, offset);
            }
            return b.buffer;
        }
        static deserialize(source) {
            const b = new Uint8Array(source);
            let offset = 0;
            const beforeVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const afterVersionId = buffer.readUInt32BE(b, offset);
            offset += 4;
            const beforeEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const afterEOL = buffer.readUInt8(b, offset);
            offset += 1;
            const beforeCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, beforeCursorState);
            const afterCursorState = [];
            offset = SingleModelEditStackData._readSelections(b, offset, afterCursorState);
            const changeCount = buffer.readUInt32BE(b, offset);
            offset += 4;
            const changes = [];
            for (let i = 0; i < changeCount; i++) {
                offset = textChange_1.TextChange.read(b, offset, changes);
            }
            return new SingleModelEditStackData(beforeVersionId, afterVersionId, beforeEOL, afterEOL, beforeCursorState, afterCursorState, changes);
        }
    }
    class SingleModelEditStackElement {
        constructor(model, beforeCursorState) {
            this.model = model;
            this._data = SingleModelEditStackData.create(model, beforeCursorState);
        }
        get type() {
            return 0 /* Resource */;
        }
        get resource() {
            if (uri_1.URI.isUri(this.model)) {
                return this.model;
            }
            return this.model.uri;
        }
        get label() {
            return nls.localize('edit', "Typing");
        }
        setModel(model) {
            this.model = model;
        }
        canAppend(model) {
            return (this.model === model && this._data instanceof SingleModelEditStackData);
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            if (this._data instanceof SingleModelEditStackData) {
                this._data.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
            }
        }
        close() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
        }
        undo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyUndo(data.changes, data.beforeEOL, data.beforeVersionId, data.beforeCursorState);
        }
        redo() {
            if (uri_1.URI.isUri(this.model)) {
                // don't have a model
                throw new Error(`Invalid SingleModelEditStackElement`);
            }
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            const data = SingleModelEditStackData.deserialize(this._data);
            this.model._applyRedo(data.changes, data.afterEOL, data.afterVersionId, data.afterCursorState);
        }
        heapSize() {
            if (this._data instanceof SingleModelEditStackData) {
                this._data = this._data.serialize();
            }
            return this._data.byteLength + 168 /*heap overhead*/;
        }
    }
    exports.SingleModelEditStackElement = SingleModelEditStackElement;
    class MultiModelEditStackElement {
        constructor(label, editStackElements) {
            this.type = 1 /* Workspace */;
            this.label = label;
            this._isOpen = true;
            this._editStackElementsArr = editStackElements.slice(0);
            this._editStackElementsMap = new Map();
            for (const editStackElement of this._editStackElementsArr) {
                const key = uriGetComparisonKey(editStackElement.resource);
                this._editStackElementsMap.set(key, editStackElement);
            }
        }
        get resources() {
            return this._editStackElementsArr.map(editStackElement => editStackElement.resource);
        }
        setModel(model) {
            const key = uriGetComparisonKey(uri_1.URI.isUri(model) ? model : model.uri);
            if (this._editStackElementsMap.has(key)) {
                this._editStackElementsMap.get(key).setModel(model);
            }
        }
        canAppend(model) {
            if (!this._isOpen) {
                return false;
            }
            const key = uriGetComparisonKey(model.uri);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.canAppend(model);
            }
            return false;
        }
        append(model, textChanges, afterEOL, afterVersionId, afterCursorState) {
            const key = uriGetComparisonKey(model.uri);
            const editStackElement = this._editStackElementsMap.get(key);
            editStackElement.append(model, textChanges, afterEOL, afterVersionId, afterCursorState);
        }
        close() {
            this._isOpen = false;
        }
        undo() {
            this._isOpen = false;
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.undo();
            }
        }
        redo() {
            for (const editStackElement of this._editStackElementsArr) {
                editStackElement.redo();
            }
        }
        heapSize(resource) {
            const key = uriGetComparisonKey(resource);
            if (this._editStackElementsMap.has(key)) {
                const editStackElement = this._editStackElementsMap.get(key);
                return editStackElement.heapSize();
            }
            return 0;
        }
        split() {
            return this._editStackElementsArr;
        }
    }
    exports.MultiModelEditStackElement = MultiModelEditStackElement;
    function getModelEOL(model) {
        const eol = model.getEOL();
        if (eol === '\n') {
            return 0 /* LF */;
        }
        else {
            return 1 /* CRLF */;
        }
    }
    function isKnownStackElement(element) {
        if (!element) {
            return false;
        }
        return ((element instanceof SingleModelEditStackElement) || (element instanceof MultiModelEditStackElement));
    }
    class EditStack {
        constructor(model, undoRedoService) {
            this._model = model;
            this._undoRedoService = undoRedoService;
        }
        pushStackElement() {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isKnownStackElement(lastElement)) {
                lastElement.close();
            }
        }
        clear() {
            this._undoRedoService.removeElements(this._model.uri);
        }
        _getOrCreateEditStackElement(beforeCursorState) {
            const lastElement = this._undoRedoService.getLastElement(this._model.uri);
            if (isKnownStackElement(lastElement) && lastElement.canAppend(this._model)) {
                return lastElement;
            }
            const newElement = new SingleModelEditStackElement(this._model, beforeCursorState);
            this._undoRedoService.pushElement(newElement);
            return newElement;
        }
        pushEOL(eol) {
            const editStackElement = this._getOrCreateEditStackElement(null);
            this._model.setEOL(eol);
            editStackElement.append(this._model, [], getModelEOL(this._model), this._model.getAlternativeVersionId(), null);
        }
        pushEditOperation(beforeCursorState, editOperations, cursorStateComputer) {
            const editStackElement = this._getOrCreateEditStackElement(beforeCursorState);
            const inverseEditOperations = this._model.applyEdits(editOperations, true);
            const afterCursorState = EditStack._computeCursorState(cursorStateComputer, inverseEditOperations);
            const textChanges = inverseEditOperations.map((op, index) => ({ index: index, textChange: op.textChange }));
            textChanges.sort((a, b) => {
                if (a.textChange.oldPosition === b.textChange.oldPosition) {
                    return a.index - b.index;
                }
                return a.textChange.oldPosition - b.textChange.oldPosition;
            });
            editStackElement.append(this._model, textChanges.map(op => op.textChange), getModelEOL(this._model), this._model.getAlternativeVersionId(), afterCursorState);
            return afterCursorState;
        }
        static _computeCursorState(cursorStateComputer, inverseEditOperations) {
            try {
                return cursorStateComputer ? cursorStateComputer(inverseEditOperations) : null;
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return null;
            }
        }
    }
    exports.EditStack = EditStack;
});
//# sourceMappingURL=editStack.js.map