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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/buffer", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/map", "vs/base/common/strings", "vs/platform/files/common/files", "vs/base/common/async", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, userDataSync_1, buffer_1, event_1, environment_1, resources_1, extensionManagement_1, extensionManagementUtil_1, map_1, strings_1, files_1, async_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionsSynchroniser = class ExtensionsSynchroniser extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, userDataSyncStoreService, extensionManagementService, logService, extensionGalleryService, configurationService) {
            super();
            this.fileService = fileService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.extensionManagementService = extensionManagementService;
            this.logService = logService;
            this.extensionGalleryService = extensionGalleryService;
            this.configurationService = configurationService;
            this._status = "idle" /* Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.replaceQueue = this._register(new async_1.Queue());
            this.lastSyncExtensionsResource = resources_1.joinPath(environmentService.userRoamingDataHome, '.lastSyncExtensions');
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtension, (e => !!e.gallery)), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error))), () => undefined, 500)(() => this._onDidChangeLocal.fire()));
        }
        get status() { return this._status; }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangStatus.fire(status);
            }
        }
        async sync() {
            if (!this.configurationService.getValue('configurationSync.enableExtensions')) {
                this.logService.trace('Extensions: Skipping synchronizing extensions as it is disabled.');
                return false;
            }
            if (this.status !== "idle" /* Idle */) {
                this.logService.trace('Extensions: Skipping synchronizing extensions as it is running already.');
                return false;
            }
            this.logService.trace('Extensions: Started synchronizing extensions...');
            this.setStatus("syncing" /* Syncing */);
            try {
                await this.doSync();
            }
            catch (e) {
                this.setStatus("idle" /* Idle */);
                if (e instanceof userDataSync_1.UserDataSyncStoreError && e.code === userDataSync_1.UserDataSyncStoreErrorCode.Rejected) {
                    // Rejected as there is a new remote version. Syncing again,
                    this.logService.info('Extensions: Failed to synchronise extensions as there is a new remote version available. Synchronizing again...');
                    return this.sync();
                }
                throw e;
            }
            this.logService.trace('Extensions: Finised synchronizing extensions.');
            this.setStatus("idle" /* Idle */);
            return true;
        }
        stop() { }
        removeExtension(identifier) {
            return this.replaceQueue.queue(async () => {
                const remoteData = await this.userDataSyncStoreService.read(ExtensionsSynchroniser.EXTERNAL_USER_DATA_EXTENSIONS_KEY, null);
                const remoteExtensions = remoteData.content ? JSON.parse(remoteData.content) : [];
                const ignoredExtensions = this.configurationService.getValue('configurationSync.extensionsToIgnore') || [];
                const removedExtensions = remoteExtensions.filter(e => !ignoredExtensions.some(id => extensionManagementUtil_1.areSameExtensions({ id }, e.identifier)) && extensionManagementUtil_1.areSameExtensions(e.identifier, identifier));
                if (removedExtensions.length) {
                    for (const removedExtension of removedExtensions) {
                        remoteExtensions.splice(remoteExtensions.indexOf(removedExtension), 1);
                    }
                    this.logService.info(`Extensions: Removing extension '${identifier.id}' from remote.`);
                    await this.writeToRemote(remoteExtensions, remoteData.ref);
                }
            });
        }
        async doSync() {
            const lastSyncData = await this.getLastSyncUserData();
            let remoteData = await this.userDataSyncStoreService.read(ExtensionsSynchroniser.EXTERNAL_USER_DATA_EXTENSIONS_KEY, lastSyncData);
            const lastSyncExtensions = lastSyncData ? JSON.parse(lastSyncData.content) : null;
            const remoteExtensions = remoteData.content ? JSON.parse(remoteData.content) : null;
            const localExtensions = await this.getLocalExtensions();
            this.logService.trace('Extensions: Merging remote extensions with local extensions...');
            const { added, removed, updated, remote } = this.merge(localExtensions, remoteExtensions, lastSyncExtensions);
            if (!added.length && !removed.length && !updated.length && !remote) {
                this.logService.trace('Extensions: No changes found during synchronizing extensions.');
            }
            if (added.length || removed.length || updated.length) {
                this.logService.info('Extensions: Updating local extensions...');
                await this.updateLocalExtensions(added, removed, updated);
            }
            if (remote) {
                // update remote
                this.logService.info('Extensions: Updating remote extensions...');
                remoteData = await this.writeToRemote(remote, remoteData.ref);
            }
            if (remoteData.content
                && (!lastSyncData || lastSyncData.ref !== remoteData.ref)) {
                // update last sync
                this.logService.info('Extensions: Updating last synchronised extensions...');
                await this.updateLastSyncValue(remoteData);
            }
        }
        /**
         * Merge Strategy:
         * - If remote does not exist, merge with local (First time sync)
         * - Overwrite local with remote changes. Removed, Added, Updated.
         * - Update remote with those local extension which are newly added or updated or removed and untouched in remote.
         */
        merge(localExtensions, remoteExtensions, lastSyncExtensions) {
            const ignoredExtensions = this.configurationService.getValue('configurationSync.extensionsToIgnore') || [];
            // First time sync
            if (!remoteExtensions) {
                this.logService.info('Extensions: Remote extensions does not exist. Synchronizing extensions for the first time.');
                return { added: [], removed: [], updated: [], remote: localExtensions.filter(({ identifier }) => ignoredExtensions.some(id => id.toLowerCase() === identifier.id.toLowerCase())) };
            }
            const uuids = new Map();
            const addUUID = (identifier) => { if (identifier.uuid) {
                uuids.set(identifier.id.toLowerCase(), identifier.uuid);
            } };
            localExtensions.forEach(({ identifier }) => addUUID(identifier));
            remoteExtensions.forEach(({ identifier }) => addUUID(identifier));
            if (lastSyncExtensions) {
                lastSyncExtensions.forEach(({ identifier }) => addUUID(identifier));
            }
            const addExtensionToMap = (map, extension) => {
                const uuid = extension.identifier.uuid || uuids.get(extension.identifier.id.toLowerCase());
                const key = uuid ? `uuid:${uuid}` : `id:${extension.identifier.id.toLowerCase()}`;
                map.set(key, extension);
                return map;
            };
            const localExtensionsMap = localExtensions.reduce(addExtensionToMap, new Map());
            const remoteExtensionsMap = remoteExtensions.reduce(addExtensionToMap, new Map());
            const newRemoteExtensionsMap = remoteExtensions.reduce(addExtensionToMap, new Map());
            const lastSyncExtensionsMap = lastSyncExtensions ? lastSyncExtensions.reduce(addExtensionToMap, new Map()) : null;
            const ignoredExtensionsSet = ignoredExtensions.reduce((set, id) => {
                const uuid = uuids.get(id.toLowerCase());
                return set.add(uuid ? `uuid:${uuid}` : `id:${id.toLowerCase()}`);
            }, new Set());
            const localToRemote = this.compare(localExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet);
            if (localToRemote.added.size === 0 && localToRemote.removed.size === 0 && localToRemote.updated.size === 0) {
                // No changes found between local and remote.
                return { added: [], removed: [], updated: [], remote: null };
            }
            const added = [];
            const removed = [];
            const updated = [];
            const baseToLocal = lastSyncExtensionsMap ? this.compare(lastSyncExtensionsMap, localExtensionsMap, ignoredExtensionsSet) : { added: map_1.keys(localExtensionsMap).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
            const baseToRemote = lastSyncExtensionsMap ? this.compare(lastSyncExtensionsMap, remoteExtensionsMap, ignoredExtensionsSet) : { added: map_1.keys(remoteExtensionsMap).reduce((r, k) => { r.add(k); return r; }, new Set()), removed: new Set(), updated: new Set() };
            const massageSyncExtension = (extension, key) => {
                return {
                    identifier: {
                        id: extension.identifier.id,
                        uuid: strings_1.startsWith(key, 'uuid:') ? key.substring('uuid:'.length) : undefined
                    },
                    enabled: extension.enabled,
                    version: extension.version
                };
            };
            // Remotely removed extension.
            for (const key of map_1.values(baseToRemote.removed)) {
                const e = localExtensionsMap.get(key);
                if (e) {
                    removed.push(e.identifier);
                }
            }
            // Remotely added extension
            for (const key of map_1.values(baseToRemote.added)) {
                // Got added in local
                if (baseToLocal.added.has(key)) {
                    // Is different from local to remote
                    if (localToRemote.updated.has(key)) {
                        updated.push(massageSyncExtension(remoteExtensionsMap.get(key), key));
                    }
                }
                else {
                    // Add to local
                    added.push(massageSyncExtension(remoteExtensionsMap.get(key), key));
                }
            }
            // Remotely updated extensions
            for (const key of map_1.values(baseToRemote.updated)) {
                // If updated in local
                if (baseToLocal.updated.has(key)) {
                    // Is different from local to remote
                    if (localToRemote.updated.has(key)) {
                        // update it in local
                        updated.push(massageSyncExtension(remoteExtensionsMap.get(key), key));
                    }
                }
            }
            // Locally added extensions
            for (const key of map_1.values(baseToLocal.added)) {
                // Not there in remote
                if (!baseToRemote.added.has(key)) {
                    newRemoteExtensionsMap.set(key, massageSyncExtension(localExtensionsMap.get(key), key));
                }
            }
            // Locally updated extensions
            for (const key of map_1.values(baseToLocal.updated)) {
                // If removed in remote
                if (baseToRemote.removed.has(key)) {
                    continue;
                }
                // If not updated in remote
                if (!baseToRemote.updated.has(key)) {
                    newRemoteExtensionsMap.set(key, massageSyncExtension(localExtensionsMap.get(key), key));
                }
            }
            // Locally removed extensions
            for (const key of map_1.values(baseToLocal.removed)) {
                // If not updated in remote
                if (!baseToRemote.updated.has(key)) {
                    newRemoteExtensionsMap.delete(key);
                }
            }
            const remoteChanges = this.compare(remoteExtensionsMap, newRemoteExtensionsMap, new Set());
            const remote = remoteChanges.added.size > 0 || remoteChanges.updated.size > 0 || remoteChanges.removed.size > 0 ? map_1.values(newRemoteExtensionsMap) : null;
            return { added, removed, updated, remote };
        }
        compare(from, to, ignoredExtensions) {
            const fromKeys = map_1.keys(from).filter(key => !ignoredExtensions.has(key));
            const toKeys = map_1.keys(to).filter(key => !ignoredExtensions.has(key));
            const added = toKeys.filter(key => fromKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
            const removed = fromKeys.filter(key => toKeys.indexOf(key) === -1).reduce((r, key) => { r.add(key); return r; }, new Set());
            const updated = new Set();
            for (const key of fromKeys) {
                if (removed.has(key)) {
                    continue;
                }
                const fromExtension = from.get(key);
                const toExtension = to.get(key);
                if (!toExtension
                    || fromExtension.enabled !== toExtension.enabled
                    || fromExtension.version !== toExtension.version) {
                    updated.add(key);
                }
            }
            return { added, removed, updated };
        }
        async updateLocalExtensions(added, removed, updated) {
            if (removed.length) {
                const installedExtensions = await this.extensionManagementService.getInstalled(1 /* User */);
                const extensionsToRemove = installedExtensions.filter(({ identifier }) => removed.some(r => extensionManagementUtil_1.areSameExtensions(identifier, r)));
                await Promise.all(extensionsToRemove.map(e => {
                    this.logService.info('Extensions: Removing local extension.', e.identifier.id);
                    return this.extensionManagementService.uninstall(e);
                }));
            }
            if (added.length || updated.length) {
                await Promise.all([...added, ...updated].map(async (e) => {
                    const extension = await this.extensionGalleryService.getCompatibleExtension(e.identifier, e.version);
                    if (extension) {
                        this.logService.info('Extensions: Installing local extension.', e.identifier.id, extension.version);
                        await this.extensionManagementService.installFromGallery(extension);
                    }
                }));
            }
        }
        async getLocalExtensions() {
            const installedExtensions = await this.extensionManagementService.getInstalled(1 /* User */);
            return installedExtensions.map(({ identifier }) => ({ identifier, enabled: true }));
        }
        async getLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncExtensionsResource);
                return JSON.parse(content.value.toString());
            }
            catch (error) {
                return null;
            }
        }
        async writeToRemote(extensions, ref) {
            const content = JSON.stringify(extensions);
            ref = await this.userDataSyncStoreService.write(ExtensionsSynchroniser.EXTERNAL_USER_DATA_EXTENSIONS_KEY, content, ref);
            return { content, ref };
        }
        async updateLastSyncValue(remoteUserData) {
            await this.fileService.writeFile(this.lastSyncExtensionsResource, buffer_1.VSBuffer.fromString(JSON.stringify(remoteUserData)));
        }
    };
    ExtensionsSynchroniser.EXTERNAL_USER_DATA_EXTENSIONS_KEY = 'extensions';
    ExtensionsSynchroniser = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, extensionManagement_1.IExtensionGalleryService),
        __param(6, configuration_1.IConfigurationService)
    ], ExtensionsSynchroniser);
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser;
});
//# sourceMappingURL=extensionsSync.js.map