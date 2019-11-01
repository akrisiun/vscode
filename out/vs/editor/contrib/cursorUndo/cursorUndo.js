/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys"], function (require, exports, nls, lifecycle_1, editorExtensions_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CursorState {
        constructor(selections) {
            this.selections = selections;
        }
        equals(other) {
            const thisLen = this.selections.length;
            const otherLen = other.selections.length;
            if (thisLen !== otherLen) {
                return false;
            }
            for (let i = 0; i < thisLen; i++) {
                if (!this.selections[i].equalsSelection(other.selections[i])) {
                    return false;
                }
            }
            return true;
        }
    }
    class CursorUndoController extends lifecycle_1.Disposable {
        constructor(editor) {
            super();
            this._editor = editor;
            this._isCursorUndo = false;
            this._undoStack = [];
            this._prevState = this._readState();
            this._register(editor.onDidChangeModel((e) => {
                this._undoStack = [];
                this._prevState = null;
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                this._undoStack = [];
                this._prevState = null;
            }));
            this._register(editor.onDidChangeCursorSelection((e) => {
                if (!this._isCursorUndo && this._prevState) {
                    this._undoStack.push(this._prevState);
                    if (this._undoStack.length > 50) {
                        // keep the cursor undo stack bounded
                        this._undoStack.shift();
                    }
                }
                this._prevState = this._readState();
            }));
        }
        static get(editor) {
            return editor.getContribution(CursorUndoController.ID);
        }
        _readState() {
            if (!this._editor.hasModel()) {
                // no model => no state
                return null;
            }
            return new CursorState(this._editor.getSelections());
        }
        getId() {
            return CursorUndoController.ID;
        }
        cursorUndo() {
            if (!this._editor.hasModel()) {
                return;
            }
            const currState = new CursorState(this._editor.getSelections());
            while (this._undoStack.length > 0) {
                const prevState = this._undoStack.pop();
                if (!prevState.equals(currState)) {
                    this._isCursorUndo = true;
                    this._editor.setSelections(prevState.selections);
                    this._editor.revealRangeInCenterIfOutsideViewport(prevState.selections[0], 0 /* Smooth */);
                    this._isCursorUndo = false;
                    return;
                }
            }
        }
    }
    exports.CursorUndoController = CursorUndoController;
    CursorUndoController.ID = 'editor.contrib.cursorUndoController';
    class CursorUndo extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'cursorUndo',
                label: nls.localize('cursor.undo', "Soft Undo"),
                alias: 'Soft Undo',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* CtrlCmd */ | 51 /* KEY_U */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor, args) {
            CursorUndoController.get(editor).cursorUndo();
        }
    }
    exports.CursorUndo = CursorUndo;
    editorExtensions_1.registerEditorContribution(CursorUndoController);
    editorExtensions_1.registerEditorAction(CursorUndo);
});
//# sourceMappingURL=cursorUndo.js.map