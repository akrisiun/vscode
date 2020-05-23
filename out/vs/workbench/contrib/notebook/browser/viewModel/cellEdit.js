/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SpliceCellsEdit = exports.MoveCellEdit = exports.DeleteCellEdit = exports.InsertCellEdit = void 0;
    class InsertCellEdit {
        constructor(resource, insertIndex, cell, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.insertIndex = insertIndex;
            this.cell = cell;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Insert Cell';
        }
        undo() {
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.deleteCell(this.insertIndex);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.insertCell(this.insertIndex, this.cell);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.InsertCellEdit = InsertCellEdit;
    class DeleteCellEdit {
        constructor(resource, insertIndex, cell, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.insertIndex = insertIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Delete Cell';
            this._rawCell = cell.model;
            // save inmem text to `ICell`
            this._rawCell.source = [cell.getText()];
        }
        undo() {
            if (!this.editingDelegate.insertCell || !this.editingDelegate.createCellViewModel) {
                throw new Error('Notebook Insert Cell not implemented for Undo/Redo');
            }
            const cell = this.editingDelegate.createCellViewModel(this._rawCell);
            this.editingDelegate.insertCell(this.insertIndex, cell);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.deleteCell) {
                throw new Error('Notebook Delete Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.deleteCell(this.insertIndex);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.DeleteCellEdit = DeleteCellEdit;
    class MoveCellEdit {
        constructor(resource, fromIndex, toIndex, editingDelegate, beforedSelections, endSelections) {
            this.resource = resource;
            this.fromIndex = fromIndex;
            this.toIndex = toIndex;
            this.editingDelegate = editingDelegate;
            this.beforedSelections = beforedSelections;
            this.endSelections = endSelections;
            this.type = 0 /* Resource */;
            this.label = 'Delete Cell';
        }
        undo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.toIndex, this.fromIndex);
            this.editingDelegate.setSelections(this.beforedSelections);
        }
        redo() {
            if (!this.editingDelegate.moveCell) {
                throw new Error('Notebook Move Cell not implemented for Undo/Redo');
            }
            this.editingDelegate.moveCell(this.fromIndex, this.toIndex);
            this.editingDelegate.setSelections(this.endSelections);
        }
    }
    exports.MoveCellEdit = MoveCellEdit;
    class SpliceCellsEdit {
        constructor(resource, diffs, editingDelegate, beforeHandles, endHandles) {
            this.resource = resource;
            this.diffs = diffs;
            this.editingDelegate = editingDelegate;
            this.beforeHandles = beforeHandles;
            this.endHandles = endHandles;
            this.type = 0 /* Resource */;
            this.label = 'Insert Cell';
        }
        undo() {
            if (!this.editingDelegate.deleteCell || !this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert/Delete Cell not implemented for Undo/Redo');
            }
            this.diffs.forEach(diff => {
                for (let i = 0; i < diff[2].length; i++) {
                    this.editingDelegate.deleteCell(diff[0]);
                }
                diff[1].reverse().forEach(cell => {
                    this.editingDelegate.insertCell(diff[0], cell);
                });
            });
            this.editingDelegate.setSelections(this.beforeHandles);
        }
        redo() {
            if (!this.editingDelegate.deleteCell || !this.editingDelegate.insertCell) {
                throw new Error('Notebook Insert/Delete Cell not implemented for Undo/Redo');
            }
            this.diffs.reverse().forEach(diff => {
                for (let i = 0; i < diff[1].length; i++) {
                    this.editingDelegate.deleteCell(diff[0]);
                }
                diff[2].reverse().forEach(cell => {
                    this.editingDelegate.insertCell(diff[0], cell);
                });
            });
            this.editingDelegate.setSelections(this.endHandles);
        }
    }
    exports.SpliceCellsEdit = SpliceCellsEdit;
});
//# sourceMappingURL=cellEdit.js.map