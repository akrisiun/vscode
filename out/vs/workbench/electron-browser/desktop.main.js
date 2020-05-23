/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "graceful-fs", "electron", "vs/base/common/performance", "vs/workbench/browser/workbench", "vs/workbench/electron-browser/window", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/errors", "vs/base/common/uri", "vs/workbench/services/configuration/browser/configurationService", "vs/workbench/services/environment/electron-browser/environmentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/services/keybinding/electron-browser/nativeKeymapService", "vs/platform/workspaces/common/workspaces", "vs/platform/log/common/log", "vs/platform/storage/node/storageService", "vs/platform/log/common/logIpc", "vs/base/common/network", "vs/base/common/extpath", "vs/platform/storage/node/storageIpc", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/base/common/lifecycle", "vs/platform/driver/electron-browser/driver", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/remote/electron-browser/remoteAuthorityResolverService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/remote/electron-browser/remoteAgentServiceImpl", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/electron-browser/diskFileSystemProvider", "vs/workbench/services/remote/common/remoteAgentFileSystemChannel", "vs/workbench/services/configuration/node/configurationCache", "vs/platform/log/node/spdlogService", "vs/platform/sign/node/signService", "vs/platform/sign/common/sign", "vs/workbench/services/userData/common/fileUserDataProvider", "vs/base/common/resources", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/platform/resource/node/resourceIdentityServiceImpl", "vs/platform/resource/common/resourceIdentityService"], function (require, exports, fs, gracefulFs, electron_1, performance_1, workbench_1, window_1, browser_1, dom_1, errors_1, uri_1, configurationService_1, environmentService_1, environmentService_2, serviceCollection_1, nativeKeymapService_1, workspaces_1, log_1, storageService_1, logIpc_1, network_1, extpath_1, storageIpc_1, workspace_1, configuration_1, storage_1, lifecycle_1, driver_1, mainProcessService_1, remoteAuthorityResolverService_1, remoteAuthorityResolver_1, remoteAgentServiceImpl_1, remoteAgentService_1, fileService_1, files_1, diskFileSystemProvider_1, remoteAgentFileSystemChannel_1, configurationCache_1, spdlogService_1, signService_1, sign_1, fileUserDataProvider_1, resources_1, productService_1, product_1, resourceIdentityServiceImpl_1, resourceIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.main = void 0;
    class DesktopMain extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.environmentService = new environmentService_1.NativeWorkbenchEnvironmentService(this.configuration, this.configuration.execPath);
            this.init();
        }
        init() {
            // Enable gracefulFs
            gracefulFs.gracefulify(fs);
            // Massage configuration file URIs
            this.reviveUris();
            // Setup perf
            performance_1.importEntries(this.environmentService.configuration.perfEntries);
            // Browser config
            browser_1.setZoomFactor(electron_1.webFrame.getZoomFactor()); // Ensure others can listen to zoom level changes
            browser_1.setZoomLevel(electron_1.webFrame.getZoomLevel(), true /* isTrusted */); // Can be trusted because we are not setting it ourselves (https://github.com/Microsoft/vscode/issues/26151)
            browser_1.setFullscreen(!!this.environmentService.configuration.fullscreen);
            // Keyboard support
            nativeKeymapService_1.KeyboardMapperFactory.INSTANCE._onKeyboardLayoutChanged();
        }
        reviveUris() {
            if (this.environmentService.configuration.folderUri) {
                this.environmentService.configuration.folderUri = uri_1.URI.revive(this.environmentService.configuration.folderUri);
            }
            if (this.environmentService.configuration.workspace) {
                this.environmentService.configuration.workspace = workspaces_1.reviveWorkspaceIdentifier(this.environmentService.configuration.workspace);
            }
            const filesToWait = this.environmentService.configuration.filesToWait;
            const filesToWaitPaths = filesToWait === null || filesToWait === void 0 ? void 0 : filesToWait.paths;
            [filesToWaitPaths, this.environmentService.configuration.filesToOpenOrCreate, this.environmentService.configuration.filesToDiff].forEach(paths => {
                if (Array.isArray(paths)) {
                    paths.forEach(path => {
                        if (path.fileUri) {
                            path.fileUri = uri_1.URI.revive(path.fileUri);
                        }
                    });
                }
            });
            if (filesToWait) {
                filesToWait.waitMarkerFileUri = uri_1.URI.revive(filesToWait.waitMarkerFileUri);
            }
        }
        async open() {
            const services = await this.initServices();
            await dom_1.domContentLoaded();
            performance_1.mark('willStartWorkbench');
            // Create Workbench
            const workbench = new workbench_1.Workbench(document.body, services.serviceCollection, services.logService);
            // Listeners
            this.registerListeners(workbench, services.storageService);
            // Startup
            const instantiationService = workbench.startup();
            // Window
            this._register(instantiationService.createInstance(window_1.NativeWindow));
            // Driver
            if (this.environmentService.configuration.driver) {
                instantiationService.invokeFunction(async (accessor) => this._register(await driver_1.registerWindowDriver(accessor, this.configuration.windowId)));
            }
            // Logging
            services.logService.trace('workbench configuration', JSON.stringify(this.environmentService.configuration));
        }
        registerListeners(workbench, storageService) {
            // Layout
            this._register(dom_1.addDisposableListener(window, dom_1.EventType.RESIZE, e => this.onWindowResize(e, true, workbench)));
            // Workbench Lifecycle
            this._register(workbench.onShutdown(() => this.dispose()));
            this._register(workbench.onWillShutdown(event => event.join(storageService.close())));
        }
        onWindowResize(e, retry, workbench) {
            if (e.target === window) {
                if (window.document && window.document.body && window.document.body.clientWidth === 0) {
                    // TODO@Ben this is an electron issue on macOS when simple fullscreen is enabled
                    // where for some reason the window clientWidth is reported as 0 when switching
                    // between simple fullscreen and normal screen. In that case we schedule the layout
                    // call at the next animation frame once, in the hope that the dimensions are
                    // proper then.
                    if (retry) {
                        dom_1.scheduleAtNextAnimationFrame(() => this.onWindowResize(e, false, workbench));
                    }
                    return;
                }
                workbench.layout();
            }
        }
        async initServices() {
            const serviceCollection = new serviceCollection_1.ServiceCollection();
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // NOTE: DO NOT ADD ANY OTHER SERVICE INTO THE COLLECTION HERE.
            // CONTRIBUTE IT VIA WORKBENCH.DESKTOP.MAIN.TS AND registerSingleton().
            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            // Main Process
            const mainProcessService = this._register(new mainProcessService_1.MainProcessService(this.configuration.windowId));
            serviceCollection.set(mainProcessService_1.IMainProcessService, mainProcessService);
            // Environment
            serviceCollection.set(environmentService_2.IWorkbenchEnvironmentService, this.environmentService);
            // Product
            serviceCollection.set(productService_1.IProductService, Object.assign({ _serviceBrand: undefined }, product_1.default));
            // Log
            const logService = this._register(this.createLogService(mainProcessService, this.environmentService));
            serviceCollection.set(log_1.ILogService, logService);
            // Remote
            const remoteAuthorityResolverService = new remoteAuthorityResolverService_1.RemoteAuthorityResolverService();
            serviceCollection.set(remoteAuthorityResolver_1.IRemoteAuthorityResolverService, remoteAuthorityResolverService);
            // Sign
            const signService = new signService_1.SignService();
            serviceCollection.set(sign_1.ISignService, signService);
            const remoteAgentService = this._register(new remoteAgentServiceImpl_1.RemoteAgentService(this.environmentService, remoteAuthorityResolverService, signService, logService));
            serviceCollection.set(remoteAgentService_1.IRemoteAgentService, remoteAgentService);
            // Files
            const fileService = this._register(new fileService_1.FileService(logService));
            serviceCollection.set(files_1.IFileService, fileService);
            const diskFileSystemProvider = this._register(new diskFileSystemProvider_1.DiskFileSystemProvider(logService));
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            // User Data Provider
            fileService.registerProvider(network_1.Schemas.userData, new fileUserDataProvider_1.FileUserDataProvider(this.environmentService.appSettingsHome, this.environmentService.backupHome, diskFileSystemProvider, this.environmentService));
            const connection = remoteAgentService.getConnection();
            if (connection) {
                const remoteFileSystemProvider = this._register(new remoteAgentFileSystemChannel_1.RemoteFileSystemProvider(remoteAgentService));
                fileService.registerProvider(network_1.Schemas.vscodeRemote, remoteFileSystemProvider);
            }
            const resourceIdentityService = this._register(new resourceIdentityServiceImpl_1.NativeResourceIdentityService());
            serviceCollection.set(resourceIdentityService_1.IResourceIdentityService, resourceIdentityService);
            const payload = await this.resolveWorkspaceInitializationPayload(resourceIdentityService);
            const services = await Promise.all([
                this.createWorkspaceService(payload, fileService, remoteAgentService, logService).then(service => {
                    // Workspace
                    serviceCollection.set(workspace_1.IWorkspaceContextService, service);
                    // Configuration
                    serviceCollection.set(configuration_1.IConfigurationService, service);
                    return service;
                }),
                this.createStorageService(payload, logService, mainProcessService).then(service => {
                    // Storage
                    serviceCollection.set(storage_1.IStorageService, service);
                    return service;
                })
            ]);
            return { serviceCollection, logService, storageService: services[1] };
        }
        async resolveWorkspaceInitializationPayload(resourceIdentityService) {
            // Multi-root workspace
            if (this.environmentService.configuration.workspace) {
                return this.environmentService.configuration.workspace;
            }
            // Single-folder workspace
            let workspaceInitializationPayload;
            if (this.environmentService.configuration.folderUri) {
                workspaceInitializationPayload = await this.resolveSingleFolderWorkspaceInitializationPayload(this.environmentService.configuration.folderUri, resourceIdentityService);
            }
            // Fallback to empty workspace if we have no payload yet.
            if (!workspaceInitializationPayload) {
                let id;
                if (this.environmentService.configuration.backupWorkspaceResource) {
                    id = resources_1.basename(this.environmentService.configuration.backupWorkspaceResource); // we know the backupPath must be a unique path so we leverage its name as workspace ID
                }
                else if (this.environmentService.isExtensionDevelopment) {
                    id = 'ext-dev'; // extension development window never stores backups and is a singleton
                }
                else {
                    throw new Error('Unexpected window configuration without backupPath');
                }
                workspaceInitializationPayload = { id };
            }
            return workspaceInitializationPayload;
        }
        async resolveSingleFolderWorkspaceInitializationPayload(folderUri, resourceIdentityService) {
            try {
                const folder = folderUri.scheme === network_1.Schemas.file
                    ? uri_1.URI.file(extpath_1.sanitizeFilePath(folderUri.fsPath, process.env['VSCODE_CWD'] || process.cwd())) // For local: ensure path is absolute
                    : folderUri;
                const id = await resourceIdentityService.resolveResourceIdentity(folderUri);
                return { id, folder };
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
            }
            return;
        }
        async createWorkspaceService(payload, fileService, remoteAgentService, logService) {
            const workspaceService = new configurationService_1.WorkspaceService({ remoteAuthority: this.environmentService.configuration.remoteAuthority, configurationCache: new configurationCache_1.ConfigurationCache(this.environmentService) }, this.environmentService, fileService, remoteAgentService);
            try {
                await workspaceService.initialize(payload);
                return workspaceService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return workspaceService;
            }
        }
        async createStorageService(payload, logService, mainProcessService) {
            const globalStorageDatabase = new storageIpc_1.GlobalStorageDatabaseChannelClient(mainProcessService.getChannel('storage'));
            const storageService = new storageService_1.NativeStorageService(globalStorageDatabase, logService, this.environmentService);
            try {
                await storageService.initialize(payload);
                return storageService;
            }
            catch (error) {
                errors_1.onUnexpectedError(error);
                logService.error(error);
                return storageService;
            }
        }
        createLogService(mainProcessService, environmentService) {
            const loggerClient = new logIpc_1.LoggerChannelClient(mainProcessService.getChannel('logger'));
            // Extension development test CLI: forward everything to main side
            const loggers = [];
            if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
                loggers.push(new log_1.ConsoleLogInMainService(loggerClient, this.environmentService.configuration.logLevel));
            }
            // Normal logger: spdylog and console
            else {
                loggers.push(new log_1.ConsoleLogService(this.environmentService.configuration.logLevel), new spdlogService_1.SpdLogService(`renderer${this.configuration.windowId}`, environmentService.logsPath, this.environmentService.configuration.logLevel));
            }
            return new logIpc_1.FollowerLogService(loggerClient, new log_1.MultiplexLogService(loggers));
        }
    }
    function main(configuration) {
        const workbench = new DesktopMain(configuration);
        return workbench.open();
    }
    exports.main = main;
});
//# sourceMappingURL=desktop.main.js.map