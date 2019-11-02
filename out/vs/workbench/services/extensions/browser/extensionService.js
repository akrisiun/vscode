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
define(["require", "exports", "vs/nls", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/workbench/services/extensions/common/extensionHostProcessManager", "vs/workbench/services/extensions/common/remoteExtensionHostClient", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/browser/webWorkerExtensionHostStarter", "vs/base/common/uri", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/configuration/common/configuration", "vs/platform/extensions/common/extensions", "vs/workbench/services/extensions/browser/webWorkerFileSystemProvider", "vs/base/common/network", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/staticExtensions"], function (require, exports, nls, environmentService_1, extensionManagement_1, remoteAgentService_1, instantiation_1, telemetry_1, extensions_1, extensions_2, files_1, productService_1, abstractExtensionService_1, extensionHostProcessManager_1, remoteExtensionHostClient_1, notification_1, webWorkerExtensionHostStarter_1, uri_1, extensionsUtil_1, configuration_1, extensions_3, webWorkerFileSystemProvider_1, network_1, lifecycle_1, staticExtensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, _remoteAgentService, _configService, _staticExtensions) {
            super(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService);
            this._remoteAgentService = _remoteAgentService;
            this._configService = _configService;
            this._staticExtensions = _staticExtensions;
            this._disposables = new lifecycle_1.DisposableStore();
            this._remoteExtensionsEnvironmentData = null;
            this._initialize();
            this._initFetchFileSystem();
        }
        dispose() {
            this._disposables.dispose();
            super.dispose();
        }
        _initFetchFileSystem() {
            const provider = new webWorkerFileSystemProvider_1.FetchFileSystemProvider();
            this._disposables.add(this._fileService.registerProvider(network_1.Schemas.http, provider));
            this._disposables.add(this._fileService.registerProvider(network_1.Schemas.https, provider));
        }
        _createProvider(remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: () => {
                    return this.whenInstalledExtensionsRegistered().then(() => {
                        return this._remoteExtensionsEnvironmentData;
                    });
                }
            };
        }
        _createExtensionHosts(_isInitialStart, initialActivationEvents) {
            const result = [];
            const webExtensions = this.getExtensions().then(extensions => extensions.filter(ext => extensionsUtil_1.canExecuteOnWeb(ext, this._productService, this._configService)));
            const webHostProcessWorker = this._instantiationService.createInstance(webWorkerExtensionHostStarter_1.WebWorkerExtensionHostStarter, true, webExtensions, uri_1.URI.file(this._environmentService.logsPath).with({ scheme: this._environmentService.logFile.scheme }));
            const webHostProcessManager = this._instantiationService.createInstance(extensionHostProcessManager_1.ExtensionHostProcessManager, false, webHostProcessWorker, null, initialActivationEvents);
            result.push(webHostProcessManager);
            const remoteAgentConnection = this._remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const remoteExtensions = this.getExtensions().then(extensions => extensions.filter(ext => !extensionsUtil_1.canExecuteOnWeb(ext, this._productService, this._configService)));
                const remoteExtHostProcessWorker = this._instantiationService.createInstance(remoteExtensionHostClient_1.RemoteExtensionHostClient, remoteExtensions, this._createProvider(remoteAgentConnection.remoteAuthority), this._remoteAgentService.socketFactory);
                const remoteExtHostProcessManager = this._instantiationService.createInstance(extensionHostProcessManager_1.ExtensionHostProcessManager, false, remoteExtHostProcessWorker, remoteAgentConnection.remoteAuthority, initialActivationEvents);
                result.push(remoteExtHostProcessManager);
            }
            return result;
        }
        async _scanAndHandleExtensions() {
            // fetch the remote environment
            let [remoteEnv, localExtensions] = await Promise.all([
                this._remoteAgentService.getEnvironment(),
                this._staticExtensions.getExtensions()
            ]);
            let result;
            // local: only enabled and web'ish extension
            localExtensions = localExtensions.filter(ext => this._isEnabled(ext) && extensionsUtil_1.canExecuteOnWeb(ext, this._productService, this._configService));
            this._checkEnableProposedApi(localExtensions);
            if (!remoteEnv) {
                result = this._registry.deltaExtensions(localExtensions, []);
            }
            else {
                // remote: only enabled and none-web'ish extension
                remoteEnv.extensions = remoteEnv.extensions.filter(extension => this._isEnabled(extension) && !extensionsUtil_1.canExecuteOnWeb(extension, this._productService, this._configService));
                this._checkEnableProposedApi(remoteEnv.extensions);
                // in case of overlap, the remote wins
                const isRemoteExtension = new Set();
                remoteEnv.extensions.forEach(extension => isRemoteExtension.add(extensions_3.ExtensionIdentifier.toKey(extension.identifier)));
                localExtensions = localExtensions.filter(extension => !isRemoteExtension.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier)));
                // save for remote extension's init data
                this._remoteExtensionsEnvironmentData = remoteEnv;
                result = this._registry.deltaExtensions(remoteEnv.extensions.concat(localExtensions), []);
            }
            if (result.removedDueToLooping.length > 0) {
                this._logOrShowMessage(notification_1.Severity.Error, nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', ')));
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
        }
        _onExtensionHostExit(code) {
            console.log(`vscode:exit`, code);
            // ipc.send('vscode:exit', code);
        }
    };
    ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_1.IExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, remoteAgentService_1.IRemoteAgentService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, staticExtensions_1.IStaticExtensionsService)
    ], ExtensionService);
    exports.ExtensionService = ExtensionService;
    extensions_2.registerSingleton(extensions_1.IExtensionService, ExtensionService);
});
//# sourceMappingURL=extensionService.js.map