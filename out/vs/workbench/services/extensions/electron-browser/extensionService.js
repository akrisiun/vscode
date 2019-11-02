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
define(["require", "exports", "electron", "vs/workbench/services/extensions/electron-browser/extensionHost", "vs/workbench/services/extensions/electron-browser/cachedExtensionScanner", "vs/platform/instantiation/common/extensions", "vs/workbench/services/extensions/common/abstractExtensionService", "vs/nls", "vs/base/common/path", "vs/base/common/async", "vs/base/common/uri", "vs/workbench/services/environment/common/environmentService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/configuration/common/configuration", "vs/workbench/services/extensions/common/remoteExtensionHostClient", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/extensions/common/extensionsUtil", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensions/common/extensionHostProcessManager", "vs/platform/extensions/common/extensions", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/workbench/services/extensions/common/extensionPoints", "vs/base/common/arrays", "vs/workbench/services/extensions/common/staticExtensions", "vs/platform/electron/node/electron", "vs/workbench/services/electron/electron-browser/electronEnvironmentService"], function (require, exports, electron_1, extensionHost_1, cachedExtensionScanner_1, extensions_1, abstractExtensionService_1, nls, path, async_1, uri_1, environmentService_1, extensionManagement_1, extensionManagement_2, configuration_1, remoteExtensionHostClient_1, remoteAgentService_1, remoteAuthorityResolver_1, extensionsUtil_1, instantiation_1, lifecycle_1, notification_1, telemetry_1, host_1, extensions_2, extensionHostProcessManager_1, extensions_3, network_1, files_1, productService_1, extensionPoints_1, arrays_1, staticExtensions_1, electron_2, electronEnvironmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DeltaExtensionsQueueItem {
        constructor(toAdd, toRemove) {
            this.toAdd = toAdd;
            this.toRemove = toRemove;
        }
    }
    let ExtensionService = class ExtensionService extends abstractExtensionService_1.AbstractExtensionService {
        constructor(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService, _extensionManagementService, _remoteAgentService, _remoteAuthorityResolverService, _configurationService, _lifecycleService, _staticExtensions, _electronService, _hostService, _electronEnvironmentService) {
            super(instantiationService, notificationService, environmentService, telemetryService, extensionEnablementService, fileService, productService);
            this._extensionManagementService = _extensionManagementService;
            this._remoteAgentService = _remoteAgentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._configurationService = _configurationService;
            this._lifecycleService = _lifecycleService;
            this._staticExtensions = _staticExtensions;
            this._electronService = _electronService;
            this._hostService = _hostService;
            this._electronEnvironmentService = _electronEnvironmentService;
            //#region deltaExtensions
            this._inHandleDeltaExtensions = false;
            if (this._extensionEnablementService.allUserExtensionsDisabled) {
                this._notificationService.prompt(notification_1.Severity.Info, nls.localize('extensionsDisabled', "All installed extensions are temporarily disabled. Reload the window to return to the previous state."), [{
                        label: nls.localize('Reload', "Reload"),
                        run: () => {
                            this._hostService.reload();
                        }
                    }]);
            }
            this._remoteExtensionsEnvironmentData = new Map();
            this._extensionHostLogsLocation = uri_1.URI.file(path.join(this._environmentService.logsPath, `exthost${this._electronEnvironmentService.windowId}`));
            this._extensionScanner = instantiationService.createInstance(cachedExtensionScanner_1.CachedExtensionScanner);
            this._deltaExtensionsQueue = [];
            this._register(this._extensionEnablementService.onEnablementChanged((extensions) => {
                let toAdd = [];
                let toRemove = [];
                for (const extension of extensions) {
                    if (this._extensionEnablementService.isEnabled(extension)) {
                        // an extension has been enabled
                        toAdd.push(extension);
                    }
                    else {
                        // an extension has been disabled
                        toRemove.push(extension.identifier.id);
                    }
                }
                this._handleDeltaExtensions(new DeltaExtensionsQueueItem(toAdd, toRemove));
            }));
            this._register(this._extensionManagementService.onDidInstallExtension((event) => {
                if (event.local) {
                    if (this._extensionEnablementService.isEnabled(event.local)) {
                        // an extension has been installed
                        this._handleDeltaExtensions(new DeltaExtensionsQueueItem([event.local], []));
                    }
                }
            }));
            this._register(this._extensionManagementService.onDidUninstallExtension((event) => {
                if (!event.error) {
                    // an extension has been uninstalled
                    this._handleDeltaExtensions(new DeltaExtensionsQueueItem([], [event.identifier.id]));
                }
            }));
            // delay extension host creation and extension scanning
            // until the workbench is running. we cannot defer the
            // extension host more (LifecyclePhase.Restored) because
            // some editors require the extension host to restore
            // and this would result in a deadlock
            // see https://github.com/Microsoft/vscode/issues/41322
            this._lifecycleService.when(2 /* Ready */).then(() => {
                // reschedule to ensure this runs after restoring viewlets, panels, and editors
                async_1.runWhenIdle(() => {
                    this._initialize();
                }, 50 /*max delay*/);
            });
        }
        async _handleDeltaExtensions(item) {
            this._deltaExtensionsQueue.push(item);
            if (this._inHandleDeltaExtensions) {
                // Let the current item finish, the new one will be picked up
                return;
            }
            while (this._deltaExtensionsQueue.length > 0) {
                const item = this._deltaExtensionsQueue.shift();
                try {
                    this._inHandleDeltaExtensions = true;
                    await this._deltaExtensions(item.toAdd, item.toRemove);
                }
                finally {
                    this._inHandleDeltaExtensions = false;
                }
            }
        }
        async _deltaExtensions(_toAdd, _toRemove) {
            if (this._environmentService.configuration.remoteAuthority) {
                return;
            }
            let toAdd = [];
            for (let i = 0, len = _toAdd.length; i < len; i++) {
                const extension = _toAdd[i];
                if (!this._canAddExtension(extension)) {
                    continue;
                }
                const extensionDescription = await this._extensionScanner.scanSingleExtension(extension.location.fsPath, extension.type === 0 /* System */, this.createLogger());
                if (!extensionDescription) {
                    // could not scan extension...
                    continue;
                }
                toAdd.push(extensionDescription);
            }
            let toRemove = [];
            for (let i = 0, len = _toRemove.length; i < len; i++) {
                const extensionId = _toRemove[i];
                const extensionDescription = this._registry.getExtensionDescription(extensionId);
                if (!extensionDescription) {
                    // ignore disabling/uninstalling an extension which is not running
                    continue;
                }
                if (!this._canRemoveExtension(extensionDescription)) {
                    // uses non-dynamic extension point or is activated
                    continue;
                }
                toRemove.push(extensionDescription);
            }
            if (toAdd.length === 0 && toRemove.length === 0) {
                return;
            }
            // Update the local registry
            const result = this._registry.deltaExtensions(toAdd, toRemove.map(e => e.identifier));
            this._onDidChangeExtensions.fire(undefined);
            toRemove = toRemove.concat(result.removedDueToLooping);
            if (result.removedDueToLooping.length > 0) {
                this._logOrShowMessage(notification_1.Severity.Error, nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', ')));
            }
            // enable or disable proposed API per extension
            this._checkEnableProposedApi(toAdd);
            // Update extension points
            this._rehandleExtensionPoints([].concat(toAdd).concat(toRemove));
            // Update the extension host
            if (this._extensionHostProcessManagers.length > 0) {
                await this._extensionHostProcessManagers[0].deltaExtensions(toAdd, toRemove.map(e => e.identifier));
            }
            for (let i = 0; i < toAdd.length; i++) {
                this._activateAddedExtensionIfNeeded(toAdd[i]);
            }
        }
        _rehandleExtensionPoints(extensionDescriptions) {
            this._doHandleExtensionPoints(extensionDescriptions);
        }
        canAddExtension(extensionDescription) {
            return this._canAddExtension(extensions_2.toExtension(extensionDescription));
        }
        _canAddExtension(extension) {
            if (this._environmentService.configuration.remoteAuthority) {
                return false;
            }
            if (extension.location.scheme !== network_1.Schemas.file) {
                return false;
            }
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier.id);
            if (extensionDescription) {
                // this extension is already running (most likely at a different version)
                return false;
            }
            // Check if extension is renamed
            if (extension.identifier.uuid && this._registry.getAllExtensionDescriptions().some(e => e.uuid === extension.identifier.uuid)) {
                return false;
            }
            return true;
        }
        canRemoveExtension(extension) {
            if (this._environmentService.configuration.remoteAuthority) {
                return false;
            }
            if (extension.extensionLocation.scheme !== network_1.Schemas.file) {
                return false;
            }
            const extensionDescription = this._registry.getExtensionDescription(extension.identifier);
            if (!extensionDescription) {
                // ignore removing an extension which is not running
                return false;
            }
            return this._canRemoveExtension(extensionDescription);
        }
        _canRemoveExtension(extension) {
            if (this._extensionHostActiveExtensions.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier))) {
                // Extension is running, cannot remove it safely
                return false;
            }
            return true;
        }
        async _activateAddedExtensionIfNeeded(extensionDescription) {
            let shouldActivate = false;
            let shouldActivateReason = null;
            if (Array.isArray(extensionDescription.activationEvents)) {
                for (let activationEvent of extensionDescription.activationEvents) {
                    // TODO@joao: there's no easy way to contribute this
                    if (activationEvent === 'onUri') {
                        activationEvent = `onUri:${extensions_3.ExtensionIdentifier.toKey(extensionDescription.identifier)}`;
                    }
                    if (this._allRequestedActivateEvents.has(activationEvent)) {
                        // This activation event was fired before the extension was added
                        shouldActivate = true;
                        shouldActivateReason = activationEvent;
                        break;
                    }
                    if (activationEvent === '*') {
                        shouldActivate = true;
                        shouldActivateReason = activationEvent;
                        break;
                    }
                    if (/^workspaceContains/.test(activationEvent)) {
                        // do not trigger a search, just activate in this case...
                        shouldActivate = true;
                        shouldActivateReason = activationEvent;
                        break;
                    }
                }
            }
            if (shouldActivate) {
                await Promise.all(this._extensionHostProcessManagers.map(extHostManager => extHostManager.activate(extensionDescription.identifier, { startup: false, extensionId: extensionDescription.identifier, activationEvent: shouldActivateReason }))).then(() => { });
            }
        }
        //#endregion
        _createProvider(remoteAuthority) {
            return {
                remoteAuthority: remoteAuthority,
                getInitData: () => {
                    return this.whenInstalledExtensionsRegistered().then(() => {
                        return this._remoteExtensionsEnvironmentData.get(remoteAuthority);
                    });
                }
            };
        }
        _createExtensionHosts(isInitialStart, initialActivationEvents) {
            let autoStart;
            let extensions;
            if (isInitialStart) {
                autoStart = false;
                extensions = this._extensionScanner.scannedExtensions.then(extensions => extensions.filter(extension => this._isEnabled(extension))); // remove disabled extensions
            }
            else {
                // restart case
                autoStart = true;
                extensions = this.getExtensions().then((extensions) => extensions.filter(ext => ext.extensionLocation.scheme === network_1.Schemas.file));
            }
            const result = [];
            const extHostProcessWorker = this._instantiationService.createInstance(extensionHost_1.ExtensionHostProcessWorker, autoStart, extensions, this._extensionHostLogsLocation);
            const extHostProcessManager = this._instantiationService.createInstance(extensionHostProcessManager_1.ExtensionHostProcessManager, true, extHostProcessWorker, null, initialActivationEvents);
            result.push(extHostProcessManager);
            const remoteAgentConnection = this._remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const remoteExtHostProcessWorker = this._instantiationService.createInstance(remoteExtensionHostClient_1.RemoteExtensionHostClient, this.getExtensions(), this._createProvider(remoteAgentConnection.remoteAuthority), this._remoteAgentService.socketFactory);
                const remoteExtHostProcessManager = this._instantiationService.createInstance(extensionHostProcessManager_1.ExtensionHostProcessManager, false, remoteExtHostProcessWorker, remoteAgentConnection.remoteAuthority, initialActivationEvents);
                result.push(remoteExtHostProcessManager);
            }
            return result;
        }
        _onExtensionHostCrashed(extensionHost, code, signal) {
            super._onExtensionHostCrashed(extensionHost, code, signal);
            if (extensionHost.isLocal) {
                if (code === 55) {
                    this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.versionMismatchCrash', "Extension host cannot start: version mismatch."), [{
                            label: nls.localize('relaunch', "Relaunch VS Code"),
                            run: () => {
                                this._instantiationService.invokeFunction((accessor) => {
                                    const hostService = accessor.get(host_1.IHostService);
                                    hostService.restart();
                                });
                            }
                        }]);
                    return;
                }
                this._notificationService.prompt(notification_1.Severity.Error, nls.localize('extensionService.crash', "Extension host terminated unexpectedly."), [{
                        label: nls.localize('devTools', "Open Developer Tools"),
                        run: () => this._electronService.openDevTools()
                    },
                    {
                        label: nls.localize('restart', "Restart Extension Host"),
                        run: () => this.startExtensionHost()
                    }]);
            }
        }
        // --- impl
        createLogger() {
            return new extensionPoints_1.Logger((severity, source, message) => {
                if (this._isDev && source) {
                    this._logOrShowMessage(severity, `[${source}]: ${message}`);
                }
                else {
                    this._logOrShowMessage(severity, message);
                }
            });
        }
        async _resolveAuthorityAgain() {
            const remoteAuthority = this._environmentService.configuration.remoteAuthority;
            if (!remoteAuthority) {
                return;
            }
            const extensionHost = this._extensionHostProcessManagers[0];
            this._remoteAuthorityResolverService.clearResolvedAuthority(remoteAuthority);
            try {
                const result = await extensionHost.resolveAuthority(remoteAuthority);
                this._remoteAuthorityResolverService.setResolvedAuthority(result.authority, result.options);
            }
            catch (err) {
                this._remoteAuthorityResolverService.setResolvedAuthorityError(remoteAuthority, err);
            }
        }
        async _scanAndHandleExtensions() {
            this._extensionScanner.startScanningExtensions(this.createLogger());
            const remoteAuthority = this._environmentService.configuration.remoteAuthority;
            const extensionHost = this._extensionHostProcessManagers[0];
            let localExtensions = arrays_1.flatten(await Promise.all([this._extensionScanner.scannedExtensions, this._staticExtensions.getExtensions()]));
            // enable or disable proposed API per extension
            this._checkEnableProposedApi(localExtensions);
            // remove disabled extensions
            localExtensions = remove(localExtensions, extension => this._isDisabled(extension));
            if (remoteAuthority) {
                let resolvedAuthority;
                try {
                    resolvedAuthority = await extensionHost.resolveAuthority(remoteAuthority);
                }
                catch (err) {
                    console.error(err);
                    const plusIndex = remoteAuthority.indexOf('+');
                    const authorityFriendlyName = plusIndex > 0 ? remoteAuthority.substr(0, plusIndex) : remoteAuthority;
                    if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandledNotAvailable(err)) {
                        this._notificationService.notify({ severity: notification_1.Severity.Error, message: nls.localize('resolveAuthorityFailure', "Resolving the authority `{0}` failed", authorityFriendlyName) });
                    }
                    else {
                        console.log(`Not showing a notification for the error`);
                    }
                    this._remoteAuthorityResolverService.setResolvedAuthorityError(remoteAuthority, err);
                    // Proceed with the local extension host
                    await this._startLocalExtensionHost(extensionHost, localExtensions, localExtensions.map(extension => extension.identifier));
                    return;
                }
                // set the resolved authority
                this._remoteAuthorityResolverService.setResolvedAuthority(resolvedAuthority.authority, resolvedAuthority.options);
                // monitor for breakage
                const connection = this._remoteAgentService.getConnection();
                if (connection) {
                    connection.onDidStateChange(async (e) => {
                        const remoteAuthority = this._environmentService.configuration.remoteAuthority;
                        if (!remoteAuthority) {
                            return;
                        }
                        if (e.type === 0 /* ConnectionLost */) {
                            this._remoteAuthorityResolverService.clearResolvedAuthority(remoteAuthority);
                        }
                    });
                    connection.onReconnecting(() => this._resolveAuthorityAgain());
                }
                // fetch the remote environment
                const remoteEnv = (await this._remoteAgentService.getEnvironment());
                if (!remoteEnv) {
                    this._notificationService.notify({ severity: notification_1.Severity.Error, message: nls.localize('getEnvironmentFailure', "Could not fetch remote environment") });
                    // Proceed with the local extension host
                    await this._startLocalExtensionHost(extensionHost, localExtensions, localExtensions.map(extension => extension.identifier));
                    return;
                }
                // enable or disable proposed API per extension
                this._checkEnableProposedApi(remoteEnv.extensions);
                // remove disabled extensions
                remoteEnv.extensions = remove(remoteEnv.extensions, extension => this._isDisabled(extension));
                // Determine where each extension will execute, based on extensionKind
                const isInstalledLocally = new Set();
                localExtensions.forEach(ext => isInstalledLocally.add(extensions_3.ExtensionIdentifier.toKey(ext.identifier)));
                const isInstalledRemotely = new Set();
                remoteEnv.extensions.forEach(ext => isInstalledRemotely.add(extensions_3.ExtensionIdentifier.toKey(ext.identifier)));
                let RunningLocation;
                (function (RunningLocation) {
                    RunningLocation[RunningLocation["None"] = 0] = "None";
                    RunningLocation[RunningLocation["Local"] = 1] = "Local";
                    RunningLocation[RunningLocation["Remote"] = 2] = "Remote";
                })(RunningLocation || (RunningLocation = {}));
                const pickRunningLocation = (extension) => {
                    for (const extensionKind of extensionsUtil_1.getExtensionKind(extension, this._productService, this._configurationService)) {
                        if (extensionKind === 'ui') {
                            // a ui extension can run on both sides for now...
                            if (isInstalledLocally.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier))) {
                                return 1 /* Local */;
                            }
                            if (isInstalledRemotely.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier))) {
                                return 2 /* Remote */;
                            }
                        }
                        else if (extensionKind === 'workspace') {
                            if (isInstalledRemotely.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier))) {
                                return 2 /* Remote */;
                            }
                        }
                    }
                    return 0 /* None */;
                };
                const runningLocation = new Map();
                localExtensions.forEach(ext => runningLocation.set(extensions_3.ExtensionIdentifier.toKey(ext.identifier), pickRunningLocation(ext)));
                remoteEnv.extensions.forEach(ext => runningLocation.set(extensions_3.ExtensionIdentifier.toKey(ext.identifier), pickRunningLocation(ext)));
                // remove non-UI extensions from the local extensions
                localExtensions = localExtensions.filter(ext => runningLocation.get(extensions_3.ExtensionIdentifier.toKey(ext.identifier)) === 1 /* Local */);
                // in case of UI extensions overlap, the local extension wins
                remoteEnv.extensions = remoteEnv.extensions.filter(ext => runningLocation.get(extensions_3.ExtensionIdentifier.toKey(ext.identifier)) === 2 /* Remote */);
                // save for remote extension's init data
                this._remoteExtensionsEnvironmentData.set(remoteAuthority, remoteEnv);
                await this._startLocalExtensionHost(extensionHost, remoteEnv.extensions.concat(localExtensions), localExtensions.map(extension => extension.identifier));
            }
            else {
                await this._startLocalExtensionHost(extensionHost, localExtensions, localExtensions.map(extension => extension.identifier));
            }
        }
        async _startLocalExtensionHost(extensionHost, allExtensions, localExtensions) {
            this._registerAndHandleExtensions(allExtensions);
            extensionHost.start(localExtensions.filter(id => this._registry.containsExtension(id)));
        }
        _registerAndHandleExtensions(allExtensions) {
            const result = this._registry.deltaExtensions(allExtensions, []);
            if (result.removedDueToLooping.length > 0) {
                this._logOrShowMessage(notification_1.Severity.Error, nls.localize('looping', "The following extensions contain dependency loops and have been disabled: {0}", result.removedDueToLooping.map(e => `'${e.identifier.value}'`).join(', ')));
            }
            this._doHandleExtensionPoints(this._registry.getAllExtensionDescriptions());
        }
        async getInspectPort(tryEnableInspector) {
            if (this._extensionHostProcessManagers.length > 0) {
                return this._extensionHostProcessManagers[0].getInspectPort(tryEnableInspector);
            }
            return 0;
        }
        _onExtensionHostExit(code) {
            if (this._isExtensionDevTestFromCli) {
                // When CLI testing make sure to exit with proper exit code
                electron_1.ipcRenderer.send('vscode:exit', code);
            }
            else {
                // Expected development extension termination: When the extension host goes down we also shutdown the window
                this._electronService.closeWindow();
            }
        }
    };
    ExtensionService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notification_1.INotificationService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, extensionManagement_2.IExtensionEnablementService),
        __param(5, files_1.IFileService),
        __param(6, productService_1.IProductService),
        __param(7, extensionManagement_1.IExtensionManagementService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, lifecycle_1.ILifecycleService),
        __param(12, staticExtensions_1.IStaticExtensionsService),
        __param(13, electron_2.IElectronService),
        __param(14, host_1.IHostService),
        __param(15, electronEnvironmentService_1.IElectronEnvironmentService)
    ], ExtensionService);
    exports.ExtensionService = ExtensionService;
    function remove(arr, arg2) {
        if (typeof arg2 === 'function') {
            return _removePredicate(arr, arg2);
        }
        return _removeSet(arr, arg2);
    }
    function _removePredicate(arr, predicate) {
        return arr.filter(extension => !predicate(extension));
    }
    function _removeSet(arr, toRemove) {
        const toRemoveSet = new Set();
        toRemove.forEach(extension => toRemoveSet.add(extensions_3.ExtensionIdentifier.toKey(extension.identifier)));
        return arr.filter(extension => !toRemoveSet.has(extensions_3.ExtensionIdentifier.toKey(extension.identifier)));
    }
    extensions_1.registerSingleton(extensions_2.IExtensionService, ExtensionService);
});
//# sourceMappingURL=extensionService.js.map