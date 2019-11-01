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
define(["require", "exports", "vs/nls", "vs/base/common/arrays", "vs/platform/state/node/state", "electron", "vs/platform/log/common/log", "vs/base/common/labels", "vs/base/common/event", "vs/base/common/platform", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/base/common/async", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/network", "vs/platform/environment/common/environment", "vs/platform/label/common/label", "vs/base/node/pfs", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle"], function (require, exports, nls, arrays, state_1, electron_1, log_1, labels_1, event_1, platform_1, workspaces_1, workspacesMainService_1, async_1, resources_1, uri_1, network_1, environment_1, label_1, pfs_1, lifecycleMainService_1, instantiation_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspacesHistoryMainService = instantiation_1.createDecorator('workspacesHistoryMainService');
    let WorkspacesHistoryMainService = class WorkspacesHistoryMainService extends lifecycle_1.Disposable {
        constructor(stateService, logService, workspacesMainService, environmentService, lifecycleMainService) {
            super();
            this.stateService = stateService;
            this.logService = logService;
            this.workspacesMainService = workspacesMainService;
            this.environmentService = environmentService;
            this.lifecycleMainService = lifecycleMainService;
            this._onRecentlyOpenedChange = new event_1.Emitter();
            this.onRecentlyOpenedChange = this._onRecentlyOpenedChange.event;
            this.macOSRecentDocumentsUpdater = this._register(new async_1.ThrottledDelayer(800));
            this.registerListeners();
        }
        registerListeners() {
            // Install window jump list after opening window
            this.lifecycleMainService.when(3 /* AfterWindowOpen */).then(() => this.handleWindowsJumpList());
            // Add to history when entering workspace
            this._register(this.workspacesMainService.onWorkspaceEntered(event => this.addRecentlyOpened([{ workspace: event.workspace }])));
        }
        handleWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            this.updateWindowsJumpList();
            this.onRecentlyOpenedChange(() => this.updateWindowsJumpList());
        }
        addRecentlyOpened(newlyAdded) {
            const workspaces = [];
            const files = [];
            for (let curr of newlyAdded) {
                // Workspace
                if (workspaces_1.isRecentWorkspace(curr)) {
                    if (!this.workspacesMainService.isUntitledWorkspace(curr.workspace) && indexOfWorkspace(workspaces, curr.workspace) === -1) {
                        workspaces.push(curr);
                    }
                }
                // Folder
                else if (workspaces_1.isRecentFolder(curr)) {
                    if (indexOfFolder(workspaces, curr.folderUri) === -1) {
                        workspaces.push(curr);
                    }
                }
                // File
                else {
                    const alreadyExistsInHistory = indexOfFile(files, curr.fileUri) >= 0;
                    const shouldBeFiltered = curr.fileUri.scheme === network_1.Schemas.file && WorkspacesHistoryMainService.COMMON_FILES_FILTER.indexOf(resources_1.basename(curr.fileUri)) >= 0;
                    if (!alreadyExistsInHistory && !shouldBeFiltered) {
                        files.push(curr);
                        // Add to recent documents (Windows only, macOS later)
                        if (platform_1.isWindows && curr.fileUri.scheme === network_1.Schemas.file) {
                            electron_1.app.addRecentDocument(curr.fileUri.fsPath);
                        }
                    }
                }
            }
            this.addEntriesFromStorage(workspaces, files);
            if (workspaces.length > WorkspacesHistoryMainService.MAX_TOTAL_RECENT_ENTRIES) {
                workspaces.length = WorkspacesHistoryMainService.MAX_TOTAL_RECENT_ENTRIES;
            }
            if (files.length > WorkspacesHistoryMainService.MAX_TOTAL_RECENT_ENTRIES) {
                files.length = WorkspacesHistoryMainService.MAX_TOTAL_RECENT_ENTRIES;
            }
            this.saveRecentlyOpened({ workspaces, files });
            this._onRecentlyOpenedChange.fire();
            // Schedule update to recent documents on macOS dock
            if (platform_1.isMacintosh) {
                this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
            }
        }
        removeFromRecentlyOpened(toRemove) {
            const keep = (recent) => {
                const uri = location(recent);
                for (const r of toRemove) {
                    if (resources_1.isEqual(r, uri)) {
                        return false;
                    }
                }
                return true;
            };
            const mru = this.getRecentlyOpened();
            const workspaces = mru.workspaces.filter(keep);
            const files = mru.files.filter(keep);
            if (workspaces.length !== mru.workspaces.length || files.length !== mru.files.length) {
                this.saveRecentlyOpened({ files, workspaces });
                this._onRecentlyOpenedChange.fire();
                // Schedule update to recent documents on macOS dock
                if (platform_1.isMacintosh) {
                    this.macOSRecentDocumentsUpdater.trigger(() => this.updateMacOSRecentDocuments());
                }
            }
        }
        async updateMacOSRecentDocuments() {
            if (!platform_1.isMacintosh) {
                return;
            }
            // We clear all documents first to ensure an up-to-date view on the set. Since entries
            // can get deleted on disk, this ensures that the list is always valid
            electron_1.app.clearRecentDocuments();
            const mru = this.getRecentlyOpened();
            // Collect max-N recent workspaces that are known to exist
            const workspaceEntries = [];
            let entries = 0;
            for (let i = 0; i < mru.workspaces.length && entries < WorkspacesHistoryMainService.MAX_MACOS_DOCK_RECENT_WORKSPACES; i++) {
                const loc = location(mru.workspaces[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const workspacePath = resources_1.originalFSPath(loc);
                    if (await pfs_1.exists(workspacePath)) {
                        workspaceEntries.push(workspacePath);
                        entries++;
                    }
                }
            }
            // Collect max-N recent files that are known to exist
            const fileEntries = [];
            for (let i = 0; i < mru.files.length && entries < WorkspacesHistoryMainService.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL; i++) {
                const loc = location(mru.files[i]);
                if (loc.scheme === network_1.Schemas.file) {
                    const filePath = resources_1.originalFSPath(loc);
                    if (WorkspacesHistoryMainService.COMMON_FILES_FILTER.indexOf(resources_1.basename(loc)) !== -1 || // skip some well known file entries
                        workspaceEntries.indexOf(filePath) !== -1 // prefer a workspace entry over a file entry (e.g. for .code-workspace)
                    ) {
                        continue;
                    }
                    if (await pfs_1.exists(filePath)) {
                        fileEntries.push(filePath);
                        entries++;
                    }
                }
            }
            // The apple guidelines (https://developer.apple.com/design/human-interface-guidelines/macos/menus/menu-anatomy/)
            // explain that most recent entries should appear close to the interaction by the user (e.g. close to the
            // mouse click). Most native macOS applications that add recent documents to the dock, show the most recent document
            // to the bottom (because the dock menu is not appearing from top to bottom, but from the bottom to the top). As such
            // we fill in the entries in reverse order so that the most recent shows up at the bottom of the menu.
            //
            // On top of that, the maximum number of documents can be configured by the user (defaults to 10). To ensure that
            // we are not failing to show the most recent entries, we start by adding files first (in reverse order of recency)
            // and then add folders (in reverse order of recency). Given that strategy, we can ensure that the most recent
            // N folders are always appearing, even if the limit is low (https://github.com/microsoft/vscode/issues/74788)
            fileEntries.reverse().forEach(fileEntry => electron_1.app.addRecentDocument(fileEntry));
            workspaceEntries.reverse().forEach(workspaceEntry => electron_1.app.addRecentDocument(workspaceEntry));
        }
        clearRecentlyOpened() {
            this.saveRecentlyOpened({ workspaces: [], files: [] });
            electron_1.app.clearRecentDocuments();
            // Event
            this._onRecentlyOpenedChange.fire();
        }
        getRecentlyOpened(currentWorkspace, currentFolder, currentFiles) {
            const workspaces = [];
            const files = [];
            // Add current workspace to beginning if set
            if (currentWorkspace && !this.workspacesMainService.isUntitledWorkspace(currentWorkspace)) {
                workspaces.push({ workspace: currentWorkspace });
            }
            if (currentFolder) {
                workspaces.push({ folderUri: currentFolder });
            }
            // Add currently files to open to the beginning if any
            if (currentFiles) {
                for (let currentFile of currentFiles) {
                    const fileUri = currentFile.fileUri;
                    if (fileUri && indexOfFile(files, fileUri) === -1) {
                        files.push({ fileUri });
                    }
                }
            }
            this.addEntriesFromStorage(workspaces, files);
            return { workspaces, files };
        }
        addEntriesFromStorage(workspaces, files) {
            // Get from storage
            let recents = this.getRecentlyOpenedFromStorage();
            for (let recent of recents.workspaces) {
                let index = workspaces_1.isRecentFolder(recent) ? indexOfFolder(workspaces, recent.folderUri) : indexOfWorkspace(workspaces, recent.workspace);
                if (index >= 0) {
                    workspaces[index].label = workspaces[index].label || recent.label;
                }
                else {
                    workspaces.push(recent);
                }
            }
            for (let recent of recents.files) {
                let index = indexOfFile(files, recent.fileUri);
                if (index >= 0) {
                    files[index].label = files[index].label || recent.label;
                }
                else {
                    files.push(recent);
                }
            }
        }
        getRecentlyOpenedFromStorage() {
            const storedRecents = this.stateService.getItem(WorkspacesHistoryMainService.recentlyOpenedStorageKey);
            return workspaces_1.restoreRecentlyOpened(storedRecents, this.logService);
        }
        saveRecentlyOpened(recent) {
            const serialized = workspaces_1.toStoreData(recent);
            this.stateService.setItem(WorkspacesHistoryMainService.recentlyOpenedStorageKey, serialized);
        }
        updateWindowsJumpList() {
            if (!platform_1.isWindows) {
                return; // only on windows
            }
            const jumpList = [];
            // Tasks
            jumpList.push({
                type: 'tasks',
                items: [
                    {
                        type: 'task',
                        title: nls.localize('newWindow', "New Window"),
                        description: nls.localize('newWindowDesc', "Opens a new window"),
                        program: process.execPath,
                        args: '-n',
                        iconPath: process.execPath,
                        iconIndex: 0
                    }
                ]
            });
            // Recent Workspaces
            if (this.getRecentlyOpened().workspaces.length > 0) {
                // The user might have meanwhile removed items from the jump list and we have to respect that
                // so we need to update our list of recent paths with the choice of the user to not add them again
                // Also: Windows will not show our custom category at all if there is any entry which was removed
                // by the user! See https://github.com/Microsoft/vscode/issues/15052
                let toRemove = [];
                for (let item of electron_1.app.getJumpListSettings().removedItems) {
                    const args = item.args;
                    if (args) {
                        const match = /^--(folder|file)-uri\s+"([^"]+)"$/.exec(args);
                        if (match) {
                            toRemove.push(uri_1.URI.parse(match[2]));
                        }
                    }
                }
                this.removeFromRecentlyOpened(toRemove);
                // Add entries
                jumpList.push({
                    type: 'custom',
                    name: nls.localize('recentFolders', "Recent Workspaces"),
                    items: arrays.coalesce(this.getRecentlyOpened().workspaces.slice(0, 7 /* limit number of entries here */).map(recent => {
                        const workspace = workspaces_1.isRecentWorkspace(recent) ? recent.workspace : recent.folderUri;
                        const title = recent.label || label_1.getSimpleWorkspaceLabel(workspace, this.environmentService.untitledWorkspacesHome);
                        let description;
                        let args;
                        if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
                            description = nls.localize('folderDesc', "{0} {1}", labels_1.getBaseLabel(workspace), labels_1.getPathLabel(resources_1.dirname(workspace), this.environmentService));
                            args = `--folder-uri "${workspace.toString()}"`;
                        }
                        else {
                            description = nls.localize('workspaceDesc', "{0} {1}", labels_1.getBaseLabel(workspace.configPath), labels_1.getPathLabel(resources_1.dirname(workspace.configPath), this.environmentService));
                            args = `--file-uri "${workspace.configPath.toString()}"`;
                        }
                        return {
                            type: 'task',
                            title,
                            description,
                            program: process.execPath,
                            args,
                            iconPath: 'explorer.exe',
                            iconIndex: 0
                        };
                    }))
                });
            }
            // Recent
            jumpList.push({
                type: 'recent' // this enables to show files in the "recent" category
            });
            try {
                electron_1.app.setJumpList(jumpList);
            }
            catch (error) {
                this.logService.warn('#setJumpList', error); // since setJumpList is relatively new API, make sure to guard for errors
            }
        }
    };
    WorkspacesHistoryMainService.MAX_TOTAL_RECENT_ENTRIES = 100;
    WorkspacesHistoryMainService.MAX_MACOS_DOCK_RECENT_WORKSPACES = 7; // prefer more workspaces...
    WorkspacesHistoryMainService.MAX_MACOS_DOCK_RECENT_ENTRIES_TOTAL = 10; // ...compared to files
    // Exclude some very common files from the dock/taskbar
    WorkspacesHistoryMainService.COMMON_FILES_FILTER = [
        'COMMIT_EDITMSG',
        'MERGE_MSG'
    ];
    WorkspacesHistoryMainService.recentlyOpenedStorageKey = 'openedPathsList';
    WorkspacesHistoryMainService = __decorate([
        __param(0, state_1.IStateService),
        __param(1, log_1.ILogService),
        __param(2, workspacesMainService_1.IWorkspacesMainService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, lifecycleMainService_1.ILifecycleMainService)
    ], WorkspacesHistoryMainService);
    exports.WorkspacesHistoryMainService = WorkspacesHistoryMainService;
    function location(recent) {
        if (workspaces_1.isRecentFolder(recent)) {
            return recent.folderUri;
        }
        if (workspaces_1.isRecentFile(recent)) {
            return recent.fileUri;
        }
        return recent.workspace.configPath;
    }
    function indexOfWorkspace(arr, workspace) {
        return arrays.firstIndex(arr, w => workspaces_1.isRecentWorkspace(w) && w.workspace.id === workspace.id);
    }
    function indexOfFolder(arr, folderURI) {
        return arrays.firstIndex(arr, f => workspaces_1.isRecentFolder(f) && resources_1.isEqual(f.folderUri, folderURI));
    }
    function indexOfFile(arr, fileURI) {
        return arrays.firstIndex(arr, f => resources_1.isEqual(f.fileUri, fileURI));
    }
});
//# sourceMappingURL=workspacesHistoryMainService.js.map