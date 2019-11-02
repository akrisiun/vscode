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
define(["require", "exports", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-browser/windowsShellHelper", "vs/platform/instantiation/common/instantiation", "vs/base/common/platform", "vs/workbench/contrib/terminal/node/terminalProcess", "vs/workbench/contrib/terminal/node/terminal", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/node/terminalEnvironment", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log"], function (require, exports, terminal_1, windowsShellHelper_1, instantiation_1, platform_1, terminalProcess_1, terminal_2, configuration_1, terminalEnvironment_1, storage_1, terminalEnvironment_2, configurationResolver_1, history_1, workspace_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let Terminal;
    let WebLinksAddon;
    let SearchAddon;
    let TerminalInstanceService = class TerminalInstanceService {
        constructor(_instantiationService, _configurationService, _storageService, _configurationResolverService, _workspaceContextService, _historyService, _logService) {
            this._instantiationService = _instantiationService;
            this._configurationService = _configurationService;
            this._storageService = _storageService;
            this._configurationResolverService = _configurationResolverService;
            this._workspaceContextService = _workspaceContextService;
            this._historyService = _historyService;
            this._logService = _logService;
        }
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
        createWindowsShellHelper(shellProcessId, instance, xterm) {
            return new windowsShellHelper_1.WindowsShellHelper(shellProcessId, instance, xterm);
        }
        createTerminalProcess(shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty) {
            return this._instantiationService.createInstance(terminalProcess_1.TerminalProcess, shellLaunchConfig, cwd, cols, rows, env, windowsEnableConpty);
        }
        _isWorkspaceShellAllowed() {
            return this._storageService.getBoolean(terminal_1.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY, 1 /* WORKSPACE */, false);
        }
        getDefaultShellAndArgs(useAutomationShell, platformOverride = platform_1.platform) {
            const isWorkspaceShellAllowed = this._isWorkspaceShellAllowed();
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot();
            let lastActiveWorkspace = activeWorkspaceRootUri ? this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri) : undefined;
            lastActiveWorkspace = lastActiveWorkspace === null ? undefined : lastActiveWorkspace;
            const shell = terminalEnvironment_1.getDefaultShell((key) => this._configurationService.inspect(key), isWorkspaceShellAllowed, terminal_2.getSystemShell(platformOverride), process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'), process.env.windir, lastActiveWorkspace, this._configurationResolverService, this._logService, useAutomationShell, platformOverride);
            const args = terminalEnvironment_1.getDefaultShellArgs((key) => this._configurationService.inspect(key), isWorkspaceShellAllowed, useAutomationShell, lastActiveWorkspace, this._configurationResolverService, this._logService, platformOverride);
            return Promise.resolve({ shell, args });
        }
        getMainProcessParentEnv() {
            return terminalEnvironment_2.getMainProcessParentEnv();
        }
    };
    TerminalInstanceService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService),
        __param(3, configurationResolver_1.IConfigurationResolverService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, history_1.IHistoryService),
        __param(6, log_1.ILogService)
    ], TerminalInstanceService);
    exports.TerminalInstanceService = TerminalInstanceService;
});
//# sourceMappingURL=terminalInstanceService.js.map