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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/buffer", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/platform/files/common/files", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/globalStateMerge", "vs/base/common/json", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/platform/configuration/common/configuration", "vs/base/common/jsonFormatter", "vs/base/common/jsonEdit", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/storageKeys", "vs/base/common/arrays"], function (require, exports, userDataSync_1, buffer_1, event_1, environment_1, resources_1, files_1, content_1, globalStateMerge_1, json_1, abstractSynchronizer_1, telemetry_1, configuration_1, jsonFormatter_1, jsonEdit_1, storage_1, storageKeys_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStateSynchroniser = void 0;
    const argvStoragePrefx = 'globalState.argv.';
    const argvProperties = ['locale'];
    let GlobalStateSynchroniser = /** @class */ (() => {
        let GlobalStateSynchroniser = class GlobalStateSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
            constructor(fileService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, environmentService, userDataSyncEnablementService, telemetryService, configurationService, storageService, storageKeysSyncRegistryService) {
                super("globalState" /* GlobalState */, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService);
                this.environmentService = environmentService;
                this.storageService = storageService;
                this.storageKeysSyncRegistryService = storageKeysSyncRegistryService;
                this.version = 1;
                this._register(this.fileService.watch(resources_1.dirname(this.environmentService.argvResource)));
                this._register(event_1.Event.any(
                /* Locale change */
                event_1.Event.filter(this.fileService.onDidFilesChange, e => e.contains(this.environmentService.argvResource)), 
                /* Storage change */
                event_1.Event.filter(this.storageService.onDidChangeStorage, e => storageKeysSyncRegistryService.storageKeys.some(({ key }) => e.key === key)), 
                /* Storage key registered */
                this.storageKeysSyncRegistryService.onDidChangeStorageKeys)((() => this._onDidChangeLocal.fire())));
            }
            async pull() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pulling ui state as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pulling ui state...`);
                    this.setStatus("syncing" /* Syncing */);
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                    if (remoteUserData.syncData !== null) {
                        const localGlobalState = await this.getLocalGlobalState();
                        const remoteGlobalState = JSON.parse(remoteUserData.syncData.content);
                        const { local, remote, skipped } = globalStateMerge_1.merge(localGlobalState.storage, remoteGlobalState.storage, null, this.getSyncStorageKeys(), (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.skippedStorageKeys) || [], this.logService);
                        await this.apply({
                            local, remote, remoteUserData, localUserData: localGlobalState, lastSyncUserData,
                            skippedStorageKeys: skipped,
                            hasLocalChanged: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0,
                            hasRemoteChanged: remote !== null
                        });
                    }
                    // No remote exists to pull
                    else {
                        this.logService.info(`${this.syncResourceLogLabel}: Remote UI state does not exist.`);
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pulling UI state.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async push() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pushing UI State as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pushing UI State...`);
                    this.setStatus("syncing" /* Syncing */);
                    const localUserData = await this.getLocalGlobalState();
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                    await this.apply({
                        local: { added: {}, removed: [], updated: {} }, remote: localUserData.storage, remoteUserData, localUserData, lastSyncUserData,
                        skippedStorageKeys: [],
                        hasLocalChanged: false,
                        hasRemoteChanged: true
                    }, true);
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pushing UI State.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async stop() { }
            async getAssociatedResources({ uri }) {
                return [{ resource: resources_1.joinPath(uri, 'globalState.json') }];
            }
            async resolveContent(uri) {
                let content = await super.resolveContent(uri);
                if (content) {
                    return content;
                }
                content = await super.resolveContent(resources_1.dirname(uri));
                if (content) {
                    const syncData = this.parseSyncData(content);
                    if (syncData) {
                        switch (resources_1.basename(uri)) {
                            case 'globalState.json':
                                const edits = jsonFormatter_1.format(syncData.content, undefined, {});
                                return jsonEdit_1.applyEdits(syncData.content, edits);
                        }
                    }
                }
                return null;
            }
            async acceptConflict(conflict, content) {
                throw new Error(`${this.syncResourceLogLabel}: Conflicts should not occur`);
            }
            async hasLocalData() {
                var _a;
                try {
                    const { storage } = await this.getLocalGlobalState();
                    if (Object.keys(storage).length > 1 || ((_a = storage[`${argvStoragePrefx}.locale`]) === null || _a === void 0 ? void 0 : _a.value) !== 'en') {
                        return true;
                    }
                }
                catch (error) {
                    /* ignore error */
                }
                return false;
            }
            async performSync(remoteUserData, lastSyncUserData) {
                const result = await this.generatePreview(remoteUserData, lastSyncUserData);
                await this.apply(result);
                return "idle" /* Idle */;
            }
            async generatePreview(remoteUserData, lastSyncUserData) {
                const remoteGlobalState = remoteUserData.syncData ? JSON.parse(remoteUserData.syncData.content) : null;
                const lastSyncGlobalState = lastSyncUserData && lastSyncUserData.syncData ? JSON.parse(lastSyncUserData.syncData.content) : null;
                const localGloablState = await this.getLocalGlobalState();
                if (remoteGlobalState) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote ui state with local ui state...`);
                }
                else {
                    this.logService.trace(`${this.syncResourceLogLabel}: Remote ui state does not exist. Synchronizing ui state for the first time.`);
                }
                const { local, remote, skipped } = globalStateMerge_1.merge(localGloablState.storage, remoteGlobalState ? remoteGlobalState.storage : null, lastSyncGlobalState ? lastSyncGlobalState.storage : null, this.getSyncStorageKeys(), (lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.skippedStorageKeys) || [], this.logService);
                return {
                    local, remote, remoteUserData, localUserData: localGloablState, lastSyncUserData,
                    skippedStorageKeys: skipped,
                    hasLocalChanged: Object.keys(local.added).length > 0 || Object.keys(local.updated).length > 0 || local.removed.length > 0,
                    hasRemoteChanged: remote !== null
                };
            }
            async apply({ local, remote, remoteUserData, lastSyncUserData, localUserData, hasLocalChanged, hasRemoteChanged, skippedStorageKeys }, forcePush) {
                if (!hasLocalChanged && !hasRemoteChanged) {
                    this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing ui state.`);
                }
                if (hasLocalChanged) {
                    // update local
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating local ui state...`);
                    await this.backupLocal(JSON.stringify(localUserData));
                    await this.writeLocalGlobalState(local);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated local ui state`);
                }
                if (hasRemoteChanged) {
                    // update remote
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating remote ui state...`);
                    const content = JSON.stringify({ storage: remote });
                    remoteUserData = await this.updateRemoteUserData(content, forcePush ? null : remoteUserData.ref);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated remote ui state`);
                }
                if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref || !arrays_1.equals(lastSyncUserData.skippedStorageKeys, skippedStorageKeys)) {
                    // update last sync
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized ui state...`);
                    await this.updateLastSyncUserData(remoteUserData, { skippedStorageKeys });
                    this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized ui state`);
                }
            }
            async getLocalGlobalState() {
                const storage = {};
                const argvContent = await this.getLocalArgvContent();
                const argvValue = json_1.parse(argvContent);
                for (const argvProperty of argvProperties) {
                    if (argvValue[argvProperty] !== undefined) {
                        storage[`${argvStoragePrefx}${argvProperty}`] = { version: 1, value: argvValue[argvProperty] };
                    }
                }
                for (const { key, version } of this.storageKeysSyncRegistryService.storageKeys) {
                    const value = this.storageService.get(key, 0 /* GLOBAL */);
                    if (value) {
                        storage[key] = { version, value };
                    }
                }
                return { storage };
            }
            async getLocalArgvContent() {
                try {
                    const content = await this.fileService.readFile(this.environmentService.argvResource);
                    return content.value.toString();
                }
                catch (error) { }
                return '{}';
            }
            async writeLocalGlobalState({ added, removed, updated }) {
                const argv = {};
                const updatedStorage = {};
                const handleUpdatedStorage = (keys, storage) => {
                    for (const key of keys) {
                        if (key.startsWith(argvStoragePrefx)) {
                            argv[key.substring(argvStoragePrefx.length)] = storage ? storage[key].value : undefined;
                            continue;
                        }
                        if (storage) {
                            const storageValue = storage[key];
                            if (storageValue.value !== String(this.storageService.get(key, 0 /* GLOBAL */))) {
                                updatedStorage[key] = storageValue.value;
                            }
                        }
                        else {
                            if (this.storageService.get(key, 0 /* GLOBAL */) !== undefined) {
                                updatedStorage[key] = undefined;
                            }
                        }
                    }
                };
                handleUpdatedStorage(Object.keys(added), added);
                handleUpdatedStorage(Object.keys(updated), updated);
                handleUpdatedStorage(removed);
                if (Object.keys(argv).length) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating locale...`);
                    await this.updateArgv(argv);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated locale`);
                }
                const updatedStorageKeys = Object.keys(updatedStorage);
                if (updatedStorageKeys.length) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating global state...`);
                    for (const key of Object.keys(updatedStorage)) {
                        this.storageService.store(key, updatedStorage[key], 0 /* GLOBAL */);
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Updated global state`, Object.keys(updatedStorage));
                }
            }
            async updateArgv(argv) {
                const argvContent = await this.getLocalArgvContent();
                let content = argvContent;
                for (const argvProperty of Object.keys(argv)) {
                    content = content_1.edit(content, [argvProperty], argv[argvProperty], {});
                }
                if (argvContent !== content) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating locale...`);
                    await this.fileService.writeFile(this.environmentService.argvResource, buffer_1.VSBuffer.fromString(content));
                    this.logService.info(`${this.syncResourceLogLabel}: Updated locale.`);
                }
            }
            getSyncStorageKeys() {
                return [...this.storageKeysSyncRegistryService.storageKeys, ...argvProperties.map(argvProprety => ({ key: `${argvStoragePrefx}${argvProprety}`, version: 1 }))];
            }
        };
        GlobalStateSynchroniser = __decorate([
            __param(0, files_1.IFileService),
            __param(1, userDataSync_1.IUserDataSyncStoreService),
            __param(2, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(3, userDataSync_1.IUserDataSyncLogService),
            __param(4, environment_1.IEnvironmentService),
            __param(5, userDataSync_1.IUserDataSyncEnablementService),
            __param(6, telemetry_1.ITelemetryService),
            __param(7, configuration_1.IConfigurationService),
            __param(8, storage_1.IStorageService),
            __param(9, storageKeys_1.IStorageKeysSyncRegistryService)
        ], GlobalStateSynchroniser);
        return GlobalStateSynchroniser;
    })();
    exports.GlobalStateSynchroniser = GlobalStateSynchroniser;
});
//# sourceMappingURL=globalStateSync.js.map