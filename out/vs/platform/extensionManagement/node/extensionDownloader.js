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
define(["require", "exports", "os", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/environment/common/environment", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/base/common/uuid", "semver-umd"], function (require, exports, os_1, lifecycle_1, files_1, extensionManagement_1, environment_1, uri_1, resources_1, extensionManagementUtil_1, log_1, uuid_1, semver) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsDownloader = void 0;
    const ExtensionIdVersionRegex = /^([^.]+\..+)-(\d+\.\d+\.\d+)$/;
    let ExtensionsDownloader = /** @class */ (() => {
        let ExtensionsDownloader = class ExtensionsDownloader extends lifecycle_1.Disposable {
            constructor(environmentService, fileService, extensionGalleryService, logService) {
                super();
                this.fileService = fileService;
                this.extensionGalleryService = extensionGalleryService;
                this.logService = logService;
                this.extensionsDownloadDir = uri_1.URI.file(os_1.tmpdir());
                this.cache = 0;
                this.cleanUpPromise = Promise.resolve();
                if (environmentService.extensionsDownloadPath) {
                    this.extensionsDownloadDir = uri_1.URI.file(environmentService.extensionsDownloadPath);
                    this.cache = 20; // Cache 20 downloads
                    this.cleanUpPromise = this.cleanUp();
                }
            }
            async downloadExtension(extension, operation) {
                await this.cleanUpPromise;
                const location = resources_1.joinPath(this.extensionsDownloadDir, this.getName(extension));
                await this.download(extension, location, operation);
                return location;
            }
            async delete(location) {
                // Delete immediately if caching is disabled
                if (!this.cache) {
                    await this.fileService.del(location);
                }
            }
            async download(extension, location, operation) {
                if (!await this.fileService.exists(location)) {
                    await this.extensionGalleryService.download(extension, location, operation);
                }
            }
            async cleanUp() {
                try {
                    if (!(await this.fileService.exists(this.extensionsDownloadDir))) {
                        this.logService.trace('Extension VSIX downlads cache dir does not exist');
                        return;
                    }
                    const folderStat = await this.fileService.resolve(this.extensionsDownloadDir, { resolveMetadata: true });
                    if (folderStat.children) {
                        const toDelete = [];
                        const all = [];
                        for (const stat of folderStat.children) {
                            const extension = this.parse(stat.name);
                            if (extension) {
                                all.push([extension, stat]);
                            }
                        }
                        const byExtension = extensionManagementUtil_1.groupByExtension(all, ([extension]) => extension.identifier);
                        const distinct = [];
                        for (const p of byExtension) {
                            p.sort((a, b) => semver.rcompare(a[0].version, b[0].version));
                            toDelete.push(...p.slice(1).map(e => e[1].resource)); // Delete outdated extensions
                            distinct.push(p[0][1]);
                        }
                        distinct.sort((a, b) => a.mtime - b.mtime); // sort by modified time
                        toDelete.push(...distinct.slice(0, Math.max(0, distinct.length - this.cache)).map(s => s.resource)); // Retain minimum cacheSize and delete the rest
                        await Promise.all(toDelete.map(resource => {
                            this.logService.trace('Deleting vsix from cache', resource.path);
                            return this.fileService.del(resource);
                        }));
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
            }
            getName(extension) {
                return this.cache ? new extensionManagementUtil_1.ExtensionIdentifierWithVersion(extension.identifier, extension.version).key().toLowerCase() : uuid_1.generateUuid();
            }
            parse(name) {
                const matches = ExtensionIdVersionRegex.exec(name);
                return matches && matches[1] && matches[2] ? new extensionManagementUtil_1.ExtensionIdentifierWithVersion({ id: matches[1] }, matches[2]) : null;
            }
        };
        ExtensionsDownloader = __decorate([
            __param(0, environment_1.IEnvironmentService),
            __param(1, files_1.IFileService),
            __param(2, extensionManagement_1.IExtensionGalleryService),
            __param(3, log_1.ILogService)
        ], ExtensionsDownloader);
        return ExtensionsDownloader;
    })();
    exports.ExtensionsDownloader = ExtensionsDownloader;
});
//# sourceMappingURL=extensionDownloader.js.map