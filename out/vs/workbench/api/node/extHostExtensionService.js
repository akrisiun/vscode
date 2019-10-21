/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.api.impl", "vs/workbench/api/common/extHostRequireInterceptor", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/node/proxyResolver", "vs/workbench/api/common/extHostExtensionService", "vs/workbench/api/node/extHostDownloadService", "vs/workbench/api/node/extHostCLIServer", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, extHost_api_impl_1, extHostRequireInterceptor_1, extHost_protocol_1, proxyResolver_1, extHostExtensionService_1, extHostDownloadService_1, extHostCLIServer_1, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class NodeModuleRequireInterceptor extends extHostRequireInterceptor_1.RequireInterceptor {
        _installInterceptor() {
            const that = this;
            const node_module = require.__$__nodeRequire('module');
            const original = node_module._load;
            node_module._load = function load(request, parent, isMain) {
                for (let alternativeModuleName of that._alternatives) {
                    let alternative = alternativeModuleName(request);
                    if (alternative) {
                        request = alternative;
                        break;
                    }
                }
                if (!that._factories.has(request)) {
                    return original.apply(this, arguments);
                }
                return that._factories.get(request).load(request, uri_1.URI.file(parent.filename), request => original.apply(this, [request, parent, isMain]));
            };
        }
    }
    class ExtHostExtensionService extends extHostExtensionService_1.AbstractExtHostExtensionService {
        async _beforeAlmostReadyToRunExtensions() {
            // initialize API and register actors
            const extensionApiFactory = this._instaService.invokeFunction(extHost_api_impl_1.createApiFactoryAndRegisterActors);
            // Register Download command
            this._instaService.createInstance(extHostDownloadService_1.ExtHostDownloadService);
            // Register CLI Server for ipc
            if (this._initData.remote.isRemote && this._initData.remote.authority) {
                const cliServer = this._instaService.createInstance(extHostCLIServer_1.CLIServer);
                process.env['VSCODE_IPC_HOOK_CLI'] = cliServer.ipcHandlePath;
            }
            // Module loading tricks
            const interceptor = this._instaService.createInstance(NodeModuleRequireInterceptor, extensionApiFactory, this._registry);
            await interceptor.install();
            // Do this when extension service exists, but extensions are not being activated yet.
            const configProvider = await this._extHostConfiguration.getConfigProvider();
            await proxyResolver_1.connectProxyResolver(this._extHostWorkspace, configProvider, this, this._logService, this._mainThreadTelemetryProxy);
            // Use IPC messages to forward console-calls, note that the console is
            // already patched to use`process.send()`
            const nativeProcessSend = process.send;
            const mainThreadConsole = this._extHostContext.getProxy(extHost_protocol_1.MainContext.MainThreadConsole);
            process.send = (...args) => {
                if (args.length === 0 || !args[0] || args[0].type !== '__$console') {
                    return nativeProcessSend.apply(process, args);
                }
                mainThreadConsole.$logExtensionHostMessage(args[0]);
            };
        }
        _loadCommonJSModule(module, activationTimesBuilder) {
            if (module.scheme !== network_1.Schemas.file) {
                throw new Error(`Cannot load URI: '${module}', must be of file-scheme`);
            }
            let r = null;
            activationTimesBuilder.codeLoadingStart();
            this._logService.info(`ExtensionService#loadCommonJSModule ${module.toString(true)}`);
            this._logService.flush();
            try {
                r = require.__$__nodeRequire(module.fsPath);
            }
            catch (e) {
                return Promise.reject(e);
            }
            finally {
                activationTimesBuilder.codeLoadingStop();
            }
            return Promise.resolve(r);
        }
        async $setRemoteEnvironment(env) {
            if (!this._initData.remote.isRemote) {
                return;
            }
            for (const key in env) {
                const value = env[key];
                if (value === null) {
                    delete process.env[key];
                }
                else {
                    process.env[key] = value;
                }
            }
        }
    }
    exports.ExtHostExtensionService = ExtHostExtensionService;
});
//# sourceMappingURL=extHostExtensionService.js.map