/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/platform", "vs/platform/product/common/product", "vs/base/parts/ipc/node/ipc.net", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationService", "vs/platform/request/common/request", "vs/platform/request/browser/requestService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/node/commonProperties", "vs/platform/telemetry/node/telemetryIpc", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/node/appInsightsAppender", "electron", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/platform/localizations/node/localizations", "vs/platform/localizations/common/localizations", "vs/base/common/lifecycle", "vs/platform/download/common/downloadService", "vs/platform/download/common/download", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc", "vs/code/electron-browser/sharedProcess/contrib/nodeCachedDataCleaner", "vs/code/electron-browser/sharedProcess/contrib/languagePackCachedDataCleaner", "vs/code/electron-browser/sharedProcess/contrib/storageDataCleaner", "vs/code/electron-browser/sharedProcess/contrib/logsDataCleaner", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/log/node/spdlogService", "vs/platform/diagnostics/node/diagnosticsService", "vs/platform/diagnostics/node/diagnosticsIpc", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/electron-browser/diskFileSystemProvider", "vs/base/common/network", "vs/platform/product/common/productService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncService", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/common/userDataSyncIpc", "vs/platform/electron/node/electron", "vs/platform/log/node/loggerService", "vs/platform/userDataSync/common/userDataSyncLog", "vs/platform/credentials/common/credentials", "vs/platform/credentials/node/credentialsService", "vs/platform/userDataSync/electron-browser/userDataAutoSyncService", "vs/platform/storage/node/storageService", "vs/platform/storage/node/storageIpc", "vs/platform/storage/common/storage", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/authentication/common/authentication", "vs/platform/authentication/common/authenticationIpc", "vs/platform/userDataSync/common/userDataSyncBackupStoreService", "vs/platform/userDataSync/common/storageKeys", "vs/platform/extensionManagement/node/extensionTipsService"], function (require, exports, fs, platform, product_1, ipc_net_1, serviceCollection_1, descriptors_1, instantiationService_1, environment_1, environmentService_1, extensionManagementIpc_1, extensionManagement_1, extensionManagementService_1, extensionGalleryService_1, configuration_1, configurationService_1, request_1, requestService_1, telemetry_1, telemetryUtils_1, commonProperties_1, telemetryIpc_1, telemetryService_1, appInsightsAppender_1, electron_1, log_1, logIpc_1, localizations_1, localizations_2, lifecycle_1, downloadService_1, download_1, ipc_1, ipc_2, nodeCachedDataCleaner_1, languagePackCachedDataCleaner_1, storageDataCleaner_1, logsDataCleaner_1, mainProcessService_1, spdlogService_1, diagnosticsService_1, diagnosticsIpc_1, fileService_1, files_1, diskFileSystemProvider_1, network_1, productService_1, userDataSync_1, userDataSyncService_1, userDataSyncStoreService_1, userDataSyncIpc_1, electron_2, loggerService_1, userDataSyncLog_1, credentials_1, credentialsService_1, userDataAutoSyncService_1, storageService_1, storageIpc_1, storage_1, extensionEnablementService_1, userDataSyncEnablementService_1, authentication_1, authenticationIpc_1, userDataSyncBackupStoreService_1, storageKeys_1, extensionTipsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.startup = void 0;
    function startup(configuration) {
        handshake(configuration);
    }
    exports.startup = startup;
    const eventPrefix = 'monacoworkbench';
    class MainProcessService {
        constructor(server, mainRouter) {
            this.server = server;
            this.mainRouter = mainRouter;
        }
        getChannel(channelName) {
            return this.server.getChannel(channelName, this.mainRouter);
        }
        registerChannel(channelName, channel) {
            this.server.registerChannel(channelName, channel);
        }
    }
    async function main(server, initData, configuration) {
        const services = new serviceCollection_1.ServiceCollection();
        const disposables = new lifecycle_1.DisposableStore();
        const onExit = () => disposables.dispose();
        process.once('exit', onExit);
        electron_1.ipcRenderer.once('electron-main->shared-process: exit', onExit);
        disposables.add(server);
        const environmentService = new environmentService_1.EnvironmentService(initData.args, process.execPath);
        const mainRouter = new ipc_1.StaticRouter(ctx => ctx === 'main');
        const loggerClient = new logIpc_1.LoggerChannelClient(server.getChannel('logger', mainRouter));
        const logService = new logIpc_1.FollowerLogService(loggerClient, new spdlogService_1.SpdLogService('sharedprocess', environmentService.logsPath, initData.logLevel));
        disposables.add(logService);
        logService.info('main', JSON.stringify(configuration));
        const mainProcessService = new MainProcessService(server, mainRouter);
        services.set(mainProcessService_1.IMainProcessService, mainProcessService);
        // Files
        const fileService = new fileService_1.FileService(logService);
        services.set(files_1.IFileService, fileService);
        disposables.add(fileService);
        const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
        disposables.add(diskFileSystemProvider);
        fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        // Configuration
        const configurationService = new configurationService_1.ConfigurationService(environmentService.settingsResource, fileService);
        disposables.add(configurationService);
        await configurationService.initialize();
        // Storage
        const storageService = new storageService_1.NativeStorageService(new storageIpc_1.GlobalStorageDatabaseChannelClient(mainProcessService.getChannel('storage')), logService, environmentService);
        await storageService.initialize();
        services.set(storage_1.IStorageService, storageService);
        disposables.add(lifecycle_1.toDisposable(() => storageService.flush()));
        services.set(storageKeys_1.IStorageKeysSyncRegistryService, new userDataSyncIpc_1.StorageKeysSyncRegistryChannelClient(mainProcessService.getChannel('storageKeysSyncRegistryService')));
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(productService_1.IProductService, Object.assign({ _serviceBrand: undefined }, product_1.default));
        services.set(log_1.ILogService, logService);
        services.set(configuration_1.IConfigurationService, configurationService);
        services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
        services.set(log_1.ILoggerService, new descriptors_1.SyncDescriptor(loggerService_1.LoggerService));
        const electronService = ipc_2.createChannelSender(mainProcessService.getChannel('electron'), { context: configuration.windowId });
        services.set(electron_2.IElectronService, electronService);
        services.set(download_1.IDownloadService, new descriptors_1.SyncDescriptor(downloadService_1.DownloadService));
        const instantiationService = new instantiationService_1.InstantiationService(services);
        let telemetryService;
        instantiationService.invokeFunction(accessor => {
            const services = new serviceCollection_1.ServiceCollection();
            const { appRoot, extensionsPath, extensionDevelopmentLocationURI, isBuilt, installSourcePath } = environmentService;
            const telemetryLogService = new logIpc_1.FollowerLogService(loggerClient, new spdlogService_1.SpdLogService('telemetry', environmentService.logsPath, initData.logLevel));
            telemetryLogService.info('The below are logs for every telemetry event sent from VS Code once the log level is set to trace.');
            telemetryLogService.info('===========================================================');
            let appInsightsAppender = telemetryUtils_1.NullAppender;
            if (!extensionDevelopmentLocationURI && !environmentService.disableTelemetry && product_1.default.enableTelemetry) {
                if (product_1.default.aiConfig && product_1.default.aiConfig.asimovKey && isBuilt) {
                    appInsightsAppender = new appInsightsAppender_1.AppInsightsAppender(eventPrefix, null, product_1.default.aiConfig.asimovKey, telemetryLogService);
                    disposables.add(lifecycle_1.toDisposable(() => appInsightsAppender.flush())); // Ensure the AI appender is disposed so that it flushes remaining data
                }
                const config = {
                    appender: telemetryUtils_1.combinedAppender(appInsightsAppender, new telemetryUtils_1.LogAppender(logService)),
                    commonProperties: commonProperties_1.resolveCommonProperties(product_1.default.commit, product_1.default.version, configuration.machineId, product_1.default.msftInternalDomains, installSourcePath),
                    sendErrorTelemetry: true,
                    piiPaths: extensionsPath ? [appRoot, extensionsPath] : [appRoot]
                };
                telemetryService = new telemetryService_1.TelemetryService(config, configurationService);
                services.set(telemetry_1.ITelemetryService, telemetryService);
            }
            else {
                telemetryService = telemetryUtils_1.NullTelemetryService;
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            server.registerChannel('telemetryAppender', new telemetryIpc_1.TelemetryAppenderChannel(appInsightsAppender));
            services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService));
            services.set(localizations_2.ILocalizationsService, new descriptors_1.SyncDescriptor(localizations_1.LocalizationsService));
            services.set(diagnosticsService_1.IDiagnosticsService, new descriptors_1.SyncDescriptor(diagnosticsService_1.DiagnosticsService));
            services.set(extensionManagement_1.IExtensionTipsService, new descriptors_1.SyncDescriptor(extensionTipsService_1.ExtensionTipsService));
            services.set(credentials_1.ICredentialsService, new descriptors_1.SyncDescriptor(credentialsService_1.KeytarCredentialsService));
            services.set(authentication_1.IAuthenticationTokenService, new descriptors_1.SyncDescriptor(authentication_1.AuthenticationTokenService));
            services.set(userDataSync_1.IUserDataSyncLogService, new descriptors_1.SyncDescriptor(userDataSyncLog_1.UserDataSyncLogService));
            services.set(userDataSync_1.IUserDataSyncUtilService, new userDataSyncIpc_1.UserDataSyncUtilServiceClient(server.getChannel('userDataSyncUtil', client => client.ctx !== 'main')));
            services.set(extensionManagement_1.IGlobalExtensionEnablementService, new descriptors_1.SyncDescriptor(extensionEnablementService_1.GlobalExtensionEnablementService));
            services.set(userDataSync_1.IUserDataSyncStoreService, new descriptors_1.SyncDescriptor(userDataSyncStoreService_1.UserDataSyncStoreService));
            services.set(userDataSync_1.IUserDataSyncBackupStoreService, new descriptors_1.SyncDescriptor(userDataSyncBackupStoreService_1.UserDataSyncBackupStoreService));
            services.set(userDataSync_1.IUserDataSyncEnablementService, new descriptors_1.SyncDescriptor(userDataSyncEnablementService_1.UserDataSyncEnablementService));
            services.set(userDataSync_1.IUserDataSyncService, new descriptors_1.SyncDescriptor(userDataSyncService_1.UserDataSyncService));
            userDataSync_1.registerConfiguration();
            const instantiationService2 = instantiationService.createChild(services);
            instantiationService2.invokeFunction(accessor => {
                const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
                const channel = new extensionManagementIpc_1.ExtensionManagementChannel(extensionManagementService, () => null);
                server.registerChannel('extensions', channel);
                const localizationsService = accessor.get(localizations_2.ILocalizationsService);
                const localizationsChannel = ipc_2.createChannelReceiver(localizationsService);
                server.registerChannel('localizations', localizationsChannel);
                const diagnosticsService = accessor.get(diagnosticsService_1.IDiagnosticsService);
                const diagnosticsChannel = new diagnosticsIpc_1.DiagnosticsChannel(diagnosticsService);
                server.registerChannel('diagnostics', diagnosticsChannel);
                const extensionTipsService = accessor.get(extensionManagement_1.IExtensionTipsService);
                const extensionTipsChannel = new extensionManagementIpc_1.ExtensionTipsChannel(extensionTipsService);
                server.registerChannel('extensionTipsService', extensionTipsChannel);
                const authTokenService = accessor.get(authentication_1.IAuthenticationTokenService);
                const authTokenChannel = new authenticationIpc_1.AuthenticationTokenServiceChannel(authTokenService);
                server.registerChannel('authToken', authTokenChannel);
                const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                const userDataSyncChannel = new userDataSyncIpc_1.UserDataSyncChannel(userDataSyncService);
                server.registerChannel('userDataSync', userDataSyncChannel);
                const userDataAutoSync = instantiationService2.createInstance(userDataAutoSyncService_1.UserDataAutoSyncService);
                const userDataAutoSyncChannel = new userDataSyncIpc_1.UserDataAutoSyncChannel(userDataAutoSync);
                server.registerChannel('userDataAutoSync', userDataAutoSyncChannel);
                // clean up deprecated extensions
                extensionManagementService.removeDeprecatedExtensions();
                // update localizations cache
                localizationsService.update();
                // cache clean ups
                disposables.add(lifecycle_1.combinedDisposable(instantiationService2.createInstance(nodeCachedDataCleaner_1.NodeCachedDataCleaner), instantiationService2.createInstance(languagePackCachedDataCleaner_1.LanguagePackCachedDataCleaner), instantiationService2.createInstance(storageDataCleaner_1.StorageDataCleaner), instantiationService2.createInstance(logsDataCleaner_1.LogsDataCleaner), userDataAutoSync));
                disposables.add(extensionManagementService);
            });
        });
    }
    function setupIPC(hook) {
        function setup(retry) {
            return ipc_net_1.serve(hook).then(null, err => {
                if (!retry || platform.isWindows || err.code !== 'EADDRINUSE') {
                    return Promise.reject(err);
                }
                // should retry, not windows and eaddrinuse
                return ipc_net_1.connect(hook, '').then(client => {
                    // we could connect to a running instance. this is not good, abort
                    client.dispose();
                    return Promise.reject(new Error('There is an instance already running.'));
                }, err => {
                    // it happens on Linux and OS X that the pipe is left behind
                    // let's delete it, since we can't connect to it
                    // and the retry the whole thing
                    try {
                        fs.unlinkSync(hook);
                    }
                    catch (e) {
                        return Promise.reject(new Error('Error deleting the shared ipc hook.'));
                    }
                    return setup(false);
                });
            });
        }
        return setup(true);
    }
    async function handshake(configuration) {
        // receive payload from electron-main to start things
        const data = await new Promise(c => {
            electron_1.ipcRenderer.once('electron-main->shared-process: payload', (_, r) => c(r));
            // tell electron-main we are ready to receive payload
            electron_1.ipcRenderer.send('shared-process->electron-main: ready-for-payload');
        });
        // await IPC connection and signal this back to electron-main
        const server = await setupIPC(data.sharedIPCHandle);
        electron_1.ipcRenderer.send('shared-process->electron-main: ipc-ready');
        // await initialization and signal this back to electron-main
        await main(server, data, configuration);
        electron_1.ipcRenderer.send('shared-process->electron-main: init-done');
    }
});
//# sourceMappingURL=sharedProcessMain.js.map