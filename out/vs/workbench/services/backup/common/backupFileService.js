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
define(["require", "exports", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/hash", "vs/base/common/arrays", "vs/base/common/objects", "vs/base/common/async", "vs/platform/files/common/files", "vs/editor/common/model/textModel", "vs/base/common/map", "vs/base/common/network", "vs/workbench/services/environment/common/environmentService", "vs/base/common/buffer", "vs/workbench/services/textfile/common/textfiles"], function (require, exports, path_1, resources_1, uri_1, hash_1, arrays_1, objects_1, async_1, files_1, textModel_1, map_1, network_1, environmentService_1, buffer_1, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BackupFilesModel {
        constructor(fileService) {
            this.fileService = fileService;
            this.cache = new map_1.ResourceMap();
        }
        async resolve(backupRoot) {
            try {
                const backupRootStat = await this.fileService.resolve(backupRoot);
                if (backupRootStat.children) {
                    await Promise.all(backupRootStat.children
                        .filter(child => child.isDirectory)
                        .map(async (backupSchema) => {
                        // Read backup directory for backups
                        const backupSchemaStat = await this.fileService.resolve(backupSchema.resource);
                        // Remember known backups in our caches
                        if (backupSchemaStat.children) {
                            backupSchemaStat.children.forEach(backupHash => this.add(backupHash.resource));
                        }
                    }));
                }
            }
            catch (error) {
                // ignore any errors
            }
            return this;
        }
        add(resource, versionId = 0, meta) {
            this.cache.set(resource, { versionId, meta: objects_1.deepClone(meta) }); // make sure to not store original meta in our cache...
        }
        count() {
            return this.cache.size;
        }
        has(resource, versionId, meta) {
            const entry = this.cache.get(resource);
            if (!entry) {
                return false; // unknown resource
            }
            if (typeof versionId === 'number' && versionId !== entry.versionId) {
                return false; // different versionId
            }
            if (meta && !objects_1.equals(meta, entry.meta)) {
                return false; // different metadata
            }
            return true;
        }
        get() {
            return this.cache.keys();
        }
        remove(resource) {
            this.cache.delete(resource);
        }
        clear() {
            this.cache.clear();
        }
    }
    exports.BackupFilesModel = BackupFilesModel;
    let BackupFileService = class BackupFileService {
        constructor(environmentService, fileService) {
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.impl = this.initialize();
        }
        hashPath(resource) {
            const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
            return hash_1.hash(str).toString(16);
        }
        initialize() {
            const backupWorkspaceResource = this.environmentService.configuration.backupWorkspaceResource;
            if (backupWorkspaceResource) {
                return new BackupFileServiceImpl(backupWorkspaceResource, this.hashPath, this.fileService);
            }
            return new InMemoryBackupFileService(this.hashPath);
        }
        reinitialize() {
            // Re-init implementation (unless we are running in-memory)
            if (this.impl instanceof BackupFileServiceImpl) {
                const backupWorkspaceResource = this.environmentService.configuration.backupWorkspaceResource;
                if (backupWorkspaceResource) {
                    this.impl.initialize(backupWorkspaceResource);
                }
                else {
                    this.impl = new InMemoryBackupFileService(this.hashPath);
                }
            }
        }
        hasBackups() {
            return this.impl.hasBackups();
        }
        hasBackupSync(resource, versionId) {
            return this.impl.hasBackupSync(resource, versionId);
        }
        loadBackupResource(resource) {
            return this.impl.loadBackupResource(resource);
        }
        backupResource(resource, content, versionId, meta) {
            return this.impl.backupResource(resource, content, versionId, meta);
        }
        discardResourceBackup(resource) {
            return this.impl.discardResourceBackup(resource);
        }
        discardAllWorkspaceBackups() {
            return this.impl.discardAllWorkspaceBackups();
        }
        getWorkspaceFileBackups() {
            return this.impl.getWorkspaceFileBackups();
        }
        resolveBackupContent(backup) {
            return this.impl.resolveBackupContent(backup);
        }
        toBackupResource(resource) {
            return this.impl.toBackupResource(resource);
        }
    };
    BackupFileService = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, files_1.IFileService)
    ], BackupFileService);
    exports.BackupFileService = BackupFileService;
    let BackupFileServiceImpl = class BackupFileServiceImpl {
        constructor(backupWorkspaceResource, hashPath, fileService) {
            this.hashPath = hashPath;
            this.fileService = fileService;
            this.isShuttingDown = false;
            this.ioOperationQueues = new async_1.ResourceQueue();
            this.initialize(backupWorkspaceResource);
        }
        initialize(backupWorkspaceResource) {
            this.backupWorkspacePath = backupWorkspaceResource;
            this.ready = this.doInitialize();
        }
        doInitialize() {
            this.model = new BackupFilesModel(this.fileService);
            return this.model.resolve(this.backupWorkspacePath);
        }
        async hasBackups() {
            const model = await this.ready;
            return model.count() > 0;
        }
        hasBackupSync(resource, versionId) {
            const backupResource = this.toBackupResource(resource);
            return this.model.has(backupResource, versionId);
        }
        async loadBackupResource(resource) {
            const model = await this.ready;
            // Return directly if we have a known backup with that resource
            const backupResource = this.toBackupResource(resource);
            if (model.has(backupResource)) {
                return backupResource;
            }
            return undefined;
        }
        async backupResource(resource, content, versionId, meta) {
            if (this.isShuttingDown) {
                return;
            }
            const model = await this.ready;
            const backupResource = this.toBackupResource(resource);
            if (model.has(backupResource, versionId, meta)) {
                return; // return early if backup version id matches requested one
            }
            return this.ioOperationQueues.queueFor(backupResource).queue(async () => {
                let preamble = undefined;
                // With Metadata: URI + META-START + Meta + END
                if (meta) {
                    const preambleWithMeta = `${resource.toString()}${BackupFileServiceImpl.PREAMBLE_META_SEPARATOR}${JSON.stringify(meta)}${BackupFileServiceImpl.PREAMBLE_END_MARKER}`;
                    if (preambleWithMeta.length < BackupFileServiceImpl.PREAMBLE_MAX_LENGTH) {
                        preamble = preambleWithMeta;
                    }
                }
                // Without Metadata: URI + END
                if (!preamble) {
                    preamble = `${resource.toString()}${BackupFileServiceImpl.PREAMBLE_END_MARKER}`;
                }
                // Update content with value
                await this.fileService.writeFile(backupResource, new textfiles_1.TextSnapshotReadable(content, preamble));
                // Update model
                model.add(backupResource, versionId, meta);
            });
        }
        async discardResourceBackup(resource) {
            const model = await this.ready;
            const backupResource = this.toBackupResource(resource);
            return this.ioOperationQueues.queueFor(backupResource).queue(async () => {
                await this.fileService.del(backupResource, { recursive: true });
                model.remove(backupResource);
            });
        }
        async discardAllWorkspaceBackups() {
            this.isShuttingDown = true;
            const model = await this.ready;
            await this.fileService.del(this.backupWorkspacePath, { recursive: true });
            model.clear();
        }
        async getWorkspaceFileBackups() {
            const model = await this.ready;
            const backups = await Promise.all(model.get().map(async (fileBackup) => {
                const backupPreamble = await this.readToMatchingString(fileBackup, BackupFileServiceImpl.PREAMBLE_END_MARKER, BackupFileServiceImpl.PREAMBLE_MAX_LENGTH);
                if (!backupPreamble) {
                    return undefined;
                }
                // Preamble with metadata: URI + META-START + Meta + END
                const metaStartIndex = backupPreamble.indexOf(BackupFileServiceImpl.PREAMBLE_META_SEPARATOR);
                if (metaStartIndex > 0) {
                    return uri_1.URI.parse(backupPreamble.substring(0, metaStartIndex));
                }
                // Preamble without metadata: URI + END
                else {
                    return uri_1.URI.parse(backupPreamble);
                }
            }));
            return arrays_1.coalesce(backups);
        }
        async readToMatchingString(file, matchingString, maximumBytesToRead) {
            const contents = (await this.fileService.readFile(file, { length: maximumBytesToRead })).value.toString();
            const newLineIndex = contents.indexOf(matchingString);
            if (newLineIndex >= 0) {
                return contents.substr(0, newLineIndex);
            }
            throw new Error(`Backup: Could not find ${JSON.stringify(matchingString)} in first ${maximumBytesToRead} bytes of ${file}`);
        }
        async resolveBackupContent(backup) {
            // Metadata extraction
            let metaRaw = '';
            let metaEndFound = false;
            // Add a filter method to filter out everything until the meta end marker
            const metaPreambleFilter = (chunk) => {
                const chunkString = chunk.toString();
                if (!metaEndFound) {
                    const metaEndIndex = chunkString.indexOf(BackupFileServiceImpl.PREAMBLE_END_MARKER);
                    if (metaEndIndex === -1) {
                        metaRaw += chunkString;
                        return buffer_1.VSBuffer.fromString(''); // meta not yet found, return empty string
                    }
                    metaEndFound = true;
                    metaRaw += chunkString.substring(0, metaEndIndex); // ensure to get last chunk from metadata
                    return buffer_1.VSBuffer.fromString(chunkString.substr(metaEndIndex + 1)); // meta found, return everything after
                }
                return chunk;
            };
            // Read backup into factory
            const content = await this.fileService.readFileStream(backup);
            const factory = await textModel_1.createTextBufferFactoryFromStream(content.value, metaPreambleFilter);
            // Extract meta data (if any)
            let meta;
            const metaStartIndex = metaRaw.indexOf(BackupFileServiceImpl.PREAMBLE_META_SEPARATOR);
            if (metaStartIndex !== -1) {
                try {
                    meta = JSON.parse(metaRaw.substr(metaStartIndex + 1));
                }
                catch (error) {
                    // ignore JSON parse errors
                }
            }
            // We have seen reports (e.g. https://github.com/microsoft/vscode/issues/78500) where
            // if VSCode goes down while writing the backup file, the file can turn empty because
            // it always first gets truncated and then written to. In this case, we will not find
            // the meta-end marker ('\n') and as such the backup can only be invalid. We bail out
            // here if that is the case.
            if (!metaEndFound) {
                throw new Error(`Backup: Could not find meta end marker in ${backup}. The file is probably corrupt.`);
            }
            return { value: factory, meta };
        }
        toBackupResource(resource) {
            return resources_1.joinPath(this.backupWorkspacePath, resource.scheme, this.hashPath(resource));
        }
    };
    BackupFileServiceImpl.PREAMBLE_END_MARKER = '\n';
    BackupFileServiceImpl.PREAMBLE_META_SEPARATOR = ' '; // using a character that is know to be escaped in a URI as separator
    BackupFileServiceImpl.PREAMBLE_MAX_LENGTH = 10000;
    BackupFileServiceImpl = __decorate([
        __param(2, files_1.IFileService)
    ], BackupFileServiceImpl);
    class InMemoryBackupFileService {
        constructor(hashPath) {
            this.hashPath = hashPath;
            this.backups = new Map();
        }
        hasBackups() {
            return Promise.resolve(this.backups.size > 0);
        }
        hasBackupSync(resource, versionId) {
            const backupResource = this.toBackupResource(resource);
            return this.backups.has(backupResource.toString());
        }
        loadBackupResource(resource) {
            const backupResource = this.toBackupResource(resource);
            if (this.backups.has(backupResource.toString())) {
                return Promise.resolve(backupResource);
            }
            return Promise.resolve(undefined);
        }
        backupResource(resource, content, versionId, meta) {
            const backupResource = this.toBackupResource(resource);
            this.backups.set(backupResource.toString(), content);
            return Promise.resolve();
        }
        async resolveBackupContent(backupResource) {
            const snapshot = this.backups.get(backupResource.toString());
            if (snapshot) {
                return { value: textModel_1.createTextBufferFactoryFromSnapshot(snapshot) };
            }
            throw new Error('Unexpected backup resource to resolve');
        }
        getWorkspaceFileBackups() {
            return Promise.resolve(map_1.keys(this.backups).map(key => uri_1.URI.parse(key)));
        }
        discardResourceBackup(resource) {
            this.backups.delete(this.toBackupResource(resource).toString());
            return Promise.resolve();
        }
        discardAllWorkspaceBackups() {
            this.backups.clear();
            return Promise.resolve();
        }
        toBackupResource(resource) {
            return uri_1.URI.file(path_1.join(resource.scheme, this.hashPath(resource)));
        }
    }
    exports.InMemoryBackupFileService = InMemoryBackupFileService;
});
//# sourceMappingURL=backupFileService.js.map