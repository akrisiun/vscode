/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/electron-browser/terminalInstanceService", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/terminal/common/terminalShellConfig", "vs/workbench/contrib/terminal/electron-browser/terminalNativeService", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, extensions_1, terminal_1, terminalInstanceService_1, terminal_2, terminalShellConfig_1, terminalNativeService_1, terminal_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    terminalShellConfig_1.registerShellConfiguration(terminal_2.getSystemShell);
    extensions_1.registerSingleton(terminal_3.ITerminalNativeService, terminalNativeService_1.TerminalNativeService, true);
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, terminalInstanceService_1.TerminalInstanceService, true);
});
//# sourceMappingURL=terminal.contribution.js.map