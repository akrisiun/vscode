/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/uri", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/errorMessage", "vs/workbench/services/extensions/common/extensionsUtil", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/cancellation", "vs/nls", "vs/platform/extensionManagement/common/extensionManagementIpc"], function (require, exports, os_1, uri_1, extensionManagementUtil_1, errorMessage_1, extensionsUtil_1, arrays_1, map_1, cancellation_1, nls_1, extensionManagementIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteExtensionManagementChannelClient extends extensionManagementIpc_1.ExtensionManagementChannelClient {
        constructor(channel, localExtensionManagementService, galleryService, logService, configurationService, productService) {
            super(channel);
            this.localExtensionManagementService = localExtensionManagementService;
            this.galleryService = galleryService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.productService = productService;
        }
        async install(vsix) {
            const local = await super.install(vsix);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async installFromGallery(extension) {
            const local = await this.doInstallFromGallery(extension);
            await this.installUIDependenciesAndPackedExtensions(local);
            return local;
        }
        async doInstallFromGallery(extension) {
            try {
                const local = await super.installFromGallery(extension);
                return local;
            }
            catch (error) {
                try {
                    this.logService.error(`Error while installing '${extension.identifier.id}' extension in the remote server.`, errorMessage_1.toErrorMessage(error));
                    this.logService.info(`Trying to download '${extension.identifier.id}' extension locally and install`);
                    const local = await this.downloadCompatibleAndInstall(extension);
                    this.logService.info(`Successfully installed '${extension.identifier.id}' extension`);
                    return local;
                }
                catch (e) {
                    this.logService.error(e);
                    throw error;
                }
            }
        }
        async downloadCompatibleAndInstall(extension) {
            const installed = await this.getInstalled(1 /* User */);
            const compatible = await this.galleryService.getCompatibleExtension(extension);
            if (!compatible) {
                return Promise.reject(new Error(nls_1.localize('incompatible', "Unable to install extension '{0}' as it is not compatible with VS Code '{1}'.", extension.identifier.id, this.productService.version)));
            }
            const manifest = await this.galleryService.getManifest(compatible, cancellation_1.CancellationToken.None);
            if (manifest) {
                const workspaceExtensions = await this.getAllWorkspaceDependenciesAndPackedExtensions(manifest, cancellation_1.CancellationToken.None);
                await Promise.all(workspaceExtensions.map(e => this.downloadAndInstall(e, installed)));
            }
            return this.downloadAndInstall(extension, installed);
        }
        async downloadAndInstall(extension, installed) {
            const location = await this.galleryService.download(extension, uri_1.URI.file(os_1.tmpdir()), installed.filter(i => extensionManagementUtil_1.areSameExtensions(i.identifier, extension.identifier))[0] ? 2 /* Update */ : 1 /* Install */);
            return super.install(location);
        }
        async installUIDependenciesAndPackedExtensions(local) {
            const uiExtensions = await this.getAllUIDependenciesAndPackedExtensions(local.manifest, cancellation_1.CancellationToken.None);
            const installed = await this.localExtensionManagementService.getInstalled();
            const toInstall = uiExtensions.filter(e => installed.every(i => !extensionManagementUtil_1.areSameExtensions(i.identifier, e.identifier)));
            await Promise.all(toInstall.map(d => this.localExtensionManagementService.installFromGallery(d)));
        }
        async getAllUIDependenciesAndPackedExtensions(manifest, token) {
            const result = new Map();
            const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
            await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, true, token);
            return map_1.values(result);
        }
        async getAllWorkspaceDependenciesAndPackedExtensions(manifest, token) {
            const result = new Map();
            const extensions = [...(manifest.extensionPack || []), ...(manifest.extensionDependencies || [])];
            await this.getDependenciesAndPackedExtensionsRecursively(extensions, result, false, token);
            return map_1.values(result);
        }
        async getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token) {
            if (toGet.length === 0) {
                return Promise.resolve();
            }
            const extensions = (await this.galleryService.query({ names: toGet, pageSize: toGet.length }, token)).firstPage;
            const manifests = await Promise.all(extensions.map(e => this.galleryService.getManifest(e, token)));
            const extensionsManifests = [];
            for (let idx = 0; idx < extensions.length; idx++) {
                const extension = extensions[idx];
                const manifest = manifests[idx];
                if (manifest && extensionsUtil_1.prefersExecuteOnUI(manifest, this.productService, this.configurationService) === uiExtension) {
                    result.set(extension.identifier.id.toLowerCase(), extension);
                    extensionsManifests.push(manifest);
                }
            }
            toGet = [];
            for (const extensionManifest of extensionsManifests) {
                if (arrays_1.isNonEmptyArray(extensionManifest.extensionDependencies)) {
                    for (const id of extensionManifest.extensionDependencies) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
                if (arrays_1.isNonEmptyArray(extensionManifest.extensionPack)) {
                    for (const id of extensionManifest.extensionPack) {
                        if (!result.has(id.toLowerCase())) {
                            toGet.push(id);
                        }
                    }
                }
            }
            return this.getDependenciesAndPackedExtensionsRecursively(toGet, result, uiExtension, token);
        }
    }
    exports.RemoteExtensionManagementChannelClient = RemoteExtensionManagementChannelClient;
});
//# sourceMappingURL=remoteExtensionManagementIpc.js.map