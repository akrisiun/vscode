/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors"], function (require, exports, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EditStackElement {
        constructor(beforeVersionId, beforeCursorState) {
            this.beforeVersionId = beforeVersionId;
            this.beforeCursorState = beforeCursorState;
            this.afterCursorState = null;
            this.afterVersionId = -1;
            this.editOperations = [];
        }
        undo(model) {
            // Apply all operations in reverse order
            for (let i = this.editOperations.length - 1; i >= 0; i--) {
                this.editOperations[i] = {
                    operations: model.applyEdits(this.editOperations[i].operations)
                };
            }
        }
        redo(model) {
            // Apply all operations
            for (let i = 0; i < this.editOperations.length; i++) {
                this.editOperations[i] = {
                    operations: model.applyEdits(this.editOperations[i].operations)
                };
            }
        }
    }
    function getModelEOL(model) {
        const eol = model.getEOL();
        if (eol === '\n') {
            return 0 /* LF */;
        }
        else {
            return 1 /* CRLF */;
        }
    }
    class EOLStackElement {
        constructor(beforeVersionId, setEOL) {
            this.beforeVersionId = beforeVersionId;
            this.beforeCursorState = null;
            this.afterCursorState = null;
            this.afterVersionId = -1;
            this.eol = setEOL;
        }
        undo(model) {
            let redoEOL = getModelEOL(model);
            model.setEOL(this.eol);
            this.eol = redoEOL;
        }
        redo(model) {
            let undoEOL = getModelEOL(model);
            model.setEOL(this.eol);
            this.eol = undoEOL;
        }
    }
    class EditStack {
        constructor(model) {
            this.model = model;
            this.currentOpenStackElement = null;
            this.past = [];
            this.future = [];
        }
        pushStackElement() {
            if (this.currentOpenStackElement !== null) {
                this.past.push(this.currentOpenStackElement);
                this.currentOpenStackElement = null;
            }
        }
        clear() {
            this.currentOpenStackElement = null;
            this.past = [];
            this.future = [];
        }
        pushEOL(eol) {
            // No support for parallel universes :(
            this.future = [];
            if (this.currentOpenStackElement) {
                this.pushStackElement();
            }
            const prevEOL = getModelEOL(this.model);
            let stackElement = new EOLStackElement(this.model.getAlternativeVersionId(), prevEOL);
            this.model.setEOL(eol);
            stackElement.afterVersionId = this.model.getVersionId();
            this.currentOpenStackElement = stackElement;
            this.pushStackElement();
        }
        pushEditOperation(beforeCursorState, editOperations, cursorStateComputer) {
            // No support for parallel universes :(
            this.future = [];
            let stackElement = null;
            if (this.currentOpenStackElement) {
                if (this.currentOpenStackElement instanceof EditStackElement) {
                    stackElement = this.currentOpenStackElement;
                }
                else {
                    this.pushStackElement();
                }
            }
            if (!this.currentOpenStackElement) {
                stackElement = new EditStackElement(this.model.getAlternativeVersionId(), beforeCursorState);
                this.currentOpenStackElement = stackElement;
            }
            const inverseEditOperation = {
                operations: this.model.applyEdits(editOperations)
            };
            stackElement.editOperations.push(inverseEditOperation);
            stackElement.afterCursorState = EditStack._computeCursorState(cursorStateComputer, inverseEditOperation.operations);
            stackElement.afterVersionId = this.model.getVersionId();
            return stackElement.afterCursorState;
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
        undo() {
            this.pushStackElement();
            if (this.past.length > 0) {
                const pastStackElement = this.past.pop();
                try {
                    pastStackElement.undo(this.model);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                    this.clear();
                    return null;
                }
                this.future.push(pastStackElement);
                return {
                    selections: pastStackElement.beforeCursorState,
                    recordedVersionId: pastStackElement.beforeVersionId
                };
            }
            return null;
        }
        canUndo() {
            return (this.past.length > 0) || this.currentOpenStackElement !== null;
        }
        redo() {
            if (this.future.length > 0) {
                const futureStackElement = this.future.pop();
                try {
                    futureStackElement.redo(this.model);
                }
                catch (e) {
                    errors_1.onUnexpectedError(e);
                    this.clear();
                    return null;
                }
                this.past.push(futureStackElement);
                return {
                    selections: futureStackElement.afterCursorState,
                    recordedVersionId: futureStackElement.afterVersionId
                };
            }
            return null;
        }
        canRedo() {
            return (this.future.length > 0);
        }
    }
    exports.EditStack = EditStack;
});
//# sourceMappingURL=editStack.js.map