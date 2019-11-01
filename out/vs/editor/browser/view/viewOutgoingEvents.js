/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/controller/mouseTarget"], function (require, exports, lifecycle_1, mouseTarget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ViewOutgoingEvents extends lifecycle_1.Disposable {
        constructor(viewModel) {
            super();
            this.onDidScroll = null;
            this.onDidGainFocus = null;
            this.onDidLoseFocus = null;
            this.onKeyDown = null;
            this.onKeyUp = null;
            this.onContextMenu = null;
            this.onMouseMove = null;
            this.onMouseLeave = null;
            this.onMouseUp = null;
            this.onMouseDown = null;
            this.onMouseDrag = null;
            this.onMouseDrop = null;
            this.onMouseWheel = null;
            this._viewModel = viewModel;
        }
        emitScrollChanged(e) {
            if (this.onDidScroll) {
                this.onDidScroll(e);
            }
        }
        emitViewFocusGained() {
            if (this.onDidGainFocus) {
                this.onDidGainFocus(undefined);
            }
        }
        emitViewFocusLost() {
            if (this.onDidLoseFocus) {
                this.onDidLoseFocus(undefined);
            }
        }
        emitKeyDown(e) {
            if (this.onKeyDown) {
                this.onKeyDown(e);
            }
        }
        emitKeyUp(e) {
            if (this.onKeyUp) {
                this.onKeyUp(e);
            }
        }
        emitContextMenu(e) {
            if (this.onContextMenu) {
                this.onContextMenu(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseMove(e) {
            if (this.onMouseMove) {
                this.onMouseMove(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseLeave(e) {
            if (this.onMouseLeave) {
                this.onMouseLeave(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseUp(e) {
            if (this.onMouseUp) {
                this.onMouseUp(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseDown(e) {
            if (this.onMouseDown) {
                this.onMouseDown(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseDrag(e) {
            if (this.onMouseDrag) {
                this.onMouseDrag(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseDrop(e) {
            if (this.onMouseDrop) {
                this.onMouseDrop(this._convertViewToModelMouseEvent(e));
            }
        }
        emitMouseWheel(e) {
            if (this.onMouseWheel) {
                this.onMouseWheel(e);
            }
        }
        _convertViewToModelMouseEvent(e) {
            if (e.target) {
                return {
                    event: e.event,
                    target: this._convertViewToModelMouseTarget(e.target)
                };
            }
            return e;
        }
        _convertViewToModelMouseTarget(target) {
            return new ExternalMouseTarget(target.element, target.type, target.mouseColumn, target.position ? this._convertViewToModelPosition(target.position) : null, target.range ? this._convertViewToModelRange(target.range) : null, target.detail);
        }
        _convertViewToModelPosition(viewPosition) {
            return this._viewModel.coordinatesConverter.convertViewPositionToModelPosition(viewPosition);
        }
        _convertViewToModelRange(viewRange) {
            return this._viewModel.coordinatesConverter.convertViewRangeToModelRange(viewRange);
        }
    }
    exports.ViewOutgoingEvents = ViewOutgoingEvents;
    class ExternalMouseTarget {
        constructor(element, type, mouseColumn, position, range, detail) {
            this.element = element;
            this.type = type;
            this.mouseColumn = mouseColumn;
            this.position = position;
            this.range = range;
            this.detail = detail;
        }
        toString() {
            return mouseTarget_1.MouseTarget.toString(this);
        }
    }
});
//# sourceMappingURL=viewOutgoingEvents.js.map