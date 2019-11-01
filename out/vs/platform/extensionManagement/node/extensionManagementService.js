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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/base/node/zip", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "../common/extensionNls", "vs/platform/environment/common/environment", "vs/base/common/async", "vs/base/common/event", "semver-umd", "vs/base/common/uri", "vs/platform/product/common/product", "vs/base/common/platform", "vs/platform/log/common/log", "vs/platform/extensionManagement/node/extensionsManifestCache", "vs/platform/extensionManagement/node/extensionLifecycle", "vs/base/common/errorMessage", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensionValidator", "os", "vs/base/common/uuid", "vs/platform/download/common/download", "vs/platform/instantiation/common/instantiation", "vs/base/common/network", "vs/base/common/cancellation", "vs/base/common/amd", "vs/platform/extensionManagement/node/extensionManagementUtil"], function (require, exports, nls, path, pfs, objects_1, lifecycle_1, arrays_1, zip_1, extensionManagement_1, extensionManagementUtil_1, extensionNls_1, environment_1, async_1, event_1, semver, uri_1, product_1, platform_1, log_1, extensionsManifestCache_1, extensionLifecycle_1, errorMessage_1, telemetry_1, extensionValidator_1, os_1, uuid_1, download_1, instantiation_1, network_1, cancellation_1, amd_1, extensionManagementUtil_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ERROR_SCANNING_SYS_EXTENSIONS = 'scanningSystem';
    const ERROR_SCANNING_USER_EXTENSIONS = 'scanningUser';
    const INSTALL_ERROR_UNSET_UNINSTALLED = 'unsetUninstalled';
    const INSTALL_ERROR_DOWNLOADING = 'downloading';
    const INSTALL_ERROR_VALIDATING = 'validating';
    const INSTALL_ERROR_LOCAL = 'local';
    const INSTALL_ERROR_EXTRACTING = 'extracting';
    const INSTALL_ERROR_RENAMING = 'renaming';
    const INSTALL_ERROR_DELETING = 'deleting';
    const ERROR_UNKNOWN = 'unknown';
    class ExtensionManagementError extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
    }
    exports.ExtensionManagementError = ExtensionManagementError;
    function parseManifest(raw) {
        return new Promise((c, e) => {
            try {
                const manifest = JSON.parse(raw);
                const metadata = manifest.__metadata || null;
                delete manifest.__metadata;
                c({ manifest, metadata });
            }
            catch (err) {
                e(new Error(nls.localize('invalidManifest', "Extension invalid: package.json is not a JSON file.")));
            }
        });
    }
    function readManifest(extensionPath) {
        const promises = [
            pfs.readFile(path.join(extensionPath, 'package.json'), 'utf8')
                .then(raw => parseManifest(raw)),
            pfs.readFile(path.join(extensionPath, 'package.nls.json'), 'utf8')
                .then(undefined, err => err.code !== 'ENOENT' ? Promise.reject(err) : '{}')
                .then(raw => JSON.parse(raw))
        ];
        return Promise.all(promises).then(([{ manifest, metadata }, translations]) => {
            return {
                manifest: extensionNls_1.localizeManifest(manifest, translations),
                metadata
            };
        });
    }
    let ExtensionManagementService = class ExtensionManagementService extends lifecycle_1.Disposable {
        constructor(environmentService, galleryService, logService, downloadService, telemetryService) {
            super();
            this.environmentService = environmentService;
            this.galleryService = galleryService;
            this.logService = logService;
            this.downloadService = downloadService;
            this.telemetryService = telemetryService;
            this.lastReportTimestamp = 0;
            this.installingExtensions = new Map();
            this.uninstallingExtensions = new Map();
            this._onInstallExtension = this._register(new event_1.Emitter());
            this.onInstallExtension = this._onInstallExtension.event;
            this._onDidInstallExtension = this._register(new event_1.Emitter());
            this.onDidInstallExtension = this._onDidInstallExtension.event;
            this._onUninstallExtension = this._register(new event_1.Emitter());
            this.onUninstallExtension = this._onUninstallExtension.event;
            this._onDidUninstallExtension = this._register(new event_1.Emitter());
            this.onDidUninstallExtension = this._onDidUninstallExtension.event;
            this._devSystemExtensionsPath = null;
            this._devSystemExtensionsFilePath = null;
            this.systemExtensionsPath = environmentService.builtinExtensionsPath;
            this.extensionsPath = environmentService.extensionsPath;
            this.uninstalledPath = path.join(this.extensionsPath, '.obsolete');
            this.uninstalledFileLimiter = new async_1.Queue();
            this.manifestCache = this._register(new extensionsManifestCache_1.ExtensionsManifestCache(environmentService, this));
            this.extensionLifecycle = this._register(new extensionLifecycle_1.ExtensionsLifecycle(environmentService, this.logService));
            this._register(lifecycle_1.toDisposable(() => {
                this.installingExtensions.forEach(promise => promise.cancel());
                this.uninstallingExtensions.forEach(promise => promise.cancel());
                this.installingExtensions.clear();
                this.uninstallingExtensions.clear();
            }));
        }
        zip(extension) {
            this.logService.trace('ExtensionManagementService#zip', extension.identifier.id);
            return this.collectFiles(extension)
                .then(files => zip_1.zip(path.join(os_1.tmpdir(), uuid_1.generateUuid()), files))
                .then(path => uri_1.URI.file(path));
        }
        unzip(zipLocation, type) {
            this.logService.trace('ExtensionManagementService#unzip', zipLocation.toString());
            return this.install(zipLocation, type).then(local => local.identifier);
        }
        async getManifest(vsix) {
            const downloadLocation = await this.downloadVsix(vsix);
            const zipPath = path.resolve(downloadLocation.fsPath);
            return extensionManagementUtil_2.getManifest(zipPath);
        }
        collectFiles(extension) {
            const collectFilesFromDirectory = async (dir) => {
                let entries = await pfs.readdir(dir);
                entries = entries.map(e => path.join(dir, e));
                const stats = await Promise.all(entries.map(e => pfs.stat(e)));
                let promise = Promise.resolve([]);
                stats.forEach((stat, index) => {
                    const entry = entries[index];
                    if (stat.isFile()) {
                        promise = promise.then(result => ([...result, entry]));
                    }
                    if (stat.isDirectory()) {
                        promise = promise
                            .then(result => collectFilesFromDirectory(entry)
                            .then(files => ([...result, ...files])));
                    }
                });
                return promise;
            };
            return collectFilesFromDirectory(extension.location.fsPath)
                .then(files => files.map(f => ({ path: `extension/${path.relative(extension.location.fsPath, f)}`, localPath: f })));
        }
        install(vsix, type = 1 /* User */) {
            this.logService.trace('ExtensionManagementService#install', vsix.toString());
            return async_1.createCancelablePromise(token => {
                return this.downloadVsix(vsix).then(downloadLocation => {
                    const zipPath = path.resolve(downloadLocation.fsPath);
                    return extensionManagementUtil_2.getManifest(zipPath)
                        .then(manifest => {
                        const identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) };
                        let operation = 1 /* Install */;
                        if (manifest.engines && manifest.engines.vscode && !extensionValidator_1.isEngineValid(manifest.engines.vscode, product_1.default.version)) {
                            return Promise.reject(new Error(nls.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", identifier.id, product_1.default.version)));
                        }
                        const identifierWithVersion = new extensionManagementUtil_1.ExtensionIdentifierWithVersion(identifier, manifest.version);
                        return this.getInstalled(1 /* User */)
                            .then(installedExtensions => {
                            const existing = installedExtensions.filter(i => extensionManagementUtil_1.areSameExtensions(identifier, i.identifier))[0];
                            if (existing) {
                                operation = 2 /* Update */;
                                if (identifierWithVersion.equals(new extensionManagementUtil_1.ExtensionIdentifierWithVersion(existing.identifier, existing.manifest.version))) {
                                    return this.removeExtension(existing, 'existing').then(null, e => Promise.reject(new Error(nls.localize('restartCode', "Please restart VS Code before reinstalling {0}.", manifest.displayName || manifest.name))));
                                }
                                else if (semver.gt(existing.manifest.version, manifest.version)) {
                                    return this.uninstall(existing, true);
                                }
                            }
                            return undefined;
                        })
                            .then(() => {
                            this.logService.info('Installing the extension:', identifier.id);
                            this._onInstallExtension.fire({ identifier, zipPath });
                            return this.getMetadata(extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name))
                                .then(metadata => this.installFromZipPath(identifierWithVersion, zipPath, metadata, type, operation, token), () => this.installFromZipPath(identifierWithVersion, zipPath, null, type, operation, token))
                                .then(local => { this.logService.info('Successfully installed the extension:', identifier.id); return local; }, e => {
                                this.logService.error('Failed to install the extension:', identifier.id, e.message);
                                return Promise.reject(e);
                            });
                        });
                    });
                });
            });
        }
        downloadVsix(vsix) {
            if (vsix.scheme === network_1.Schemas.file) {
                return Promise.resolve(vsix);
            }
            if (!this.downloadService) {
                throw new Error('Download service is not available');
            }
            const downloadedLocation = path.join(os_1.tmpdir(), uuid_1.generateUuid());
            return this.downloadService.download(vsix, uri_1.URI.file(downloadedLocation)).then(() => uri_1.URI.file(downloadedLocation));
        }
        installFromZipPath(identifierWithVersion, zipPath, metadata, type, operation, token) {
            return this.toNonCancellablePromise(this.installExtension({ zipPath, identifierWithVersion, metadata }, type, token)
                .then(local => this.installDependenciesAndPackExtensions(local, null)
                .then(() => local, error => {
                if (arrays_1.isNonEmptyArray(local.manifest.extensionDependencies)) {
                    this.logService.warn(`Cannot install dependencies of extension:`, local.identifier.id, error.message);
                }
                if (arrays_1.isNonEmptyArray(local.manifest.extensionPack)) {
                    this.logService.warn(`Cannot install packed extensions of extension:`, local.identifier.id, error.message);
                }
                return local;
            }))
                .then(local => { this._onDidInstallExtension.fire({ identifier: identifierWithVersion.identifier, zipPath, local, operation }); return local; }, error => { this._onDidInstallExtension.fire({ identifier: identifierWithVersion.identifier, zipPath, operation, error }); return Promise.reject(error); }));
        }
        async installFromGallery(extension) {
            if (!this.galleryService.isEnabled()) {
                return Promise.reject(new Error(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled")));
            }
            const startTime = new Date().getTime();
            const onDidInstallExtensionSuccess = (extension, operation, local) => {
                this.logService.info(`Extensions installed successfully:`, extension.identifier.id);
                this._onDidInstallExtension.fire({ identifier: extension.identifier, gallery: extension, local, operation });
                this.reportTelemetry(this.getTelemetryEvent(operation), extensionManagementUtil_1.getGalleryExtensionTelemetryData(extension), new Date().getTime() - startTime, undefined);
            };
            const onDidInstallExtensionFailure = (extension, operation, error) => {
                const errorCode = error && error.code ? error.code : ERROR_UNKNOWN;
                this.logService.error(`Failed to install extension:`, extension.identifier.id, error ? error.message : errorCode);
                this._onDidInstallExtension.fire({ identifier: extension.identifier, gallery: extension, operation, error: errorCode });
                this.reportTelemetry(this.getTelemetryEvent(operation), extensionManagementUtil_1.getGalleryExtensionTelemetryData(extension), new Date().getTime() - startTime, error);
                if (error instanceof Error) {
                    error.name = errorCode;
                }
            };
            try {
                extension = await this.checkAndGetCompatibleVersion(extension);
            }
            catch (error) {
                onDidInstallExtensionFailure(extension, 1 /* Install */, error);
                return Promise.reject(error);
            }
            const key = new extensionManagementUtil_1.ExtensionIdentifierWithVersion(extension.identifier, extension.version).key();
            let cancellablePromise = this.installingExtensions.get(key);
            if (!cancellablePromise) {
                this.logService.info('Installing extension:', extension.identifier.id);
                this._onInstallExtension.fire({ identifier: extension.identifier, gallery: extension });
                let operation = 1 /* Install */;
                let cancellationToken, successCallback, errorCallback;
                cancellablePromise = async_1.createCancelablePromise(token => { cancellationToken = token; return new Promise((c, e) => { successCallback = c; errorCallback = e; }); });
                this.installingExtensions.set(key, cancellablePromise);
                try {
                    const installed = await this.getInstalled(1 /* User */);
                    const existingExtension = installed.filter(i => extensionManagementUtil_1.areSameExtensions(i.identifier, extension.identifier))[0];
                    if (existingExtension) {
                        operation = 2 /* Update */;
                    }
                    this.downloadInstallableExtension(extension, operation)
                        .then(installableExtension => this.installExtension(installableExtension, 1 /* User */, cancellationToken)
                        .then(local => pfs.rimraf(installableExtension.zipPath).finally(() => null).then(() => local)))
                        .then(local => this.installDependenciesAndPackExtensions(local, existingExtension)
                        .then(() => local, error => this.uninstall(local, true).then(() => Promise.reject(error), () => Promise.reject(error))))
                        .then(async (local) => {
                        if (existingExtension && semver.neq(existingExtension.manifest.version, extension.version)) {
                            await this.setUninstalled(existingExtension);
                        }
                        this.installingExtensions.delete(key);
                        onDidInstallExtensionSuccess(extension, operation, local);
                        successCallback(local);
                    }, error => {
                        this.installingExtensions.delete(key);
                        onDidInstallExtensionFailure(extension, operation, error);
                        errorCallback(error);
                    });
                }
                catch (error) {
                    this.installingExtensions.delete(key);
                    onDidInstallExtensionFailure(extension, operation, error);
                    return Promise.reject(error);
                }
            }
            return cancellablePromise;
        }
        async checkAndGetCompatibleVersion(extension) {
            if (await this.isMalicious(extension)) {
                return Promise.reject(new ExtensionManagementError(nls.localize('malicious extension', "Can't install extension since it was reported to be problematic."), extensionManagement_1.INSTALL_ERROR_MALICIOUS));
            }
            const compatibleExtension = await this.galleryService.getCompatibleExtension(extension);
            if (!compatibleExtension) {
                return Promise.reject(new ExtensionManagementError(nls.localize('notFoundCompatibleDependency', "Unable to install '{0}' extension because it is not compatible with the current version of VS Code (version {1}).", extension.identifier.id, product_1.default.version), extensionManagement_1.INSTALL_ERROR_INCOMPATIBLE));
            }
            return compatibleExtension;
        }
        reinstallFromGallery(extension) {
            this.logService.trace('ExtensionManagementService#reinstallFromGallery', extension.identifier.id);
            if (!this.galleryService.isEnabled()) {
                return Promise.reject(new Error(nls.localize('MarketPlaceDisabled', "Marketplace is not enabled")));
            }
            return this.findGalleryExtension(extension)
                .then(galleryExtension => {
                if (galleryExtension) {
                    return this.setUninstalled(extension)
                        .then(() => this.removeUninstalledExtension(extension)
                        .then(() => this.installFromGallery(galleryExtension), e => Promise.reject(new Error(nls.localize('removeError', "Error while removing the extension: {0}. Please Quit and Start VS Code before trying again.", errorMessage_1.toErrorMessage(e))))));
                }
                return Promise.reject(new Error(nls.localize('Not a Marketplace extension', "Only Marketplace Extensions can be reinstalled")));
            });
        }
        getTelemetryEvent(operation) {
            return operation === 2 /* Update */ ? 'extensionGallery:update' : 'extensionGallery:install';
        }
        isMalicious(extension) {
            return this.getExtensionsReport()
                .then(report => extensionManagementUtil_1.getMaliciousExtensionsSet(report).has(extension.identifier.id));
        }
        downloadInstallableExtension(extension, operation) {
            const metadata = {
                id: extension.identifier.uuid,
                publisherId: extension.publisherId,
                publisherDisplayName: extension.publisherDisplayName,
            };
            this.logService.trace('Started downloading extension:', extension.identifier.id);
            return this.galleryService.download(extension, uri_1.URI.file(os_1.tmpdir()), operation)
                .then(zip => {
                const zipPath = zip.fsPath;
                this.logService.info('Downloaded extension:', extension.identifier.id, zipPath);
                return extensionManagementUtil_2.getManifest(zipPath)
                    .then(manifest => ({ zipPath, identifierWithVersion: new extensionManagementUtil_1.ExtensionIdentifierWithVersion(extension.identifier, manifest.version), metadata }), error => Promise.reject(new ExtensionManagementError(this.joinErrors(error).message, INSTALL_ERROR_VALIDATING)));
            }, error => Promise.reject(new ExtensionManagementError(this.joinErrors(error).message, INSTALL_ERROR_DOWNLOADING)));
        }
        installExtension(installableExtension, type, token) {
            return this.unsetUninstalledAndGetLocal(installableExtension.identifierWithVersion)
                .then(local => {
                if (local) {
                    return local;
                }
                return this.extractAndInstall(installableExtension, type, token);
            }, e => {
                if (platform_1.isMacintosh) {
                    return Promise.reject(new ExtensionManagementError(nls.localize('quitCode', "Unable to install the extension. Please Quit and Start VS Code before reinstalling."), INSTALL_ERROR_UNSET_UNINSTALLED));
                }
                return Promise.reject(new ExtensionManagementError(nls.localize('exitCode', "Unable to install the extension. Please Exit and Start VS Code before reinstalling."), INSTALL_ERROR_UNSET_UNINSTALLED));
            });
        }
        unsetUninstalledAndGetLocal(identifierWithVersion) {
            return this.isUninstalled(identifierWithVersion)
                .then(isUninstalled => {
                if (isUninstalled) {
                    this.logService.trace('Removing the extension from uninstalled list:', identifierWithVersion.identifier.id);
                    // If the same version of extension is marked as uninstalled, remove it from there and return the local.
                    return this.unsetUninstalled(identifierWithVersion)
                        .then(() => {
                        this.logService.info('Removed the extension from uninstalled list:', identifierWithVersion.identifier.id);
                        return this.getInstalled(1 /* User */);
                    })
                        .then(installed => installed.filter(i => new extensionManagementUtil_1.ExtensionIdentifierWithVersion(i.identifier, i.manifest.version).equals(identifierWithVersion))[0]);
                }
                return null;
            });
        }
        extractAndInstall({ zipPath, identifierWithVersion, metadata }, type, token) {
            const { identifier } = identifierWithVersion;
            const location = type === 1 /* User */ ? this.extensionsPath : this.systemExtensionsPath;
            const folderName = identifierWithVersion.key();
            const tempPath = path.join(location, `.${folderName}`);
            const extensionPath = path.join(location, folderName);
            return pfs.rimraf(extensionPath)
                .then(() => this.extractAndRename(identifier, zipPath, tempPath, extensionPath, token), e => Promise.reject(new ExtensionManagementError(nls.localize('errorDeleting', "Unable to delete the existing folder '{0}' while installing the extension '{1}'. Please delete the folder manually and try again", extensionPath, identifier.id), INSTALL_ERROR_DELETING)))
                .then(() => this.scanExtension(folderName, location, type))
                .then(local => {
                if (!local) {
                    return Promise.reject(nls.localize('cannot read', "Cannot read the extension from {0}", location));
                }
                this.logService.info('Installation completed.', identifier.id);
                if (metadata) {
                    this.setMetadata(local, metadata);
                    return this.saveMetadataForLocalExtension(local);
                }
                return local;
            }, error => pfs.rimraf(extensionPath).then(() => Promise.reject(error), () => Promise.reject(error)));
        }
        extractAndRename(identifier, zipPath, extractPath, renamePath, token) {
            return this.extract(identifier, zipPath, extractPath, token)
                .then(() => this.rename(identifier, extractPath, renamePath, Date.now() + (2 * 60 * 1000) /* Retry for 2 minutes */)
                .then(() => this.logService.info('Renamed to', renamePath), e => {
                this.logService.info('Rename failed. Deleting from extracted location', extractPath);
                return pfs.rimraf(extractPath).finally(() => null).then(() => Promise.reject(e));
            }));
        }
        extract(identifier, zipPath, extractPath, token) {
            this.logService.trace(`Started extracting the extension from ${zipPath} to ${extractPath}`);
            return pfs.rimraf(extractPath)
                .then(() => zip_1.extract(zipPath, extractPath, { sourcePath: 'extension', overwrite: true }, token)
                .then(() => this.logService.info(`Extracted extension to ${extractPath}:`, identifier.id), e => pfs.rimraf(extractPath).finally(() => null)
                .then(() => Promise.reject(new ExtensionManagementError(e.message, e instanceof zip_1.ExtractError && e.type ? e.type : INSTALL_ERROR_EXTRACTING)))), e => Promise.reject(new ExtensionManagementError(this.joinErrors(e).message, INSTALL_ERROR_DELETING)));
        }
        rename(identifier, extractPath, renamePath, retryUntil) {
            return pfs.rename(extractPath, renamePath)
                .then(undefined, error => {
                if (platform_1.isWindows && error && error.code === 'EPERM' && Date.now() < retryUntil) {
                    this.logService.info(`Failed renaming ${extractPath} to ${renamePath} with 'EPERM' error. Trying again...`, identifier.id);
                    return this.rename(identifier, extractPath, renamePath, retryUntil);
                }
                return Promise.reject(new ExtensionManagementError(error.message || nls.localize('renameError', "Unknown error while renaming {0} to {1}", extractPath, renamePath), error.code || INSTALL_ERROR_RENAMING));
            });
        }
        async installDependenciesAndPackExtensions(installed, existing) {
            if (this.galleryService.isEnabled()) {
                const dependenciesAndPackExtensions = installed.manifest.extensionDependencies || [];
                if (installed.manifest.extensionPack) {
                    for (const extension of installed.manifest.extensionPack) {
                        // add only those extensions which are new in currently installed extension
                        if (!(existing && existing.manifest.extensionPack && existing.manifest.extensionPack.some(old => extensionManagementUtil_1.areSameExtensions({ id: old }, { id: extension })))) {
                            if (dependenciesAndPackExtensions.every(e => !extensionManagementUtil_1.areSameExtensions({ id: e }, { id: extension }))) {
                                dependenciesAndPackExtensions.push(extension);
                            }
                        }
                    }
                }
                if (dependenciesAndPackExtensions.length) {
                    return this.getInstalled()
                        .then(installed => {
                        // filter out installed extensions
                        const names = dependenciesAndPackExtensions.filter(id => installed.every(({ identifier: galleryIdentifier }) => !extensionManagementUtil_1.areSameExtensions(galleryIdentifier, { id })));
                        if (names.length) {
                            return this.galleryService.query({ names, pageSize: dependenciesAndPackExtensions.length }, cancellation_1.CancellationToken.None)
                                .then(galleryResult => {
                                const extensionsToInstall = galleryResult.firstPage;
                                return Promise.all(extensionsToInstall.map(e => this.installFromGallery(e)))
                                    .then(() => null, errors => this.rollback(extensionsToInstall).then(() => Promise.reject(errors), () => Promise.reject(errors)));
                            });
                        }
                        return null;
                    });
                }
            }
            return Promise.resolve(undefined);
        }
        rollback(extensions) {
            return this.getInstalled(1 /* User */)
                .then(installed => Promise.all(installed.filter(local => extensions.some(galleryExtension => new extensionManagementUtil_1.ExtensionIdentifierWithVersion(local.identifier, local.manifest.version).equals(new extensionManagementUtil_1.ExtensionIdentifierWithVersion(galleryExtension.identifier, galleryExtension.version)))) // Check with version because we want to rollback the exact version
                .map(local => this.uninstall(local, true))))
                .then(() => undefined, () => undefined);
        }
        uninstall(extension, force = false) {
            this.logService.trace('ExtensionManagementService#uninstall', extension.identifier.id);
            return this.toNonCancellablePromise(this.getInstalled(1 /* User */)
                .then(installed => {
                const extensionToUninstall = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0];
                if (extensionToUninstall) {
                    return this.checkForDependenciesAndUninstall(extensionToUninstall, installed).then(() => null, error => Promise.reject(this.joinErrors(error)));
                }
                else {
                    return Promise.reject(new Error(nls.localize('notInstalled', "Extension '{0}' is not installed.", extension.manifest.displayName || extension.manifest.name)));
                }
            }));
        }
        updateMetadata(local, metadata) {
            this.logService.trace('ExtensionManagementService#updateMetadata', local.identifier.id);
            local.metadata = metadata;
            return this.saveMetadataForLocalExtension(local)
                .then(localExtension => {
                this.manifestCache.invalidate();
                return localExtension;
            });
        }
        saveMetadataForLocalExtension(local) {
            if (!local.metadata) {
                return Promise.resolve(local);
            }
            const manifestPath = path.join(local.location.fsPath, 'package.json');
            return pfs.readFile(manifestPath, 'utf8')
                .then(raw => parseManifest(raw))
                .then(({ manifest }) => objects_1.assign(manifest, { __metadata: local.metadata }))
                .then(manifest => pfs.writeFile(manifestPath, JSON.stringify(manifest, null, '\t')))
                .then(() => local);
        }
        getMetadata(extensionName) {
            return this.findGalleryExtensionByName(extensionName)
                .then(galleryExtension => galleryExtension ? { id: galleryExtension.identifier.uuid, publisherDisplayName: galleryExtension.publisherDisplayName, publisherId: galleryExtension.publisherId } : null);
        }
        findGalleryExtension(local) {
            if (local.identifier.uuid) {
                return this.findGalleryExtensionById(local.identifier.uuid)
                    .then(galleryExtension => galleryExtension ? galleryExtension : this.findGalleryExtensionByName(local.identifier.id));
            }
            return this.findGalleryExtensionByName(local.identifier.id);
        }
        findGalleryExtensionById(uuid) {
            return this.galleryService.query({ ids: [uuid], pageSize: 1 }, cancellation_1.CancellationToken.None).then(galleryResult => galleryResult.firstPage[0]);
        }
        findGalleryExtensionByName(name) {
            return this.galleryService.query({ names: [name], pageSize: 1 }, cancellation_1.CancellationToken.None).then(galleryResult => galleryResult.firstPage[0]);
        }
        joinErrors(errorOrErrors) {
            const errors = Array.isArray(errorOrErrors) ? errorOrErrors : [errorOrErrors];
            if (errors.length === 1) {
                return errors[0] instanceof Error ? errors[0] : new Error(errors[0]);
            }
            return errors.reduce((previousValue, currentValue) => {
                return new Error(`${previousValue.message}${previousValue.message ? ',' : ''}${currentValue instanceof Error ? currentValue.message : currentValue}`);
            }, new Error(''));
        }
        checkForDependenciesAndUninstall(extension, installed) {
            return this.preUninstallExtension(extension)
                .then(() => {
                const packedExtensions = this.getAllPackExtensionsToUninstall(extension, installed);
                if (packedExtensions.length) {
                    return this.uninstallExtensions(extension, packedExtensions, installed);
                }
                return this.uninstallExtensions(extension, [], installed);
            })
                .then(() => this.postUninstallExtension(extension), error => {
                this.postUninstallExtension(extension, new ExtensionManagementError(error instanceof Error ? error.message : error, INSTALL_ERROR_LOCAL));
                return Promise.reject(error);
            });
        }
        uninstallExtensions(extension, otherExtensionsToUninstall, installed) {
            const dependents = this.getDependents(extension, installed);
            if (dependents.length) {
                const remainingDependents = dependents.filter(dependent => extension !== dependent && otherExtensionsToUninstall.indexOf(dependent) === -1);
                if (remainingDependents.length) {
                    return Promise.reject(new Error(this.getDependentsErrorMessage(extension, remainingDependents)));
                }
            }
            return Promise.all([this.uninstallExtension(extension), ...otherExtensionsToUninstall.map(d => this.doUninstall(d))]).then(() => undefined);
        }
        getDependentsErrorMessage(extension, dependents) {
            if (dependents.length === 1) {
                return nls.localize('singleDependentError', "Cannot uninstall extension '{0}'. Extension '{1}' depends on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name);
            }
            if (dependents.length === 2) {
                return nls.localize('twoDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}' and '{2}' depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
            }
            return nls.localize('multipleDependentsError', "Cannot uninstall extension '{0}'. Extensions '{1}', '{2}' and others depend on this.", extension.manifest.displayName || extension.manifest.name, dependents[0].manifest.displayName || dependents[0].manifest.name, dependents[1].manifest.displayName || dependents[1].manifest.name);
        }
        getAllPackExtensionsToUninstall(extension, installed, checked = []) {
            if (checked.indexOf(extension) !== -1) {
                return [];
            }
            checked.push(extension);
            const extensionsPack = extension.manifest.extensionPack ? extension.manifest.extensionPack : [];
            if (extensionsPack.length) {
                const packedExtensions = installed.filter(i => extensionsPack.some(id => extensionManagementUtil_1.areSameExtensions({ id }, i.identifier)));
                const packOfPackedExtensions = [];
                for (const packedExtension of packedExtensions) {
                    packOfPackedExtensions.push(...this.getAllPackExtensionsToUninstall(packedExtension, installed, checked));
                }
                return [...packedExtensions, ...packOfPackedExtensions];
            }
            return [];
        }
        getDependents(extension, installed) {
            return installed.filter(e => e.manifest.extensionDependencies && e.manifest.extensionDependencies.some(id => extensionManagementUtil_1.areSameExtensions({ id }, extension.identifier)));
        }
        doUninstall(extension) {
            return this.preUninstallExtension(extension)
                .then(() => this.uninstallExtension(extension))
                .then(() => this.postUninstallExtension(extension), error => {
                this.postUninstallExtension(extension, new ExtensionManagementError(error instanceof Error ? error.message : error, INSTALL_ERROR_LOCAL));
                return Promise.reject(error);
            });
        }
        preUninstallExtension(extension) {
            return Promise.resolve(pfs.exists(extension.location.fsPath))
                .then(exists => exists ? null : Promise.reject(new Error(nls.localize('notExists', "Could not find extension"))))
                .then(() => {
                this.logService.info('Uninstalling extension:', extension.identifier.id);
                this._onUninstallExtension.fire(extension.identifier);
            });
        }
        uninstallExtension(local) {
            let promise = this.uninstallingExtensions.get(local.identifier.id);
            if (!promise) {
                // Set all versions of the extension as uninstalled
                promise = async_1.createCancelablePromise(token => this.scanUserExtensions(false)
                    .then(userExtensions => this.setUninstalled(...userExtensions.filter(u => extensionManagementUtil_1.areSameExtensions(u.identifier, local.identifier))))
                    .then(() => { this.uninstallingExtensions.delete(local.identifier.id); }));
                this.uninstallingExtensions.set(local.identifier.id, promise);
            }
            return promise;
        }
        async postUninstallExtension(extension, error) {
            if (error) {
                this.logService.error('Failed to uninstall extension:', extension.identifier.id, error.message);
            }
            else {
                this.logService.info('Successfully uninstalled extension:', extension.identifier.id);
                // only report if extension has a mapped gallery extension. UUID identifies the gallery extension.
                if (extension.identifier.uuid) {
                    await this.galleryService.reportStatistic(extension.manifest.publisher, extension.manifest.name, extension.manifest.version, "uninstall" /* Uninstall */);
                }
            }
            this.reportTelemetry('extensionGallery:uninstall', extensionManagementUtil_1.getLocalExtensionTelemetryData(extension), undefined, error);
            const errorcode = error ? error instanceof ExtensionManagementError ? error.code : ERROR_UNKNOWN : undefined;
            this._onDidUninstallExtension.fire({ identifier: extension.identifier, error: errorcode });
        }
        getInstalled(type = null) {
            const promises = [];
            if (type === null || type === 0 /* System */) {
                promises.push(this.scanSystemExtensions().then(null, e => Promise.reject(new ExtensionManagementError(this.joinErrors(e).message, ERROR_SCANNING_SYS_EXTENSIONS))));
            }
            if (type === null || type === 1 /* User */) {
                promises.push(this.scanUserExtensions(true).then(null, e => Promise.reject(new ExtensionManagementError(this.joinErrors(e).message, ERROR_SCANNING_USER_EXTENSIONS))));
            }
            return Promise.all(promises).then(arrays_1.flatten, errors => Promise.reject(this.joinErrors(errors)));
        }
        scanSystemExtensions() {
            this.logService.trace('Started scanning system extensions');
            const systemExtensionsPromise = this.scanExtensions(this.systemExtensionsPath, 0 /* System */)
                .then(result => {
                this.logService.trace('Scanned system extensions:', result.length);
                return result;
            });
            if (this.environmentService.isBuilt) {
                return systemExtensionsPromise;
            }
            // Scan other system extensions during development
            const devSystemExtensionsPromise = this.getDevSystemExtensionsList()
                .then(devSystemExtensionsList => {
                if (devSystemExtensionsList.length) {
                    return this.scanExtensions(this.devSystemExtensionsPath, 0 /* System */)
                        .then(result => {
                        this.logService.trace('Scanned dev system extensions:', result.length);
                        return result.filter(r => devSystemExtensionsList.some(id => extensionManagementUtil_1.areSameExtensions(r.identifier, { id })));
                    });
                }
                else {
                    return [];
                }
            });
            return Promise.all([systemExtensionsPromise, devSystemExtensionsPromise])
                .then(([systemExtensions, devSystemExtensions]) => [...systemExtensions, ...devSystemExtensions]);
        }
        scanUserExtensions(excludeOutdated) {
            this.logService.trace('Started scanning user extensions');
            return Promise.all([this.getUninstalledExtensions(), this.scanExtensions(this.extensionsPath, 1 /* User */)])
                .then(([uninstalled, extensions]) => {
                extensions = extensions.filter(e => !uninstalled[new extensionManagementUtil_1.ExtensionIdentifierWithVersion(e.identifier, e.manifest.version).key()]);
                if (excludeOutdated) {
                    const byExtension = extensionManagementUtil_1.groupByExtension(extensions, e => e.identifier);
                    extensions = byExtension.map(p => p.sort((a, b) => semver.rcompare(a.manifest.version, b.manifest.version))[0]);
                }
                this.logService.trace('Scanned user extensions:', extensions.length);
                return extensions;
            });
        }
        scanExtensions(root, type) {
            const limiter = new async_1.Limiter(10);
            return pfs.readdir(root)
                .then(extensionsFolders => Promise.all(extensionsFolders.map(extensionFolder => limiter.queue(() => this.scanExtension(extensionFolder, root, type)))))
                .then(extensions => extensions.filter(e => e && e.identifier));
        }
        scanExtension(folderName, root, type) {
            if (type === 1 /* User */ && folderName.indexOf('.') === 0) { // Do not consider user extension folder starting with `.`
                return Promise.resolve(null);
            }
            const extensionPath = path.join(root, folderName);
            return pfs.readdir(extensionPath)
                .then(children => readManifest(extensionPath)
                .then(({ manifest, metadata }) => {
                const readme = children.filter(child => /^readme(\.txt|\.md|)$/i.test(child))[0];
                const readmeUrl = readme ? uri_1.URI.file(path.join(extensionPath, readme)) : null;
                const changelog = children.filter(child => /^changelog(\.txt|\.md|)$/i.test(child))[0];
                const changelogUrl = changelog ? uri_1.URI.file(path.join(extensionPath, changelog)) : null;
                const identifier = { id: extensionManagementUtil_1.getGalleryExtensionId(manifest.publisher, manifest.name) };
                const local = { type, identifier, manifest, metadata, location: uri_1.URI.file(extensionPath), readmeUrl, changelogUrl };
                if (metadata) {
                    this.setMetadata(local, metadata);
                }
                return local;
            }))
                .then(undefined, () => null);
        }
        setMetadata(local, metadata) {
            local.metadata = metadata;
            local.identifier.uuid = metadata.id;
        }
        async removeDeprecatedExtensions() {
            await this.removeUninstalledExtensions();
            await this.removeOutdatedExtensions();
        }
        async removeUninstalledExtensions() {
            const uninstalled = await this.getUninstalledExtensions();
            const extensions = await this.scanExtensions(this.extensionsPath, 1 /* User */); // All user extensions
            const installed = new Set();
            for (const e of extensions) {
                if (!uninstalled[new extensionManagementUtil_1.ExtensionIdentifierWithVersion(e.identifier, e.manifest.version).key()]) {
                    installed.add(e.identifier.id.toLowerCase());
                }
            }
            const byExtension = extensionManagementUtil_1.groupByExtension(extensions, e => e.identifier);
            await Promise.all(byExtension.map(async (e) => {
                const latest = e.sort((a, b) => semver.rcompare(a.manifest.version, b.manifest.version))[0];
                if (!installed.has(latest.identifier.id.toLowerCase())) {
                    await this.extensionLifecycle.postUninstall(latest);
                }
            }));
            const toRemove = extensions.filter(e => uninstalled[new extensionManagementUtil_1.ExtensionIdentifierWithVersion(e.identifier, e.manifest.version).key()]);
            await Promise.all(toRemove.map(e => this.removeUninstalledExtension(e)));
        }
        removeOutdatedExtensions() {
            return this.scanExtensions(this.extensionsPath, 1 /* User */) // All user extensions
                .then(extensions => {
                const toRemove = [];
                // Outdated extensions
                const byExtension = extensionManagementUtil_1.groupByExtension(extensions, e => e.identifier);
                toRemove.push(...arrays_1.flatten(byExtension.map(p => p.sort((a, b) => semver.rcompare(a.manifest.version, b.manifest.version)).slice(1))));
                return Promise.all(toRemove.map(extension => this.removeExtension(extension, 'outdated')));
            }).then(() => undefined);
        }
        removeUninstalledExtension(extension) {
            return this.removeExtension(extension, 'uninstalled')
                .then(() => this.withUninstalledExtensions(uninstalled => delete uninstalled[new extensionManagementUtil_1.ExtensionIdentifierWithVersion(extension.identifier, extension.manifest.version).key()]))
                .then(() => undefined);
        }
        removeExtension(extension, type) {
            this.logService.trace(`Deleting ${type} extension from disk`, extension.identifier.id, extension.location.fsPath);
            return pfs.rimraf(extension.location.fsPath).then(() => this.logService.info('Deleted from disk', extension.identifier.id, extension.location.fsPath));
        }
        isUninstalled(identifier) {
            return this.filterUninstalled(identifier).then(uninstalled => uninstalled.length === 1);
        }
        filterUninstalled(...identifiers) {
            return this.withUninstalledExtensions(allUninstalled => {
                const uninstalled = [];
                for (const identifier of identifiers) {
                    if (!!allUninstalled[identifier.key()]) {
                        uninstalled.push(identifier.key());
                    }
                }
                return uninstalled;
            });
        }
        setUninstalled(...extensions) {
            const ids = extensions.map(e => new extensionManagementUtil_1.ExtensionIdentifierWithVersion(e.identifier, e.manifest.version));
            return this.withUninstalledExtensions(uninstalled => objects_1.assign(uninstalled, ids.reduce((result, id) => { result[id.key()] = true; return result; }, {})));
        }
        unsetUninstalled(extensionIdentifier) {
            return this.withUninstalledExtensions(uninstalled => delete uninstalled[extensionIdentifier.key()]);
        }
        getUninstalledExtensions() {
            return this.withUninstalledExtensions(uninstalled => uninstalled);
        }
        async withUninstalledExtensions(fn) {
            return await this.uninstalledFileLimiter.queue(() => {
                let result = null;
                return pfs.readFile(this.uninstalledPath, 'utf8')
                    .then(undefined, err => err.code === 'ENOENT' ? Promise.resolve('{}') : Promise.reject(err))
                    .then(raw => { try {
                    return JSON.parse(raw);
                }
                catch (e) {
                    return {};
                } })
                    .then(uninstalled => { result = fn(uninstalled); return uninstalled; })
                    .then(uninstalled => {
                    if (Object.keys(uninstalled).length === 0) {
                        return pfs.rimraf(this.uninstalledPath);
                    }
                    else {
                        const raw = JSON.stringify(uninstalled);
                        return pfs.writeFile(this.uninstalledPath, raw);
                    }
                })
                    .then(() => result);
            });
        }
        getExtensionsReport() {
            const now = new Date().getTime();
            if (!this.reportedExtensions || now - this.lastReportTimestamp > 1000 * 60 * 5) { // 5 minute cache freshness
                this.reportedExtensions = this.updateReportCache();
                this.lastReportTimestamp = now;
            }
            return this.reportedExtensions;
        }
        updateReportCache() {
            this.logService.trace('ExtensionManagementService.refreshReportedCache');
            return this.galleryService.getExtensionsReport()
                .then(result => {
                this.logService.trace(`ExtensionManagementService.refreshReportedCache - got ${result.length} reported extensions from service`);
                return result;
            }, err => {
                this.logService.trace('ExtensionManagementService.refreshReportedCache - failed to get extension report');
                return [];
            });
        }
        get devSystemExtensionsPath() {
            if (!this._devSystemExtensionsPath) {
                this._devSystemExtensionsPath = path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', '.build', 'builtInExtensions'));
            }
            return this._devSystemExtensionsPath;
        }
        get devSystemExtensionsFilePath() {
            if (!this._devSystemExtensionsFilePath) {
                this._devSystemExtensionsFilePath = path.normalize(path.join(amd_1.getPathFromAmdModule(require, ''), '..', 'build', 'builtInExtensions.json'));
            }
            return this._devSystemExtensionsFilePath;
        }
        getDevSystemExtensionsList() {
            return pfs.readFile(this.devSystemExtensionsFilePath, 'utf8')
                .then(raw => {
                const parsed = JSON.parse(raw);
                return parsed.map(({ name }) => name);
            });
        }
        toNonCancellablePromise(promise) {
            return new Promise((c, e) => promise.then(result => c(result), error => e(error)));
        }
        reportTelemetry(eventName, extensionData, duration, error) {
            const errorcode = error ? error instanceof ExtensionManagementError ? error.code : ERROR_UNKNOWN : undefined;
            /* __GDPR__
                "extensionGallery:install" : {
                    "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                    "recommendationReason": { "retiredFromVersion": "1.23.0", "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            /* __GDPR__
                "extensionGallery:uninstall" : {
                    "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            /* __GDPR__
                "extensionGallery:update" : {
                    "success": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "duration" : { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "errorcode": { "classification": "CallstackOrException", "purpose": "PerformanceAndHealth" },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            this.telemetryService.publicLog(eventName, objects_1.assign(extensionData, { success: !error, duration, errorcode }));
        }
    };
    ExtensionManagementService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, extensionManagement_1.IExtensionGalleryService),
        __param(2, log_1.ILogService),
        __param(3, instantiation_1.optional(download_1.IDownloadService)),
        __param(4, telemetry_1.ITelemetryService)
    ], ExtensionManagementService);
    exports.ExtensionManagementService = ExtensionManagementService;
});
//# sourceMappingURL=extensionManagementService.js.map