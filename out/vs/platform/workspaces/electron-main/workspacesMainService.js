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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/platform/environment/common/environment", "vs/base/common/path", "vs/base/node/pfs", "fs", "vs/base/common/platform", "vs/base/common/event", "vs/platform/log/common/log", "crypto", "vs/base/common/json", "vs/platform/workspace/common/workspace", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/platform/product/common/product", "electron", "vs/base/common/types", "vs/platform/backup/electron-main/backup", "vs/platform/dialogs/electron-main/dialogs", "vs/platform/windows/node/window"], function (require, exports, workspaces_1, environment_1, path_1, pfs_1, fs_1, platform_1, event_1, log_1, crypto_1, json, workspace_1, network_1, lifecycle_1, resources_1, instantiation_1, nls_1, product_1, electron_1, types_1, backup_1, dialogs_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspacesMainService = instantiation_1.createDecorator('workspacesMainService');
    let WorkspacesMainService = class WorkspacesMainService extends lifecycle_1.Disposable {
        constructor(environmentService, logService, backupMainService, dialogMainService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.backupMainService = backupMainService;
            this.dialogMainService = dialogMainService;
            this._onUntitledWorkspaceDeleted = this._register(new event_1.Emitter());
            this.onUntitledWorkspaceDeleted = this._onUntitledWorkspaceDeleted.event;
            this._onWorkspaceEntered = this._register(new event_1.Emitter());
            this.onWorkspaceEntered = this._onWorkspaceEntered.event;
            this.untitledWorkspacesHome = environmentService.untitledWorkspacesHome;
        }
        resolveLocalWorkspaceSync(uri) {
            if (!this.isWorkspacePath(uri)) {
                return null; // does not look like a valid workspace config file
            }
            if (uri.scheme !== network_1.Schemas.file) {
                return null;
            }
            let contents;
            try {
                contents = fs_1.readFileSync(uri.fsPath, 'utf8');
            }
            catch (error) {
                return null; // invalid workspace
            }
            return this.doResolveWorkspace(uri, contents);
        }
        isWorkspacePath(uri) {
            return this.isInsideWorkspacesHome(uri) || workspaces_1.hasWorkspaceFileExtension(uri);
        }
        doResolveWorkspace(path, contents) {
            try {
                const workspace = this.doParseStoredWorkspace(path, contents);
                const workspaceIdentifier = getWorkspaceIdentifier(path);
                return {
                    id: workspaceIdentifier.id,
                    configPath: workspaceIdentifier.configPath,
                    folders: workspace_1.toWorkspaceFolders(workspace.folders, workspaceIdentifier.configPath),
                    remoteAuthority: workspace.remoteAuthority
                };
            }
            catch (error) {
                this.logService.warn(error.toString());
            }
            return null;
        }
        doParseStoredWorkspace(path, contents) {
            // Parse workspace file
            let storedWorkspace = json.parse(contents); // use fault tolerant parser
            // Filter out folders which do not have a path or uri set
            if (Array.isArray(storedWorkspace.folders)) {
                storedWorkspace.folders = storedWorkspace.folders.filter(folder => workspaces_1.isStoredWorkspaceFolder(folder));
            }
            // Validate
            if (!Array.isArray(storedWorkspace.folders)) {
                throw new Error(`${path.toString()} looks like an invalid workspace file.`);
            }
            return storedWorkspace;
        }
        isInsideWorkspacesHome(path) {
            return resources_1.isEqualOrParent(path, this.environmentService.untitledWorkspacesHome);
        }
        async createUntitledWorkspace(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            await pfs_1.mkdirp(path_1.dirname(configPath));
            await pfs_1.writeFile(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            return workspace;
        }
        createUntitledWorkspaceSync(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            const configPathDir = path_1.dirname(configPath);
            if (!fs_1.existsSync(configPathDir)) {
                const configPathDirDir = path_1.dirname(configPathDir);
                if (!fs_1.existsSync(configPathDirDir)) {
                    fs_1.mkdirSync(configPathDirDir);
                }
                fs_1.mkdirSync(configPathDir);
            }
            pfs_1.writeFileSync(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            return workspace;
        }
        newUntitledWorkspace(folders = [], remoteAuthority) {
            const randomId = (Date.now() + Math.round(Math.random() * 1000)).toString();
            const untitledWorkspaceConfigFolder = resources_1.joinPath(this.untitledWorkspacesHome, randomId);
            const untitledWorkspaceConfigPath = resources_1.joinPath(untitledWorkspaceConfigFolder, workspaces_1.UNTITLED_WORKSPACE_NAME);
            const storedWorkspaceFolder = [];
            for (const folder of folders) {
                storedWorkspaceFolder.push(workspaces_1.getStoredWorkspaceFolder(folder.uri, folder.name, untitledWorkspaceConfigFolder));
            }
            return {
                workspace: getWorkspaceIdentifier(untitledWorkspaceConfigPath),
                storedWorkspace: { folders: storedWorkspaceFolder, remoteAuthority }
            };
        }
        getWorkspaceIdentifier(configPath) {
            return Promise.resolve(getWorkspaceIdentifier(configPath));
        }
        isUntitledWorkspace(workspace) {
            return this.isInsideWorkspacesHome(workspace.configPath);
        }
        deleteUntitledWorkspaceSync(workspace) {
            if (!this.isUntitledWorkspace(workspace)) {
                return; // only supported for untitled workspaces
            }
            // Delete from disk
            this.doDeleteUntitledWorkspaceSync(workspace);
            // Event
            this._onUntitledWorkspaceDeleted.fire(workspace);
        }
        deleteUntitledWorkspace(workspace) {
            this.deleteUntitledWorkspaceSync(workspace);
            return Promise.resolve();
        }
        doDeleteUntitledWorkspaceSync(workspace) {
            const configPath = resources_1.originalFSPath(workspace.configPath);
            try {
                // Delete Workspace
                pfs_1.rimrafSync(path_1.dirname(configPath));
                // Mark Workspace Storage to be deleted
                const workspaceStoragePath = path_1.join(this.environmentService.workspaceStorageHome, workspace.id);
                if (fs_1.existsSync(workspaceStoragePath)) {
                    pfs_1.writeFileSync(path_1.join(workspaceStoragePath, 'obsolete'), '');
                }
            }
            catch (error) {
                this.logService.warn(`Unable to delete untitled workspace ${configPath} (${error}).`);
            }
        }
        getUntitledWorkspacesSync() {
            let untitledWorkspaces = [];
            try {
                const untitledWorkspacePaths = pfs_1.readdirSync(this.untitledWorkspacesHome.fsPath).map(folder => resources_1.joinPath(this.untitledWorkspacesHome, folder, workspaces_1.UNTITLED_WORKSPACE_NAME));
                for (const untitledWorkspacePath of untitledWorkspacePaths) {
                    const workspace = getWorkspaceIdentifier(untitledWorkspacePath);
                    const resolvedWorkspace = this.resolveLocalWorkspaceSync(untitledWorkspacePath);
                    if (!resolvedWorkspace) {
                        this.doDeleteUntitledWorkspaceSync(workspace);
                    }
                    else {
                        untitledWorkspaces.push({ workspace, remoteAuthority: resolvedWorkspace.remoteAuthority });
                    }
                }
            }
            catch (error) {
                if (error && error.code !== 'ENOENT') {
                    this.logService.warn(`Unable to read folders in ${this.untitledWorkspacesHome} (${error}).`);
                }
            }
            return untitledWorkspaces;
        }
        async enterWorkspace(window, windows, path) {
            if (!window || !window.win || !window.isReady) {
                return null; // return early if the window is not ready or disposed
            }
            const isValid = await this.isValidTargetWorkspacePath(window, windows, path);
            if (!isValid) {
                return null; // return early if the workspace is not valid
            }
            const result = this.doEnterWorkspace(window, getWorkspaceIdentifier(path));
            // Emit as event
            this._onWorkspaceEntered.fire({ window, workspace: result.workspace });
            return result;
        }
        async isValidTargetWorkspacePath(window, windows, path) {
            if (!path) {
                return true;
            }
            if (window.openedWorkspace && resources_1.isEqual(window.openedWorkspace.configPath, path)) {
                return false; // window is already opened on a workspace with that path
            }
            // Prevent overwriting a workspace that is currently opened in another window
            if (window_1.findWindowOnWorkspace(windows, getWorkspaceIdentifier(path))) {
                const options = {
                    title: product_1.default.nameLong,
                    type: 'info',
                    buttons: [nls_1.localize('ok', "OK")],
                    message: nls_1.localize('workspaceOpenedMessage', "Unable to save workspace '{0}'", resources_1.basename(path)),
                    detail: nls_1.localize('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again."),
                    noLink: true
                };
                await this.dialogMainService.showMessageBox(options, types_1.withNullAsUndefined(electron_1.BrowserWindow.getFocusedWindow()));
                return false;
            }
            return true; // OK
        }
        doEnterWorkspace(window, workspace) {
            window.focus();
            // Register window for backups and migrate current backups over
            let backupPath;
            if (!window.config.extensionDevelopmentPath) {
                backupPath = this.backupMainService.registerWorkspaceBackupSync({ workspace, remoteAuthority: window.remoteAuthority }, window.config.backupPath);
            }
            // if the window was opened on an untitled workspace, delete it.
            if (window.openedWorkspace && this.isUntitledWorkspace(window.openedWorkspace)) {
                this.deleteUntitledWorkspaceSync(window.openedWorkspace);
            }
            // Update window configuration properly based on transition to workspace
            window.config.folderUri = undefined;
            window.config.workspace = workspace;
            window.config.backupPath = backupPath;
            return { workspace, backupPath };
        }
    };
    WorkspacesMainService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, backup_1.IBackupMainService),
        __param(3, dialogs_1.IDialogMainService)
    ], WorkspacesMainService);
    exports.WorkspacesMainService = WorkspacesMainService;
    function getWorkspaceId(configPath) {
        let workspaceConfigPath = configPath.scheme === network_1.Schemas.file ? resources_1.originalFSPath(configPath) : configPath.toString();
        if (!platform_1.isLinux) {
            workspaceConfigPath = workspaceConfigPath.toLowerCase(); // sanitize for platform file system
        }
        return crypto_1.createHash('md5').update(workspaceConfigPath).digest('hex');
    }
    function getWorkspaceIdentifier(configPath) {
        return {
            configPath,
            id: getWorkspaceId(configPath)
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
});
//# sourceMappingURL=workspacesMainService.js.map