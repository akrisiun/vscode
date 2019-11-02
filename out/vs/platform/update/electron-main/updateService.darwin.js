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
define(["require", "exports", "electron", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/decorators", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/update/common/update", "vs/platform/telemetry/common/telemetry", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/update/electron-main/abstractUpdateService", "vs/platform/request/common/request"], function (require, exports, electron, lifecycle_1, event_1, decorators_1, configuration_1, lifecycleMainService_1, update_1, telemetry_1, environment_1, log_1, abstractUpdateService_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DarwinUpdateService = class DarwinUpdateService extends abstractUpdateService_1.AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, telemetryService, environmentService, requestService, logService) {
            super(lifecycleMainService, configurationService, environmentService, requestService, logService);
            this.telemetryService = telemetryService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.onRawError(this.onError, this, this.disposables);
            this.onRawUpdateAvailable(this.onUpdateAvailable, this, this.disposables);
            this.onRawUpdateDownloaded(this.onUpdateDownloaded, this, this.disposables);
            this.onRawUpdateNotAvailable(this.onUpdateNotAvailable, this, this.disposables);
        }
        get onRawError() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'error', (_, message) => message); }
        get onRawUpdateNotAvailable() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-not-available'); }
        get onRawUpdateAvailable() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-available', (_, url, version) => ({ url, version, productVersion: version })); }
        get onRawUpdateDownloaded() { return event_1.Event.fromNodeEventEmitter(electron.autoUpdater, 'update-downloaded', (_, releaseNotes, version, date) => ({ releaseNotes, version, productVersion: version, date })); }
        onError(err) {
            this.logService.error('UpdateService error:', err);
            // only show message when explicitly checking for updates
            const shouldShowMessage = this.state.type === "checking for updates" /* CheckingForUpdates */ ? !!this.state.context : true;
            const message = shouldShowMessage ? err : undefined;
            this.setState(update_1.State.Idle(1 /* Archive */, message));
        }
        buildUpdateFeedUrl(quality) {
            const url = abstractUpdateService_1.createUpdateURL('darwin', quality);
            try {
                electron.autoUpdater.setFeedURL({ url });
            }
            catch (e) {
                // application is very likely not signed
                this.logService.error('Failed to set update feed URL', e);
                return undefined;
            }
            return url;
        }
        doCheckForUpdates(context) {
            this.setState(update_1.State.CheckingForUpdates(context));
            electron.autoUpdater.checkForUpdates();
        }
        onUpdateAvailable(update) {
            if (this.state.type !== "checking for updates" /* CheckingForUpdates */) {
                return;
            }
            this.setState(update_1.State.Downloading(update));
        }
        onUpdateDownloaded(update) {
            if (this.state.type !== "downloading" /* Downloading */) {
                return;
            }
            this.telemetryService.publicLog2('update:downloaded', { version: update.version });
            this.setState(update_1.State.Ready(update));
        }
        onUpdateNotAvailable() {
            if (this.state.type !== "checking for updates" /* CheckingForUpdates */) {
                return;
            }
            this.telemetryService.publicLog2('update:notAvailable', { explicit: !!this.state.context });
            this.setState(update_1.State.Idle(1 /* Archive */));
        }
        doQuitAndInstall() {
            this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
            electron.autoUpdater.quitAndInstall();
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawError", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateNotAvailable", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateAvailable", null);
    __decorate([
        decorators_1.memoize
    ], DarwinUpdateService.prototype, "onRawUpdateDownloaded", null);
    DarwinUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, request_1.IRequestService),
        __param(5, log_1.ILogService)
    ], DarwinUpdateService);
    exports.DarwinUpdateService = DarwinUpdateService;
});
//# sourceMappingURL=updateService.darwin.js.map