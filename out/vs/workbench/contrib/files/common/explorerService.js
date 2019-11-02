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
define(["require", "exports", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/common/explorerModel", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/decorators", "vs/workbench/common/resources", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/editor/common/editorService"], function (require, exports, event_1, workspace_1, lifecycle_1, files_1, explorerModel_1, files_2, resources_1, decorators_1, resources_2, instantiation_1, configuration_1, clipboardService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getFileEventsExcludes(configurationService, root) {
        var _a, _b;
        const scope = root ? { resource: root } : undefined;
        const configuration = scope ? configurationService.getValue(scope) : configurationService.getValue();
        return ((_b = (_a = configuration) === null || _a === void 0 ? void 0 : _a.files) === null || _b === void 0 ? void 0 : _b.exclude) || Object.create(null);
    }
    let ExplorerService = class ExplorerService {
        constructor(fileService, instantiationService, configurationService, contextService, clipboardService, editorService) {
            this.fileService = fileService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.clipboardService = clipboardService;
            this.editorService = editorService;
            this._onDidChangeRoots = new event_1.Emitter();
            this._onDidChangeItem = new event_1.Emitter();
            this._onDidChangeEditable = new event_1.Emitter();
            this._onDidSelectResource = new event_1.Emitter();
            this._onDidCopyItems = new event_1.Emitter();
            this.disposables = new lifecycle_1.DisposableStore();
            this.fileSystemProviderSchemes = new Set();
            this._sortOrder = this.configurationService.getValue('explorer.sortOrder');
        }
        get roots() {
            return this.model.roots;
        }
        get onDidChangeRoots() {
            return this._onDidChangeRoots.event;
        }
        get onDidChangeItem() {
            return this._onDidChangeItem.event;
        }
        get onDidChangeEditable() {
            return this._onDidChangeEditable.event;
        }
        get onDidSelectResource() {
            return this._onDidSelectResource.event;
        }
        get onDidCopyItems() {
            return this._onDidCopyItems.event;
        }
        get sortOrder() {
            return this._sortOrder;
        }
        // Memoized locals
        get fileEventsFilter() {
            const fileEventsFilter = this.instantiationService.createInstance(resources_2.ResourceGlobMatcher, (root) => getFileEventsExcludes(this.configurationService, root), (event) => event.affectsConfiguration(files_2.FILES_EXCLUDE_CONFIG));
            this.disposables.add(fileEventsFilter);
            return fileEventsFilter;
        }
        get model() {
            const model = new explorerModel_1.ExplorerModel(this.contextService);
            this.disposables.add(model);
            this.disposables.add(this.fileService.onAfterOperation(e => this.onFileOperation(e)));
            this.disposables.add(this.fileService.onFileChanges(e => this.onFileChanges(e)));
            this.disposables.add(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue())));
            this.disposables.add(this.fileService.onDidChangeFileSystemProviderRegistrations(e => {
                if (e.added && this.fileSystemProviderSchemes.has(e.scheme)) {
                    // A file system provider got re-registered, we should update all file stats since they might change (got read-only)
                    this.model.roots.forEach(r => r.forgetChildren());
                    this._onDidChangeItem.fire({ recursive: true });
                }
                else {
                    this.fileSystemProviderSchemes.add(e.scheme);
                }
            }));
            this.disposables.add(model.onDidChangeRoots(() => this._onDidChangeRoots.fire()));
            return model;
        }
        // IExplorerService methods
        findClosest(resource) {
            return this.model.findClosest(resource);
        }
        setEditable(stat, data) {
            if (!data) {
                this.editable = undefined;
            }
            else {
                this.editable = { stat, data };
            }
            this._onDidChangeEditable.fire(stat);
        }
        setToCopy(items, cut) {
            const previouslyCutItems = this.cutItems;
            this.cutItems = cut ? items : undefined;
            this.clipboardService.writeResources(items.map(s => s.resource));
            this._onDidCopyItems.fire({ items, cut, previouslyCutItems });
        }
        isCut(item) {
            return !!this.cutItems && this.cutItems.indexOf(item) >= 0;
        }
        getEditable() {
            return this.editable;
        }
        getEditableData(stat) {
            return this.editable && this.editable.stat === stat ? this.editable.data : undefined;
        }
        isEditable(stat) {
            return !!this.editable && (this.editable.stat === stat || !stat);
        }
        async select(resource, reveal) {
            const fileStat = this.findClosest(resource);
            if (fileStat) {
                this._onDidSelectResource.fire({ resource: fileStat.resource, reveal });
                return Promise.resolve(undefined);
            }
            // Stat needs to be resolved first and then revealed
            const options = { resolveTo: [resource], resolveMetadata: this.sortOrder === 'modified' };
            const workspaceFolder = this.contextService.getWorkspaceFolder(resource);
            if (workspaceFolder === null) {
                return Promise.resolve(undefined);
            }
            const rootUri = workspaceFolder.uri;
            const root = this.roots.filter(r => r.resource.toString() === rootUri.toString()).pop();
            try {
                const stat = await this.fileService.resolve(rootUri, options);
                // Convert to model
                const modelStat = explorerModel_1.ExplorerItem.create(stat, undefined, options.resolveTo);
                // Update Input with disk Stat
                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, root);
                const item = root.find(resource);
                this._onDidChangeItem.fire({ item: root, recursive: true });
                // Select and Reveal
                this._onDidSelectResource.fire({ resource: item ? item.resource : undefined, reveal });
            }
            catch (error) {
                root.isError = true;
                this._onDidChangeItem.fire({ item: root, recursive: false });
            }
        }
        refresh() {
            this.model.roots.forEach(r => r.forgetChildren());
            this._onDidChangeItem.fire({ recursive: true });
            const resource = this.editorService.activeEditor ? this.editorService.activeEditor.getResource() : undefined;
            const autoReveal = this.configurationService.getValue().explorer.autoReveal;
            if (resource && autoReveal) {
                // We did a top level refresh, reveal the active file #67118
                this.select(resource, true);
            }
        }
        // File events
        onFileOperation(e) {
            // Add
            if (e.isOperation(0 /* CREATE */) || e.isOperation(3 /* COPY */)) {
                const addedElement = e.target;
                const parentResource = resources_1.dirname(addedElement.resource);
                const parents = this.model.findAll(parentResource);
                if (parents.length) {
                    // Add the new file to its parent (Model)
                    parents.forEach(p => {
                        // We have to check if the parent is resolved #29177
                        const resolveMetadata = this.sortOrder === `modified`;
                        const thenable = p.isDirectoryResolved ? Promise.resolve(undefined) : this.fileService.resolve(p.resource, { resolveMetadata });
                        thenable.then(stat => {
                            if (stat) {
                                const modelStat = explorerModel_1.ExplorerItem.create(stat, p.parent);
                                explorerModel_1.ExplorerItem.mergeLocalWithDisk(modelStat, p);
                            }
                            const childElement = explorerModel_1.ExplorerItem.create(addedElement, p.parent);
                            // Make sure to remove any previous version of the file if any
                            p.removeChild(childElement);
                            p.addChild(childElement);
                            // Refresh the Parent (View)
                            this._onDidChangeItem.fire({ item: p, recursive: false });
                        });
                    });
                }
            }
            // Move (including Rename)
            else if (e.isOperation(2 /* MOVE */)) {
                const oldResource = e.resource;
                const newElement = e.target;
                const oldParentResource = resources_1.dirname(oldResource);
                const newParentResource = resources_1.dirname(newElement.resource);
                // Handle Rename
                if (oldParentResource.toString() === newParentResource.toString()) {
                    const modelElements = this.model.findAll(oldResource);
                    modelElements.forEach(modelElement => {
                        // Rename File (Model)
                        modelElement.rename(newElement);
                        this._onDidChangeItem.fire({ item: modelElement.parent, recursive: false });
                    });
                }
                // Handle Move
                else {
                    const newParents = this.model.findAll(newParentResource);
                    const modelElements = this.model.findAll(oldResource);
                    if (newParents.length && modelElements.length) {
                        // Move in Model
                        modelElements.forEach((modelElement, index) => {
                            const oldParent = modelElement.parent;
                            modelElement.move(newParents[index]);
                            this._onDidChangeItem.fire({ item: oldParent, recursive: false });
                            this._onDidChangeItem.fire({ item: newParents[index], recursive: false });
                        });
                    }
                }
            }
            // Delete
            else if (e.isOperation(1 /* DELETE */)) {
                const modelElements = this.model.findAll(e.resource);
                modelElements.forEach(element => {
                    if (element.parent) {
                        const parent = element.parent;
                        // Remove Element from Parent (Model)
                        parent.removeChild(element);
                        // Refresh Parent (View)
                        this._onDidChangeItem.fire({ item: parent, recursive: false });
                    }
                });
            }
        }
        onFileChanges(e) {
            // Check if an explorer refresh is necessary (delayed to give internal events a chance to react first)
            // Note: there is no guarantee when the internal events are fired vs real ones. Code has to deal with the fact that one might
            // be fired first over the other or not at all.
            setTimeout(() => {
                // Filter to the ones we care
                const shouldRefresh = () => {
                    e = this.filterToViewRelevantEvents(e);
                    // Handle added files/folders
                    const added = e.getAdded();
                    if (added.length) {
                        // Check added: Refresh if added file/folder is not part of resolved root and parent is part of it
                        const ignoredPaths = new Set();
                        for (let i = 0; i < added.length; i++) {
                            const change = added[i];
                            // Find parent
                            const parent = resources_1.dirname(change.resource);
                            // Continue if parent was already determined as to be ignored
                            if (ignoredPaths.has(parent.toString())) {
                                continue;
                            }
                            // Compute if parent is visible and added file not yet part of it
                            const parentStat = this.model.findClosest(parent);
                            if (parentStat && parentStat.isDirectoryResolved && !this.model.findClosest(change.resource)) {
                                return true;
                            }
                            // Keep track of path that can be ignored for faster lookup
                            if (!parentStat || !parentStat.isDirectoryResolved) {
                                ignoredPaths.add(parent.toString());
                            }
                        }
                    }
                    // Handle deleted files/folders
                    const deleted = e.getDeleted();
                    if (deleted.length) {
                        // Check deleted: Refresh if deleted file/folder part of resolved root
                        for (let j = 0; j < deleted.length; j++) {
                            const del = deleted[j];
                            const item = this.model.findClosest(del.resource);
                            if (item && item.parent) {
                                return true;
                            }
                        }
                    }
                    // Handle updated files/folders if we sort by modified
                    if (this._sortOrder === files_1.SortOrderConfiguration.MODIFIED) {
                        const updated = e.getUpdated();
                        // Check updated: Refresh if updated file/folder part of resolved root
                        for (let j = 0; j < updated.length; j++) {
                            const upd = updated[j];
                            const item = this.model.findClosest(upd.resource);
                            if (item && item.parent) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                if (shouldRefresh()) {
                    this.roots.forEach(r => r.forgetChildren());
                    this._onDidChangeItem.fire({ recursive: true });
                }
            }, ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY);
        }
        filterToViewRelevantEvents(e) {
            return new files_2.FileChangesEvent(e.changes.filter(change => {
                if (change.type === 0 /* UPDATED */ && this._sortOrder !== files_1.SortOrderConfiguration.MODIFIED) {
                    return false; // we only are about updated if we sort by modified time
                }
                if (!this.contextService.isInsideWorkspace(change.resource)) {
                    return false; // exclude changes for resources outside of workspace
                }
                if (this.fileEventsFilter.matches(change.resource)) {
                    return false; // excluded via files.exclude setting
                }
                return true;
            }));
        }
        onConfigurationUpdated(configuration, event) {
            var _a, _b;
            const configSortOrder = ((_b = (_a = configuration) === null || _a === void 0 ? void 0 : _a.explorer) === null || _b === void 0 ? void 0 : _b.sortOrder) || 'default';
            if (this._sortOrder !== configSortOrder) {
                const shouldRefresh = this._sortOrder !== undefined;
                this._sortOrder = configSortOrder;
                if (shouldRefresh) {
                    this.refresh();
                }
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ExplorerService.EXPLORER_FILE_CHANGES_REACT_DELAY = 500; // delay in ms to react to file changes to give our internal events a chance to react first
    __decorate([
        decorators_1.memoize
    ], ExplorerService.prototype, "fileEventsFilter", null);
    __decorate([
        decorators_1.memoize
    ], ExplorerService.prototype, "model", null);
    ExplorerService = __decorate([
        __param(0, files_2.IFileService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, clipboardService_1.IClipboardService),
        __param(5, editorService_1.IEditorService)
    ], ExplorerService);
    exports.ExplorerService = ExplorerService;
});
//# sourceMappingURL=explorerService.js.map