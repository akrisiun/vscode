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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/idGenerator", "vs/base/common/labels", "vs/base/common/objects", "vs/base/common/resources", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/base/parts/quickopen/common/quickOpenScorer", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/workbench/browser/quickopen", "vs/workbench/contrib/search/common/queryBuilder", "vs/workbench/contrib/search/common/search", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/remotePathService", "vs/workbench/services/search/common/search", "vs/workbench/services/themes/common/workbenchThemeService"], function (require, exports, errors, idGenerator_1, labels_1, objects, resources_1, quickOpenModel_1, quickOpenScorer_1, getIconClasses_1, modelService_1, modeService_1, nls, configuration_1, environment_1, files_1, instantiation_1, label_1, workspace_1, quickopen_1, queryBuilder_1, search_1, editorService_1, environmentService_1, remotePathService_1, search_2, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileQuickOpenModel extends quickOpenModel_1.QuickOpenModel {
        constructor(entries, stats) {
            super(entries);
        }
    }
    exports.FileQuickOpenModel = FileQuickOpenModel;
    let FileEntry = class FileEntry extends quickopen_1.EditorQuickOpenEntry {
        constructor(resource, name, description, icon, editorService, modeService, modelService, configurationService, contextService) {
            super(editorService);
            this.resource = resource;
            this.name = name;
            this.description = description;
            this.icon = icon;
            this.modeService = modeService;
            this.modelService = modelService;
            this.configurationService = configurationService;
            this.range = null;
        }
        getLabel() {
            return this.name;
        }
        getLabelOptions() {
            return {
                extraClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, this.resource)
            };
        }
        getAriaLabel() {
            return nls.localize('entryAriaLabel', "{0}, file picker", this.getLabel());
        }
        getDescription() {
            return this.description;
        }
        getIcon() {
            return this.icon;
        }
        getResource() {
            return this.resource;
        }
        setRange(range) {
            this.range = range;
        }
        mergeWithEditorHistory() {
            return true;
        }
        getInput() {
            const input = {
                resource: this.resource,
                options: {
                    pinned: !this.configurationService.getValue().workbench.editor.enablePreviewFromQuickOpen,
                    selection: this.range ? this.range : undefined
                }
            };
            return input;
        }
    };
    FileEntry = __decorate([
        __param(4, editorService_1.IEditorService),
        __param(5, modeService_1.IModeService),
        __param(6, modelService_1.IModelService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, workspace_1.IWorkspaceContextService)
    ], FileEntry);
    exports.FileEntry = FileEntry;
    let OpenFileHandler = class OpenFileHandler extends quickopen_1.QuickOpenHandler {
        constructor(instantiationService, themeService, contextService, searchService, environmentService, workbenchEnvironmentService, fileService, labelService, remotePathService) {
            super();
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.contextService = contextService;
            this.searchService = searchService;
            this.environmentService = environmentService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.fileService = fileService;
            this.labelService = labelService;
            this.remotePathService = remotePathService;
            this.queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        setOptions(options) {
            this.options = options;
        }
        getResults(searchValue, token, maxSortedResults) {
            const query = quickOpenScorer_1.prepareQuery(searchValue);
            // Respond directly to empty search
            if (!query.value) {
                return Promise.resolve(new FileQuickOpenModel([]));
            }
            // Do find results
            return this.doFindResults(query, token, this.cacheState ? this.cacheState.cacheKey : undefined, maxSortedResults);
        }
        async doFindResults(query, token, cacheKey, maxSortedResults) {
            const queryOptions = this.doResolveQueryOptions(query, cacheKey, maxSortedResults);
            let iconClass = undefined;
            if (this.options && this.options.forceUseIcons && !this.themeService.getFileIconTheme()) {
                iconClass = 'file'; // only use a generic file icon if we are forced to use an icon and have no icon theme set otherwise
            }
            let complete = undefined;
            const result = await this.getAbsolutePathResult(query);
            if (token.isCancellationRequested) {
                complete = { results: [] };
            }
            // If the original search value is an existing file on disk, return it immediately and bypass the search service
            else if (result) {
                complete = { results: [{ resource: result }] };
            }
            else {
                complete = await this.searchService.fileSearch(this.queryBuilder.file(this.contextService.getWorkspace().folders.map(folder => folder.uri), queryOptions), token);
            }
            const results = [];
            if (!token.isCancellationRequested) {
                for (const fileMatch of complete.results) {
                    const label = resources_1.basename(fileMatch.resource);
                    const description = this.labelService.getUriLabel(resources_1.dirname(fileMatch.resource), { relative: true });
                    results.push(this.instantiationService.createInstance(FileEntry, fileMatch.resource, label, description, iconClass));
                }
            }
            return new FileQuickOpenModel(results, complete.stats);
        }
        async getAbsolutePathResult(query) {
            const detildifiedQuery = labels_1.untildify(query.original, this.environmentService.userHome);
            if ((await this.remotePathService.path).isAbsolute(detildifiedQuery)) {
                const resource = resources_1.toLocalResource(await this.remotePathService.fileURI(detildifiedQuery), this.workbenchEnvironmentService.configuration.remoteAuthority);
                try {
                    const stat = await this.fileService.resolve(resource);
                    return stat.isDirectory ? undefined : resource;
                }
                catch (error) {
                    // ignore
                }
            }
            return undefined;
        }
        doResolveQueryOptions(query, cacheKey, maxSortedResults) {
            const queryOptions = {
                _reason: 'openFileHandler',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                filePattern: query.original,
                cacheKey
            };
            if (typeof maxSortedResults === 'number') {
                queryOptions.maxResults = maxSortedResults;
                queryOptions.sortByScore = true;
            }
            return queryOptions;
        }
        hasShortResponseTime() {
            return this.isCacheLoaded;
        }
        onOpen() {
            this.cacheState = new CacheState(cacheKey => this.cacheQuery(cacheKey), query => this.searchService.fileSearch(query), cacheKey => this.searchService.clearCache(cacheKey), this.cacheState);
            this.cacheState.load();
        }
        cacheQuery(cacheKey) {
            const options = {
                _reason: 'openFileHandler',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                filePattern: '',
                cacheKey: cacheKey,
                maxResults: 0,
                sortByScore: true,
            };
            const folderResources = this.contextService.getWorkspace().folders.map(folder => folder.uri);
            const query = this.queryBuilder.file(folderResources, options);
            return query;
        }
        get isCacheLoaded() {
            return !!this.cacheState && this.cacheState.isLoaded;
        }
        getGroupLabel() {
            return nls.localize('searchResults', "search results");
        }
        getAutoFocus(searchValue) {
            return {
                autoFocusFirstEntry: true
            };
        }
    };
    OpenFileHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, search_2.ISearchService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, files_1.IFileService),
        __param(7, label_1.ILabelService),
        __param(8, remotePathService_1.IRemotePathService)
    ], OpenFileHandler);
    exports.OpenFileHandler = OpenFileHandler;
    var LoadingPhase;
    (function (LoadingPhase) {
        LoadingPhase[LoadingPhase["Created"] = 1] = "Created";
        LoadingPhase[LoadingPhase["Loading"] = 2] = "Loading";
        LoadingPhase[LoadingPhase["Loaded"] = 3] = "Loaded";
        LoadingPhase[LoadingPhase["Errored"] = 4] = "Errored";
        LoadingPhase[LoadingPhase["Disposed"] = 5] = "Disposed";
    })(LoadingPhase || (LoadingPhase = {}));
    /**
     * Exported for testing.
     */
    class CacheState {
        constructor(cacheQuery, doLoad, doDispose, previous) {
            this.doLoad = doLoad;
            this.doDispose = doDispose;
            this.previous = previous;
            this._cacheKey = idGenerator_1.defaultGenerator.nextId();
            this.loadingPhase = LoadingPhase.Created;
            this.query = cacheQuery(this._cacheKey);
            if (this.previous) {
                const current = objects.assign({}, this.query, { cacheKey: null });
                const previous = objects.assign({}, this.previous.query, { cacheKey: null });
                if (!objects.equals(current, previous)) {
                    this.previous.dispose();
                    this.previous = undefined;
                }
            }
        }
        get cacheKey() {
            return this.loadingPhase === LoadingPhase.Loaded || !this.previous ? this._cacheKey : this.previous.cacheKey;
        }
        get isLoaded() {
            const isLoaded = this.loadingPhase === LoadingPhase.Loaded;
            return isLoaded || !this.previous ? isLoaded : this.previous.isLoaded;
        }
        get isUpdating() {
            const isUpdating = this.loadingPhase === LoadingPhase.Loading;
            return isUpdating || !this.previous ? isUpdating : this.previous.isUpdating;
        }
        load() {
            if (this.isUpdating) {
                return;
            }
            this.loadingPhase = LoadingPhase.Loading;
            this.promise = this.doLoad(this.query)
                .then(() => {
                this.loadingPhase = LoadingPhase.Loaded;
                if (this.previous) {
                    this.previous.dispose();
                    this.previous = undefined;
                }
            }, err => {
                this.loadingPhase = LoadingPhase.Errored;
                errors.onUnexpectedError(err);
            });
        }
        dispose() {
            if (this.promise) {
                this.promise.then(undefined, () => { })
                    .then(() => {
                    this.loadingPhase = LoadingPhase.Disposed;
                    return this.doDispose(this._cacheKey);
                }).then(undefined, err => {
                    errors.onUnexpectedError(err);
                });
            }
            else {
                this.loadingPhase = LoadingPhase.Disposed;
            }
            if (this.previous) {
                this.previous.dispose();
                this.previous = undefined;
            }
        }
    }
    exports.CacheState = CacheState;
});
//# sourceMappingURL=openFileHandler.js.map