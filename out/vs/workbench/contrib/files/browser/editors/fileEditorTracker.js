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
define(["require", "exports", "vs/base/common/resources", "vs/workbench/common/editor", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/contrib/files/common/editors/fileEditorInput", "vs/platform/lifecycle/common/lifecycle", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/base/common/map", "vs/platform/workspace/common/workspace", "vs/editor/browser/editorBrowser", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/types", "vs/platform/editor/common/editor"], function (require, exports, resources, editor_1, textfiles_1, files_1, fileEditorInput_1, lifecycle_1, lifecycle_2, arrays_1, environment_1, configuration_1, map_1, workspace_1, editorBrowser_1, sideBySideEditor_1, host_1, files_2, editorService_1, editorGroupsService_1, async_1, errors_1, types_1, editor_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileEditorTracker = class FileEditorTracker extends lifecycle_2.Disposable {
        constructor(editorService, textFileService, lifecycleService, editorGroupService, fileService, environmentService, configurationService, contextService, hostService) {
            super();
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.lifecycleService = lifecycleService;
            this.editorGroupService = editorGroupService;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.hostService = hostService;
            this.modelLoadQueue = new async_1.ResourceQueue();
            this.activeOutOfWorkspaceWatchers = new map_1.ResourceMap();
            this.onConfigurationUpdated(configurationService.getValue());
            this.registerListeners();
        }
        registerListeners() {
            // Update editors from operation changes
            this._register(this.fileService.onAfterOperation(e => this.onFileOperation(e)));
            // Update editors from disk changes
            this._register(this.fileService.onFileChanges(e => this.onFileChanges(e)));
            // Editor changing
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.handleOutOfWorkspaceWatchers()));
            // Update visible editors when focus is gained
            this._register(this.hostService.onDidChangeFocus(e => this.onWindowFocusChange(e)));
            // Lifecycle
            this.lifecycleService.onShutdown(this.dispose, this);
            // Configuration
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue())));
        }
        onConfigurationUpdated(configuration) {
            var _a, _b;
            if (typeof ((_b = (_a = configuration.workbench) === null || _a === void 0 ? void 0 : _a.editor) === null || _b === void 0 ? void 0 : _b.closeOnFileDelete) === 'boolean') {
                this.closeOnFileDelete = configuration.workbench.editor.closeOnFileDelete;
            }
            else {
                this.closeOnFileDelete = false; // default
            }
        }
        onWindowFocusChange(focused) {
            if (focused) {
                // the window got focus and we use this as a hint that files might have been changed outside
                // of this window. since file events can be unreliable, we queue a load for models that
                // are visible in any editor. since this is a fast operation in the case nothing has changed,
                // we tolerate the additional work.
                arrays_1.distinct(arrays_1.coalesce(this.editorService.visibleEditors
                    .map(editorInput => {
                    const resource = editor_1.toResource(editorInput, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                    return resource ? this.textFileService.models.get(resource) : undefined;
                }))
                    .filter(model => !model.isDirty()), m => m.getResource().toString()).forEach(model => this.queueModelLoad(model));
            }
        }
        // Note: there is some duplication with the other file event handler below. Since we cannot always rely on the disk events
        // carrying all necessary data in all environments, we also use the file operation events to make sure operations are handled.
        // In any case there is no guarantee if the local event is fired first or the disk one. Thus, code must handle the case
        // that the event ordering is random as well as might not carry all information needed.
        onFileOperation(e) {
            // Handle moves specially when file is opened
            if (e.isOperation(2 /* MOVE */)) {
                this.handleMovedFileInOpenedEditors(e.resource, e.target.resource);
            }
            // Handle deletes
            if (e.isOperation(1 /* DELETE */) || e.isOperation(2 /* MOVE */)) {
                this.handleDeletes(e.resource, false, e.target ? e.target.resource : undefined);
            }
        }
        onFileChanges(e) {
            // Handle updates
            if (e.gotAdded() || e.gotUpdated()) {
                this.handleUpdates(e);
            }
            // Handle deletes
            if (e.gotDeleted()) {
                this.handleDeletes(e, true);
            }
        }
        handleDeletes(arg1, isExternal, movedTo) {
            const nonDirtyFileEditors = this.getOpenedFileEditors(false /* non-dirty only */);
            nonDirtyFileEditors.forEach(async (editor) => {
                const resource = editor.getResource();
                // Handle deletes in opened editors depending on:
                // - the user has not disabled the setting closeOnFileDelete
                // - the file change is local or external
                // - the input is not resolved (we need to dispose because we cannot restore otherwise since we do not have the contents)
                if (this.closeOnFileDelete || !isExternal || !editor.isResolved()) {
                    // Do NOT close any opened editor that matches the resource path (either equal or being parent) of the
                    // resource we move to (movedTo). Otherwise we would close a resource that has been renamed to the same
                    // path but different casing.
                    if (movedTo && resources.isEqualOrParent(resource, movedTo)) {
                        return;
                    }
                    let matches = false;
                    if (arg1 instanceof files_1.FileChangesEvent) {
                        matches = arg1.contains(resource, 2 /* DELETED */);
                    }
                    else {
                        matches = resources.isEqualOrParent(resource, arg1);
                    }
                    if (!matches) {
                        return;
                    }
                    // We have received reports of users seeing delete events even though the file still
                    // exists (network shares issue: https://github.com/Microsoft/vscode/issues/13665).
                    // Since we do not want to close an editor without reason, we have to check if the
                    // file is really gone and not just a faulty file event.
                    // This only applies to external file events, so we need to check for the isExternal
                    // flag.
                    let exists = false;
                    if (isExternal) {
                        await async_1.timeout(100);
                        exists = await this.fileService.exists(resource);
                    }
                    if (!exists && !editor.isDisposed()) {
                        editor.dispose();
                    }
                    else if (this.environmentService.verbose) {
                        console.warn(`File exists even though we received a delete event: ${resource.toString()}`);
                    }
                }
            });
        }
        getOpenedFileEditors(dirtyState) {
            const editors = [];
            this.editorService.editors.forEach(editor => {
                if (editor instanceof fileEditorInput_1.FileEditorInput) {
                    if (!!editor.isDirty() === dirtyState) {
                        editors.push(editor);
                    }
                }
                else if (editor instanceof editor_1.SideBySideEditorInput) {
                    const master = editor.master;
                    const details = editor.details;
                    if (master instanceof fileEditorInput_1.FileEditorInput) {
                        if (!!master.isDirty() === dirtyState) {
                            editors.push(master);
                        }
                    }
                    if (details instanceof fileEditorInput_1.FileEditorInput) {
                        if (!!details.isDirty() === dirtyState) {
                            editors.push(details);
                        }
                    }
                }
            });
            return editors;
        }
        handleMovedFileInOpenedEditors(oldResource, newResource) {
            this.editorGroupService.groups.forEach(group => {
                group.editors.forEach(editor => {
                    if (editor instanceof fileEditorInput_1.FileEditorInput) {
                        const resource = editor.getResource();
                        // Update Editor if file (or any parent of the input) got renamed or moved
                        if (resources.isEqualOrParent(resource, oldResource)) {
                            let reopenFileResource;
                            if (oldResource.toString() === resource.toString()) {
                                reopenFileResource = newResource; // file got moved
                            }
                            else {
                                const index = this.getIndexOfPath(resource.path, oldResource.path, resources.hasToIgnoreCase(resource));
                                reopenFileResource = resources.joinPath(newResource, resource.path.substr(index + oldResource.path.length + 1)); // parent folder got moved
                            }
                            this.editorService.replaceEditors([{
                                    editor: { resource },
                                    replacement: {
                                        resource: reopenFileResource,
                                        options: {
                                            preserveFocus: true,
                                            pinned: group.isPinned(editor),
                                            index: group.getIndexOfEditor(editor),
                                            inactive: !group.isActive(editor),
                                            viewState: this.getViewStateFor(oldResource, group)
                                        }
                                    },
                                }], group);
                        }
                    }
                });
            });
        }
        getIndexOfPath(path, candidate, ignoreCase) {
            if (candidate.length > path.length) {
                return -1;
            }
            if (path === candidate) {
                return 0;
            }
            if (ignoreCase) {
                path = path.toLowerCase();
                candidate = candidate.toLowerCase();
            }
            return path.indexOf(candidate);
        }
        getViewStateFor(resource, group) {
            var _a;
            const editors = this.editorService.visibleControls;
            for (const editor of editors) {
                if (((_a = editor) === null || _a === void 0 ? void 0 : _a.input) && editor.group === group) {
                    const editorResource = editor.input.getResource();
                    if (editorResource && resource.toString() === editorResource.toString()) {
                        const control = editor.getControl();
                        if (editorBrowser_1.isCodeEditor(control)) {
                            return types_1.withNullAsUndefined(control.saveViewState());
                        }
                    }
                }
            }
            return undefined;
        }
        handleUpdates(e) {
            // Handle updates to text models
            this.handleUpdatesToTextModels(e);
            // Handle updates to visible binary editors
            this.handleUpdatesToVisibleBinaryEditors(e);
        }
        handleUpdatesToTextModels(e) {
            // Collect distinct (saved) models to update.
            //
            // Note: we also consider the added event because it could be that a file was added
            // and updated right after.
            arrays_1.distinct(arrays_1.coalesce([...e.getUpdated(), ...e.getAdded()]
                .map(u => this.textFileService.models.get(u.resource)))
                .filter(model => model && !model.isDirty()), m => m.getResource().toString())
                .forEach(model => this.queueModelLoad(model));
        }
        queueModelLoad(model) {
            // Load model to update (use a queue to prevent accumulation of loads
            // when the load actually takes long. At most we only want the queue
            // to have a size of 2 (1 running load and 1 queued load).
            const queue = this.modelLoadQueue.queueFor(model.getResource());
            if (queue.size <= 1) {
                queue.queue(() => model.load().then(undefined, errors_1.onUnexpectedError));
            }
        }
        handleUpdatesToVisibleBinaryEditors(e) {
            const editors = this.editorService.visibleControls;
            editors.forEach(editor => {
                var _a;
                const resource = editor.input ? editor_1.toResource(editor.input, { supportSideBySide: editor_1.SideBySideEditor.MASTER }) : undefined;
                // Support side-by-side binary editors too
                let isBinaryEditor = false;
                if (editor instanceof sideBySideEditor_1.SideBySideEditor) {
                    const masterEditor = editor.getMasterEditor();
                    isBinaryEditor = ((_a = masterEditor) === null || _a === void 0 ? void 0 : _a.getId()) === files_2.BINARY_FILE_EDITOR_ID;
                }
                else {
                    isBinaryEditor = editor.getId() === files_2.BINARY_FILE_EDITOR_ID;
                }
                // Binary editor that should reload from event
                if (resource && editor.input && isBinaryEditor && (e.contains(resource, 0 /* UPDATED */) || e.contains(resource, 1 /* ADDED */))) {
                    this.editorService.openEditor(editor.input, { forceReload: true, preserveFocus: true, activation: editor_2.EditorActivation.PRESERVE }, editor.group);
                }
            });
        }
        handleOutOfWorkspaceWatchers() {
            const visibleOutOfWorkspacePaths = new map_1.ResourceMap();
            arrays_1.coalesce(this.editorService.visibleEditors.map(editorInput => {
                return editor_1.toResource(editorInput, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
            })).filter(resource => {
                return this.fileService.canHandleResource(resource) && !this.contextService.isInsideWorkspace(resource);
            }).forEach(resource => {
                visibleOutOfWorkspacePaths.set(resource, resource);
            });
            // Handle no longer visible out of workspace resources
            this.activeOutOfWorkspaceWatchers.keys().forEach(resource => {
                if (!visibleOutOfWorkspacePaths.get(resource)) {
                    lifecycle_2.dispose(this.activeOutOfWorkspaceWatchers.get(resource));
                    this.activeOutOfWorkspaceWatchers.delete(resource);
                }
            });
            // Handle newly visible out of workspace resources
            visibleOutOfWorkspacePaths.forEach(resource => {
                if (!this.activeOutOfWorkspaceWatchers.get(resource)) {
                    const disposable = this.fileService.watch(resource);
                    this.activeOutOfWorkspaceWatchers.set(resource, disposable);
                }
            });
        }
        dispose() {
            super.dispose();
            // Dispose remaining watchers if any
            this.activeOutOfWorkspaceWatchers.forEach(disposable => lifecycle_2.dispose(disposable));
            this.activeOutOfWorkspaceWatchers.clear();
        }
    };
    FileEditorTracker = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, files_1.IFileService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, workspace_1.IWorkspaceContextService),
        __param(8, host_1.IHostService)
    ], FileEditorTracker);
    exports.FileEditorTracker = FileEditorTracker;
});
//# sourceMappingURL=fileEditorTracker.js.map