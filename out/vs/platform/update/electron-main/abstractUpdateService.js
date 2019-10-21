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
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/product/common/product", "vs/platform/update/common/update", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/request/common/request", "vs/base/common/cancellation"], function (require, exports, event_1, async_1, configuration_1, lifecycleMainService_1, product_1, update_1, environment_1, log_1, request_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function createUpdateURL(platform, quality) {
        return `${product_1.default.updateUrl}/api/update/${platform}/${quality}/${product_1.default.commit}`;
    }
    exports.createUpdateURL = createUpdateURL;
    let AbstractUpdateService = class AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, environmentService, requestService, logService) {
            this.lifecycleMainService = lifecycleMainService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.requestService = requestService;
            this.logService = logService;
            this._state = update_1.State.Uninitialized;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            if (this.environmentService.disableUpdates) {
                this.logService.info('update#ctor - updates are disabled by the environment');
                return;
            }
            if (!product_1.default.updateUrl || !product_1.default.commit) {
                this.logService.info('update#ctor - updates are disabled as there is no update URL');
                return;
            }
            const updateMode = configuration_1.getMigratedSettingValue(this.configurationService, 'update.mode', 'update.channel');
            const quality = this.getProductQuality(updateMode);
            if (!quality) {
                this.logService.info('update#ctor - updates are disabled by user preference');
                return;
            }
            this.url = this.buildUpdateFeedUrl(quality);
            if (!this.url) {
                this.logService.info('update#ctor - updates are disabled as the update URL is badly formed');
                return;
            }
            this.setState(update_1.State.Idle(this.getUpdateType()));
            if (updateMode === 'manual') {
                this.logService.info('update#ctor - manual checks only; automatic updates are disabled by user preference');
                return;
            }
            if (updateMode === 'start') {
                this.logService.info('update#ctor - startup checks only; automatic updates are disabled by user preference');
                // Check for updates only once after 30 seconds
                setTimeout(() => this.checkForUpdates(null), 30 * 1000);
            }
            else {
                // Start checking for updates after 30 seconds
                this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
            }
        }
        get state() {
            return this._state;
        }
        setState(state) {
            this.logService.info('update#setState', state.type);
            this._state = state;
            this._onStateChange.fire(state);
        }
        getProductQuality(updateMode) {
            return updateMode === 'none' ? undefined : product_1.default.quality;
        }
        scheduleCheckForUpdates(delay = 60 * 60 * 1000) {
            return async_1.timeout(delay)
                .then(() => this.checkForUpdates(null))
                .then(() => {
                // Check again after 1 hour
                return this.scheduleCheckForUpdates(60 * 60 * 1000);
            });
        }
        async checkForUpdates(context) {
            this.logService.trace('update#checkForUpdates, state = ', this.state.type);
            if (this.state.type !== "idle" /* Idle */) {
                return;
            }
            this.doCheckForUpdates(context);
        }
        async downloadUpdate() {
            this.logService.trace('update#downloadUpdate, state = ', this.state.type);
            if (this.state.type !== "available for download" /* AvailableForDownload */) {
                return;
            }
            await this.doDownloadUpdate(this.state);
        }
        async doDownloadUpdate(state) {
            // noop
        }
        async applyUpdate() {
            this.logService.trace('update#applyUpdate, state = ', this.state.type);
            if (this.state.type !== "downloaded" /* Downloaded */) {
                return;
            }
            await this.doApplyUpdate();
        }
        async doApplyUpdate() {
            // noop
        }
        quitAndInstall() {
            this.logService.trace('update#quitAndInstall, state = ', this.state.type);
            if (this.state.type !== "ready" /* Ready */) {
                return Promise.resolve(undefined);
            }
            this.logService.trace('update#quitAndInstall(): before lifecycle quit()');
            this.lifecycleMainService.quit(true /* from update */).then(vetod => {
                this.logService.trace(`update#quitAndInstall(): after lifecycle quit() with veto: ${vetod}`);
                if (vetod) {
                    return;
                }
                this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
                this.doQuitAndInstall();
            });
            return Promise.resolve(undefined);
        }
        isLatestVersion() {
            if (!this.url) {
                return Promise.resolve(undefined);
            }
            return this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None).then(context => {
                // The update server replies with 204 (No Content) when no
                // update is available - that's all we want to know.
                if (context.res.statusCode === 204) {
                    return true;
                }
                else {
                    return false;
                }
            });
        }
        getUpdateType() {
            return 1 /* Archive */;
        }
        doQuitAndInstall() {
            // noop
        }
    };
    AbstractUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, request_1.IRequestService),
        __param(4, log_1.ILogService)
    ], AbstractUpdateService);
    exports.AbstractUpdateService = AbstractUpdateService;
});
//# sourceMappingURL=abstractUpdateService.js.map