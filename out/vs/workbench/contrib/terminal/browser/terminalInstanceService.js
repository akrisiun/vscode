/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, terminal_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let Terminal;
    let WebLinksAddon;
    let SearchAddon;
    class TerminalInstanceService {
        constructor() {
            this._onRequestDefaultShellAndArgs = new event_1.Emitter();
        }
        get onRequestDefaultShellAndArgs() { return this._onRequestDefaultShellAndArgs.event; }
        async getXtermConstructor() {
            if (!Terminal) {
                Terminal = (await new Promise((resolve_1, reject_1) => { require(['xterm'], resolve_1, reject_1); })).Terminal;
            }
            return Terminal;
        }
        async getXtermWebLinksConstructor() {
            if (!WebLinksAddon) {
                WebLinksAddon = (await new Promise((resolve_2, reject_2) => { require(['xterm-addon-web-links'], resolve_2, reject_2); })).WebLinksAddon;
            }
            return WebLinksAddon;
        }
        async getXtermSearchConstructor() {
            if (!SearchAddon) {
                SearchAddon = (await new Promise((resolve_3, reject_3) => { require(['xterm-addon-search'], resolve_3, reject_3); })).SearchAddon;
            }
            return SearchAddon;
        }
        createWindowsShellHelper() {
            throw new Error('Not implemented');
        }
        createTerminalProcess() {
            throw new Error('Not implemented');
        }
        getDefaultShellAndArgs(useAutomationShell) {
            return new Promise(r => this._onRequestDefaultShellAndArgs.fire({
                useAutomationShell,
                callback: (shell, args) => r({ shell, args })
            }));
        }
        async getMainProcessParentEnv() {
            return {};
        }
    }
    exports.TerminalInstanceService = TerminalInstanceService;
    extensions_1.registerSingleton(terminal_1.ITerminalInstanceService, TerminalInstanceService, true);
});
//# sourceMappingURL=terminalInstanceService.js.map