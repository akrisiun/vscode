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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/extensionsMerge", "vs/base/common/arrays", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources", "vs/base/common/jsonFormatter", "vs/base/common/jsonEdit"], function (require, exports, userDataSync_1, event_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, configuration_1, extensionsMerge_1, arrays_1, abstractSynchronizer_1, telemetry_1, resources_1, jsonFormatter_1, jsonEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsSynchroniser = void 0;
    let ExtensionsSynchroniser = /** @class */ (() => {
        let ExtensionsSynchroniser = class ExtensionsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
            constructor(environmentService, fileService, userDataSyncStoreService, userDataSyncBackupStoreService, extensionManagementService, extensionEnablementService, logService, extensionGalleryService, configurationService, userDataSyncEnablementService, telemetryService) {
                super("extensions" /* Extensions */, fileService, environmentService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncEnablementService, telemetryService, logService, configurationService);
                this.extensionManagementService = extensionManagementService;
                this.extensionEnablementService = extensionEnablementService;
                this.extensionGalleryService = extensionGalleryService;
                this.version = 2;
                this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtension, (e => !!e.gallery)), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)), this.extensionEnablementService.onDidChangeEnablement), () => undefined, 500)(() => this._onDidChangeLocal.fire()));
            }
            isEnabled() { return super.isEnabled() && this.extensionGalleryService.isEnabled(); }
            async pull() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pulling extensions as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pulling extensions...`);
                    this.setStatus("syncing" /* Syncing */);
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                    if (remoteUserData.syncData !== null) {
                        const localExtensions = await this.getLocalExtensions();
                        const remoteExtensions = this.parseExtensions(remoteUserData.syncData);
                        const { added, updated, remote, removed } = extensionsMerge_1.merge(localExtensions, remoteExtensions, localExtensions, [], this.getIgnoredExtensions());
                        await this.apply({
                            added, removed, updated, remote, remoteUserData, localExtensions, skippedExtensions: [], lastSyncUserData,
                            hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                            hasRemoteChanged: remote !== null
                        });
                    }
                    // No remote exists to pull
                    else {
                        this.logService.info(`${this.syncResourceLogLabel}: Remote extensions does not exist.`);
                    }
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pulling extensions.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async push() {
                if (!this.isEnabled()) {
                    this.logService.info(`${this.syncResourceLogLabel}: Skipped pushing extensions as it is disabled.`);
                    return;
                }
                this.stop();
                try {
                    this.logService.info(`${this.syncResourceLogLabel}: Started pushing extensions...`);
                    this.setStatus("syncing" /* Syncing */);
                    const localExtensions = await this.getLocalExtensions();
                    const { added, removed, updated, remote } = extensionsMerge_1.merge(localExtensions, null, null, [], this.getIgnoredExtensions());
                    const lastSyncUserData = await this.getLastSyncUserData();
                    const remoteUserData = await this.getRemoteUserData(lastSyncUserData);
                    await this.apply({
                        added, removed, updated, remote, remoteUserData, localExtensions, skippedExtensions: [], lastSyncUserData,
                        hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                        hasRemoteChanged: remote !== null
                    }, true);
                    this.logService.info(`${this.syncResourceLogLabel}: Finished pushing extensions.`);
                }
                finally {
                    this.setStatus("idle" /* Idle */);
                }
            }
            async stop() { }
            async getAssociatedResources({ uri }) {
                return [{ resource: resources_1.joinPath(uri, 'extensions.json') }];
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
                            case 'extensions.json':
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
                try {
                    const localExtensions = await this.getLocalExtensions();
                    if (arrays_1.isNonEmptyArray(localExtensions)) {
                        return true;
                    }
                }
                catch (error) {
                    /* ignore error */
                }
                return false;
            }
            async performSync(remoteUserData, lastSyncUserData) {
                const previewResult = await this.generatePreview(remoteUserData, lastSyncUserData);
                await this.apply(previewResult);
                return "idle" /* Idle */;
            }
            async generatePreview(remoteUserData, lastSyncUserData) {
                const remoteExtensions = remoteUserData.syncData ? this.parseExtensions(remoteUserData.syncData) : null;
                const lastSyncExtensions = lastSyncUserData ? this.parseExtensions(lastSyncUserData.syncData) : null;
                const skippedExtensions = lastSyncUserData ? lastSyncUserData.skippedExtensions || [] : [];
                const localExtensions = await this.getLocalExtensions();
                if (remoteExtensions) {
                    this.logService.trace(`${this.syncResourceLogLabel}: Merging remote extensions with local extensions...`);
                }
                else {
                    this.logService.trace(`${this.syncResourceLogLabel}: Remote extensions does not exist. Synchronizing extensions for the first time.`);
                }
                const { added, removed, updated, remote } = extensionsMerge_1.merge(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, this.getIgnoredExtensions());
                return {
                    added,
                    removed,
                    updated,
                    remote,
                    skippedExtensions,
                    remoteUserData,
                    localExtensions,
                    lastSyncUserData,
                    hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                    hasRemoteChanged: remote !== null
                };
            }
            getIgnoredExtensions() {
                return this.configurationService.getValue('sync.ignoredExtensions') || [];
            }
            async apply({ added, removed, updated, remote, remoteUserData, skippedExtensions, lastSyncUserData, localExtensions, hasLocalChanged, hasRemoteChanged }, forcePush) {
                if (!hasLocalChanged && !hasRemoteChanged) {
                    this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing extensions.`);
                }
                if (hasLocalChanged) {
                    // back up all disabled or market place extensions
                    const backUpExtensions = localExtensions.filter(e => e.disabled || !!e.identifier.uuid);
                    await this.backupLocal(JSON.stringify(backUpExtensions));
                    skippedExtensions = await this.updateLocalExtensions(added, removed, updated, skippedExtensions);
                }
                if (remote) {
                    // update remote
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating remote extensions...`);
                    const content = JSON.stringify(remote);
                    remoteUserData = await this.updateRemoteUserData(content, forcePush ? null : remoteUserData.ref);
                    this.logService.info(`${this.syncResourceLogLabel}: Updated remote extensions`);
                }
                if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                    // update last sync
                    this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized extensions...`);
                    await this.updateLastSyncUserData(remoteUserData, { skippedExtensions });
                    this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized extensions`);
                }
            }
            async updateLocalExtensions(added, removed, updated, skippedExtensions) {
                const removeFromSkipped = [];
                const addToSkipped = [];
                if (removed.length) {
                    const installedExtensions = await this.extensionManagementService.getInstalled(1 /* User */);
                    const extensionsToRemove = installedExtensions.filter(({ identifier }) => removed.some(r => extensionManagementUtil_1.areSameExtensions(identifier, r)));
                    await Promise.all(extensionsToRemove.map(async (extensionToRemove) => {
                        this.logService.trace(`${this.syncResourceLogLabel}: Uninstalling local extension...`, extensionToRemove.identifier.id);
                        await this.extensionManagementService.uninstall(extensionToRemove);
                        this.logService.info(`${this.syncResourceLogLabel}: Uninstalled local extension.`, extensionToRemove.identifier.id);
                        removeFromSkipped.push(extensionToRemove.identifier);
                    }));
                }
                if (added.length || updated.length) {
                    await Promise.all([...added, ...updated].map(async (e) => {
                        const installedExtensions = await this.extensionManagementService.getInstalled();
                        const installedExtension = installedExtensions.filter(installed => extensionManagementUtil_1.areSameExtensions(installed.identifier, e.identifier))[0];
                        // Builtin Extension: Sync only enablement state
                        if (installedExtension && installedExtension.type === 0 /* System */) {
                            if (e.disabled) {
                                this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id);
                                await this.extensionEnablementService.disableExtension(e.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id);
                            }
                            else {
                                this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id);
                                await this.extensionEnablementService.enableExtension(e.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id);
                            }
                            removeFromSkipped.push(e.identifier);
                            return;
                        }
                        const extension = await this.extensionGalleryService.getCompatibleExtension(e.identifier, e.version);
                        if (extension) {
                            try {
                                if (e.disabled) {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id, extension.version);
                                    await this.extensionEnablementService.disableExtension(extension.identifier);
                                    this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id, extension.version);
                                }
                                else {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id, extension.version);
                                    await this.extensionEnablementService.enableExtension(extension.identifier);
                                    this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id, extension.version);
                                }
                                // Install only if the extension does not exist
                                if (!installedExtension || installedExtension.manifest.version !== extension.version) {
                                    this.logService.trace(`${this.syncResourceLogLabel}: Installing extension...`, e.identifier.id, extension.version);
                                    await this.extensionManagementService.installFromGallery(extension);
                                    this.logService.info(`${this.syncResourceLogLabel}: Installed extension.`, e.identifier.id, extension.version);
                                    removeFromSkipped.push(extension.identifier);
                                }
                            }
                            catch (error) {
                                addToSkipped.push(e);
                                this.logService.error(error);
                                this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension`, extension.displayName || extension.identifier.id);
                            }
                        }
                        else {
                            addToSkipped.push(e);
                        }
                    }));
                }
                const newSkippedExtensions = [];
                for (const skippedExtension of skippedExtensions) {
                    if (!removeFromSkipped.some(e => extensionManagementUtil_1.areSameExtensions(e, skippedExtension.identifier))) {
                        newSkippedExtensions.push(skippedExtension);
                    }
                }
                for (const skippedExtension of addToSkipped) {
                    if (!newSkippedExtensions.some(e => extensionManagementUtil_1.areSameExtensions(e.identifier, skippedExtension.identifier))) {
                        newSkippedExtensions.push(skippedExtension);
                    }
                }
                return newSkippedExtensions;
            }
            parseExtensions(syncData) {
                let extensions = JSON.parse(syncData.content);
                if (syncData.version !== this.version) {
                    extensions = extensions.map(e => {
                        // #region Migration from v1 (enabled -> disabled)
                        if (!e.enabled) {
                            e.disabled = true;
                        }
                        delete e.enabled;
                        // #endregion
                        return e;
                    });
                }
                return extensions;
            }
            async getLocalExtensions() {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const disabledExtensions = this.extensionEnablementService.getDisabledExtensions();
                return installedExtensions
                    .map(({ identifier }) => {
                    const syncExntesion = { identifier };
                    if (disabledExtensions.some(disabledExtension => extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier))) {
                        syncExntesion.disabled = true;
                    }
                    return syncExntesion;
                });
            }
        };
        ExtensionsSynchroniser = __decorate([
            __param(0, environment_1.IEnvironmentService),
            __param(1, files_1.IFileService),
            __param(2, userDataSync_1.IUserDataSyncStoreService),
            __param(3, userDataSync_1.IUserDataSyncBackupStoreService),
            __param(4, extensionManagement_1.IExtensionManagementService),
            __param(5, extensionManagement_1.IGlobalExtensionEnablementService),
            __param(6, userDataSync_1.IUserDataSyncLogService),
            __param(7, extensionManagement_1.IExtensionGalleryService),
            __param(8, configuration_1.IConfigurationService),
            __param(9, userDataSync_1.IUserDataSyncEnablementService),
            __param(10, telemetry_1.ITelemetryService)
        ], ExtensionsSynchroniser);
        return ExtensionsSynchroniser;
    })();
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser;
});
//# sourceMappingURL=extensionsSync.js.map