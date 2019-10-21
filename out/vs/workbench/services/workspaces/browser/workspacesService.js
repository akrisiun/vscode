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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/workspaces/common/workspaces", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log", "vs/base/common/lifecycle"], function (require, exports, extensions_1, workspaces_1, event_1, storage_1, workspace_1, log_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserWorkspacesService = class BrowserWorkspacesService extends lifecycle_1.Disposable {
        constructor(storageService, workspaceService, logService) {
            super();
            this.storageService = storageService;
            this.workspaceService = workspaceService;
            this.logService = logService;
            this._onRecentlyOpenedChange = this._register(new event_1.Emitter());
            this.onRecentlyOpenedChange = this._onRecentlyOpenedChange.event;
            this.addWorkspaceToRecentlyOpened();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.storageService.onDidChangeStorage(event => {
                if (event.key === BrowserWorkspacesService.RECENTLY_OPENED_KEY && event.scope === 0 /* GLOBAL */) {
                    this._onRecentlyOpenedChange.fire();
                }
            }));
        }
        addWorkspaceToRecentlyOpened() {
            const workspace = this.workspaceService.getWorkspace();
            switch (this.workspaceService.getWorkbenchState()) {
                case 2 /* FOLDER */:
                    this.addRecentlyOpened([{ folderUri: workspace.folders[0].uri }]);
                    break;
                case 3 /* WORKSPACE */:
                    this.addRecentlyOpened([{ workspace: { id: workspace.id, configPath: workspace.configuration } }]);
                    break;
            }
        }
        //#region Workspaces History
        async getRecentlyOpened() {
            const recentlyOpenedRaw = this.storageService.get(BrowserWorkspacesService.RECENTLY_OPENED_KEY, 0 /* GLOBAL */);
            if (recentlyOpenedRaw) {
                return workspaces_1.restoreRecentlyOpened(JSON.parse(recentlyOpenedRaw), this.logService);
            }
            return { workspaces: [], files: [] };
        }
        async addRecentlyOpened(recents) {
            const recentlyOpened = await this.getRecentlyOpened();
            recents.forEach(recent => {
                if (workspaces_1.isRecentFile(recent)) {
                    this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.fileUri]);
                    recentlyOpened.files.unshift(recent);
                }
                else if (workspaces_1.isRecentFolder(recent)) {
                    this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.folderUri]);
                    recentlyOpened.workspaces.unshift(recent);
                }
                else {
                    this.doRemoveFromRecentlyOpened(recentlyOpened, [recent.workspace.configPath]);
                    recentlyOpened.workspaces.unshift(recent);
                }
            });
            return this.saveRecentlyOpened(recentlyOpened);
        }
        async removeFromRecentlyOpened(paths) {
            const recentlyOpened = await this.getRecentlyOpened();
            this.doRemoveFromRecentlyOpened(recentlyOpened, paths);
            return this.saveRecentlyOpened(recentlyOpened);
        }
        doRemoveFromRecentlyOpened(recentlyOpened, paths) {
            recentlyOpened.files = recentlyOpened.files.filter(file => {
                return !paths.some(path => path.toString() === file.fileUri.toString());
            });
            recentlyOpened.workspaces = recentlyOpened.workspaces.filter(workspace => {
                return !paths.some(path => path.toString() === (workspaces_1.isRecentFolder(workspace) ? workspace.folderUri.toString() : workspace.workspace.configPath.toString()));
            });
        }
        async saveRecentlyOpened(data) {
            return this.storageService.store(BrowserWorkspacesService.RECENTLY_OPENED_KEY, JSON.stringify(workspaces_1.toStoreData(data)), 0 /* GLOBAL */);
        }
        async clearRecentlyOpened() {
            this.storageService.remove(BrowserWorkspacesService.RECENTLY_OPENED_KEY, 0 /* GLOBAL */);
        }
        //#endregion
        //#region Workspace Management
        enterWorkspace(path) {
            throw new Error('Untitled workspaces are currently unsupported in Web');
        }
        createUntitledWorkspace(folders, remoteAuthority) {
            throw new Error('Untitled workspaces are currently unsupported in Web');
        }
        deleteUntitledWorkspace(workspace) {
            throw new Error('Untitled workspaces are currently unsupported in Web');
        }
        getWorkspaceIdentifier(workspacePath) {
            throw new Error('Untitled workspaces are currently unsupported in Web');
        }
    };
    BrowserWorkspacesService.RECENTLY_OPENED_KEY = 'recently.opened';
    BrowserWorkspacesService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, log_1.ILogService)
    ], BrowserWorkspacesService);
    exports.BrowserWorkspacesService = BrowserWorkspacesService;
    extensions_1.registerSingleton(workspaces_1.IWorkspacesService, BrowserWorkspacesService, true);
});
//# sourceMappingURL=workspacesService.js.map