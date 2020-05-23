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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/buffer", "vs/base/common/uri", "vs/platform/userDataSync/common/userDataSync", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/base/common/json", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/types", "vs/base/common/strings", "vs/base/common/arrays"], function (require, exports, lifecycle_1, files_1, buffer_1, uri_1, userDataSync_1, environment_1, resources_1, event_1, telemetry_1, json_1, nls_1, configuration_1, types_1, strings_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractJsonFileSynchroniser = exports.AbstractFileSynchroniser = exports.AbstractSynchroniser = void 0;
    function isSyncData(thing) {
        return thing
            && (thing.version && typeof thing.version === 'number')
            && (thing.content && typeof thing.content === 'string')
            && Object.keys(thing).length === 2;
    }
    let AbstractSynchroniser = /** @class */ (() => {
        let AbstractSynchroniser = class AbstractSynchroniser extends lifecycle_1.Disposable {
            constructor(resource, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService) {
                super();
                this.resource = resource;
                this.fileService = fileService;
                this.userDataSyncStoreService = userDataSyncStoreService;
                this.userDataSyncBackupStoreService = userDataSyncBackupStoreService;
                this.userDataSyncEnablementService = userDataSyncEnablementService;
                this.telemetryService = telemetryService;
                this.logService = logService;
                this.configurationService = configurationService;
                this._status = "idle" /* Idle */;
                this._onDidChangStatus = this._register(new event_1.Emitter());
                this.onDidChangeStatus = this._onDidChangStatus.event;
                this._conflicts = [];
                this._onDidChangeConflicts = this._register(new event_1.Emitter());
                this.onDidChangeConflicts = this._onDidChangeConflicts.event;
                this._onDidChangeLocal = this._register(new event_1.Emitter());
                this.onDidChangeLocal = this._onDidChangeLocal.event;
                this.syncResourceLogLabel = strings_1.uppercaseFirstLetter(this.resource);
                this.syncFolder = resources_1.joinPath(environmentService.userDataSyncHome, resource);
                this.lastSyncResource = resources_1.joinPath(this.syncFolder, `lastSync${this.resource}.json`);
            }
            get status() { return this._status; }
            get conflicts() { return this._conflicts; }
            setStatus(status) {
                if (this._status !== status) {
                    const oldStatus = this._status;
                    this._status = status;
                    this._onDidChangStatus.fire(status);
                    if (status === "hasConflicts" /* HasConflicts */) {
                        // Log to telemetry when there is a sync conflict
                        this.telemetryService.publicLog2('sync/conflictsDetected', { source: this.resource });
                    }
                    if (oldStatus === "hasConflicts" /* HasConflicts */ && status === "idle" /* Idle */) {
                        // Log to telemetry when conflicts are resolved
                        this.telemetryService.publicLog2('sync/conflictsResolved', { source: this.resource });
                    }
                    if (this.status !== "hasConflicts" /* HasConflicts */) {
                        this.setConflicts([]);
                    }
                }
            }
            setConflicts(conflicts) {
                if (!arrays_1.equals(this._conflicts, conflicts, (a, b) => resources_1.isEqual(a.local, b.local) && resources_1.isEqual(a.remote, b.remote))) {
                    this._conflicts = conflicts;
                    this._onDidChangeConflicts.fire(this._conflicts);
                }
            }
            isEnabled() { return this.userDataSyncEnablementService.isResourceEnabled(this.resource); }
            async sync(ref) {
                if (!this.isEnabled()) {
                    if (this.status !== "idle" /* Idle */) {
                        await this.stop();
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is disabled.`);
                    return;
                }
                if (this.status === "hasConflicts" /* HasConflicts */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as there are conflicts.`);
                    return;
                }
                if (this.status === "syncing" /* Syncing */) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing ${this.resource.toLowerCase()} as it is running already.`);
                    return;
                }
                this.logService.trace(`${this.syncResourceLogLabel}: Started synchronizing ${this.resource.toLowerCase()}...`);
                this.setStatus("syncing" /* Syncing */);
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = ref && lastSyncUserData && lastSyncUserData.ref === ref ? lastSyncUserData : await this.getRemoteUserData(lastSyncUserData);
                let status = "idle" /* Idle */;
                try {
                    status = await this.doSync(remoteUserData, lastSyncUserData);
                    if (status === "hasConflicts" /* HasConflicts */) {
                        this.logService.info(`${this.syncResourceLogLabel}: Detected conflicts while synchronizing ${this.resource.toLowerCase()}.`);
                    }
                    else if (status === "idle" /* Idle */) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Finished synchronizing ${this.resource.toLowerCase()}.`);
                    }
                }
                finally {
                    this.setStatus(status);
                }
            }
            async getSyncPreview() {
                if (!this.isEnabled()) {
                    return { hasLocalChanged: false, hasRemoteChanged: false };
                }
                const lastSyncUserData = await this.getLastSyncUserData();
                const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                return this.generatePreview(remoteUserData, lastSyncUserData);
            }
            async doSync(remoteUserData, lastSyncUserData) {
                if (remoteUserData.syncData && remoteUserData.syncData.version > this.version) {
                    // current version is not compatible with cloud version
                    this.telemetryService.publicLog2('sync/incompatible', { source: this.resource });
                    throw new userDataSync_1.UserDataSyncError(nls_1.localize('incompatible', "Cannot sync {0} as its version {1} is not compatible with cloud {2}", this.resource, this.version, remoteUserData.syncData.version), userDataSync_1.UserDataSyncErrorCode.Incompatible, this.resource);
                }
                try {
                    const status = await this.performSync(remoteUserData, lastSyncUserData);
                    return status;
                }
                catch (e) {
                    if (e instanceof userDataSync_1.UserDataSyncError) {
                        switch (e.code) {
                            case userDataSync_1.UserDataSyncErrorCode.RemotePreconditionFailed:
                                // Rejected as there is a new remote version. Syncing again,
                                this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize as there is a new remote version available. Synchronizing again...`);
                                // Avoid cache and get latest remote user data - https://github.com/microsoft/vscode/issues/90624
                                remoteUserData = await this.getRemoteUserData(null);
                                return this.doSync(remoteUserData, lastSyncUserData);
                        }
                    }
                    throw e;
                }
            }
            async hasPreviouslySynced() {
                const lastSyncData = await this.getLastSyncUserData();
                return !!lastSyncData;
            }
            async getRemoteSyncResourceHandles() {
                const handles = await this.userDataSyncStoreService.getAllRefs(this.resource);
                return handles.map(({ created, ref }) => ({ created, uri: this.toRemoteBackupResource(ref) }));
            }
            async getLocalSyncResourceHandles() {
                const handles = await this.userDataSyncBackupStoreService.getAllRefs(this.resource);
                return handles.map(({ created, ref }) => ({ created, uri: this.toLocalBackupResource(ref) }));
            }
            toRemoteBackupResource(ref) {
                return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote-backup', path: `/${this.resource}/${ref}` });
            }
            toLocalBackupResource(ref) {
                return uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'local-backup', path: `/${this.resource}/${ref}` });
            }
            async resolveContent(uri) {
                const ref = resources_1.basename(uri);
                if (resources_1.isEqual(uri, this.toRemoteBackupResource(ref))) {
                    const { content } = await this.getUserData(ref);
                    return content;
                }
                if (resources_1.isEqual(uri, this.toLocalBackupResource(ref))) {
                    return this.userDataSyncBackupStoreService.resolveContent(this.resource, ref);
                }
                return null;
            }
            async resetLocal() {
                try {
                    await this.fileService.del(this.lastSyncResource);
                }
                catch (e) { /* ignore */ }
            }
            async getLastSyncUserData() {
                try {
                    const content = await this.fileService.readFile(this.lastSyncResource);
                    const parsed = JSON.parse(content.value.toString());
                    let syncData = JSON.parse(parsed.content);
                    // Migration from old content to sync data
                    if (!isSyncData(syncData)) {
                        syncData = { version: this.version, content: parsed.content };
                    }
                    return Object.assign(Object.assign({}, parsed), { syncData, content: undefined });
                }
                catch (error) {
                    if (!(error instanceof files_1.FileOperationError && error.fileOperationResult === 1 /* FILE_NOT_FOUND */)) {
                        // log error always except when file does not exist
                        this.logService.error(error);
                    }
                }
                return null;
            }
            async updateLastSyncUserData(lastSyncRemoteUserData, additionalProps = {}) {
                const lastSyncUserData = Object.assign({ ref: lastSyncRemoteUserData.ref, content: JSON.stringify(lastSyncRemoteUserData.syncData) }, additionalProps);
                await this.fileService.writeFile(this.lastSyncResource, buffer_1.VSBuffer.fromString(JSON.stringify(lastSyncUserData)));
            }
            async getRemoteUserData(lastSyncData) {
                const { ref, content } = await this.getUserData(lastSyncData);
                let syncData = null;
                if (content !== null) {
                    syncData = this.parseSyncData(content);
                }
                return { ref, syncData };
            }
            parseSyncData(content) {
                let syncData = null;
                try {
                    syncData = JSON.parse(content);
                    // Migration from old content to sync data
                    if (!isSyncData(syncData)) {
                        syncData = { version: this.version, content };
                    }
                }
                catch (e) {
                    this.logService.error(e);
                }
                return syncData;
            }
            async getUserData(refOrLastSyncData) {
                if (types_1.isString(refOrLastSyncData)) {
                    const content = await this.userDataSyncStoreService.resolveContent(this.resource, refOrLastSyncData);
                    return { ref: refOrLastSyncData, content };
                }
                else {
                    const lastSyncUserData = refOrLastSyncData ? { ref: refOrLastSyncData.ref, content: refOrLastSyncData.syncData ? JSON.stringify(refOrLastSyncData.syncData) : null } : null;
                    return this.userDataSyncStoreService.read(this.resource, lastSyncUserData);
                }
            }
            async updateRemoteUserData(content, ref) {
                const syncData = { version: this.version, content };
                ref = await this.userDataSyncStoreService.write(this.resource, JSON.stringify(syncData), ref);
                return { ref, syncData };
            }
            async backupLocal(content) {
                const syncData = { version: this.version, content };
                return this.userDataSyncBackupStoreService.backup(this.resource, JSON.stringify(syncData));
            }
        };
        AbstractSynchroniser = __decorate([
            __param(1, files_1.IFileService),
            __param(2, environment_1.IEnvironmentService),
            __param(3, userDataSync_1.IUserDataSyncStoreService),
            __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(5, userDataSync_1.IUserDataSyncEnablementService),
            __param(6, telemetry_1.ITelemetryService),
            __param(7, userDataSync_1.IUserDataSyncLogService),
            __param(8, configuration_1.IConfigurationService)
        ], AbstractSynchroniser);
        return AbstractSynchroniser;
    })();
    exports.AbstractSynchroniser = AbstractSynchroniser;
    let AbstractFileSynchroniser = /** @class */ (() => {
        let AbstractFileSynchroniser = class AbstractFileSynchroniser extends AbstractSynchroniser {
            constructor(file, resource, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService) {
                super(resource, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService);
                this.file = file;
                this.syncPreviewResultPromise = null;
                this._register(this.fileService.watch(resources_1.dirname(file)));
                this._register(this.fileService.onDidFilesChange(e => this.onFileChanges(e)));
            }
            async stop() {
                this.cancel();
                this.logService.info(`${this.syncResourceLogLabel}: Stopped synchronizing ${this.resource.toLowerCase()}.`);
                try {
                    await this.fileService.del(this.localPreviewResource);
                }
                catch (e) { /* ignore */ }
                this.setStatus("idle" /* Idle */);
            }
            async getConflictContent(conflictResource) {
                if (resources_1.isEqual(this.remotePreviewResource, conflictResource) || resources_1.isEqual(this.localPreviewResource, conflictResource)) {
                    if (this.syncPreviewResultPromise) {
                        const result = await this.syncPreviewResultPromise;
                        if (resources_1.isEqual(this.remotePreviewResource, conflictResource)) {
                            return result.remoteUserData && result.remoteUserData.syncData ? result.remoteUserData.syncData.content : null;
                        }
                        if (resources_1.isEqual(this.localPreviewResource, conflictResource)) {
                            return result.fileContent ? result.fileContent.value.toString() : null;
                        }
                    }
                }
                return null;
            }
            async getLocalFileContent() {
                try {
                    return await this.fileService.readFile(this.file);
                }
                catch (error) {
                    return null;
                }
            }
            async updateLocalFileContent(newContent, oldContent) {
                try {
                    if (oldContent) {
                        // file exists already
                        await this.fileService.writeFile(this.file, buffer_1.VSBuffer.fromString(newContent), oldContent);
                    }
                    else {
                        // file does not exist
                        await this.fileService.createFile(this.file, buffer_1.VSBuffer.fromString(newContent), { overwrite: false });
                    }
                }
                catch (e) {
                    if ((e instanceof files_1.FileOperationError && e.fileOperationResult === 1 /* FILE_NOT_FOUND */) ||
                        (e instanceof files_1.FileOperationError && e.fileOperationResult === 3 /* FILE_MODIFIED_SINCE */)) {
                        throw new userDataSync_1.UserDataSyncError(e.message, userDataSync_1.UserDataSyncErrorCode.LocalPreconditionFailed);
                    }
                    else {
                        throw e;
                    }
                }
            }
            onFileChanges(e) {
                var _a;
                if (!e.contains(this.file)) {
                    return;
                }
                if (!this.isEnabled()) {
                    return;
                }
                // Sync again if local file has changed and current status is in conflicts
                if (this.status === "hasConflicts" /* HasConflicts */) {
                    (_a = this.syncPreviewResultPromise) === null || _a === void 0 ? void 0 : _a.then(result => {
                        this.cancel();
                        this.doSync(result.remoteUserData, result.lastSyncUserData).then(status => this.setStatus(status));
                    });
                }
                // Otherwise fire change event
                else {
                    this._onDidChangeLocal.fire();
                }
            }
            cancel() {
                if (this.syncPreviewResultPromise) {
                    this.syncPreviewResultPromise.cancel();
                    this.syncPreviewResultPromise = null;
                }
            }
        };
        AbstractFileSynchroniser = __decorate([
            __param(2, files_1.IFileService),
            __param(3, environment_1.IEnvironmentService),
            __param(4, userDataSync_1.IUserDataSyncStoreService),
            __param(5, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(6, userDataSync_1.IUserDataSyncEnablementService),
            __param(7, telemetry_1.ITelemetryService),
            __param(8, userDataSync_1.IUserDataSyncLogService),
            __param(9, configuration_1.IConfigurationService)
        ], AbstractFileSynchroniser);
        return AbstractFileSynchroniser;
    })();
    exports.AbstractFileSynchroniser = AbstractFileSynchroniser;
    let AbstractJsonFileSynchroniser = /** @class */ (() => {
        let AbstractJsonFileSynchroniser = class AbstractJsonFileSynchroniser extends AbstractFileSynchroniser {
            constructor(file, resource, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService) {
                super(file, resource, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService);
                this.userDataSyncUtilService = userDataSyncUtilService;
                this._formattingOptions = undefined;
            }
            hasErrors(content) {
                const parseErrors = [];
                json_1.parse(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
                return parseErrors.length > 0;
            }
            getFormattingOptions() {
                if (!this._formattingOptions) {
                    this._formattingOptions = this.userDataSyncUtilService.resolveFormattingOptions(this.file);
                }
                return this._formattingOptions;
            }
        };
        AbstractJsonFileSynchroniser = __decorate([
            __param(2, files_1.IFileService),
            __param(3, environment_1.IEnvironmentService),
            __param(4, userDataSync_1.IUserDataSyncStoreService),
            __param(5, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(6, userDataSync_1.IUserDataSyncEnablementService),
            __param(7, telemetry_1.ITelemetryService),
            __param(8, userDataSync_1.IUserDataSyncLogService),
            __param(9, userDataSync_1.IUserDataSyncUtilService),
            __param(10, configuration_1.IConfigurationService)
        ], AbstractJsonFileSynchroniser);
        return AbstractJsonFileSynchroniser;
    })();
    exports.AbstractJsonFileSynchroniser = AbstractJsonFileSynchroniser;
});
//# sourceMappingURL=abstractSynchronizer.js.map