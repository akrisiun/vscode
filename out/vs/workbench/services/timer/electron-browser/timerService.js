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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/node/id", "vs/base/common/performance", "os", "vs/platform/electron/node/electron", "vs/workbench/services/environment/common/environmentService", "vs/platform/workspace/common/workspace", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions", "vs/platform/update/common/update", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/panel/common/panelService", "vs/workbench/services/editor/common/editorService", "vs/platform/accessibility/common/accessibility"], function (require, exports, instantiation_1, id_1, perf, os, electron_1, environmentService_1, workspace_1, extensions_1, extensions_2, update_1, lifecycle_1, viewlet_1, panelService_1, editorService_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TimerService = class TimerService {
        constructor(_electronService, _environmentService, _lifecycleService, _contextService, _extensionService, _updateService, _viewletService, _panelService, _editorService, _accessibilityService) {
            this._electronService = _electronService;
            this._environmentService = _environmentService;
            this._lifecycleService = _lifecycleService;
            this._contextService = _contextService;
            this._extensionService = _extensionService;
            this._updateService = _updateService;
            this._viewletService = _viewletService;
            this._panelService = _panelService;
            this._editorService = _editorService;
            this._accessibilityService = _accessibilityService;
        }
        get startupMetrics() {
            if (!this._startupMetrics) {
                this._startupMetrics = Promise
                    .resolve(this._extensionService.whenInstalledExtensionsRegistered())
                    .then(() => this._computeStartupMetrics());
            }
            return this._startupMetrics;
        }
        async _computeStartupMetrics() {
            const now = Date.now();
            const initialStartup = !!this._environmentService.configuration.isInitialStartup;
            const startMark = initialStartup ? 'main:started' : 'main:loadWindow';
            let totalmem;
            let freemem;
            let cpus;
            let platform;
            let release;
            let arch;
            let loadavg;
            let meminfo;
            let isVMLikelyhood;
            try {
                totalmem = os.totalmem();
                freemem = os.freemem();
                platform = os.platform();
                release = os.release();
                arch = os.arch();
                loadavg = os.loadavg();
                const processMemoryInfo = await process.getProcessMemoryInfo();
                meminfo = {
                    workingSetSize: processMemoryInfo.residentSet,
                    privateBytes: processMemoryInfo.private,
                    sharedBytes: processMemoryInfo.shared
                };
                isVMLikelyhood = Math.round((id_1.virtualMachineHint.value() * 100));
                const rawCpus = os.cpus();
                if (rawCpus && rawCpus.length > 0) {
                    cpus = { count: rawCpus.length, speed: rawCpus[0].speed, model: rawCpus[0].model };
                }
            }
            catch (error) {
                // ignore, be on the safe side with these hardware method calls
            }
            const activeViewlet = this._viewletService.getActiveViewlet();
            const activePanel = this._panelService.getActivePanel();
            return {
                version: 2,
                ellapsed: perf.getDuration(startMark, 'didStartWorkbench'),
                // reflections
                isLatestVersion: Boolean(await this._updateService.isLatestVersion()),
                didUseCachedData: didUseCachedData(),
                windowKind: this._lifecycleService.startupKind,
                windowCount: await this._electronService.getWindowCount(),
                viewletId: activeViewlet ? activeViewlet.getId() : undefined,
                editorIds: this._editorService.visibleEditors.map(input => input.getTypeId()),
                panelId: activePanel ? activePanel.getId() : undefined,
                // timers
                timers: {
                    ellapsedAppReady: initialStartup ? perf.getDuration('main:started', 'main:appReady') : undefined,
                    ellapsedNlsGeneration: initialStartup ? perf.getDuration('nlsGeneration:start', 'nlsGeneration:end') : undefined,
                    ellapsedWindowLoad: initialStartup ? perf.getDuration('main:appReady', 'main:loadWindow') : undefined,
                    ellapsedWindowLoadToRequire: perf.getDuration('main:loadWindow', 'willLoadWorkbenchMain'),
                    ellapsedRequire: perf.getDuration('willLoadWorkbenchMain', 'didLoadWorkbenchMain'),
                    ellapsedWorkspaceStorageInit: perf.getDuration('willInitWorkspaceStorage', 'didInitWorkspaceStorage'),
                    ellapsedWorkspaceServiceInit: perf.getDuration('willInitWorkspaceService', 'didInitWorkspaceService'),
                    ellapsedExtensions: perf.getDuration('willLoadExtensions', 'didLoadExtensions'),
                    ellapsedEditorRestore: perf.getDuration('willRestoreEditors', 'didRestoreEditors'),
                    ellapsedViewletRestore: perf.getDuration('willRestoreViewlet', 'didRestoreViewlet'),
                    ellapsedPanelRestore: perf.getDuration('willRestorePanel', 'didRestorePanel'),
                    ellapsedWorkbench: perf.getDuration('willStartWorkbench', 'didStartWorkbench'),
                    ellapsedExtensionsReady: perf.getDuration(startMark, 'didLoadExtensions'),
                    ellapsedTimersToTimersComputed: Date.now() - now,
                },
                // system info
                platform,
                release,
                arch,
                totalmem,
                freemem,
                meminfo,
                cpus,
                loadavg,
                initialStartup,
                isVMLikelyhood,
                hasAccessibilitySupport: this._accessibilityService.getAccessibilitySupport() === 2 /* Enabled */,
                emptyWorkbench: this._contextService.getWorkbenchState() === 1 /* EMPTY */
            };
        }
    };
    TimerService = __decorate([
        __param(0, electron_1.IElectronService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, extensions_1.IExtensionService),
        __param(5, update_1.IUpdateService),
        __param(6, viewlet_1.IViewletService),
        __param(7, panelService_1.IPanelService),
        __param(8, editorService_1.IEditorService),
        __param(9, accessibility_1.IAccessibilityService)
    ], TimerService);
    exports.ITimerService = instantiation_1.createDecorator('timerService');
    extensions_2.registerSingleton(exports.ITimerService, TimerService, true);
    //#region cached data logic
    function didUseCachedData() {
        // We surely don't use cached data when we don't tell the loader to do so
        if (!Boolean(global.require.getConfig().nodeCachedData)) {
            return false;
        }
        // There are loader events that signal if cached data was missing, rejected,
        // or used. The former two mean no cached data.
        let cachedDataFound = 0;
        for (const event of require.getStats()) {
            switch (event.type) {
                case 62 /* CachedDataRejected */:
                    return false;
                case 60 /* CachedDataFound */:
                    cachedDataFound += 1;
                    break;
            }
        }
        return cachedDataFound > 0;
    }
    exports.didUseCachedData = didUseCachedData;
});
//#endregion
//# sourceMappingURL=timerService.js.map