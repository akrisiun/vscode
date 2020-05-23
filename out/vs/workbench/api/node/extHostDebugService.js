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
define(["require", "exports", "vs/nls", "vs/workbench/api/common/extHostTypes", "vs/workbench/contrib/debug/node/debugAdapter", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/common/extHostDocumentsAndEditors", "../common/extHostConfiguration", "vs/workbench/api/common/extHostCommands", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostDebugService", "vs/platform/sign/node/signService", "vs/workbench/contrib/debug/node/terminals"], function (require, exports, nls, extHostTypes_1, debugAdapter_1, extHostWorkspace_1, extHostExtensionService_1, extHostDocumentsAndEditors_1, extHostConfiguration_1, extHostCommands_1, extHostTerminalService_1, extHostRpcService_1, extHostDebugService_1, signService_1, terminals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDebugService = void 0;
    let ExtHostDebugService = /** @class */ (() => {
        let ExtHostDebugService = class ExtHostDebugService extends extHostDebugService_1.ExtHostDebugServiceBase {
            constructor(extHostRpcService, workspaceService, extensionService, editorsService, configurationService, _terminalService, commandService) {
                super(extHostRpcService, workspaceService, extensionService, editorsService, configurationService, commandService);
                this._terminalService = _terminalService;
            }
            createDebugAdapter(adapter, session) {
                switch (adapter.type) {
                    case 'server':
                        return new debugAdapter_1.SocketDebugAdapter(adapter);
                    case 'executable':
                        return new debugAdapter_1.ExecutableDebugAdapter(adapter, session.type);
                }
                return super.createDebugAdapter(adapter, session);
            }
            daExecutableFromPackage(session, extensionRegistry) {
                const dae = debugAdapter_1.ExecutableDebugAdapter.platformAdapterExecutable(extensionRegistry.getAllExtensionDescriptions(), session.type);
                if (dae) {
                    return new extHostTypes_1.DebugAdapterExecutable(dae.command, dae.args, dae.options);
                }
                return undefined;
            }
            createSignService() {
                return new signService_1.SignService();
            }
            async $runInTerminal(args) {
                if (args.kind === 'integrated') {
                    if (!this._terminalDisposedListener) {
                        // React on terminal disposed and check if that is the debug terminal #12956
                        this._terminalDisposedListener = this._terminalService.onDidCloseTerminal(terminal => {
                            if (this._integratedTerminalInstance && this._integratedTerminalInstance === terminal) {
                                this._integratedTerminalInstance = undefined;
                            }
                        });
                    }
                    let needNewTerminal = true; // be pessimistic
                    if (this._integratedTerminalInstance) {
                        const pid = await this._integratedTerminalInstance.processId;
                        needNewTerminal = await terminals_1.hasChildProcesses(pid); // if no processes running in terminal reuse terminal
                    }
                    const configProvider = await this._configurationService.getConfigProvider();
                    const shell = this._terminalService.getDefaultShell(true, configProvider);
                    if (needNewTerminal || !this._integratedTerminalInstance) {
                        const options = {
                            shellPath: shell,
                            // shellArgs: this._terminalService._getDefaultShellArgs(configProvider),
                            cwd: args.cwd,
                            name: args.title || nls.localize('debug.terminal.title', "debuggee"),
                        };
                        // @ts-ignore
                        delete args.cwd;
                        this._integratedTerminalInstance = this._terminalService.createTerminalFromOptions(options);
                    }
                    const terminal = this._integratedTerminalInstance;
                    terminal.show();
                    const shellProcessId = await this._integratedTerminalInstance.processId;
                    const command = terminals_1.prepareCommand(args, shell);
                    terminal.sendText(command, true);
                    return shellProcessId;
                }
                else if (args.kind === 'external') {
                    return terminals_1.runInExternalTerminal(args, await this._configurationService.getConfigProvider());
                }
                return super.$runInTerminal(args);
            }
            createVariableResolver(folders, editorService, configurationService) {
                return new extHostDebugService_1.ExtHostVariableResolverService(folders, editorService, configurationService, process.env);
            }
        };
        ExtHostDebugService = __decorate([
            __param(0, extHostRpcService_1.IExtHostRpcService),
            __param(1, extHostWorkspace_1.IExtHostWorkspace),
            __param(2, extHostExtensionService_1.IExtHostExtensionService),
            __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
            __param(4, extHostConfiguration_1.IExtHostConfiguration),
            __param(5, extHostTerminalService_1.IExtHostTerminalService),
            __param(6, extHostCommands_1.IExtHostCommands)
        ], ExtHostDebugService);
        return ExtHostDebugService;
    })();
    exports.ExtHostDebugService = ExtHostDebugService;
});
//# sourceMappingURL=extHostDebugService.js.map