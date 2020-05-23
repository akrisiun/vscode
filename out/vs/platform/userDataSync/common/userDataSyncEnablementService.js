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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/environment/common/environment"], function (require, exports, userDataSync_1, lifecycle_1, event_1, storage_1, telemetry_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncEnablementService = void 0;
    const enablementKey = 'sync.enable';
    function getEnablementKey(resource) { return `${enablementKey}.${resource}`; }
    let UserDataSyncEnablementService = /** @class */ (() => {
        let UserDataSyncEnablementService = class UserDataSyncEnablementService extends lifecycle_1.Disposable {
            constructor(storageService, telemetryService, environmentService) {
                super();
                this.storageService = storageService;
                this.telemetryService = telemetryService;
                this.environmentService = environmentService;
                this._onDidChangeEnablement = new event_1.Emitter();
                this.onDidChangeEnablement = this._onDidChangeEnablement.event;
                this._onDidChangeResourceEnablement = new event_1.Emitter();
                this.onDidChangeResourceEnablement = this._onDidChangeResourceEnablement.event;
                this._register(storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
            }
            canToggleEnablement() {
                return this.environmentService.sync === undefined;
            }
            isEnabled() {
                switch (this.environmentService.sync) {
                    case 'on':
                        return true;
                    case 'off':
                        return false;
                }
                return this.storageService.getBoolean(enablementKey, 0 /* GLOBAL */, this.environmentService.enableSyncByDefault);
            }
            setEnablement(enabled) {
                if (this.isEnabled() !== enabled) {
                    this.telemetryService.publicLog2(enablementKey, { enabled });
                    this.storageService.store(enablementKey, enabled, 0 /* GLOBAL */);
                }
            }
            isResourceEnabled(resource) {
                return this.storageService.getBoolean(getEnablementKey(resource), 0 /* GLOBAL */, true);
            }
            setResourceEnablement(resource, enabled) {
                if (this.isResourceEnabled(resource) !== enabled) {
                    const resourceEnablementKey = getEnablementKey(resource);
                    this.telemetryService.publicLog2(resourceEnablementKey, { enabled });
                    this.storageService.store(resourceEnablementKey, enabled, 0 /* GLOBAL */);
                }
            }
            onDidStorageChange(workspaceStorageChangeEvent) {
                if (workspaceStorageChangeEvent.scope === 0 /* GLOBAL */) {
                    if (enablementKey === workspaceStorageChangeEvent.key) {
                        this._onDidChangeEnablement.fire(this.isEnabled());
                        return;
                    }
                    const resourceKey = userDataSync_1.ALL_SYNC_RESOURCES.filter(resourceKey => getEnablementKey(resourceKey) === workspaceStorageChangeEvent.key)[0];
                    if (resourceKey) {
                        this._onDidChangeResourceEnablement.fire([resourceKey, this.isEnabled()]);
                        return;
                    }
                }
            }
        };
        UserDataSyncEnablementService = __decorate([
            __param(0, storage_1.IStorageService),
            __param(1, telemetry_1.ITelemetryService),
            __param(2, environment_1.IEnvironmentService)
        ], UserDataSyncEnablementService);
        return UserDataSyncEnablementService;
    })();
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService;
});
//# sourceMappingURL=userDataSyncEnablementService.js.map