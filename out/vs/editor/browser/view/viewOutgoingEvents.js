/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/controller/mouseTarget"], function (require, exports, lifecycle_1, mouseTarget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewOutgoingEvents = void 0;
    class ViewOutgoingEvents extends lifecycle_1.Disposable {
        constructor(viewModel) {
            super();
            this.onDidContentSizeChange = null;
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
        emitContentSizeChange(e) {
            if (this.onDidContentSizeChange) {
                this.onDidContentSizeChange(e);
            }
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
            return ViewOutgoingEvents.convertViewToModelMouseTarget(target, this._viewModel.coordinatesConverter);
        }
        static convertViewToModelMouseTarget(target, coordinatesConverter) {
            return new ExternalMouseTarget(target.element, target.type, target.mouseColumn, target.position ? coordinatesConverter.convertViewPositionToModelPosition(target.position) : null, target.range ? coordinatesConverter.convertViewRangeToModelRange(target.range) : null, target.detail);
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