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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/fileSearchManager", "vs/workbench/services/search/node/rawSearchService", "vs/workbench/services/search/node/ripgrepSearchProvider", "vs/workbench/services/search/node/ripgrepSearchUtils", "vs/workbench/services/search/node/textSearchManager", "../common/extHost.protocol", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostInitDataService"], function (require, exports, lifecycle_1, uri_1, pfs, log_1, search_1, fileSearchManager_1, rawSearchService_1, ripgrepSearchProvider_1, ripgrepSearchUtils_1, textSearchManager_1, extHost_protocol_1, extHostRpcService_1, extHostUriTransformerService_1, extHostInitDataService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtHostSearch = class ExtHostSearch {
        constructor(extHostRpc, initData, _uriTransformer, _logService) {
            this._uriTransformer = _uriTransformer;
            this._logService = _logService;
            this._textSearchProvider = new Map();
            this._textSearchUsedSchemes = new Set();
            this._fileSearchProvider = new Map();
            this._fileSearchUsedSchemes = new Set();
            this._handlePool = 0;
            this._internalFileSearchHandle = -1;
            this._internalFileSearchProvider = null;
            this._pfs = pfs; // allow extending for tests
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadSearch);
            this._fileSearchManager = new fileSearchManager_1.FileSearchManager();
            if (initData.remote.isRemote && initData.remote.authority) {
                this._registerEHSearchProviders();
            }
        }
        _registerEHSearchProviders() {
            const outputChannel = new ripgrepSearchUtils_1.OutputChannel(this._logService);
            this.registerTextSearchProvider('file', new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel));
            this.registerInternalFileSearchProvider('file', new rawSearchService_1.SearchService());
        }
        _transformScheme(scheme) {
            return this._uriTransformer.transformOutgoingScheme(scheme);
        }
        registerTextSearchProvider(scheme, provider) {
            if (this._textSearchUsedSchemes.has(scheme)) {
                throw new Error(`a text search provider for the scheme '${scheme}' is already registered`);
            }
            this._textSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._textSearchProvider.set(handle, provider);
            this._proxy.$registerTextSearchProvider(handle, this._transformScheme(scheme));
            return lifecycle_1.toDisposable(() => {
                this._textSearchUsedSchemes.delete(scheme);
                this._textSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerFileSearchProvider(scheme, provider) {
            if (this._fileSearchUsedSchemes.has(scheme)) {
                throw new Error(`a file search provider for the scheme '${scheme}' is already registered`);
            }
            this._fileSearchUsedSchemes.add(scheme);
            const handle = this._handlePool++;
            this._fileSearchProvider.set(handle, provider);
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return lifecycle_1.toDisposable(() => {
                this._fileSearchUsedSchemes.delete(scheme);
                this._fileSearchProvider.delete(handle);
                this._proxy.$unregisterProvider(handle);
            });
        }
        registerInternalFileSearchProvider(scheme, provider) {
            const handle = this._handlePool++;
            this._internalFileSearchProvider = provider;
            this._internalFileSearchHandle = handle;
            this._proxy.$registerFileSearchProvider(handle, this._transformScheme(scheme));
            return lifecycle_1.toDisposable(() => {
                this._internalFileSearchProvider = null;
                this._proxy.$unregisterProvider(handle);
            });
        }
        $provideFileSearchResults(handle, session, rawQuery, token) {
            const query = reviveQuery(rawQuery);
            if (handle === this._internalFileSearchHandle) {
                return this.doInternalFileSearch(handle, session, query, token);
            }
            else {
                const provider = this._fileSearchProvider.get(handle);
                if (provider) {
                    return this._fileSearchManager.fileSearch(query, provider, batch => {
                        this._proxy.$handleFileMatch(handle, session, batch.map(p => p.resource));
                    }, token);
                }
                else {
                    throw new Error('unknown provider: ' + handle);
                }
            }
        }
        doInternalFileSearch(handle, session, rawQuery, token) {
            const onResult = (ev) => {
                if (search_1.isSerializedFileMatch(ev)) {
                    ev = [ev];
                }
                if (Array.isArray(ev)) {
                    this._proxy.$handleFileMatch(handle, session, ev.map(m => uri_1.URI.file(m.path)));
                    return;
                }
                if (ev.message) {
                    this._logService.debug('ExtHostSearch', ev.message);
                }
            };
            if (!this._internalFileSearchProvider) {
                throw new Error('No internal file search handler');
            }
            return this._internalFileSearchProvider.doFileSearch(rawQuery, onResult, token);
        }
        $clearCache(cacheKey) {
            if (this._internalFileSearchProvider) {
                this._internalFileSearchProvider.clearCache(cacheKey);
            }
            this._fileSearchManager.clearCache(cacheKey);
            return Promise.resolve(undefined);
        }
        $provideTextSearchResults(handle, session, rawQuery, token) {
            const provider = this._textSearchProvider.get(handle);
            if (!provider || !provider.provideTextSearchResults) {
                throw new Error(`Unknown provider ${handle}`);
            }
            const query = reviveQuery(rawQuery);
            const engine = new textSearchManager_1.TextSearchManager(query, provider, this._pfs);
            return engine.search(progress => this._proxy.$handleTextMatch(handle, session, progress), token);
        }
    };
    ExtHostSearch = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService),
        __param(2, extHostUriTransformerService_1.IURITransformerService),
        __param(3, log_1.ILogService)
    ], ExtHostSearch);
    exports.ExtHostSearch = ExtHostSearch;
    function reviveQuery(rawQuery) {
        return Object.assign(Object.assign({}, rawQuery), {
            folderQueries: rawQuery.folderQueries && rawQuery.folderQueries.map(reviveFolderQuery),
            extraFileResources: rawQuery.extraFileResources && rawQuery.extraFileResources.map(components => uri_1.URI.revive(components))
        });
    }
    function reviveFolderQuery(rawFolderQuery) {
        return Object.assign(Object.assign({}, rawFolderQuery), { folder: uri_1.URI.revive(rawFolderQuery.folder) });
    }
});
//# sourceMappingURL=extHostSearch.js.map