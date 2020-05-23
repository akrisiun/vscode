/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VerticalAnchorSide = exports.HorizontalAnchorSide = void 0;
    var HorizontalAnchorSide;
    (function (HorizontalAnchorSide) {
        HorizontalAnchorSide[HorizontalAnchorSide["Left"] = 0] = "Left";
        HorizontalAnchorSide[HorizontalAnchorSide["Right"] = 1] = "Right";
    })(HorizontalAnchorSide = exports.HorizontalAnchorSide || (exports.HorizontalAnchorSide = {}));
    var VerticalAnchorSide;
    (function (VerticalAnchorSide) {
        VerticalAnchorSide[VerticalAnchorSide["Top"] = 0] = "Top";
        VerticalAnchorSide[VerticalAnchorSide["Bottom"] = 1] = "Bottom";
    })(VerticalAnchorSide = exports.VerticalAnchorSide || (exports.VerticalAnchorSide = {}));
});
//# sourceMappingURL=widgets.js.map