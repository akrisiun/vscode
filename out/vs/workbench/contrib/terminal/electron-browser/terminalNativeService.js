/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "electron", "vs/platform/files/common/files", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/terminal/common/terminalEnvironment", "child_process", "vs/base/common/event", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/electron-browser/terminalRemote", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, electron_1, files_1, terminal_1, terminalEnvironment_1, child_process_1, event_1, instantiation_1, terminalRemote_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TerminalNativeService = class TerminalNativeService {
        constructor(_fileService, instantiationService, remoteAgentService) {
            this._fileService = _fileService;
            this.instantiationService = instantiationService;
            this._onOpenFileRequest = new event_1.Emitter();
            this._onOsResume = new event_1.Emitter();
            electron_1.ipcRenderer.on('vscode:openFiles', (_event, request) => this._onOpenFileRequest.fire(request));
            electron_1.ipcRenderer.on('vscode:osResume', () => this._onOsResume.fire());
            const connection = remoteAgentService.getConnection();
            if (connection && connection.remoteAuthority) {
                terminalRemote_1.registerRemoteContributions();
            }
        }
        get linuxDistro() { return terminal_1.linuxDistro; }
        get onOpenFileRequest() { return this._onOpenFileRequest.event; }
        get onOsResume() { return this._onOsResume.event; }
        whenFileDeleted(path) {
            // Complete when wait marker file is deleted
            return new Promise(resolve => {
                let running = false;
                const interval = setInterval(() => {
                    if (!running) {
                        running = true;
                        this._fileService.exists(path).then(exists => {
                            running = false;
                            if (!exists) {
                                clearInterval(interval);
                                resolve(undefined);
                            }
                        });
                    }
                }, 1000);
            });
        }
        /**
         * Converts a path to a path on WSL using the wslpath utility.
         * @param path The original path.
         */
        getWslPath(path) {
            if (terminal_1.getWindowsBuildNumber() < 17063) {
                throw new Error('wslpath does not exist on Windows build < 17063');
            }
            return new Promise(c => {
                const proc = child_process_1.execFile('bash.exe', ['-c', `wslpath ${terminalEnvironment_1.escapeNonWindowsPath(path)}`], {}, (error, stdout, stderr) => {
                    c(terminalEnvironment_1.escapeNonWindowsPath(stdout.trim()));
                });
                proc.stdin.end();
            });
        }
        getWindowsBuildNumber() {
            return terminal_1.getWindowsBuildNumber();
        }
    };
    TerminalNativeService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, remoteAgentService_1.IRemoteAgentService)
    ], TerminalNativeService);
    exports.TerminalNativeService = TerminalNativeService;
});
//# sourceMappingURL=terminalNativeService.js.map