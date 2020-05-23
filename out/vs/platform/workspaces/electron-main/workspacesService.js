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
define(["require", "exports", "vs/platform/workspaces/electron-main/workspacesMainService", "vs/platform/windows/electron-main/windows", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/backup/electron-main/backup"], function (require, exports, workspacesMainService_1, windows_1, workspacesHistoryMainService_1, backup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesService = void 0;
    let WorkspacesService = /** @class */ (() => {
        let WorkspacesService = class WorkspacesService {
            constructor(workspacesMainService, windowsMainService, workspacesHistoryMainService, backupMainService) {
                this.workspacesMainService = workspacesMainService;
                this.windowsMainService = windowsMainService;
                this.workspacesHistoryMainService = workspacesHistoryMainService;
                this.backupMainService = backupMainService;
                //#endregion
                //#region Workspaces History
                this.onRecentlyOpenedChange = this.workspacesHistoryMainService.onRecentlyOpenedChange;
            }
            //#region Workspace Management
            async enterWorkspace(windowId, path) {
                const window = this.windowsMainService.getWindowById(windowId);
                if (window) {
                    return this.workspacesMainService.enterWorkspace(window, this.windowsMainService.getWindows(), path);
                }
                return null;
            }
            createUntitledWorkspace(windowId, folders, remoteAuthority) {
                return this.workspacesMainService.createUntitledWorkspace(folders, remoteAuthority);
            }
            deleteUntitledWorkspace(windowId, workspace) {
                return this.workspacesMainService.deleteUntitledWorkspace(workspace);
            }
            getWorkspaceIdentifier(windowId, workspacePath) {
                return this.workspacesMainService.getWorkspaceIdentifier(workspacePath);
            }
            async getRecentlyOpened(windowId) {
                return this.workspacesHistoryMainService.getRecentlyOpened(this.windowsMainService.getWindowById(windowId));
            }
            async addRecentlyOpened(windowId, recents) {
                return this.workspacesHistoryMainService.addRecentlyOpened(recents);
            }
            async removeRecentlyOpened(windowId, paths) {
                return this.workspacesHistoryMainService.removeRecentlyOpened(paths);
            }
            async clearRecentlyOpened(windowId) {
                return this.workspacesHistoryMainService.clearRecentlyOpened();
            }
            //#endregion
            //#region Dirty Workspaces
            async getDirtyWorkspaces() {
                return this.backupMainService.getDirtyWorkspaces();
            }
        };
        WorkspacesService = __decorate([
            __param(0, workspacesMainService_1.IWorkspacesMainService),
            __param(1, windows_1.IWindowsMainService),
            __param(2, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
            __param(3, backup_1.IBackupMainService)
        ], WorkspacesService);
        return WorkspacesService;
    })();
    exports.WorkspacesService = WorkspacesService;
});
//# sourceMappingURL=workspacesService.js.map