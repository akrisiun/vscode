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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/workbench/services/search/common/search", "vs/workbench/services/search/node/rawSearchService", "vs/workbench/services/search/node/ripgrepSearchProvider", "vs/workbench/services/search/node/ripgrepSearchUtils", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostUriTransformerService", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostSearch", "vs/base/common/network", "vs/workbench/services/search/node/textSearchManager"], function (require, exports, lifecycle_1, uri_1, pfs, log_1, search_1, rawSearchService_1, ripgrepSearchProvider_1, ripgrepSearchUtils_1, extHostRpcService_1, extHostUriTransformerService_1, extHostInitDataService_1, extHostSearch_1, network_1, textSearchManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeExtHostSearch = void 0;
    let NativeExtHostSearch = /** @class */ (() => {
        let NativeExtHostSearch = class NativeExtHostSearch extends extHostSearch_1.ExtHostSearch {
            constructor(extHostRpc, initData, _uriTransformer, _logService) {
                super(extHostRpc, _uriTransformer, _logService);
                this._pfs = pfs; // allow extending for tests
                this._internalFileSearchHandle = -1;
                this._internalFileSearchProvider = null;
                if (initData.remote.isRemote && initData.remote.authority) {
                    this._registerEHSearchProviders();
                }
            }
            _registerEHSearchProviders() {
                const outputChannel = new ripgrepSearchUtils_1.OutputChannel(this._logService);
                this.registerTextSearchProvider(network_1.Schemas.file, new ripgrepSearchProvider_1.RipgrepSearchProvider(outputChannel));
                this.registerInternalFileSearchProvider(network_1.Schemas.file, new rawSearchService_1.SearchService());
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
                const query = extHostSearch_1.reviveQuery(rawQuery);
                if (handle === this._internalFileSearchHandle) {
                    return this.doInternalFileSearch(handle, session, query, token);
                }
                return super.$provideFileSearchResults(handle, session, rawQuery, token);
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
                return super.$clearCache(cacheKey);
            }
            createTextSearchManager(query, provider) {
                return new textSearchManager_1.NativeTextSearchManager(query, provider);
            }
        };
        NativeExtHostSearch = __decorate([
            __param(0, extHostRpcService_1.IExtHostRpcService),
            __param(1, extHostInitDataService_1.IExtHostInitDataService),
            __param(2, extHostUriTransformerService_1.IURITransformerService),
            __param(3, log_1.ILogService)
        ], NativeExtHostSearch);
        return NativeExtHostSearch;
    })();
    exports.NativeExtHostSearch = NativeExtHostSearch;
});
//# sourceMappingURL=extHostSearch.js.map