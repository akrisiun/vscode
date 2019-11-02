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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/base/common/path", "vs/base/common/resources", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/backup/common/backup", "vs/base/common/network", "vs/workbench/services/untitled/common/untitledEditorService", "vs/platform/configuration/common/configuration", "vs/base/browser/dnd", "vs/base/common/labels", "vs/base/common/mime", "vs/base/common/platform", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/types", "vs/workbench/services/host/browser/host", "vs/base/browser/browser"], function (require, exports, workspaces_1, path_1, resources_1, files_1, uri_1, textfiles_1, backup_1, network_1, untitledEditorService_1, configuration_1, dnd_1, labels_1, mime_1, platform_1, editorBrowser_1, editorService_1, lifecycle_1, dom_1, workspaceEditing_1, types_1, host_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DraggedEditorIdentifier {
        constructor(_identifier) {
            this._identifier = _identifier;
        }
        get identifier() {
            return this._identifier;
        }
    }
    exports.DraggedEditorIdentifier = DraggedEditorIdentifier;
    class DraggedEditorGroupIdentifier {
        constructor(_identifier) {
            this._identifier = _identifier;
        }
        get identifier() {
            return this._identifier;
        }
    }
    exports.DraggedEditorGroupIdentifier = DraggedEditorGroupIdentifier;
    exports.CodeDataTransfers = {
        EDITORS: 'CodeEditors',
        FILES: 'CodeFiles'
    };
    function extractResources(e, externalOnly) {
        var _a;
        const resources = [];
        if (e.dataTransfer && e.dataTransfer.types.length > 0) {
            // Check for window-to-window DND
            if (!externalOnly) {
                // Data Transfer: Code Editors
                const rawEditorsData = e.dataTransfer.getData(exports.CodeDataTransfers.EDITORS);
                if (rawEditorsData) {
                    try {
                        const draggedEditors = JSON.parse(rawEditorsData);
                        draggedEditors.forEach(draggedEditor => {
                            resources.push({
                                resource: uri_1.URI.parse(draggedEditor.resource),
                                backupResource: draggedEditor.backupResource ? uri_1.URI.parse(draggedEditor.backupResource) : undefined,
                                viewState: types_1.withNullAsUndefined(draggedEditor.viewState),
                                isExternal: false
                            });
                        });
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
                // Data Transfer: Resources
                else {
                    try {
                        const rawResourcesData = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                        if (rawResourcesData) {
                            const uriStrArray = JSON.parse(rawResourcesData);
                            resources.push(...uriStrArray.map(uriStr => ({ resource: uri_1.URI.parse(uriStr), isExternal: false })));
                        }
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
            }
            // Check for native file transfer
            if (e.dataTransfer && e.dataTransfer.files) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i];
                    if (((_a = file) === null || _a === void 0 ? void 0 : _a.path /* Electron only */) && !resources.some(r => r.resource.fsPath === file.path) /* prevent duplicates */) {
                        try {
                            resources.push({ resource: uri_1.URI.file(file.path), isExternal: true });
                        }
                        catch (error) {
                            // Invalid URI
                        }
                    }
                }
            }
            // Check for CodeFiles transfer
            const rawCodeFiles = e.dataTransfer.getData(exports.CodeDataTransfers.FILES);
            if (rawCodeFiles) {
                try {
                    const codeFiles = JSON.parse(rawCodeFiles);
                    codeFiles.forEach(codeFile => {
                        if (!resources.some(r => r.resource.fsPath === codeFile) /* prevent duplicates */) {
                            resources.push({ resource: uri_1.URI.file(codeFile), isExternal: true });
                        }
                    });
                }
                catch (error) {
                    // Invalid transfer
                }
            }
        }
        return resources;
    }
    exports.extractResources = extractResources;
    /**
     * Shared function across some components to handle drag & drop of resources. E.g. of folders and workspace files
     * to open them in the window instead of the editor or to handle dirty editors being dropped between instances of Code.
     */
    let ResourcesDropHandler = class ResourcesDropHandler {
        constructor(options, fileService, workspacesService, textFileService, backupFileService, untitledEditorService, editorService, configurationService, workspaceEditingService, hostService) {
            this.options = options;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.textFileService = textFileService;
            this.backupFileService = backupFileService;
            this.untitledEditorService = untitledEditorService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.workspaceEditingService = workspaceEditingService;
            this.hostService = hostService;
        }
        async handleDrop(event, resolveTargetGroup, afterDrop, targetIndex) {
            const untitledOrFileResources = extractResources(event).filter(r => this.fileService.canHandleResource(r.resource) || r.resource.scheme === network_1.Schemas.untitled);
            if (!untitledOrFileResources.length) {
                return;
            }
            // Make the window active to handle the drop properly within
            await this.hostService.focus();
            // Check for special things being dropped
            const isWorkspaceOpening = await this.doHandleDrop(untitledOrFileResources);
            if (isWorkspaceOpening) {
                return; // return early if the drop operation resulted in this window changing to a workspace
            }
            // Add external ones to recently open list unless dropped resource is a workspace
            const recentFiles = untitledOrFileResources.filter(d => d.isExternal && d.resource.scheme === network_1.Schemas.file).map(d => ({ fileUri: d.resource }));
            if (recentFiles.length) {
                this.workspacesService.addRecentlyOpened(recentFiles);
            }
            const editors = untitledOrFileResources.map(untitledOrFileResource => ({
                resource: untitledOrFileResource.resource,
                options: {
                    pinned: true,
                    index: targetIndex,
                    viewState: untitledOrFileResource.viewState
                }
            }));
            // Open in Editor
            const targetGroup = resolveTargetGroup();
            await this.editorService.openEditors(editors, targetGroup);
            // Finish with provided function
            afterDrop(targetGroup);
        }
        async doHandleDrop(untitledOrFileResources) {
            // Check for dirty editors being dropped
            const resourcesWithBackups = untitledOrFileResources.filter(resource => !resource.isExternal && !!resource.backupResource);
            if (resourcesWithBackups.length > 0) {
                await Promise.all(resourcesWithBackups.map(resourceWithBackup => this.handleDirtyEditorDrop(resourceWithBackup)));
                return false;
            }
            // Check for workspace file being dropped if we are allowed to do so
            if (this.options.allowWorkspaceOpen) {
                const externalFileOnDiskResources = untitledOrFileResources.filter(d => d.isExternal && d.resource.scheme === network_1.Schemas.file).map(d => d.resource);
                if (externalFileOnDiskResources.length > 0) {
                    return this.handleWorkspaceFileDrop(externalFileOnDiskResources);
                }
            }
            return false;
        }
        async handleDirtyEditorDrop(droppedDirtyEditor) {
            // Untitled: always ensure that we open a new untitled for each file we drop
            if (droppedDirtyEditor.resource.scheme === network_1.Schemas.untitled) {
                droppedDirtyEditor.resource = this.untitledEditorService.createOrGet().getResource();
            }
            // Return early if the resource is already dirty in target or opened already
            if (this.textFileService.isDirty(droppedDirtyEditor.resource) || this.editorService.isOpen({ resource: droppedDirtyEditor.resource })) {
                return false;
            }
            // Resolve the contents of the dropped dirty resource from source
            if (droppedDirtyEditor.backupResource) {
                try {
                    const content = await this.backupFileService.resolveBackupContent((droppedDirtyEditor.backupResource));
                    await this.backupFileService.backupResource(droppedDirtyEditor.resource, content.value.create(this.getDefaultEOL()).createSnapshot(true));
                }
                catch (e) {
                    // Ignore error
                }
            }
            return false;
        }
        getDefaultEOL() {
            const eol = this.configurationService.getValue('files.eol');
            if (eol === '\r\n') {
                return 2 /* CRLF */;
            }
            return 1 /* LF */;
        }
        async handleWorkspaceFileDrop(fileOnDiskResources) {
            const toOpen = [];
            const folderURIs = [];
            await Promise.all(fileOnDiskResources.map(async (fileOnDiskResource) => {
                // Check for Workspace
                if (workspaces_1.hasWorkspaceFileExtension(fileOnDiskResource)) {
                    toOpen.push({ workspaceUri: fileOnDiskResource });
                    return;
                }
                // Check for Folder
                try {
                    const stat = await this.fileService.resolve(fileOnDiskResource);
                    if (stat.isDirectory) {
                        toOpen.push({ folderUri: stat.resource });
                        folderURIs.push({ uri: stat.resource });
                    }
                }
                catch (error) {
                    // Ignore error
                }
            }));
            // Return early if no external resource is a folder or workspace
            if (toOpen.length === 0) {
                return false;
            }
            // Pass focus to window
            this.hostService.focus();
            // Open in separate windows if we drop workspaces or just one folder
            if (toOpen.length > folderURIs.length || folderURIs.length === 1) {
                await this.hostService.openWindow(toOpen, { forceReuseWindow: true });
            }
            // folders.length > 1: Multiple folders: Create new workspace with folders and open
            else {
                await this.workspaceEditingService.createAndEnterWorkspace(folderURIs);
            }
            return true;
        }
    };
    ResourcesDropHandler = __decorate([
        __param(1, files_1.IFileService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, backup_1.IBackupFileService),
        __param(5, untitledEditorService_1.IUntitledEditorService),
        __param(6, editorService_1.IEditorService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, workspaceEditing_1.IWorkspaceEditingService),
        __param(9, host_1.IHostService)
    ], ResourcesDropHandler);
    exports.ResourcesDropHandler = ResourcesDropHandler;
    function fillResourceDataTransfers(accessor, resources, event) {
        if (resources.length === 0 || !event.dataTransfer) {
            return;
        }
        const sources = resources.map(obj => {
            if (uri_1.URI.isUri(obj)) {
                return { resource: obj, isDirectory: false /* assume resource is not a directory */ };
            }
            return obj;
        });
        // Text: allows to paste into text-capable areas
        const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
        event.dataTransfer.setData(dnd_1.DataTransfers.TEXT, sources.map(source => source.resource.scheme === network_1.Schemas.file ? path_1.normalize(labels_1.normalizeDriveLetter(source.resource.fsPath)) : source.resource.toString()).join(lineDelimiter));
        // Download URL: enables support to drag a tab as file to desktop (only single file supported)
        // Disabled for PWA web due to: https://github.com/microsoft/vscode/issues/83441
        if (!sources[0].isDirectory && (!platform_1.isWeb || !browser_1.isStandalone)) {
            event.dataTransfer.setData(dnd_1.DataTransfers.DOWNLOAD_URL, [mime_1.MIME_BINARY, resources_1.basename(sources[0].resource), dom_1.asDomUri(sources[0].resource).toString()].join(':'));
        }
        // Resource URLs: allows to drop multiple resources to a target in VS Code (not directories)
        const files = sources.filter(s => !s.isDirectory);
        if (files.length) {
            event.dataTransfer.setData(dnd_1.DataTransfers.RESOURCES, JSON.stringify(files.map(f => f.resource.toString())));
        }
        // Editors: enables cross window DND of tabs into the editor area
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const backupFileService = accessor.get(backup_1.IBackupFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const draggedEditors = [];
        files.forEach(file => {
            var _a, _b;
            // Try to find editor view state from the visible editors that match given resource
            let viewState = null;
            const textEditorWidgets = editorService.visibleTextEditorWidgets;
            for (const textEditorWidget of textEditorWidgets) {
                if (editorBrowser_1.isCodeEditor(textEditorWidget)) {
                    const model = textEditorWidget.getModel();
                    if (((_b = (_a = model) === null || _a === void 0 ? void 0 : _a.uri) === null || _b === void 0 ? void 0 : _b.toString()) === file.resource.toString()) {
                        viewState = textEditorWidget.saveViewState();
                        break;
                    }
                }
            }
            // Add as dragged editor
            draggedEditors.push({
                resource: file.resource.toString(),
                backupResource: textFileService.isDirty(file.resource) ? backupFileService.toBackupResource(file.resource).toString() : undefined,
                viewState
            });
        });
        if (draggedEditors.length) {
            event.dataTransfer.setData(exports.CodeDataTransfers.EDITORS, JSON.stringify(draggedEditors));
        }
    }
    exports.fillResourceDataTransfers = fillResourceDataTransfers;
    /**
     * A singleton to store transfer data during drag & drop operations that are only valid within the application.
     */
    class LocalSelectionTransfer {
        constructor() {
            // protect against external instantiation
        }
        static getInstance() {
            return LocalSelectionTransfer.INSTANCE;
        }
        hasData(proto) {
            return proto && proto === this.proto;
        }
        clearData(proto) {
            if (this.hasData(proto)) {
                this.proto = undefined;
                this.data = undefined;
            }
        }
        getData(proto) {
            if (this.hasData(proto)) {
                return this.data;
            }
            return undefined;
        }
        setData(data, proto) {
            if (proto) {
                this.data = data;
                this.proto = proto;
            }
        }
    }
    exports.LocalSelectionTransfer = LocalSelectionTransfer;
    LocalSelectionTransfer.INSTANCE = new LocalSelectionTransfer();
    class DragAndDropObserver extends lifecycle_1.Disposable {
        constructor(element, callbacks) {
            super();
            this.element = element;
            this.callbacks = callbacks;
            // A helper to fix issues with repeated DRAG_ENTER / DRAG_LEAVE
            // calls see https://github.com/Microsoft/vscode/issues/14470
            // when the element has child elements where the events are fired
            // repeadedly.
            this.counter = 0;
            this.registerListeners();
        }
        registerListeners() {
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_ENTER, (e) => {
                this.counter++;
                this.callbacks.onDragEnter(e);
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_OVER, (e) => {
                e.preventDefault(); // needed so that the drop event fires (https://stackoverflow.com/questions/21339924/drop-event-not-firing-in-chrome)
                if (this.callbacks.onDragOver) {
                    this.callbacks.onDragOver(e);
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_LEAVE, (e) => {
                this.counter--;
                if (this.counter === 0) {
                    this.callbacks.onDragLeave(e);
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DRAG_END, (e) => {
                this.counter = 0;
                this.callbacks.onDragEnd(e);
            }));
            this._register(dom_1.addDisposableListener(this.element, dom_1.EventType.DROP, (e) => {
                this.counter = 0;
                this.callbacks.onDrop(e);
            }));
        }
    }
    exports.DragAndDropObserver = DragAndDropObserver;
    function containsDragType(event, ...dragTypesToFind) {
        if (!event.dataTransfer) {
            return false;
        }
        const dragTypes = event.dataTransfer.types;
        const lowercaseDragTypes = [];
        for (let i = 0; i < dragTypes.length; i++) {
            lowercaseDragTypes.push(dragTypes[i].toLowerCase()); // somehow the types are lowercase
        }
        for (const dragType of dragTypesToFind) {
            if (lowercaseDragTypes.indexOf(dragType.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    exports.containsDragType = containsDragType;
});
//# sourceMappingURL=dnd.js.map