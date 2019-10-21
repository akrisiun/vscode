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
define(["require", "exports", "vs/base/common/amd", "vs/base/common/errors", "vs/base/common/uri", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "./searchIpc", "vs/workbench/services/search/common/searchService", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/modelService", "vs/workbench/services/untitled/common/untitledEditorService", "vs/workbench/services/editor/common/editorService", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/extensions/common/extensions", "vs/platform/instantiation/common/extensions"], function (require, exports, amd_1, errors_1, uri_1, ipc_1, ipc_cp_1, configuration_1, environmentService_1, files_1, log_1, search_1, searchIpc_1, searchService_1, instantiation_1, modelService_1, untitledEditorService_1, editorService_1, telemetry_1, extensions_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LocalSearchService = class LocalSearchService extends searchService_1.SearchService {
        constructor(modelService, untitledEditorService, editorService, telemetryService, logService, extensionService, fileService, environmentService, instantiationService) {
            super(modelService, untitledEditorService, editorService, telemetryService, logService, extensionService, fileService);
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.diskSearch = instantiationService.createInstance(DiskSearch, !environmentService.isBuilt || environmentService.verbose, environmentService.debugSearch);
        }
    };
    LocalSearchService = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, untitledEditorService_1.IUntitledEditorService),
        __param(2, editorService_1.IEditorService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, log_1.ILogService),
        __param(5, extensions_1.IExtensionService),
        __param(6, files_1.IFileService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, instantiation_1.IInstantiationService)
    ], LocalSearchService);
    exports.LocalSearchService = LocalSearchService;
    let DiskSearch = class DiskSearch {
        constructor(verboseLogging, searchDebug, logService, configService, fileService) {
            this.logService = logService;
            this.configService = configService;
            this.fileService = fileService;
            const timeout = this.configService.getValue().search.maintainFileSearchCache ?
                Number.MAX_VALUE :
                60 * 60 * 1000;
            const opts = {
                serverName: 'Search',
                timeout,
                args: ['--type=searchService'],
                // See https://github.com/Microsoft/vscode/issues/27665
                // Pass in fresh execArgv to the forked process such that it doesn't inherit them from `process.execArgv`.
                // e.g. Launching the extension host process with `--inspect-brk=xxx` and then forking a process from the extension host
                // results in the forked process inheriting `--inspect-brk=xxx`.
                freshExecArgv: true,
                env: {
                    AMD_ENTRYPOINT: 'vs/workbench/services/search/node/searchApp',
                    PIPE_LOGGING: 'true',
                    VERBOSE_LOGGING: verboseLogging
                },
                useQueue: true
            };
            if (searchDebug) {
                if (searchDebug.break && searchDebug.port) {
                    opts.debugBrk = searchDebug.port;
                }
                else if (!searchDebug.break && searchDebug.port) {
                    opts.debug = searchDebug.port;
                }
            }
            const client = new ipc_cp_1.Client(amd_1.getPathFromAmdModule(require, 'bootstrap-fork'), opts);
            const channel = ipc_1.getNextTickChannel(client.getChannel('search'));
            this.raw = new searchIpc_1.SearchChannelClient(channel);
        }
        textSearch(query, onProgress, token) {
            const folderQueries = query.folderQueries || [];
            return Promise.all(folderQueries.map(q => this.fileService.exists(q.folder)))
                .then(exists => {
                if (token && token.isCancellationRequested) {
                    throw errors_1.canceled();
                }
                query.folderQueries = folderQueries.filter((q, index) => exists[index]);
                const event = this.raw.textSearch(query);
                return DiskSearch.collectResultsFromEvent(event, onProgress, token);
            });
        }
        fileSearch(query, token) {
            const folderQueries = query.folderQueries || [];
            return Promise.all(folderQueries.map(q => this.fileService.exists(q.folder)))
                .then(exists => {
                if (token && token.isCancellationRequested) {
                    throw errors_1.canceled();
                }
                query.folderQueries = folderQueries.filter((q, index) => exists[index]);
                let event;
                event = this.raw.fileSearch(query);
                const onProgress = (p) => {
                    if (p.message) {
                        // Should only be for logs
                        this.logService.debug('SearchService#search', p.message);
                    }
                };
                return DiskSearch.collectResultsFromEvent(event, onProgress, token);
            });
        }
        /**
         * Public for test
         */
        static collectResultsFromEvent(event, onProgress, token) {
            let result = [];
            let listener;
            return new Promise((c, e) => {
                if (token) {
                    token.onCancellationRequested(() => {
                        if (listener) {
                            listener.dispose();
                        }
                        e(errors_1.canceled());
                    });
                }
                listener = event(ev => {
                    if (search_1.isSerializedSearchComplete(ev)) {
                        if (search_1.isSerializedSearchSuccess(ev)) {
                            c({
                                limitHit: ev.limitHit,
                                results: result,
                                stats: ev.stats
                            });
                        }
                        else {
                            e(ev.error);
                        }
                        listener.dispose();
                    }
                    else {
                        // Matches
                        if (Array.isArray(ev)) {
                            const fileMatches = ev.map(d => this.createFileMatch(d));
                            result = result.concat(fileMatches);
                            if (onProgress) {
                                fileMatches.forEach(onProgress);
                            }
                        }
                        // Match
                        else if (ev.path) {
                            const fileMatch = this.createFileMatch(ev);
                            result.push(fileMatch);
                            if (onProgress) {
                                onProgress(fileMatch);
                            }
                        }
                        // Progress
                        else if (onProgress) {
                            onProgress(ev);
                        }
                    }
                });
            });
        }
        static createFileMatch(data) {
            const fileMatch = new search_1.FileMatch(uri_1.URI.file(data.path));
            if (data.results) {
                // const matches = data.results.filter(resultIsMatch);
                fileMatch.results.push(...data.results);
            }
            return fileMatch;
        }
        clearCache(cacheKey) {
            return this.raw.clearCache(cacheKey);
        }
    };
    DiskSearch = __decorate([
        __param(2, log_1.ILogService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, files_1.IFileService)
    ], DiskSearch);
    exports.DiskSearch = DiskSearch;
    extensions_2.registerSingleton(search_1.ISearchService, LocalSearchService, true);
});
//# sourceMappingURL=searchService.js.map