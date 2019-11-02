/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITerminalService = instantiation_1.createDecorator('terminalService');
    exports.ITerminalInstanceService = instantiation_1.createDecorator('terminalInstanceService');
    var Direction;
    (function (Direction) {
        Direction[Direction["Left"] = 0] = "Left";
        Direction[Direction["Right"] = 1] = "Right";
        Direction[Direction["Up"] = 2] = "Up";
        Direction[Direction["Down"] = 3] = "Down";
    })(Direction = exports.Direction || (exports.Direction = {}));
    var WindowsShellType;
    (function (WindowsShellType) {
        WindowsShellType[WindowsShellType["CommandPrompt"] = 0] = "CommandPrompt";
        WindowsShellType[WindowsShellType["PowerShell"] = 1] = "PowerShell";
        WindowsShellType[WindowsShellType["Wsl"] = 2] = "Wsl";
        WindowsShellType[WindowsShellType["GitBash"] = 3] = "GitBash";
    })(WindowsShellType = exports.WindowsShellType || (exports.WindowsShellType = {}));
});
//# sourceMappingURL=terminal.js.map