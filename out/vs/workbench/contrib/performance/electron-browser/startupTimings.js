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
define(["require", "exports", "fs", "vs/base/common/async", "util", "vs/base/common/errors", "vs/editor/browser/editorBrowser", "vs/platform/environment/common/environment", "vs/platform/lifecycle/common/lifecycle", "vs/platform/product/common/product", "vs/platform/telemetry/common/telemetry", "vs/platform/update/common/update", "vs/platform/electron/node/electron", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/timer/electron-browser/timerService", "vs/workbench/services/viewlet/browser/viewlet", "vs/base/common/performance"], function (require, exports, fs_1, async_1, util_1, errors_1, editorBrowser_1, environment_1, lifecycle_1, product_1, telemetry_1, update_1, electron_1, files, editorService_1, panelService_1, timerService_1, viewlet_1, performance_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StartupTimings = class StartupTimings {
        constructor(_timerService, _electronService, _editorService, _viewletService, _panelService, _telemetryService, _lifecycleService, _updateService, _envService) {
            this._timerService = _timerService;
            this._electronService = _electronService;
            this._editorService = _editorService;
            this._viewletService = _viewletService;
            this._panelService = _panelService;
            this._telemetryService = _telemetryService;
            this._lifecycleService = _lifecycleService;
            this._updateService = _updateService;
            this._envService = _envService;
            //
            this._report().catch(errors_1.onUnexpectedError);
        }
        async _report() {
            const isStandardStartup = await this._isStandardStartup();
            this._reportStartupTimes().catch(errors_1.onUnexpectedError);
            this._appendStartupTimes(isStandardStartup).catch(errors_1.onUnexpectedError);
            this._reportPerfTicks();
        }
        async _reportStartupTimes() {
            const metrics = await this._timerService.startupMetrics;
            /* __GDPR__
                "startupTimeVaried" : {
                    "${include}": [
                        "${IStartupMetrics}"
                    ]
                }
            */
            this._telemetryService.publicLog('startupTimeVaried', metrics);
        }
        async _appendStartupTimes(isStandardStartup) {
            const appendTo = this._envService.args['prof-append-timers'];
            if (!appendTo) {
                // nothing to do
                return;
            }
            const { sessionId } = await this._telemetryService.getTelemetryInfo();
            Promise.all([
                this._timerService.startupMetrics,
                async_1.timeout(15000),
            ]).then(([startupMetrics]) => {
                return util_1.promisify(fs_1.appendFile)(appendTo, `${startupMetrics.ellapsed}\t${product_1.default.nameShort}\t${(product_1.default.commit || '').slice(0, 10) || '0000000000'}\t${sessionId}\t${isStandardStartup ? 'standard_start' : 'NO_standard_start'}\n`);
            }).then(() => {
                this._electronService.quit();
            }).catch(err => {
                console.error(err);
                this._electronService.quit();
            });
        }
        async _isStandardStartup() {
            // check for standard startup:
            // * new window (no reload)
            // * just one window
            // * explorer viewlet visible
            // * one text editor (not multiple, not webview, welcome etc...)
            // * cached data present (not rejected, not created)
            if (this._lifecycleService.startupKind !== 1 /* NewWindow */) {
                return false;
            }
            if (await this._electronService.getWindowCount() !== 1) {
                return false;
            }
            const activeViewlet = this._viewletService.getActiveViewlet();
            if (!activeViewlet || activeViewlet.getId() !== files.VIEWLET_ID) {
                return false;
            }
            const visibleControls = this._editorService.visibleControls;
            if (visibleControls.length !== 1 || !editorBrowser_1.isCodeEditor(visibleControls[0].getControl())) {
                return false;
            }
            if (this._panelService.getActivePanel()) {
                return false;
            }
            if (!timerService_1.didUseCachedData()) {
                return false;
            }
            if (!await this._updateService.isLatestVersion()) {
                return false;
            }
            return true;
        }
        _reportPerfTicks() {
            const entries = Object.create(null);
            for (const entry of performance_1.getEntries()) {
                entries[entry.name] = entry.timestamp;
            }
            /* __GDPR__
                "startupRawTimers" : {
                    "entries": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth" }
                }
            */
            this._telemetryService.publicLog('startupRawTimers', { entries });
        }
    };
    StartupTimings = __decorate([
        __param(0, timerService_1.ITimerService),
        __param(1, electron_1.IElectronService),
        __param(2, editorService_1.IEditorService),
        __param(3, viewlet_1.IViewletService),
        __param(4, panelService_1.IPanelService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, lifecycle_1.ILifecycleService),
        __param(7, update_1.IUpdateService),
        __param(8, environment_1.IEnvironmentService)
    ], StartupTimings);
    exports.StartupTimings = StartupTimings;
});
//# sourceMappingURL=startupTimings.js.map