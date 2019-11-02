/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, terminal_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TerminalNativeService {
        constructor() {
            this._onOpenFileRequest = new event_1.Emitter();
            this._onOsResume = new event_1.Emitter();
        }
        get linuxDistro() { return terminal_1.LinuxDistro.Unknown; }
        get onOpenFileRequest() { return this._onOpenFileRequest.event; }
        get onOsResume() { return this._onOsResume.event; }
        whenFileDeleted() {
            throw new Error('Not implemented');
        }
        getWslPath() {
            throw new Error('Not implemented');
        }
        getWindowsBuildNumber() {
            throw new Error('Not implemented');
        }
    }
    exports.TerminalNativeService = TerminalNativeService;
    extensions_1.registerSingleton(terminal_1.ITerminalNativeService, TerminalNativeService, true);
});
//# sourceMappingURL=terminalNativeService.js.map