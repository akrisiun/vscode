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
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net", "http", "fs", "vs/workbench/api/common/extHostCommands", "vs/base/common/uri", "vs/platform/workspaces/common/workspaces"], function (require, exports, ipc_net_1, http, fs, extHostCommands_1, uri_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CLIServer = class CLIServer {
        constructor(_commands) {
            this._commands = _commands;
            this._server = http.createServer((req, res) => this.onRequest(req, res));
            this.setup().catch(err => {
                console.error(err);
                return '';
            });
        }
        get ipcHandlePath() {
            return this._ipcHandlePath;
        }
        async setup() {
            this._ipcHandlePath = ipc_net_1.generateRandomPipeName();
            try {
                this._server.listen(this.ipcHandlePath);
                this._server.on('error', err => console.error(err));
            }
            catch (err) {
                console.error('Could not start open from terminal server.');
            }
            return this._ipcHandlePath;
        }
        onRequest(req, res) {
            const chunks = [];
            req.setEncoding('utf8');
            req.on('data', (d) => chunks.push(d));
            req.on('end', () => {
                const data = JSON.parse(chunks.join(''));
                switch (data.type) {
                    case 'open':
                        this.open(data, res);
                        break;
                    case 'status':
                        this.getStatus(data, res);
                        break;
                    case 'command':
                        this.runCommand(data, res)
                            .catch(console.error);
                        break;
                    default:
                        res.writeHead(404);
                        res.write(`Unknown message type: ${data.type}`, err => {
                            if (err) {
                                console.error(err);
                            }
                        });
                        res.end();
                        break;
                }
            });
        }
        open(data, res) {
            let { fileURIs, folderURIs, forceNewWindow, diffMode, addMode, forceReuseWindow, gotoLineMode, waitMarkerFilePath } = data;
            const urisToOpen = [];
            if (Array.isArray(folderURIs)) {
                for (const s of folderURIs) {
                    try {
                        urisToOpen.push({ folderUri: uri_1.URI.parse(s) });
                        if (!addMode && !forceReuseWindow) {
                            forceNewWindow = true;
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            if (Array.isArray(fileURIs)) {
                for (const s of fileURIs) {
                    try {
                        if (workspaces_1.hasWorkspaceFileExtension(s)) {
                            urisToOpen.push({ workspaceUri: uri_1.URI.parse(s) });
                            if (!forceReuseWindow) {
                                forceNewWindow = true;
                            }
                        }
                        else {
                            urisToOpen.push({ fileUri: uri_1.URI.parse(s) });
                        }
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
            if (urisToOpen.length) {
                const waitMarkerFileURI = waitMarkerFilePath ? uri_1.URI.file(waitMarkerFilePath) : undefined;
                const windowOpenArgs = { forceNewWindow, diffMode, addMode, gotoLineMode, forceReuseWindow, waitMarkerFileURI };
                this._commands.executeCommand('_files.windowOpen', urisToOpen, windowOpenArgs);
            }
            res.writeHead(200);
            res.end();
        }
        async getStatus(data, res) {
            try {
                const status = await this._commands.executeCommand('_issues.getSystemStatus');
                res.writeHead(200);
                res.write(status);
                res.end();
            }
            catch (err) {
                res.writeHead(500);
                res.write(String(err), err => {
                    if (err) {
                        console.error(err);
                    }
                });
                res.end();
            }
        }
        async runCommand(data, res) {
            try {
                const { command, args } = data;
                const result = await this._commands.executeCommand(command, ...args);
                res.writeHead(200);
                res.write(JSON.stringify(result), err => {
                    if (err) {
                        console.error(err);
                    }
                });
                res.end();
            }
            catch (err) {
                res.writeHead(500);
                res.write(String(err), err => {
                    if (err) {
                        console.error(err);
                    }
                });
                res.end();
            }
        }
        dispose() {
            this._server.close();
            if (this._ipcHandlePath && process.platform !== 'win32' && fs.existsSync(this._ipcHandlePath)) {
                fs.unlinkSync(this._ipcHandlePath);
            }
        }
    };
    CLIServer = __decorate([
        __param(0, extHostCommands_1.IExtHostCommands)
    ], CLIServer);
    exports.CLIServer = CLIServer;
});
//# sourceMappingURL=extHostCLIServer.js.map