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
define(["require", "exports", "vs/nls", "vs/platform/product/common/product", "vs/base/common/path", "semver-umd", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/instantiationService", "vs/platform/environment/common/environment", "vs/platform/environment/node/environmentService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/node/extensionManagementService", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/node/commonProperties", "vs/platform/request/common/request", "vs/platform/request/node/requestService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/node/configurationService", "vs/platform/telemetry/node/appInsightsAppender", "vs/base/node/pfs", "vs/base/common/labels", "vs/platform/state/node/state", "vs/platform/state/node/stateService", "vs/platform/log/common/log", "vs/base/common/errors", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/uri", "vs/platform/extensionManagement/node/extensionManagementUtil", "vs/platform/extensions/common/extensions", "vs/base/common/cancellation", "vs/platform/localizations/node/localizations", "vs/base/common/network", "vs/platform/log/node/spdlogService", "vs/platform/telemetry/node/telemetry", "vs/platform/files/common/fileService", "vs/platform/files/common/files", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/lifecycle", "vs/platform/product/common/productService"], function (require, exports, nls_1, product_1, path, semver, serviceCollection_1, descriptors_1, instantiation_1, instantiationService_1, environment_1, environmentService_1, extensionManagement_1, extensionManagementService_1, extensionGalleryService_1, telemetry_1, telemetryUtils_1, telemetryService_1, commonProperties_1, request_1, requestService_1, configuration_1, configurationService_1, appInsightsAppender_1, pfs_1, labels_1, state_1, stateService_1, log_1, errors_1, extensionManagementUtil_1, uri_1, extensionManagementUtil_2, extensions_1, cancellation_1, localizations_1, network_1, spdlogService_1, telemetry_2, fileService_1, files_1, diskFileSystemProvider_1, lifecycle_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const notFound = (id) => nls_1.localize('notFound', "Extension '{0}' not found.", id);
    const notInstalled = (id) => nls_1.localize('notInstalled', "Extension '{0}' is not installed.", id);
    const useId = nls_1.localize('useId', "Make sure you use the full extension ID, including the publisher, e.g.: {0}", 'ms-vscode.csharp');
    function getId(manifest, withVersion) {
        if (withVersion) {
            return `${manifest.publisher}.${manifest.name}@${manifest.version}`;
        }
        else {
            return `${manifest.publisher}.${manifest.name}`;
        }
    }
    const EXTENSION_ID_REGEX = /^([^.]+\..+)@(\d+\.\d+\.\d+(-.*)?)$/;
    function getIdAndVersion(id) {
        const matches = EXTENSION_ID_REGEX.exec(id);
        if (matches && matches[1]) {
            return [extensionManagementUtil_1.adoptToGalleryExtensionId(matches[1]), matches[2]];
        }
        return [extensionManagementUtil_1.adoptToGalleryExtensionId(id), undefined];
    }
    exports.getIdAndVersion = getIdAndVersion;
    let Main = class Main {
        constructor(instantiationService, environmentService, extensionManagementService, extensionGalleryService) {
            this.instantiationService = instantiationService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            this.extensionGalleryService = extensionGalleryService;
        }
        async run(argv) {
            if (argv['install-source']) {
                await this.setInstallSource(argv['install-source']);
            }
            else if (argv['list-extensions']) {
                await this.listExtensions(!!argv['show-versions'], argv['category']);
            }
            else if (argv['install-extension']) {
                await this.installExtensions(argv['install-extension'], !!argv['force']);
            }
            else if (argv['uninstall-extension']) {
                await this.uninstallExtension(argv['uninstall-extension']);
            }
            else if (argv['locate-extension']) {
                await this.locateExtension(argv['locate-extension']);
            }
            else if (argv['telemetry']) {
                console.log(telemetry_2.buildTelemetryMessage(this.environmentService.appRoot, this.environmentService.extensionsPath ? this.environmentService.extensionsPath : undefined));
            }
        }
        setInstallSource(installSource) {
            return pfs_1.writeFile(this.environmentService.installSourcePath, installSource.slice(0, 30));
        }
        async listExtensions(showVersions, category) {
            let extensions = await this.extensionManagementService.getInstalled(1 /* User */);
            // TODO: we should save this array in a common place so that the command and extensionQuery can use it that way changing it is easier
            const categories = ['"programming languages"', 'snippets', 'linters', 'themes', 'debuggers', 'formatters', 'keymaps', '"scm providers"', 'other', '"extension packs"', '"language packs"'];
            if (category && category !== '') {
                if (categories.indexOf(category.toLowerCase()) < 0) {
                    console.log('Invalid category please enter a valid category. To list valid categories run --category without a category specified');
                    return;
                }
                extensions = extensions.filter(e => {
                    if (e.manifest.categories) {
                        const lowerCaseCategories = e.manifest.categories.map(c => c.toLowerCase());
                        return lowerCaseCategories.indexOf(category.toLowerCase()) > -1;
                    }
                    return false;
                });
            }
            else if (category === '') {
                console.log('Possible Categories: ');
                categories.forEach(category => {
                    console.log(category);
                });
                return;
            }
            extensions.forEach(e => console.log(getId(e.manifest, showVersions)));
        }
        async installExtensions(extensions, force) {
            const failed = [];
            const installedExtensionsManifests = [];
            if (extensions.length) {
                console.log(nls_1.localize('installingExtensions', "Installing extensions..."));
            }
            for (const extension of extensions) {
                try {
                    const manifest = await this.installExtension(extension, force);
                    if (manifest) {
                        installedExtensionsManifests.push(manifest);
                    }
                }
                catch (err) {
                    console.error(err.message || err.stack || err);
                    failed.push(extension);
                }
            }
            if (installedExtensionsManifests.some(manifest => extensions_1.isLanguagePackExtension(manifest))) {
                await this.updateLocalizationsCache();
            }
            return failed.length ? Promise.reject(nls_1.localize('installation failed', "Failed Installing Extensions: {0}", failed.join(', '))) : Promise.resolve();
        }
        async installExtension(extension, force) {
            if (/\.vsix$/i.test(extension)) {
                extension = path.isAbsolute(extension) ? extension : path.join(process.cwd(), extension);
                const manifest = await extensionManagementUtil_2.getManifest(extension);
                const valid = await this.validate(manifest, force);
                if (valid) {
                    return this.extensionManagementService.install(uri_1.URI.file(extension)).then(id => {
                        console.log(nls_1.localize('successVsixInstall', "Extension '{0}' was successfully installed.", labels_1.getBaseLabel(extension)));
                        return manifest;
                    }, error => {
                        if (errors_1.isPromiseCanceledError(error)) {
                            console.log(nls_1.localize('cancelVsixInstall', "Cancelled installing extension '{0}'.", labels_1.getBaseLabel(extension)));
                            return null;
                        }
                        else {
                            return Promise.reject(error);
                        }
                    });
                }
                return null;
            }
            const [id, version] = getIdAndVersion(extension);
            return this.extensionManagementService.getInstalled(1 /* User */)
                .then(installed => this.extensionGalleryService.getCompatibleExtension({ id }, version)
                .then(null, err => {
                if (err.responseText) {
                    try {
                        const response = JSON.parse(err.responseText);
                        return Promise.reject(response.message);
                    }
                    catch (e) {
                        // noop
                    }
                }
                return Promise.reject(err);
            })
                .then(async (extension) => {
                if (!extension) {
                    return Promise.reject(new Error(`${notFound(version ? `${id}@${version}` : id)}\n${useId}`));
                }
                const manifest = await this.extensionGalleryService.getManifest(extension, cancellation_1.CancellationToken.None);
                const [installedExtension] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
                if (installedExtension) {
                    if (extension.version === installedExtension.manifest.version) {
                        console.log(nls_1.localize('alreadyInstalled', "Extension '{0}' is already installed.", version ? `${id}@${version}` : id));
                        return Promise.resolve(null);
                    }
                    if (!version && !force) {
                        console.log(nls_1.localize('forceUpdate', "Extension '{0}' v{1} is already installed, but a newer version {2} is available in the marketplace. Use '--force' option to update to newer version.", id, installedExtension.manifest.version, extension.version));
                        return Promise.resolve(null);
                    }
                    console.log(nls_1.localize('updateMessage', "Updating the extension '{0}' to the version {1}", id, extension.version));
                }
                await this.installFromGallery(id, extension);
                return manifest;
            }));
        }
        async validate(manifest, force) {
            if (!manifest) {
                throw new Error('Invalid vsix');
            }
            const extensionIdentifier = { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) };
            const installedExtensions = await this.extensionManagementService.getInstalled(1 /* User */);
            const newer = installedExtensions.filter(local => extensionManagementUtil_1.areSameExtensions(extensionIdentifier, local.identifier) && semver.gt(local.manifest.version, manifest.version))[0];
            if (newer && !force) {
                console.log(nls_1.localize('forceDowngrade', "A newer version of extension '{0}' v{1} is already installed. Use '--force' option to downgrade to older version.", newer.identifier.id, newer.manifest.version, manifest.version));
                return false;
            }
            return true;
        }
        async installFromGallery(id, extension) {
            console.log(nls_1.localize('installing', "Installing extension '{0}' v{1}...", id, extension.version));
            try {
                await this.extensionManagementService.installFromGallery(extension);
                console.log(nls_1.localize('successInstall', "Extension '{0}' v{1} was successfully installed.", id, extension.version));
            }
            catch (error) {
                if (errors_1.isPromiseCanceledError(error)) {
                    console.log(nls_1.localize('cancelVsixInstall', "Cancelled installing extension '{0}'.", id));
                }
                else {
                    throw error;
                }
            }
        }
        async uninstallExtension(extensions) {
            async function getExtensionId(extensionDescription) {
                if (!/\.vsix$/i.test(extensionDescription)) {
                    return extensionDescription;
                }
                const zipPath = path.isAbsolute(extensionDescription) ? extensionDescription : path.join(process.cwd(), extensionDescription);
                const manifest = await extensionManagementUtil_2.getManifest(zipPath);
                return getId(manifest);
            }
            const uninstalledExtensions = [];
            for (const extension of extensions) {
                const id = await getExtensionId(extension);
                const installed = await this.extensionManagementService.getInstalled(1 /* User */);
                const [extensionToUninstall] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
                if (!extensionToUninstall) {
                    return Promise.reject(new Error(`${notInstalled(id)}\n${useId}`));
                }
                console.log(nls_1.localize('uninstalling', "Uninstalling {0}...", id));
                await this.extensionManagementService.uninstall(extensionToUninstall, true);
                uninstalledExtensions.push(extensionToUninstall);
                console.log(nls_1.localize('successUninstall', "Extension '{0}' was successfully uninstalled!", id));
            }
            if (uninstalledExtensions.some(e => extensions_1.isLanguagePackExtension(e.manifest))) {
                await this.updateLocalizationsCache();
            }
        }
        async locateExtension(extensions) {
            const installed = await this.extensionManagementService.getInstalled();
            extensions.forEach(e => {
                installed.forEach(i => {
                    if (i.identifier.id === e) {
                        if (i.location.scheme === network_1.Schemas.file) {
                            console.log(i.location.fsPath);
                            return;
                        }
                    }
                });
            });
        }
        async updateLocalizationsCache() {
            const localizationService = this.instantiationService.createInstance(localizations_1.LocalizationsService);
            await localizationService.update();
            localizationService.dispose();
        }
    };
    Main = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, extensionManagement_1.IExtensionManagementService),
        __param(3, extensionManagement_1.IExtensionGalleryService)
    ], Main);
    exports.Main = Main;
    const eventPrefix = 'monacoworkbench';
    async function main(argv) {
        const services = new serviceCollection_1.ServiceCollection();
        const disposables = new lifecycle_1.DisposableStore();
        const environmentService = new environmentService_1.EnvironmentService(argv, process.execPath);
        const logService = new spdlogService_1.SpdLogService('cli', environmentService.logsPath, log_1.getLogLevel(environmentService));
        process.once('exit', () => logService.dispose());
        logService.info('main', argv);
        await Promise.all([environmentService.appSettingsHome.fsPath, environmentService.extensionsPath]
            .map((path) => path ? pfs_1.mkdirp(path) : undefined));
        const configurationService = new configurationService_1.ConfigurationService(environmentService.settingsResource);
        disposables.add(configurationService);
        await configurationService.initialize();
        services.set(environment_1.IEnvironmentService, environmentService);
        services.set(log_1.ILogService, logService);
        services.set(configuration_1.IConfigurationService, configurationService);
        services.set(state_1.IStateService, new descriptors_1.SyncDescriptor(stateService_1.StateService));
        services.set(productService_1.IProductService, Object.assign({ _serviceBrand: undefined }, product_1.default));
        // Files
        const fileService = new fileService_1.FileService(logService);
        disposables.add(fileService);
        services.set(files_1.IFileService, fileService);
        const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
        disposables.add(diskFileSystemProvider);
        fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        const instantiationService = new instantiationService_1.InstantiationService(services);
        return instantiationService.invokeFunction(async (accessor) => {
            const envService = accessor.get(environment_1.IEnvironmentService);
            const stateService = accessor.get(state_1.IStateService);
            const { appRoot, extensionsPath, extensionDevelopmentLocationURI: extensionDevelopmentLocationURI, isBuilt, installSourcePath } = envService;
            const services = new serviceCollection_1.ServiceCollection();
            services.set(request_1.IRequestService, new descriptors_1.SyncDescriptor(requestService_1.RequestService));
            services.set(extensionManagement_1.IExtensionManagementService, new descriptors_1.SyncDescriptor(extensionManagementService_1.ExtensionManagementService));
            services.set(extensionManagement_1.IExtensionGalleryService, new descriptors_1.SyncDescriptor(extensionGalleryService_1.ExtensionGalleryService));
            const appenders = [];
            if (isBuilt && !extensionDevelopmentLocationURI && !envService.args['disable-telemetry'] && product_1.default.enableTelemetry) {
                if (product_1.default.aiConfig && product_1.default.aiConfig.asimovKey) {
                    appenders.push(new appInsightsAppender_1.AppInsightsAppender(eventPrefix, null, product_1.default.aiConfig.asimovKey, logService));
                }
                const config = {
                    appender: telemetryUtils_1.combinedAppender(...appenders),
                    commonProperties: commonProperties_1.resolveCommonProperties(product_1.default.commit, product_1.default.version, stateService.getItem('telemetry.machineId'), product_1.default.msftInternalDomains, installSourcePath),
                    piiPaths: extensionsPath ? [appRoot, extensionsPath] : [appRoot]
                };
                services.set(telemetry_1.ITelemetryService, new descriptors_1.SyncDescriptor(telemetryService_1.TelemetryService, [config]));
            }
            else {
                services.set(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            }
            const instantiationService2 = instantiationService.createChild(services);
            const main = instantiationService2.createInstance(Main);
            try {
                await main.run(argv);
                // Flush the remaining data in AI adapter.
                await telemetryUtils_1.combinedAppender(...appenders).flush();
            }
            finally {
                disposables.dispose();
            }
        });
    }
    exports.main = main;
});
//# sourceMappingURL=cliProcessMain.js.map