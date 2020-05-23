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
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/buffer", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/base/common/cancellation", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/content", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/resources"], function (require, exports, files_1, userDataSync_1, buffer_1, nls_1, event_1, async_1, environment_1, configuration_1, cancellation_1, settingsMerge_1, content_1, abstractSynchronizer_1, telemetry_1, extensionManagement_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsSynchroniser = void 0;
    function isSettingsSyncContent(thing) {
        return thing
            && (thing.settings && typeof thing.settings === 'string')
            && Object.keys(thing).length === 1;
    }
    let SettingsSynchroniser = /** @class */ (() => {
        let SettingsSynchroniser = class SettingsSynchroniser extends abstractSynchronizer_1.AbstractJsonFileSynchroniser {
            constructor(fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, logService, userDataSyncUtilService, configurationService, userDataSyncEnablementService, telemetryService, extensionManagementService) {
                super(environmentService.settingsResource, "settings" /* Settings */, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, userDataSyncUtilService, configurationService);
                this.extensionManagementService = extensionManagementService;
                this.version = 1;
                this.localPreviewResource = resources_1.joinPath(this.syncFolder, userDataSync_1.PREVIEW_DIR_NAME, 'settings.json');
                this.remotePreviewResource = this.localPreviewResource.with({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME });
                this._defaultIgnoredSettings = undefined;
            }
            setStatus(status) {
                super.setStatus(status);
                if (this.status !== "hasConflicts" /* HasConflicts */) {
                    this.setConflicts([]);
                }
            }
            async pull() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pulling settings as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pulling settings...`);
                    this.setStatus("syncing" /* Syncing */);
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                    const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                    if (remoteSettingsSyncContent !== null) {
                        const fileContent = await this.getLocalFileContent();
                        const formatUtils = await this.getFormattingOptions();
                        // Update ignored settings from local file content
                        const ignoredSettings = await this.getIgnoredSettings();
                        const content = settingsMerge_1.updateIgnoredSettings(remoteSettingsSyncContent.settings, fileContent ? fileContent.value.toString() : '{}', ignoredSettings, formatUtils);
                        this.syncPreviewResultPromise = async_1.createCancelablePromise(() => Promise.resolve({
                            fileContent,
                            remoteUserData,
                            lastSyncUserData,
                            content,
                            hasLocalChanged: true,
                            hasRemoteChanged: false,
                            hasConflicts: false,
                        }));
                        await this.apply();
                    }
                    // No remote exists to pull
                    else {
                        this.logService.info(`${this.syncResourceLogLabel}: Remote settings does not exist.`);
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pulling settings.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async push() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pushing settings as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pushing settings...`);
                    this.setStatus("syncing" /* Syncing */);
                    const fileContent = await this.getLocalFileContent();
                    if (fileContent !== null) {
                        const formatUtils = await this.getFormattingOptions();
                        // Remove ignored settings
                        const ignoredSettings = await this.getIgnoredSettings();
                        const content = settingsMerge_1.updateIgnoredSettings(fileContent.value.toString(), '{}', ignoredSettings, formatUtils);
                        const lastSyncUserData = await this.getLastSyncUserData();
                        const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                        this.syncPreviewResultPromise = async_1.createCancelablePromise(() => Promise.resolve({
                            fileContent,
                            remoteUserData,
                            lastSyncUserData,
                            content,
                            hasRemoteChanged: true,
                            hasLocalChanged: false,
                            hasConflicts: false,
                        }));
                        await this.apply(true);
                    }
                    // No local exists to push
                    else {
                        this.logService.info(`${this.syncResourceLogLabel}: Local settings does not exist.`);
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pushing settings.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async hasLocalData() {
                try {
                    const localFileContent = await this.getLocalFileContent();
                    if (localFileContent) {
                        const formatUtils = await this.getFormattingOptions();
                        const content = content_1.edit(localFileContent.value.toString(), [userDataSync_1.CONFIGURATION_SYNC_STORE_KEY], undefined, formatUtils);
                        return !settingsMerge_1.isEmpty(content);
                    }
                }
                catch (error) {
                    if (error.fileOperationResult !== 1 /* FILE_NOT_FOUND */) {
                        return true;
                    }
                }
                return false;
            }
            async getAssociatedResources({ uri }) {
                return [{ resource: resources_1.joinPath(uri, 'settings.json'), comparableResource: this.file }];
            }
            async resolveContent(uri) {
                if (resources_1.isEqual(this.remotePreviewResource, uri)) {
                    return this.getConflictContent(uri);
                }
                let content = await super.resolveContent(uri);
                if (content) {
                    return content;
                }
                content = await super.resolveContent(resources_1.dirname(uri));
                if (content) {
                    const syncData = this.parseSyncData(content);
                    if (syncData) {
                        const settingsSyncContent = this.parseSettingsSyncContent(syncData.content);
                        if (settingsSyncContent) {
                            switch (resources_1.basename(uri)) {
                                case 'settings.json':
                                    return settingsSyncContent.settings;
                            }
                        }
                    }
                }
                return null;
            }
            async getConflictContent(conflictResource) {
                let content = await super.getConflictContent(conflictResource);
                if (content !== null) {
                    const settingsSyncContent = this.parseSettingsSyncContent(content);
                    content = settingsSyncContent ? settingsSyncContent.settings : null;
                }
                if (content !== null) {
                    const formatUtils = await this.getFormattingOptions();
                    // remove ignored settings from the remote content for preview
                    const ignoredSettings = await this.getIgnoredSettings();
                    content = settingsMerge_1.updateIgnoredSettings(content, '{}', ignoredSettings, formatUtils);
                }
                return content;
            }
            async acceptConflict(conflict, content) {
                if (this.status === "hasConflicts" /* HasConflicts */
                    && (resources_1.isEqual(this.localPreviewResource, conflict) || resources_1.isEqual(this.remotePreviewResource, conflict))) {
                    const preview = await this.syncPreviewResultPromise;
                    this.cancel();
                    const formatUtils = await this.getFormattingOptions();
                    // Add ignored settings from local file content
                    const ignoredSettings = await this.getIgnoredSettings();
                    content = settingsMerge_1.updateIgnoredSettings(content, preview.fileContent ? preview.fileContent.value.toString() : '{}', ignoredSettings, formatUtils);
                    this.syncPreviewResultPromise = async_1.createCancelablePromise(async () => (Object.assign(Object.assign({}, preview), { content })));
                    await this.apply(true);
                    this.setStatus("idle" /* Idle */);
                }
            }
            async resolveSettingsConflicts(resolvedConflicts) {
                if (this.status === "hasConflicts" /* HasConflicts */) {
                    const preview = await this.syncPreviewResultPromise;
                    this.cancel();
                    await this.performSync(preview.remoteUserData, preview.lastSyncUserData, resolvedConflicts);
                }
            }
            async performSync(remoteUserData, lastSyncUserData, resolvedConflicts = []) {
                try {
                    const result = await this.getPreview(remoteUserData, lastSyncUserData, resolvedConflicts);
                    if (result.hasConflicts) {
                        return "hasConflicts" /* HasConflicts */;
                    }
                    await this.apply();
                    return "idle" /* Idle */;
                }
                catch (e) {
                    this.syncPreviewResultPromise = null;
                    if (e instanceof userDataSync_1.UserDataSyncError) {
                        switch (e.code) {
                            case userDataSync_1.UserDataSyncErrorCode.LocalPreconditionFailed:
                                // Rejected as there is a new local version. Syncing again.
                                this.logService.info(`${this.syncResourceLogLabel}: Failed to synchronize settings as there is a new local version available. Synchronizing again...`);
                                return this.performSync(remoteUserData, lastSyncUserData, resolvedConflicts);
                        }
                    }
                    throw e;
                }
            }
            async apply(forcePush) {
                if (!this.syncPreviewResultPromise) {
                    return;
                }
                let { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged } = await this.syncPreviewResultPromise;
                if (content !== null) {
                    this.validateContent(content);
                    if (hasLocalChanged) {
                        this.logService.trace(`${this.syncResourceLogLabel}: Updating local settings...`);
                        if (fileContent) {
                            await this.backupLocal(JSON.stringify(this.toSettingsSyncContent(fileContent.value.toString())));
                        }
                        await this.updateLocalFileContent(content, fileContent);
                        this.logService.info(`${this.syncResourceLogLabel}: Updated local settings`);
                    }
                    if (hasRemoteChanged) {
                        const formatUtils = await this.getFormattingOptions();
                        // Update ignored settings from remote
                        const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                        const ignoredSettings = await this.getIgnoredSettings(content);
                        content = settingsMerge_1.updateIgnoredSettings(content, remoteSettingsSyncContent ? remoteSettingsSyncContent.settings : '{}', ignoredSettings, formatUtils);
                        this.logService.trace(`${this.syncResourceLogLabel}: Updating remote settings...`);
                        remoteUserData = await this.updateRemoteUserData(JSON.stringify(this.toSettingsSyncContent(content)), forcePush ? null : remoteUserData.ref);
                        this.logService.info(`${this.syncResourceLogLabel}: Updated remote settings`);
                    }
                    // Delete the preview
                    try {
                        await this.fileService.del(this.localPreviewResource);
                    }
                    catch (e) { /* ignore */ }
                }
                else {
                    this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing settings.`);
                }
                if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized settings...`);
                    await this.updateLastSyncUserData(remoteUserData);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized settings`);
                }
                this.syncPreviewResultPromise = null;
            }
            getPreview(remoteUserData, lastSyncUserData, resolvedConflicts = []) {
                if (!this.syncPreviewResultPromise) {
                    this.syncPreviewResultPromise = async_1.createCancelablePromise(token => this.generatePreview(remoteUserData, lastSyncUserData, resolvedConflicts, token));
                }
                return this.syncPreviewResultPromise;
            }
            async generatePreview(remoteUserData, lastSyncUserData, resolvedConflicts = [], token = cancellation_1.CancellationToken.None) {
                const fileContent = await this.getLocalFileContent();
                const formattingOptions = await this.getFormattingOptions();
                const remoteSettingsSyncContent = this.getSettingsSyncContent(remoteUserData);
                const lastSettingsSyncContent = lastSyncUserData ? this.getSettingsSyncContent(lastSyncUserData) : null;
                let content = null;
                let hasLocalChanged = false;
                let hasRemoteChanged = false;
                let hasConflicts = false;
                if (remoteSettingsSyncContent) {
                    const localContent = fileContent ? fileContent.value.toString() : '{}';
                    this.validateContent(localContent);
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote settings with local settings...`);
                    const ignoredSettings = await this.getIgnoredSettings();
                    const result = settingsMerge_1.merge(localContent, remoteSettingsSyncContent.settings, lastSettingsSyncContent ? lastSettingsSyncContent.settings : null, ignoredSettings, resolvedConflicts, formattingOptions);
                    content = result.localContent || result.remoteContent;
                    hasLocalChanged = result.localContent !== null;
                    hasRemoteChanged = result.remoteContent !== null;
                    hasConflicts = result.hasConflicts;
                }
                // First time syncing to remote
                else if (fileContent) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Remote settings does not exist. Synchronizing settings for the first time.`);
                    content = fileContent.value.toString();
                    hasRemoteChanged = true;
                }
                if (content && !token.isCancellationRequested) {
                    // Remove the ignored settings from the preview.
                    const ignoredSettings = await this.getIgnoredSettings();
                    const previewContent = settingsMerge_1.updateIgnoredSettings(content, '{}', ignoredSettings, formattingOptions);
                    await this.fileService.writeFile(this.localPreviewResource, buffer_1.VSBuffer.fromString(previewContent));
                }
                this.setConflicts(hasConflicts && !token.isCancellationRequested ? [{ local: this.localPreviewResource, remote: this.remotePreviewResource }] : []);
                return { fileContent, remoteUserData, lastSyncUserData, content, hasLocalChanged, hasRemoteChanged, hasConflicts };
            }
            getSettingsSyncContent(remoteUserData) {
                return remoteUserData.syncData ? this.parseSettingsSyncContent(remoteUserData.syncData.content) : null;
            }
            parseSettingsSyncContent(syncContent) {
                try {
                    const parsed = JSON.parse(syncContent);
                    return isSettingsSyncContent(parsed) ? parsed : /* migrate */ { settings: syncContent };
                }
                catch (e) {
                    this.logService.error(e);
                }
                return null;
            }
            toSettingsSyncContent(settings) {
                return { settings };
            }
            async getIgnoredSettings(content) {
                if (!this._defaultIgnoredSettings) {
                    this._defaultIgnoredSettings = this.userDataSyncUtilService.resolveDefaultIgnoredSettings();
                    const disposable = event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtension, (e => !!e.gallery)), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)))(() => {
                        disposable.dispose();
                        this._defaultIgnoredSettings = undefined;
                    });
                }
                const defaultIgnoredSettings = await this._defaultIgnoredSettings;
                return settingsMerge_1.getIgnoredSettings(defaultIgnoredSettings, this.configurationService, content);
            }
            validateContent(content) {
                if (this.hasErrors(content)) {
                    throw new userDataSync_1.UserDataSyncError(nls_1.localize('errorInvalidSettings', "Unable to sync settings as there are errors/warning in settings file."), userDataSync_1.UserDataSyncErrorCode.LocalInvalidContent, this.resource);
                }
            }
        };
        SettingsSynchroniser = __decorate([
            __param(0, files_1.IFileService),
            __param(1, environment_1.IEnvironmentService),
            __param(2, userDataSync_1.IUserDataSyncStoreService),
            __param(3, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(4, userDataSync_1.IUserDataSyncLogService),
            __param(5, userDataSync_1.IUserDataSyncUtilService),
            __param(6, configuration_1.IConfigurationService),
            __param(7, userDataSync_1.IUserDataSyncEnablementService),
            __param(8, telemetry_1.ITelemetryService),
            __param(9, extensionManagement_1.IExtensionManagementService)
        ], SettingsSynchroniser);
        return SettingsSynchroniser;
    })();
    exports.SettingsSynchroniser = SettingsSynchroniser;
});
//# sourceMappingURL=settingsSync.js.map