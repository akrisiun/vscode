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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/buffer", "vs/base/common/json", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/platform/environment/common/environment", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/base/common/strings"], function (require, exports, lifecycle_1, files_1, userDataSync_1, buffer_1, json_1, nls_1, event_1, async_1, environment_1, resources_1, configuration_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SettingsSynchroniser = class SettingsSynchroniser extends lifecycle_1.Disposable {
        constructor(fileService, environmentService, userDataSyncStoreService, settingsMergeService, logService, configurationService) {
            super();
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.settingsMergeService = settingsMergeService;
            this.logService = logService;
            this.configurationService = configurationService;
            this.syncPreviewResultPromise = null;
            this._status = "idle" /* Idle */;
            this._onDidChangStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangStatus.event;
            this._onDidChangeLocal = this._register(new event_1.Emitter());
            this.onDidChangeLocal = this._onDidChangeLocal.event;
            this.lastSyncSettingsResource = resources_1.joinPath(this.environmentService.userRoamingDataHome, '.lastSyncSettings.json');
            this.throttledDelayer = this._register(new async_1.ThrottledDelayer(500));
            this._register(event_1.Event.filter(this.fileService.onFileChanges, e => e.contains(this.environmentService.settingsResource))(() => this.throttledDelayer.trigger(() => this.onDidChangeSettings())));
        }
        get status() { return this._status; }
        async onDidChangeSettings() {
            const localFileContent = await this.getLocalFileContent();
            const lastSyncData = await this.getLastSyncUserData();
            if (localFileContent && lastSyncData) {
                if (localFileContent.value.toString() !== lastSyncData.content) {
                    this._onDidChangeLocal.fire();
                    return;
                }
            }
            if (!localFileContent || !lastSyncData) {
                this._onDidChangeLocal.fire();
                return;
            }
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangStatus.fire(status);
            }
        }
        async sync(_continue) {
            if (!this.configurationService.getValue('configurationSync.enableSettings')) {
                this.logService.trace('Settings: Skipping synchronizing settings as it is disabled.');
                return false;
            }
            if (_continue) {
                this.logService.info('Settings: Resumed synchronizing settings');
                return this.continueSync();
            }
            if (this.status !== "idle" /* Idle */) {
                this.logService.trace('Settings: Skipping synchronizing settings as it is running already.');
                return false;
            }
            this.logService.trace('Settings: Started synchronizing settings...');
            this.setStatus("syncing" /* Syncing */);
            try {
                const result = await this.getPreview();
                if (result.hasConflicts) {
                    this.logService.info('Settings: Detected conflicts while synchronizing settings.');
                    this.setStatus("hasConflicts" /* HasConflicts */);
                    return false;
                }
                await this.apply();
                return true;
            }
            catch (e) {
                this.syncPreviewResultPromise = null;
                this.setStatus("idle" /* Idle */);
                if (e instanceof userDataSync_1.UserDataSyncStoreError && e.code === userDataSync_1.UserDataSyncStoreErrorCode.Rejected) {
                    // Rejected as there is a new remote version. Syncing again,
                    this.logService.info('Settings: Failed to synchronise settings as there is a new remote version available. Synchronizing again...');
                    return this.sync();
                }
                if (e instanceof files_1.FileSystemProviderError && e.code === files_1.FileSystemProviderErrorCode.FileExists) {
                    // Rejected as there is a new local version. Syncing again.
                    this.logService.info('Settings: Failed to synchronise settings as there is a new local version available. Synchronizing again...');
                    return this.sync();
                }
                throw e;
            }
        }
        stop() {
            if (this.syncPreviewResultPromise) {
                this.syncPreviewResultPromise.cancel();
                this.syncPreviewResultPromise = null;
                this.logService.info('Settings: Stopped synchronizing settings.');
            }
            this.fileService.del(this.environmentService.settingsSyncPreviewResource);
            this.setStatus("idle" /* Idle */);
        }
        async continueSync() {
            if (this.status !== "hasConflicts" /* HasConflicts */) {
                return false;
            }
            await this.apply();
            return true;
        }
        async apply() {
            if (!this.syncPreviewResultPromise) {
                return;
            }
            if (await this.fileService.exists(this.environmentService.settingsSyncPreviewResource)) {
                const settingsPreivew = await this.fileService.readFile(this.environmentService.settingsSyncPreviewResource);
                const content = settingsPreivew.value.toString();
                if (this.hasErrors(content)) {
                    const error = new Error(nls_1.localize('errorInvalidSettings', "Unable to sync settings. Please resolve conflicts without any errors/warnings and try again."));
                    this.logService.error(error);
                    throw error;
                }
                let { fileContent, remoteUserData, hasLocalChanged, hasRemoteChanged } = await this.syncPreviewResultPromise;
                if (!hasLocalChanged && !hasRemoteChanged) {
                    this.logService.trace('Settings: No changes found during synchronizing settings.');
                }
                if (hasLocalChanged) {
                    this.logService.info('Settings: Updating local settings');
                    await this.writeToLocal(content, fileContent);
                }
                if (hasRemoteChanged) {
                    const remoteContent = remoteUserData.content ? await this.settingsMergeService.computeRemoteContent(content, remoteUserData.content, this.getIgnoredSettings(content)) : content;
                    this.logService.info('Settings: Updating remote settings');
                    const ref = await this.writeToRemote(remoteContent, remoteUserData.ref);
                    remoteUserData = { ref, content };
                }
                if (remoteUserData.content) {
                    this.logService.info('Settings: Updating last synchronised sttings');
                    await this.updateLastSyncValue(remoteUserData);
                }
                // Delete the preview
                await this.fileService.del(this.environmentService.settingsSyncPreviewResource);
            }
            else {
                this.logService.trace('Settings: No changes found during synchronizing settings.');
            }
            this.logService.trace('Settings: Finised synchronizing settings.');
            this.syncPreviewResultPromise = null;
            this.setStatus("idle" /* Idle */);
        }
        hasErrors(content) {
            const parseErrors = [];
            json_1.parse(content, parseErrors, { allowEmptyContent: true, allowTrailingComma: true });
            return parseErrors.length > 0;
        }
        getPreview() {
            if (!this.syncPreviewResultPromise) {
                this.syncPreviewResultPromise = async_1.createCancelablePromise(token => this.generatePreview(token));
            }
            return this.syncPreviewResultPromise;
        }
        async generatePreview(token) {
            const lastSyncData = await this.getLastSyncUserData();
            const remoteUserData = await this.userDataSyncStoreService.read(SettingsSynchroniser.EXTERNAL_USER_DATA_SETTINGS_KEY, lastSyncData);
            const remoteContent = remoteUserData.content;
            // Get file content last to get the latest
            const fileContent = await this.getLocalFileContent();
            let hasLocalChanged = false;
            let hasRemoteChanged = false;
            let hasConflicts = false;
            let previewContent = null;
            if (remoteContent) {
                const localContent = fileContent ? fileContent.value.toString() : '{}';
                if (this.hasErrors(localContent)) {
                    this.logService.error('Settings: Unable to sync settings as there are errors/warning in settings file.');
                    return { fileContent, remoteUserData, hasLocalChanged, hasRemoteChanged, hasConflicts };
                }
                if (!lastSyncData // First time sync
                    || lastSyncData.content !== localContent // Local has moved forwarded
                    || lastSyncData.content !== remoteContent // Remote has moved forwarded
                ) {
                    this.logService.trace('Settings: Merging remote settings with local settings...');
                    const result = await this.settingsMergeService.merge(localContent, remoteContent, lastSyncData ? lastSyncData.content : null, this.getIgnoredSettings());
                    // Sync only if there are changes
                    if (result.hasChanges) {
                        hasLocalChanged = result.mergeContent !== localContent;
                        hasRemoteChanged = result.mergeContent !== remoteContent;
                        hasConflicts = result.hasConflicts;
                        previewContent = result.mergeContent;
                    }
                }
            }
            // First time syncing to remote
            else if (fileContent) {
                this.logService.info('Settings: Remote settings does not exist. Synchronizing settings for the first time.');
                hasRemoteChanged = true;
                previewContent = fileContent.value.toString();
            }
            if (previewContent && !token.isCancellationRequested) {
                await this.fileService.writeFile(this.environmentService.settingsSyncPreviewResource, buffer_1.VSBuffer.fromString(previewContent));
            }
            return { fileContent, remoteUserData, hasLocalChanged, hasRemoteChanged, hasConflicts };
        }
        getIgnoredSettings(settingsContent) {
            let value = [];
            if (settingsContent) {
                const setting = json_1.parse(settingsContent);
                if (setting) {
                    value = setting['configurationSync.settingsToIgnore'];
                }
            }
            else {
                value = this.configurationService.getValue('configurationSync.settingsToIgnore');
            }
            const added = [], removed = [];
            if (Array.isArray(value)) {
                for (const key of value) {
                    if (strings_1.startsWith(key, '-')) {
                        removed.push(key.substring(1));
                    }
                    else {
                        added.push(key);
                    }
                }
            }
            return [...userDataSync_1.DEFAULT_IGNORED_SETTINGS, ...added].filter(setting => removed.indexOf(setting) === -1);
        }
        async getLastSyncUserData() {
            try {
                const content = await this.fileService.readFile(this.lastSyncSettingsResource);
                return JSON.parse(content.value.toString());
            }
            catch (error) {
                return null;
            }
        }
        async getLocalFileContent() {
            try {
                return await this.fileService.readFile(this.environmentService.settingsResource);
            }
            catch (error) {
                return null;
            }
        }
        async writeToRemote(content, ref) {
            return this.userDataSyncStoreService.write(SettingsSynchroniser.EXTERNAL_USER_DATA_SETTINGS_KEY, content, ref);
        }
        async writeToLocal(newContent, oldContent) {
            if (oldContent) {
                // file exists already
                await this.fileService.writeFile(this.environmentService.settingsResource, buffer_1.VSBuffer.fromString(newContent), oldContent);
            }
            else {
                // file does not exist
                await this.fileService.createFile(this.environmentService.settingsResource, buffer_1.VSBuffer.fromString(newContent), { overwrite: false });
            }
        }
        async updateLastSyncValue(remoteUserData) {
            await this.fileService.writeFile(this.lastSyncSettingsResource, buffer_1.VSBuffer.fromString(JSON.stringify(remoteUserData)));
        }
    };
    SettingsSynchroniser.EXTERNAL_USER_DATA_SETTINGS_KEY = 'settings';
    SettingsSynchroniser = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.ISettingsMergeService),
        __param(4, userDataSync_1.IUserDataSyncLogService),
        __param(5, configuration_1.IConfigurationService)
    ], SettingsSynchroniser);
    exports.SettingsSynchroniser = SettingsSynchroniser;
});
//# sourceMappingURL=settingsSync.js.map