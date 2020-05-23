/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/electron-browser/terminalInstanceService", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/terminal/electron-browser/terminalNativeService", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/terminal/common/terminalConfiguration"], function (require, exports, extensions_1, terminal_1, terminalInstanceService_1, terminal_2, terminalNativeService_1, terminal_3, platform_1, configurationRegistry_1, terminalConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // This file contains additional desktop-only contributions on top of those in browser/
    // Register services
    extensions_1.registerSingleton(terminal_3.ITerminalNativeService, terminalNativeService_1.TerminalNativeService, true);
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, terminalInstanceService_1.TerminalInstanceService, true);
    // Register configurations
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration(terminalConfiguration_1.getTerminalShellConfiguration(terminal_2.getSystemShell));
});
//# sourceMappingURL=terminal.contribution.js.map