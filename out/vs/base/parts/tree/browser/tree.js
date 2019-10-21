/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ContextMenuEvent {
        constructor(posx, posy, target) {
            this._posx = posx;
            this._posy = posy;
            this._target = target;
        }
        preventDefault() {
            // no-op
        }
        stopPropagation() {
            // no-op
        }
        get posx() {
            return this._posx;
        }
        get posy() {
            return this._posy;
        }
        get target() {
            return this._target;
        }
    }
    exports.ContextMenuEvent = ContextMenuEvent;
    class MouseContextMenuEvent extends ContextMenuEvent {
        constructor(originalEvent) {
            super(originalEvent.posx, originalEvent.posy, originalEvent.target);
            this.originalEvent = originalEvent;
        }
        preventDefault() {
            this.originalEvent.preventDefault();
        }
        stopPropagation() {
            this.originalEvent.stopPropagation();
        }
    }
    exports.MouseContextMenuEvent = MouseContextMenuEvent;
    class KeyboardContextMenuEvent extends ContextMenuEvent {
        constructor(posx, posy, originalEvent) {
            super(posx, posy, originalEvent.target);
            this.originalEvent = originalEvent;
        }
        preventDefault() {
            this.originalEvent.preventDefault();
        }
        stopPropagation() {
            this.originalEvent.stopPropagation();
        }
    }
    exports.KeyboardContextMenuEvent = KeyboardContextMenuEvent;
    var DragOverEffect;
    (function (DragOverEffect) {
        DragOverEffect[DragOverEffect["COPY"] = 0] = "COPY";
        DragOverEffect[DragOverEffect["MOVE"] = 1] = "MOVE";
    })(DragOverEffect = exports.DragOverEffect || (exports.DragOverEffect = {}));
    var DragOverBubble;
    (function (DragOverBubble) {
        DragOverBubble[DragOverBubble["BUBBLE_DOWN"] = 0] = "BUBBLE_DOWN";
        DragOverBubble[DragOverBubble["BUBBLE_UP"] = 1] = "BUBBLE_UP";
    })(DragOverBubble = exports.DragOverBubble || (exports.DragOverBubble = {}));
});
//# sourceMappingURL=tree.js.map