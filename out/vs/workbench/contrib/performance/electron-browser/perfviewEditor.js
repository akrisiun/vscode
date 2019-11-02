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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor/resourceEditorInput", "vs/editor/common/services/resolverService", "vs/platform/lifecycle/common/lifecycle", "vs/editor/common/services/modeService", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modelService", "vs/workbench/services/timer/electron-browser/timerService", "vs/base/common/strings", "vs/workbench/services/extensions/common/extensions", "vs/base/common/performance", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/codeEditor/browser/toggleWordWrap", "vs/base/common/arrays", "vs/platform/product/common/product"], function (require, exports, nls_1, uri_1, resourceEditorInput_1, resolverService_1, lifecycle_1, modeService_1, instantiation_1, modelService_1, timerService_1, strings_1, extensions_1, perf, lifecycle_2, codeEditorService_1, toggleWordWrap_1, arrays_1, product_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let PerfviewContrib = class PerfviewContrib {
        constructor(instaService, textModelResolverService) {
            this._registration = textModelResolverService.registerTextModelContentProvider('perf', instaService.createInstance(PerfModelContentProvider));
        }
        dispose() {
            this._registration.dispose();
        }
    };
    PerfviewContrib = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, resolverService_1.ITextModelService)
    ], PerfviewContrib);
    exports.PerfviewContrib = PerfviewContrib;
    let PerfviewInput = class PerfviewInput extends resourceEditorInput_1.ResourceEditorInput {
        constructor(textModelResolverService) {
            super(nls_1.localize('name', "Startup Performance"), undefined, PerfviewInput.Uri, undefined, textModelResolverService);
        }
        getTypeId() {
            return PerfviewInput.Id;
        }
    };
    PerfviewInput.Id = 'PerfviewInput';
    PerfviewInput.Uri = uri_1.URI.from({ scheme: 'perf', path: 'Startup Performance' });
    PerfviewInput = __decorate([
        __param(0, resolverService_1.ITextModelService)
    ], PerfviewInput);
    exports.PerfviewInput = PerfviewInput;
    let PerfModelContentProvider = class PerfModelContentProvider {
        constructor(_modelService, _modeService, _editorService, _lifecycleService, _timerService, _extensionService) {
            this._modelService = _modelService;
            this._modeService = _modeService;
            this._editorService = _editorService;
            this._lifecycleService = _lifecycleService;
            this._timerService = _timerService;
            this._extensionService = _extensionService;
            this._modelDisposables = [];
        }
        provideTextContent(resource) {
            if (!this._model || this._model.isDisposed()) {
                lifecycle_2.dispose(this._modelDisposables);
                const langId = this._modeService.create('markdown');
                this._model = this._modelService.getModel(resource) || this._modelService.createModel('Loading...', langId, resource);
                this._modelDisposables.push(langId.onDidChange(e => {
                    if (this._model) {
                        this._model.setMode(e);
                    }
                }));
                this._modelDisposables.push(langId);
                this._modelDisposables.push(this._extensionService.onDidChangeExtensionsStatus(this._updateModel, this));
                toggleWordWrap_1.writeTransientState(this._model, { forceWordWrap: 'off', forceWordWrapMinified: false }, this._editorService);
            }
            this._updateModel();
            return Promise.resolve(this._model);
        }
        _updateModel() {
            Promise.all([
                this._timerService.startupMetrics,
                this._lifecycleService.when(4 /* Eventually */),
                this._extensionService.whenInstalledExtensionsRegistered()
            ]).then(([metrics]) => {
                if (this._model && !this._model.isDisposed()) {
                    let stats = LoaderStats.get();
                    let md = new MarkdownBuilder();
                    this._addSummary(md, metrics);
                    md.blank();
                    this._addSummaryTable(md, metrics, stats);
                    md.blank();
                    this._addExtensionsTable(md);
                    md.blank();
                    this._addRawPerfMarks(md);
                    md.blank();
                    this._addLoaderStats(md, stats);
                    md.blank();
                    this._addCachedDataStats(md);
                    this._model.setValue(md.value);
                }
            });
        }
        _addSummary(md, metrics) {
            md.heading(2, 'System Info');
            md.li(`${product_1.default.nameShort}: ${product_1.default.version} (${product_1.default.commit || '0000000'})`);
            md.li(`OS: ${metrics.platform}(${metrics.release})`);
            if (metrics.cpus) {
                md.li(`CPUs: ${metrics.cpus.model}(${metrics.cpus.count} x ${metrics.cpus.speed})`);
            }
            if (typeof metrics.totalmem === 'number' && typeof metrics.freemem === 'number') {
                md.li(`Memory(System): ${(metrics.totalmem / (1024 * 1024 * 1024)).toFixed(2)} GB(${(metrics.freemem / (1024 * 1024 * 1024)).toFixed(2)}GB free)`);
            }
            if (metrics.meminfo) {
                md.li(`Memory(Process): ${(metrics.meminfo.workingSetSize / 1024).toFixed(2)} MB working set(${(metrics.meminfo.privateBytes / 1024).toFixed(2)}MB private, ${(metrics.meminfo.sharedBytes / 1024).toFixed(2)}MB shared)`);
            }
            md.li(`VM(likelyhood): ${metrics.isVMLikelyhood}%`);
            md.li(`Initial Startup: ${metrics.initialStartup}`);
            md.li(`Has ${metrics.windowCount - 1} other windows`);
            md.li(`Screen Reader Active: ${metrics.hasAccessibilitySupport}`);
            md.li(`Empty Workspace: ${metrics.emptyWorkbench}`);
        }
        _addSummaryTable(md, metrics, stats) {
            const table = [];
            table.push(['start => app.isReady', metrics.timers.ellapsedAppReady, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['nls:start => nls:end', metrics.timers.ellapsedNlsGeneration, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['require(main.bundle.js)', metrics.initialStartup ? perf.getDuration('willLoadMainBundle', 'didLoadMainBundle') : undefined, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['app.isReady => window.loadUrl()', metrics.timers.ellapsedWindowLoad, '[main]', `initial startup: ${metrics.initialStartup}`]);
            table.push(['window.loadUrl() => begin to require(workbench.desktop.main.js)', metrics.timers.ellapsedWindowLoadToRequire, '[main->renderer]', lifecycle_1.StartupKindToString(metrics.windowKind)]);
            table.push(['require(workbench.desktop.main.js)', metrics.timers.ellapsedRequire, '[renderer]', `cached data: ${(metrics.didUseCachedData ? 'YES' : 'NO')}${stats ? `, node_modules took ${stats.nodeRequireTotal}ms` : ''}`]);
            table.push(['require & init workspace storage', metrics.timers.ellapsedWorkspaceStorageInit, '[renderer]', undefined]);
            table.push(['init workspace service', metrics.timers.ellapsedWorkspaceServiceInit, '[renderer]', undefined]);
            table.push(['register extensions & spawn extension host', metrics.timers.ellapsedExtensions, '[renderer]', undefined]);
            table.push(['restore viewlet', metrics.timers.ellapsedViewletRestore, '[renderer]', metrics.viewletId]);
            table.push(['restore panel', metrics.timers.ellapsedPanelRestore, '[renderer]', metrics.panelId]);
            table.push(['restore editors', metrics.timers.ellapsedEditorRestore, '[renderer]', `${metrics.editorIds.length}: ${metrics.editorIds.join(', ')}`]);
            table.push(['overall workbench load', metrics.timers.ellapsedWorkbench, '[renderer]', undefined]);
            table.push(['workbench ready', metrics.ellapsed, '[main->renderer]', undefined]);
            table.push(['extensions registered', metrics.timers.ellapsedExtensionsReady, '[renderer]', undefined]);
            md.heading(2, 'Performance Marks');
            md.table(['What', 'Duration', 'Process', 'Info'], table);
        }
        _addExtensionsTable(md) {
            const eager = [];
            const normal = [];
            let extensionsStatus = this._extensionService.getExtensionsStatus();
            for (let id in extensionsStatus) {
                const { activationTimes: times } = extensionsStatus[id];
                if (!times) {
                    continue;
                }
                if (times.activationReason.startup) {
                    eager.push([id, times.activationReason.startup, times.codeLoadingTime, times.activateCallTime, times.activateResolvedTime, times.activationReason.activationEvent, times.activationReason.extensionId.value]);
                }
                else {
                    normal.push([id, times.activationReason.startup, times.codeLoadingTime, times.activateCallTime, times.activateResolvedTime, times.activationReason.activationEvent, times.activationReason.extensionId.value]);
                }
            }
            const table = eager.concat(normal);
            if (table.length > 0) {
                md.heading(2, 'Extension Activation Stats');
                md.table(['Extension', 'Eager', 'Load Code', 'Call Activate', 'Finish Activate', 'Event', 'By'], table);
            }
        }
        _addRawPerfMarks(md) {
            md.heading(2, 'Raw Perf Marks');
            md.value += '```\n';
            md.value += `Name\tTimestamp\tDelta\tTotal\n`;
            let lastStartTime = -1;
            let total = 0;
            for (const { name, timestamp: startTime } of perf.getEntries()) {
                let delta = lastStartTime !== -1 ? startTime - lastStartTime : 0;
                total += delta;
                md.value += `${name}\t${startTime}\t${delta}\t${total}\n`;
                lastStartTime = startTime;
            }
            md.value += '```\n';
        }
        _addLoaderStats(md, stats) {
            md.heading(2, 'Loader Stats');
            md.heading(3, 'Load AMD-module');
            md.table(['Module', 'Duration'], stats.amdLoad);
            md.blank();
            md.heading(3, 'Load commonjs-module');
            md.table(['Module', 'Duration'], stats.nodeRequire);
            md.blank();
            md.heading(3, 'Invoke AMD-module factory');
            md.table(['Module', 'Duration'], stats.amdInvoke);
            md.blank();
            md.heading(3, 'Invoke commonjs-module');
            md.table(['Module', 'Duration'], stats.nodeEval);
        }
        _addCachedDataStats(md) {
            const map = new Map();
            map.set(63 /* CachedDataCreated */, []);
            map.set(60 /* CachedDataFound */, []);
            map.set(61 /* CachedDataMissed */, []);
            map.set(62 /* CachedDataRejected */, []);
            for (const stat of require.getStats()) {
                if (map.has(stat.type)) {
                    map.get(stat.type).push(stat.detail);
                }
            }
            const printLists = (arr) => {
                if (arr) {
                    arr.sort();
                    for (const e of arr) {
                        md.li(`${e}`);
                    }
                    md.blank();
                }
            };
            md.heading(2, 'Node Cached Data Stats');
            md.blank();
            md.heading(3, 'cached data used');
            printLists(map.get(60 /* CachedDataFound */));
            md.heading(3, 'cached data missed');
            printLists(map.get(61 /* CachedDataMissed */));
            md.heading(3, 'cached data rejected');
            printLists(map.get(62 /* CachedDataRejected */));
            md.heading(3, 'cached data created (lazy, might need refreshes)');
            printLists(map.get(63 /* CachedDataCreated */));
        }
    };
    PerfModelContentProvider = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService),
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, timerService_1.ITimerService),
        __param(5, extensions_1.IExtensionService)
    ], PerfModelContentProvider);
    class LoaderStats {
        static get() {
            const amdLoadScript = new Map();
            const amdInvokeFactory = new Map();
            const nodeRequire = new Map();
            const nodeEval = new Map();
            function mark(map, stat) {
                if (map.has(stat.detail)) {
                    // console.warn('BAD events, DOUBLE start', stat);
                    // map.delete(stat.detail);
                    return;
                }
                map.set(stat.detail, -stat.timestamp);
            }
            function diff(map, stat) {
                let duration = map.get(stat.detail);
                if (!duration) {
                    // console.warn('BAD events, end WITHOUT start', stat);
                    // map.delete(stat.detail);
                    return;
                }
                if (duration >= 0) {
                    // console.warn('BAD events, DOUBLE end', stat);
                    // map.delete(stat.detail);
                    return;
                }
                map.set(stat.detail, duration + stat.timestamp);
            }
            const stats = arrays_1.mergeSort(require.getStats().slice(0), (a, b) => a.timestamp - b.timestamp);
            for (const stat of stats) {
                switch (stat.type) {
                    case 10 /* BeginLoadingScript */:
                        mark(amdLoadScript, stat);
                        break;
                    case 11 /* EndLoadingScriptOK */:
                    case 12 /* EndLoadingScriptError */:
                        diff(amdLoadScript, stat);
                        break;
                    case 21 /* BeginInvokeFactory */:
                        mark(amdInvokeFactory, stat);
                        break;
                    case 22 /* EndInvokeFactory */:
                        diff(amdInvokeFactory, stat);
                        break;
                    case 33 /* NodeBeginNativeRequire */:
                        mark(nodeRequire, stat);
                        break;
                    case 34 /* NodeEndNativeRequire */:
                        diff(nodeRequire, stat);
                        break;
                    case 31 /* NodeBeginEvaluatingScript */:
                        mark(nodeEval, stat);
                        break;
                    case 32 /* NodeEndEvaluatingScript */:
                        diff(nodeEval, stat);
                        break;
                }
            }
            let nodeRequireTotal = 0;
            nodeRequire.forEach(value => nodeRequireTotal += value);
            function to2dArray(map) {
                let res = [];
                map.forEach((value, index) => res.push([index, value]));
                return res;
            }
            return {
                amdLoad: to2dArray(amdLoadScript),
                amdInvoke: to2dArray(amdInvokeFactory),
                nodeRequire: to2dArray(nodeRequire),
                nodeEval: to2dArray(nodeEval),
                nodeRequireTotal
            };
        }
    }
    class MarkdownBuilder {
        constructor() {
            this.value = '';
        }
        heading(level, value) {
            this.value += `${strings_1.repeat('#', level)} ${value}\n\n`;
            return this;
        }
        blank() {
            this.value += '\n';
            return this;
        }
        li(value) {
            this.value += `* ${value}\n`;
            return this;
        }
        table(header, rows) {
            let lengths = [];
            header.forEach((cell, ci) => {
                lengths[ci] = cell.length;
            });
            rows.forEach(row => {
                row.forEach((cell, ci) => {
                    if (typeof cell === 'undefined') {
                        cell = row[ci] = '-';
                    }
                    const len = cell.toString().length;
                    lengths[ci] = Math.max(len, lengths[ci]);
                });
            });
            // header
            header.forEach((cell, ci) => { this.value += `| ${cell + strings_1.repeat(' ', lengths[ci] - cell.toString().length)} `; });
            this.value += '|\n';
            header.forEach((_cell, ci) => { this.value += `| ${strings_1.repeat('-', lengths[ci])} `; });
            this.value += '|\n';
            // cells
            rows.forEach(row => {
                row.forEach((cell, ci) => {
                    if (typeof cell !== 'undefined') {
                        this.value += `| ${cell + strings_1.repeat(' ', lengths[ci] - cell.toString().length)} `;
                    }
                });
                this.value += '|\n';
            });
        }
    }
});
//# sourceMappingURL=perfviewEditor.js.map