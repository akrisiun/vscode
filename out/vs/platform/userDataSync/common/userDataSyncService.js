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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/userDataSync/common/settingsSync", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/platform/userDataSync/common/extensionsSync", "vs/platform/auth/common/auth"], function (require, exports, userDataSync_1, lifecycle_1, instantiation_1, settingsSync_1, event_1, configuration_1, async_1, extensionsSync_1, auth_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncService = class UserDataSyncService extends lifecycle_1.Disposable {
        constructor(userDataSyncStoreService, instantiationService, authTokenService) {
            super();
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.instantiationService = instantiationService;
            this.authTokenService = authTokenService;
            this._status = "uninitialized" /* Uninitialized */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            this._conflictsSource = null;
            this.settingsSynchroniser = this._register(this.instantiationService.createInstance(settingsSync_1.SettingsSynchroniser));
            this.extensionsSynchroniser = this._register(this.instantiationService.createInstance(extensionsSync_1.ExtensionsSynchroniser));
            this.synchronisers = [this.settingsSynchroniser, this.extensionsSynchroniser];
            this.updateStatus();
            this._register(event_1.Event.any(...this.synchronisers.map(s => event_1.Event.map(s.onDidChangeStatus, () => undefined)))(() => this.updateStatus()));
            this.onDidChangeLocal = event_1.Event.any(...this.synchronisers.map(s => s.onDidChangeLocal));
            this._register(authTokenService.onDidChangeStatus(() => this.onDidChangeAuthTokenStatus()));
        }
        get status() { return this._status; }
        get conflictsSource() { return this._conflictsSource; }
        async sync(_continue) {
            if (!this.userDataSyncStoreService.enabled) {
                throw new Error('Not enabled');
            }
            if (this.authTokenService.status === "Inactive" /* Inactive */) {
                throw new Error('Not Authenticated. Please sign in to start sync.');
            }
            for (const synchroniser of this.synchronisers) {
                if (!await synchroniser.sync(_continue)) {
                    return false;
                }
            }
            return true;
        }
        stop() {
            if (!this.userDataSyncStoreService.enabled) {
                throw new Error('Not enabled');
            }
            for (const synchroniser of this.synchronisers) {
                synchroniser.stop();
            }
        }
        removeExtension(identifier) {
            return this.extensionsSynchroniser.removeExtension(identifier);
        }
        updateStatus() {
            this._conflictsSource = this.computeConflictsSource();
            this.setStatus(this.computeStatus());
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
            }
        }
        computeStatus() {
            if (!this.userDataSyncStoreService.enabled) {
                return "uninitialized" /* Uninitialized */;
            }
            if (this.synchronisers.some(s => s.status === "hasConflicts" /* HasConflicts */)) {
                return "hasConflicts" /* HasConflicts */;
            }
            if (this.synchronisers.some(s => s.status === "syncing" /* Syncing */)) {
                return "syncing" /* Syncing */;
            }
            return "idle" /* Idle */;
        }
        computeConflictsSource() {
            const source = this.synchronisers.filter(s => s.status === "hasConflicts" /* HasConflicts */)[0];
            if (source) {
                if (source instanceof settingsSync_1.SettingsSynchroniser) {
                    return 1 /* Settings */;
                }
            }
            return null;
        }
        onDidChangeAuthTokenStatus() {
            if (this.authTokenService.status === "Inactive" /* Inactive */) {
                this.stop();
            }
        }
    };
    UserDataSyncService = __decorate([
        __param(0, userDataSync_1.IUserDataSyncStoreService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, auth_1.IAuthTokenService)
    ], UserDataSyncService);
    exports.UserDataSyncService = UserDataSyncService;
    let UserDataAutoSync = class UserDataAutoSync extends lifecycle_1.Disposable {
        constructor(configurationService, userDataSyncService, userDataSyncStoreService, logService, authTokenService) {
            super();
            this.configurationService = configurationService;
            this.userDataSyncService = userDataSyncService;
            this.logService = logService;
            this.authTokenService = authTokenService;
            this.enabled = false;
            this.updateEnablement(false);
            this._register(event_1.Event.any(authTokenService.onDidChangeStatus, userDataSyncService.onDidChangeStatus)(() => this.updateEnablement(true)));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('configurationSync.enable'))(() => this.updateEnablement(true)));
            // Sync immediately if there is a local change.
            this._register(event_1.Event.debounce(this.userDataSyncService.onDidChangeLocal, () => undefined, 500)(() => this.sync(false)));
        }
        updateEnablement(stopIfDisabled) {
            const enabled = this.isSyncEnabled();
            if (this.enabled === enabled) {
                return;
            }
            this.enabled = enabled;
            if (this.enabled) {
                this.logService.info('Syncing configuration started');
                this.sync(true);
                return;
            }
            else {
                if (stopIfDisabled) {
                    this.userDataSyncService.stop();
                    this.logService.info('Syncing configuration stopped.');
                }
            }
        }
        async sync(loop) {
            if (this.enabled) {
                try {
                    await this.userDataSyncService.sync();
                }
                catch (e) {
                    if (e instanceof userDataSync_1.UserDataSyncStoreError && e.code === userDataSync_1.UserDataSyncStoreErrorCode.Unauthroized) {
                        if (e instanceof userDataSync_1.UserDataSyncStoreError && e.code === userDataSync_1.UserDataSyncStoreErrorCode.Unauthroized && this.authTokenService.status === "Disabled" /* Disabled */) {
                            this.logService.error('Sync failed because the server requires authorization. Please enable authorization.');
                        }
                        else {
                            this.logService.error(e);
                        }
                    }
                    this.logService.error(e);
                }
                if (loop) {
                    await async_1.timeout(1000 * 5); // Loop sync for every 5s.
                    this.sync(loop);
                }
            }
        }
        isSyncEnabled() {
            return this.configurationService.getValue('configurationSync.enable')
                && this.userDataSyncService.status !== "uninitialized" /* Uninitialized */
                && this.authTokenService.status !== "Inactive" /* Inactive */;
        }
    };
    UserDataAutoSync = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, auth_1.IAuthTokenService)
    ], UserDataAutoSync);
    exports.UserDataAutoSync = UserDataAutoSync;
});
//# sourceMappingURL=userDataSyncService.js.map