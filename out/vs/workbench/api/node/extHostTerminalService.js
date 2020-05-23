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
define(["require", "exports", "vs/platform/product/common/product", "os", "vs/base/common/uri", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminalEnvironment", "vs/workbench/api/common/extHostConfiguration", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/node/terminalProcess", "vs/workbench/api/common/extHostWorkspace", "vs/workbench/api/common/extHostDebugService", "vs/workbench/api/common/extHostDocumentsAndEditors", "vs/workbench/contrib/terminal/node/terminal", "vs/workbench/contrib/terminal/node/terminalEnvironment", "vs/workbench/api/common/extHostTerminalService", "vs/workbench/api/common/extHostRpcService", "vs/workbench/contrib/terminal/common/environmentVariableShared", "vs/workbench/contrib/terminal/common/environmentVariableCollection"], function (require, exports, product_1, os, uri_1, platform, terminalEnvironment, extHostConfiguration_1, log_1, terminalProcess_1, extHostWorkspace_1, extHostDebugService_1, extHostDocumentsAndEditors_1, terminal_1, terminalEnvironment_1, extHostTerminalService_1, extHostRpcService_1, environmentVariableShared_1, environmentVariableCollection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostTerminalService = void 0;
    let ExtHostTerminalService = /** @class */ (() => {
        let ExtHostTerminalService = class ExtHostTerminalService extends extHostTerminalService_1.BaseExtHostTerminalService {
            constructor(extHostRpc, _extHostConfiguration, _extHostWorkspace, _extHostDocumentsAndEditors, _logService) {
                super(extHostRpc);
                this._extHostConfiguration = _extHostConfiguration;
                this._extHostWorkspace = _extHostWorkspace;
                this._extHostDocumentsAndEditors = _extHostDocumentsAndEditors;
                this._logService = _logService;
                this._environmentVariableCollections = new Map();
                // TODO: Pull this from main side
                this._isWorkspaceShellAllowed = false;
                this._updateLastActiveWorkspace();
                this._updateVariableResolver();
                this._registerListeners();
            }
            createTerminal(name, shellPath, shellArgs) {
                const terminal = new extHostTerminalService_1.ExtHostTerminal(this._proxy, { name, shellPath, shellArgs }, name);
                this._terminals.push(terminal);
                terminal.create(shellPath, shellArgs);
                return terminal;
            }
            createTerminalFromOptions(options) {
                const terminal = new extHostTerminalService_1.ExtHostTerminal(this._proxy, options, options.name);
                this._terminals.push(terminal);
                terminal.create(options.shellPath, options.shellArgs, options.cwd, options.env, /*options.waitOnExit*/ undefined, options.strictEnv, options.hideFromUser);
                return terminal;
            }
            getDefaultShell(useAutomationShell, configProvider) {
                const fetchSetting = (key) => {
                    const setting = configProvider
                        .getConfiguration(key.substr(0, key.lastIndexOf('.')))
                        .inspect(key.substr(key.lastIndexOf('.') + 1));
                    return this._apiInspectConfigToPlain(setting);
                };
                return terminalEnvironment.getDefaultShell(fetchSetting, this._isWorkspaceShellAllowed, terminal_1.getSystemShell(platform.platform), process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'), process.env.windir, this._lastActiveWorkspace, this._variableResolver, this._logService, useAutomationShell);
            }
            getDefaultShellArgs(useAutomationShell, configProvider) {
                const fetchSetting = (key) => {
                    const setting = configProvider
                        .getConfiguration(key.substr(0, key.lastIndexOf('.')))
                        .inspect(key.substr(key.lastIndexOf('.') + 1));
                    return this._apiInspectConfigToPlain(setting);
                };
                return terminalEnvironment.getDefaultShellArgs(fetchSetting, this._isWorkspaceShellAllowed, useAutomationShell, this._lastActiveWorkspace, this._variableResolver, this._logService);
            }
            _apiInspectConfigToPlain(config) {
                return {
                    userValue: config ? config.globalValue : undefined,
                    value: config ? config.workspaceValue : undefined,
                    defaultValue: config ? config.defaultValue : undefined,
                };
            }
            async _getNonInheritedEnv() {
                const env = await terminalEnvironment_1.getMainProcessParentEnv();
                env.VSCODE_IPC_HOOK_CLI = process.env['VSCODE_IPC_HOOK_CLI'];
                return env;
            }
            _registerListeners() {
                this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(() => this._updateLastActiveWorkspace());
                this._extHostWorkspace.onDidChangeWorkspace(() => this._updateVariableResolver());
            }
            _updateLastActiveWorkspace() {
                const activeEditor = this._extHostDocumentsAndEditors.activeEditor();
                if (activeEditor) {
                    this._lastActiveWorkspace = this._extHostWorkspace.getWorkspaceFolder(activeEditor.document.uri);
                }
            }
            async _updateVariableResolver() {
                const configProvider = await this._extHostConfiguration.getConfigProvider();
                const workspaceFolders = await this._extHostWorkspace.getWorkspaceFolders2();
                this._variableResolver = new extHostDebugService_1.ExtHostVariableResolverService(workspaceFolders || [], this._extHostDocumentsAndEditors, configProvider, process.env);
            }
            async $spawnExtHostProcess(id, shellLaunchConfigDto, activeWorkspaceRootUriComponents, cols, rows, isWorkspaceShellAllowed) {
                const shellLaunchConfig = {
                    name: shellLaunchConfigDto.name,
                    executable: shellLaunchConfigDto.executable,
                    args: shellLaunchConfigDto.args,
                    cwd: typeof shellLaunchConfigDto.cwd === 'string' ? shellLaunchConfigDto.cwd : uri_1.URI.revive(shellLaunchConfigDto.cwd),
                    env: shellLaunchConfigDto.env
                };
                // Merge in shell and args from settings
                const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
                const configProvider = await this._extHostConfiguration.getConfigProvider();
                if (!shellLaunchConfig.executable) {
                    shellLaunchConfig.executable = this.getDefaultShell(false, configProvider);
                    shellLaunchConfig.args = this.getDefaultShellArgs(false, configProvider);
                }
                else {
                    if (this._variableResolver) {
                        shellLaunchConfig.executable = this._variableResolver.resolve(this._lastActiveWorkspace, shellLaunchConfig.executable);
                        if (shellLaunchConfig.args) {
                            if (Array.isArray(shellLaunchConfig.args)) {
                                const resolvedArgs = [];
                                for (const arg of shellLaunchConfig.args) {
                                    resolvedArgs.push(this._variableResolver.resolve(this._lastActiveWorkspace, arg));
                                }
                                shellLaunchConfig.args = resolvedArgs;
                            }
                            else {
                                shellLaunchConfig.args = this._variableResolver.resolve(this._lastActiveWorkspace, shellLaunchConfig.args);
                            }
                        }
                    }
                }
                const activeWorkspaceRootUri = uri_1.URI.revive(activeWorkspaceRootUriComponents);
                let lastActiveWorkspace;
                if (activeWorkspaceRootUriComponents && activeWorkspaceRootUri) {
                    // Get the environment
                    const apiLastActiveWorkspace = await this._extHostWorkspace.getWorkspaceFolder(activeWorkspaceRootUri);
                    if (apiLastActiveWorkspace) {
                        lastActiveWorkspace = {
                            uri: apiLastActiveWorkspace.uri,
                            name: apiLastActiveWorkspace.name,
                            index: apiLastActiveWorkspace.index,
                            toResource: () => {
                                throw new Error('Not implemented');
                            }
                        };
                    }
                }
                // Get the initial cwd
                const terminalConfig = configProvider.getConfiguration('terminal.integrated');
                const initialCwd = terminalEnvironment.getCwd(shellLaunchConfig, os.homedir(), lastActiveWorkspace, this._variableResolver, activeWorkspaceRootUri, terminalConfig.cwd, this._logService);
                shellLaunchConfig.cwd = initialCwd;
                const envFromConfig = this._apiInspectConfigToPlain(configProvider.getConfiguration('terminal.integrated').inspect(`env.${platformKey}`));
                const baseEnv = terminalConfig.get('inheritEnv', true) ? process.env : await this._getNonInheritedEnv();
                const env = terminalEnvironment.createTerminalEnvironment(shellLaunchConfig, lastActiveWorkspace, envFromConfig, this._variableResolver, isWorkspaceShellAllowed, product_1.default.version, terminalConfig.get('detectLocale', 'auto'), baseEnv);
                // Apply extension environment variable collections to the environment
                if (!shellLaunchConfig.strictEnv) {
                    const mergedCollection = new environmentVariableCollection_1.MergedEnvironmentVariableCollection(this._environmentVariableCollections);
                    mergedCollection.applyToProcessEnvironment(env);
                }
                this._proxy.$sendResolvedLaunchConfig(id, shellLaunchConfig);
                // Fork the process and listen for messages
                this._logService.debug(`Terminal process launching on ext host`, shellLaunchConfig, initialCwd, cols, rows, env);
                // TODO: Support conpty on remote, it doesn't seem to work for some reason?
                // TODO: When conpty is enabled, only enable it when accessibilityMode is off
                const enableConpty = false; //terminalConfig.get('windowsEnableConpty') as boolean;
                this._setupExtHostProcessListeners(id, new terminalProcess_1.TerminalProcess(shellLaunchConfig, initialCwd, cols, rows, env, enableConpty, this._logService));
            }
            $getAvailableShells() {
                return terminal_1.detectAvailableShells();
            }
            async $getDefaultShellAndArgs(useAutomationShell) {
                const configProvider = await this._extHostConfiguration.getConfigProvider();
                return {
                    shell: this.getDefaultShell(useAutomationShell, configProvider),
                    args: this.getDefaultShellArgs(useAutomationShell, configProvider)
                };
            }
            $acceptWorkspacePermissionsChanged(isAllowed) {
                this._isWorkspaceShellAllowed = isAllowed;
            }
            getEnvironmentVariableCollection(extension) {
                let collection = this._environmentVariableCollections.get(extension.identifier.value);
                if (!collection) {
                    // TODO: Disable dispose
                    collection = new extHostTerminalService_1.EnvironmentVariableCollection();
                    this._setEnvironmentVariableCollection(extension.identifier.value, collection);
                }
                return collection;
            }
            _syncEnvironmentVariableCollection(extensionIdentifier, collection) {
                const serialized = environmentVariableShared_1.serializeEnvironmentVariableCollection(collection.map);
                this._proxy.$setEnvironmentVariableCollection(extensionIdentifier, collection.persistent, serialized.length === 0 ? undefined : serialized);
            }
            $initEnvironmentVariableCollections(collections) {
                collections.forEach(entry => {
                    const extensionIdentifier = entry[0];
                    const collection = new extHostTerminalService_1.EnvironmentVariableCollection(entry[1]);
                    this._setEnvironmentVariableCollection(extensionIdentifier, collection);
                });
            }
            _setEnvironmentVariableCollection(extensionIdentifier, collection) {
                this._environmentVariableCollections.set(extensionIdentifier, collection);
                collection.onDidChangeCollection(() => {
                    // When any collection value changes send this immediately, this is done to ensure
                    // following calls to createTerminal will be created with the new environment. It will
                    // result in more noise by sending multiple updates when called but collections are
                    // expected to be small.
                    this._syncEnvironmentVariableCollection(extensionIdentifier, collection);
                });
            }
        };
        ExtHostTerminalService = __decorate([
            __param(0, extHostRpcService_1.IExtHostRpcService),
            __param(1, extHostConfiguration_1.IExtHostConfiguration),
            __param(2, extHostWorkspace_1.IExtHostWorkspace),
            __param(3, extHostDocumentsAndEditors_1.IExtHostDocumentsAndEditors),
            __param(4, log_1.ILogService)
        ], ExtHostTerminalService);
        return ExtHostTerminalService;
    })();
    exports.ExtHostTerminalService = ExtHostTerminalService;
});
//# sourceMappingURL=extHostTerminalService.js.map