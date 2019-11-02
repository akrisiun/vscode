/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkbenchLayoutService = instantiation_1.createDecorator('layoutService');
    var Parts;
    (function (Parts) {
        Parts["TITLEBAR_PART"] = "workbench.parts.titlebar";
        Parts["ACTIVITYBAR_PART"] = "workbench.parts.activitybar";
        Parts["SIDEBAR_PART"] = "workbench.parts.sidebar";
        Parts["PANEL_PART"] = "workbench.parts.panel";
        Parts["EDITOR_PART"] = "workbench.parts.editor";
        Parts["STATUSBAR_PART"] = "workbench.parts.statusbar";
    })(Parts = exports.Parts || (exports.Parts = {}));
    var Position;
    (function (Position) {
        Position[Position["LEFT"] = 0] = "LEFT";
        Position[Position["RIGHT"] = 1] = "RIGHT";
        Position[Position["BOTTOM"] = 2] = "BOTTOM";
    })(Position = exports.Position || (exports.Position = {}));
});
//# sourceMappingURL=layoutService.js.map