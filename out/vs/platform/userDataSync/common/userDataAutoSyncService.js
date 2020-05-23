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
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/platform/authentication/common/authentication", "vs/platform/telemetry/common/telemetry"], function (require, exports, async_1, event_1, lifecycle_1, userDataSync_1, authentication_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    let UserDataAutoSyncService = /** @class */ (() => {
        let UserDataAutoSyncService = class UserDataAutoSyncService extends lifecycle_1.Disposable {
            constructor(userDataSyncEnablementService, userDataSyncService, logService, authTokenService, telemetryService) {
                super();
                this.userDataSyncEnablementService = userDataSyncEnablementService;
                this.userDataSyncService = userDataSyncService;
                this.logService = logService;
                this.authTokenService = authTokenService;
                this.telemetryService = telemetryService;
                this.enabled = false;
                this.successiveFailures = 0;
                this._onError = this._register(new event_1.Emitter());
                this.onError = this._onError.event;
                this.updateEnablement(false, true);
                this.syncDelayer = this._register(new async_1.Delayer(0));
                this._register(event_1.Event.any(authTokenService.onDidChangeToken)(() => this.updateEnablement(true, true)));
                this._register(event_1.Event.any(userDataSyncService.onDidChangeStatus)(() => this.updateEnablement(true, true)));
                this._register(this.userDataSyncEnablementService.onDidChangeEnablement(() => this.updateEnablement(true, false)));
                this._register(this.userDataSyncEnablementService.onDidChangeResourceEnablement(() => this.triggerAutoSync(['resourceEnablement'])));
            }
            async updateEnablement(stopIfDisabled, auto) {
                const { enabled, reason } = await this.isAutoSyncEnabled();
                if (this.enabled === enabled) {
                    return;
                }
                this.enabled = enabled;
                if (this.enabled) {
                    this.logService.info('Auto Sync: Started');
                    this.sync(true, auto);
                    return;
                }
                else {
                    this.resetFailures();
                    if (stopIfDisabled) {
                        this.userDataSyncService.stop();
                        this.logService.info('Auto Sync: stopped because', reason);
                    }
                }
            }
            async sync(loop, auto) {
                if (this.enabled) {
                    try {
                        await this.userDataSyncService.sync();
                        this.resetFailures();
                    }
                    catch (e) {
                        const error = userDataSync_1.UserDataSyncError.toUserDataSyncError(e);
                        if (error.code === userDataSync_1.UserDataSyncErrorCode.TurnedOff || error.code === userDataSync_1.UserDataSyncErrorCode.SessionExpired) {
                            this.logService.info('Auto Sync: Sync is turned off in the cloud.');
                            this.logService.info('Auto Sync: Resetting the local sync state.');
                            await this.userDataSyncService.resetLocal();
                            this.logService.info('Auto Sync: Completed resetting the local sync state.');
                            if (auto) {
                                this.userDataSyncEnablementService.setEnablement(false);
                                this._onError.fire(error);
                                return;
                            }
                            else {
                                return this.sync(loop, auto);
                            }
                        }
                        this.logService.error(error);
                        this.successiveFailures++;
                        this._onError.fire(error);
                    }
                    if (loop) {
                        await async_1.timeout(1000 * 60 * 5);
                        this.sync(loop, true);
                    }
                }
                else {
                    this.logService.trace('Auto Sync: Not syncing as it is disabled.');
                }
            }
            async isAutoSyncEnabled() {
                if (!this.userDataSyncEnablementService.isEnabled()) {
                    return { enabled: false, reason: 'sync is disabled' };
                }
                if (this.userDataSyncService.status === "uninitialized" /* Uninitialized */) {
                    return { enabled: false, reason: 'sync is not initialized' };
                }
                const token = await this.authTokenService.getToken();
                if (!token) {
                    return { enabled: false, reason: 'token is not avaialable' };
                }
                return { enabled: true };
            }
            resetFailures() {
                this.successiveFailures = 0;
            }
            async triggerAutoSync(sources) {
                sources.forEach(source => this.telemetryService.publicLog2('sync/triggerAutoSync', { source }));
                if (this.enabled) {
                    return this.syncDelayer.trigger(() => {
                        this.logService.info('Auto Sync: Triggered.');
                        return this.sync(false, true);
                    }, this.successiveFailures
                        ? 1000 * 1 * Math.min(this.successiveFailures, 60) /* Delay by number of seconds as number of failures up to 1 minute */
                        : 1000);
                }
                else {
                    this.syncDelayer.cancel();
                }
            }
        };
        UserDataAutoSyncService = __decorate([
            __param(0, userDataSync_1.IUserDataSyncEnablementService),
            __param(1, userDataSync_1.IUserDataSyncService),
            __param(2, userDataSync_1.IUserDataSyncLogService),
            __param(3, authentication_1.IAuthenticationTokenService),
            __param(4, telemetry_1.ITelemetryService)
        ], UserDataAutoSyncService);
        return UserDataAutoSyncService;
    })();
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
});
//# sourceMappingURL=userDataAutoSyncService.js.map