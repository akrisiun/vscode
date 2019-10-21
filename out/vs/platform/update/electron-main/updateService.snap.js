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
define(["require", "exports", "vs/base/common/event", "vs/base/common/async", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/update/common/update", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/base/common/path", "fs", "child_process", "vs/platform/telemetry/common/telemetry"], function (require, exports, event_1, async_1, lifecycleMainService_1, update_1, environment_1, log_1, path, fs_1, child_process_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AbstractUpdateService2 = class AbstractUpdateService2 {
        constructor(lifecycleMainService, environmentService, logService) {
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this._state = update_1.State.Uninitialized;
            this._onStateChange = new event_1.Emitter();
            this.onStateChange = this._onStateChange.event;
            if (environmentService.disableUpdates) {
                this.logService.info('update#ctor - updates are disabled');
                return;
            }
            this.setState(update_1.State.Idle(this.getUpdateType()));
            // Start checking for updates after 30 seconds
            this.scheduleCheckForUpdates(30 * 1000).then(undefined, err => this.logService.error(err));
        }
        get state() {
            return this._state;
        }
        setState(state) {
            this.logService.info('update#setState', state.type);
            this._state = state;
            this._onStateChange.fire(state);
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
        doDownloadUpdate(state) {
            return Promise.resolve(undefined);
        }
        async applyUpdate() {
            this.logService.trace('update#applyUpdate, state = ', this.state.type);
            if (this.state.type !== "downloaded" /* Downloaded */) {
                return;
            }
            await this.doApplyUpdate();
        }
        doApplyUpdate() {
            return Promise.resolve(undefined);
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
        getUpdateType() {
            return 2 /* Snap */;
        }
        doQuitAndInstall() {
            // noop
        }
    };
    AbstractUpdateService2 = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService)
    ], AbstractUpdateService2);
    let SnapUpdateService = class SnapUpdateService extends AbstractUpdateService2 {
        constructor(snap, snapRevision, lifecycleMainService, environmentService, logService, telemetryService) {
            super(lifecycleMainService, environmentService, logService);
            this.snap = snap;
            this.snapRevision = snapRevision;
            this.telemetryService = telemetryService;
            const watcher = fs_1.watch(path.dirname(this.snap));
            const onChange = event_1.Event.fromNodeEventEmitter(watcher, 'change', (_, fileName) => fileName);
            const onCurrentChange = event_1.Event.filter(onChange, n => n === 'current');
            const onDebouncedCurrentChange = event_1.Event.debounce(onCurrentChange, (_, e) => e, 2000);
            const listener = onDebouncedCurrentChange(this.checkForUpdates, this);
            lifecycleMainService.onWillShutdown(() => {
                listener.dispose();
                watcher.close();
            });
        }
        doCheckForUpdates(context) {
            this.setState(update_1.State.CheckingForUpdates(context));
            this.isUpdateAvailable().then(result => {
                if (result) {
                    this.setState(update_1.State.Ready({ version: 'something', productVersion: 'something' }));
                }
                else {
                    this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                    this.setState(update_1.State.Idle(2 /* Snap */));
                }
            }, err => {
                this.logService.error(err);
                this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                this.setState(update_1.State.Idle(2 /* Snap */, err.message || err));
            });
        }
        doQuitAndInstall() {
            this.logService.trace('update#quitAndInstall(): running raw#quitAndInstall()');
            // Allow 3 seconds for VS Code to close
            child_process_1.spawn('sleep 3 && ' + path.basename(process.argv[0]), {
                shell: true,
                detached: true,
                stdio: 'ignore',
            });
        }
        async isUpdateAvailable() {
            const resolvedCurrentSnapPath = await new Promise((c, e) => fs_1.realpath(`${path.dirname(this.snap)}/current`, (err, r) => err ? e(err) : c(r)));
            const currentRevision = path.basename(resolvedCurrentSnapPath);
            return this.snapRevision !== currentRevision;
        }
        isLatestVersion() {
            return this.isUpdateAvailable().then(undefined, err => {
                this.logService.error('update#checkForSnapUpdate(): Could not get realpath of application.');
                return undefined;
            });
        }
    };
    SnapUpdateService = __decorate([
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, log_1.ILogService),
        __param(5, telemetry_1.ITelemetryService)
    ], SnapUpdateService);
    exports.SnapUpdateService = SnapUpdateService;
});
//# sourceMappingURL=updateService.snap.js.map