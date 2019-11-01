/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/errors", "vs/editor/common/core/position", "vs/base/common/lifecycle"], function (require, exports, dom_1, actions_1, errors_1, position_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CodeActionWidget extends lifecycle_1.Disposable {
        constructor(_editor, _contextMenuService, _delegate) {
            super();
            this._editor = _editor;
            this._contextMenuService = _contextMenuService;
            this._delegate = _delegate;
            this._showingActions = this._register(new lifecycle_1.MutableDisposable());
            this._visible = false;
        }
        async show(codeActions, at) {
            if (!codeActions.actions.length) {
                this._visible = false;
                return;
            }
            if (!this._editor.getDomNode()) {
                // cancel when editor went off-dom
                this._visible = false;
                return Promise.reject(errors_1.canceled());
            }
            this._visible = true;
            const actions = codeActions.actions.map(action => this.codeActionToAction(action));
            this._showingActions.value = codeActions;
            this._contextMenuService.showContextMenu({
                getAnchor: () => {
                    if (position_1.Position.isIPosition(at)) {
                        at = this._toCoords(at);
                    }
                    return at || { x: 0, y: 0 };
                },
                getActions: () => actions,
                onHide: () => {
                    this._visible = false;
                    this._editor.focus();
                },
                autoSelectFirstItem: true
            });
        }
        codeActionToAction(action) {
            const id = action.command ? action.command.id : action.title;
            const title = action.title;
            return new actions_1.Action(id, title, undefined, true, () => this._delegate.onSelectCodeAction(action));
        }
        get isVisible() {
            return this._visible;
        }
        _toCoords(position) {
            if (!this._editor.hasModel()) {
                return { x: 0, y: 0 };
            }
            this._editor.revealPosition(position, 1 /* Immediate */);
            this._editor.render();
            // Translate to absolute editor position
            const cursorCoords = this._editor.getScrolledVisiblePosition(position);
            const editorCoords = dom_1.getDomNodePagePosition(this._editor.getDomNode());
            const x = editorCoords.left + cursorCoords.left;
            const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
            return { x, y };
        }
    }
    exports.CodeActionWidget = CodeActionWidget;
});
//# sourceMappingURL=codeActionWidget.js.map