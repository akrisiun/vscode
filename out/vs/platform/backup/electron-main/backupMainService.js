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
define(["require", "exports", "fs", "crypto", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/common/arrays", "vs/platform/environment/common/environment", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/workspaces/common/workspaces", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/extpath", "vs/base/common/network"], function (require, exports, fs, crypto, path, platform, pfs_1, arrays, environment_1, configuration_1, files_1, log_1, workspaces_1, uri_1, resources_1, extpath_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BackupMainService = class BackupMainService {
        constructor(environmentService, configurationService, logService) {
            this.configurationService = configurationService;
            this.logService = logService;
            this.backupHome = environmentService.backupHome.fsPath;
            this.workspacesJsonPath = environmentService.backupWorkspacesPath;
        }
        async initialize() {
            let backups;
            try {
                backups = JSON.parse(await pfs_1.readFile(this.workspacesJsonPath, 'utf8')); // invalid JSON or permission issue can happen here
            }
            catch (error) {
                backups = Object.create(null);
            }
            // read empty workspaces backups first
            if (backups.emptyWorkspaceInfos) {
                this.emptyWorkspaces = await this.validateEmptyWorkspaces(backups.emptyWorkspaceInfos);
            }
            else if (Array.isArray(backups.emptyWorkspaces)) {
                // read legacy entries
                this.emptyWorkspaces = await this.validateEmptyWorkspaces(backups.emptyWorkspaces.map(backupFolder => ({ backupFolder })));
            }
            else {
                this.emptyWorkspaces = [];
            }
            // read workspace backups
            let rootWorkspaces = [];
            try {
                if (Array.isArray(backups.rootURIWorkspaces)) {
                    rootWorkspaces = backups.rootURIWorkspaces.map(f => ({ workspace: { id: f.id, configPath: uri_1.URI.parse(f.configURIPath) }, remoteAuthority: f.remoteAuthority }));
                }
                else if (Array.isArray(backups.rootWorkspaces)) {
                    rootWorkspaces = backups.rootWorkspaces.map(f => ({ workspace: { id: f.id, configPath: uri_1.URI.file(f.configPath) } }));
                }
            }
            catch (e) {
                // ignore URI parsing exceptions
            }
            this.rootWorkspaces = await this.validateWorkspaces(rootWorkspaces);
            // read folder backups
            let workspaceFolders = [];
            try {
                if (Array.isArray(backups.folderURIWorkspaces)) {
                    workspaceFolders = backups.folderURIWorkspaces.map(f => uri_1.URI.parse(f));
                }
                else if (Array.isArray(backups.folderWorkspaces)) {
                    // migrate legacy folder paths
                    workspaceFolders = [];
                    for (const folderPath of backups.folderWorkspaces) {
                        const oldFolderHash = this.getLegacyFolderHash(folderPath);
                        const folderUri = uri_1.URI.file(folderPath);
                        const newFolderHash = this.getFolderHash(folderUri);
                        if (newFolderHash !== oldFolderHash) {
                            await this.moveBackupFolder(this.getBackupPath(newFolderHash), this.getBackupPath(oldFolderHash));
                        }
                        workspaceFolders.push(folderUri);
                    }
                }
            }
            catch (e) {
                // ignore URI parsing exceptions
            }
            this.folderWorkspaces = await this.validateFolders(workspaceFolders);
            // save again in case some workspaces or folders have been removed
            await this.save();
        }
        getWorkspaceBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.rootWorkspaces.slice(0); // return a copy
        }
        getFolderBackupPaths() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.folderWorkspaces.slice(0); // return a copy
        }
        isHotExitEnabled() {
            return this.getHotExitConfig() !== files_1.HotExitConfiguration.OFF;
        }
        isHotExitOnExitAndWindowClose() {
            return this.getHotExitConfig() === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE;
        }
        getHotExitConfig() {
            const config = this.configurationService.getValue();
            return (config && config.files && config.files.hotExit) || files_1.HotExitConfiguration.ON_EXIT;
        }
        getEmptyWindowBackupPaths() {
            return this.emptyWorkspaces.slice(0); // return a copy
        }
        registerWorkspaceBackupSync(workspaceInfo, migrateFrom) {
            if (!this.rootWorkspaces.some(window => workspaceInfo.workspace.id === window.workspace.id)) {
                this.rootWorkspaces.push(workspaceInfo);
                this.saveSync();
            }
            const backupPath = this.getBackupPath(workspaceInfo.workspace.id);
            if (migrateFrom) {
                this.moveBackupFolderSync(backupPath, migrateFrom);
            }
            return backupPath;
        }
        moveBackupFolderSync(backupPath, moveFromPath) {
            // Target exists: make sure to convert existing backups to empty window backups
            if (fs.existsSync(backupPath)) {
                this.convertToEmptyWindowBackupSync(backupPath);
            }
            // When we have data to migrate from, move it over to the target location
            if (fs.existsSync(moveFromPath)) {
                try {
                    fs.renameSync(moveFromPath, backupPath);
                }
                catch (ex) {
                    this.logService.error(`Backup: Could not move backup folder to new location: ${ex.toString()}`);
                }
            }
        }
        async moveBackupFolder(backupPath, moveFromPath) {
            // Target exists: make sure to convert existing backups to empty window backups
            if (await pfs_1.exists(backupPath)) {
                await this.convertToEmptyWindowBackup(backupPath);
            }
            // When we have data to migrate from, move it over to the target location
            if (await pfs_1.exists(moveFromPath)) {
                try {
                    await pfs_1.rename(moveFromPath, backupPath);
                }
                catch (ex) {
                    this.logService.error(`Backup: Could not move backup folder to new location: ${ex.toString()}`);
                }
            }
        }
        unregisterWorkspaceBackupSync(workspace) {
            const id = workspace.id;
            let index = arrays.firstIndex(this.rootWorkspaces, w => w.workspace.id === id);
            if (index !== -1) {
                this.rootWorkspaces.splice(index, 1);
                this.saveSync();
            }
        }
        registerFolderBackupSync(folderUri) {
            if (!this.folderWorkspaces.some(uri => resources_1.isEqual(folderUri, uri))) {
                this.folderWorkspaces.push(folderUri);
                this.saveSync();
            }
            return this.getBackupPath(this.getFolderHash(folderUri));
        }
        unregisterFolderBackupSync(folderUri) {
            let index = arrays.firstIndex(this.folderWorkspaces, uri => resources_1.isEqual(folderUri, uri));
            if (index !== -1) {
                this.folderWorkspaces.splice(index, 1);
                this.saveSync();
            }
        }
        registerEmptyWindowBackupSync(backupFolder, remoteAuthority) {
            // Generate a new folder if this is a new empty workspace
            if (!backupFolder) {
                backupFolder = this.getRandomEmptyWindowId();
            }
            if (!this.emptyWorkspaces.some(window => !!window.backupFolder && extpath_1.isEqual(window.backupFolder, backupFolder, !platform.isLinux))) {
                this.emptyWorkspaces.push({ backupFolder, remoteAuthority });
                this.saveSync();
            }
            return this.getBackupPath(backupFolder);
        }
        unregisterEmptyWindowBackupSync(backupFolder) {
            let index = arrays.firstIndex(this.emptyWorkspaces, w => !!w.backupFolder && extpath_1.isEqual(w.backupFolder, backupFolder, !platform.isLinux));
            if (index !== -1) {
                this.emptyWorkspaces.splice(index, 1);
                this.saveSync();
            }
        }
        getBackupPath(oldFolderHash) {
            return path.join(this.backupHome, oldFolderHash);
        }
        async validateWorkspaces(rootWorkspaces) {
            if (!Array.isArray(rootWorkspaces)) {
                return [];
            }
            const seenIds = new Set();
            const result = [];
            // Validate Workspaces
            for (let workspaceInfo of rootWorkspaces) {
                const workspace = workspaceInfo.workspace;
                if (!workspaces_1.isWorkspaceIdentifier(workspace)) {
                    return []; // wrong format, skip all entries
                }
                if (!seenIds.has(workspace.id)) {
                    seenIds.add(workspace.id);
                    const backupPath = this.getBackupPath(workspace.id);
                    const hasBackups = await this.hasBackups(backupPath);
                    // If the workspace has no backups, ignore it
                    if (hasBackups) {
                        if (workspace.configPath.scheme !== network_1.Schemas.file || await pfs_1.exists(workspace.configPath.fsPath)) {
                            result.push(workspaceInfo);
                        }
                        else {
                            // If the workspace has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateFolders(folderWorkspaces) {
            if (!Array.isArray(folderWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            for (let folderURI of folderWorkspaces) {
                const key = resources_1.getComparisonKey(folderURI);
                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    const backupPath = this.getBackupPath(this.getFolderHash(folderURI));
                    const hasBackups = await this.hasBackups(backupPath);
                    // If the folder has no backups, ignore it
                    if (hasBackups) {
                        if (folderURI.scheme !== network_1.Schemas.file || await pfs_1.exists(folderURI.fsPath)) {
                            result.push(folderURI);
                        }
                        else {
                            // If the folder has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateEmptyWorkspaces(emptyWorkspaces) {
            if (!Array.isArray(emptyWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            // Validate Empty Windows
            for (let backupInfo of emptyWorkspaces) {
                const backupFolder = backupInfo.backupFolder;
                if (typeof backupFolder !== 'string') {
                    return [];
                }
                if (!seenIds.has(backupFolder)) {
                    seenIds.add(backupFolder);
                    const backupPath = this.getBackupPath(backupFolder);
                    if (await this.hasBackups(backupPath)) {
                        result.push(backupInfo);
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async deleteStaleBackup(backupPath) {
            try {
                if (await pfs_1.exists(backupPath)) {
                    await pfs_1.rimraf(backupPath, pfs_1.RimRafMode.MOVE);
                }
            }
            catch (ex) {
                this.logService.error(`Backup: Could not delete stale backup: ${ex.toString()}`);
            }
        }
        async convertToEmptyWindowBackup(backupPath) {
            // New empty window backup
            let newBackupFolder = this.getRandomEmptyWindowId();
            while (this.emptyWorkspaces.some(window => !!window.backupFolder && extpath_1.isEqual(window.backupFolder, newBackupFolder, platform.isLinux))) {
                newBackupFolder = this.getRandomEmptyWindowId();
            }
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = this.getBackupPath(newBackupFolder);
            try {
                await pfs_1.rename(backupPath, newEmptyWindowBackupPath);
            }
            catch (ex) {
                this.logService.error(`Backup: Could not rename backup folder: ${ex.toString()}`);
                return false;
            }
            this.emptyWorkspaces.push({ backupFolder: newBackupFolder });
            return true;
        }
        convertToEmptyWindowBackupSync(backupPath) {
            // New empty window backup
            let newBackupFolder = this.getRandomEmptyWindowId();
            while (this.emptyWorkspaces.some(window => !!window.backupFolder && extpath_1.isEqual(window.backupFolder, newBackupFolder, platform.isLinux))) {
                newBackupFolder = this.getRandomEmptyWindowId();
            }
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = this.getBackupPath(newBackupFolder);
            try {
                fs.renameSync(backupPath, newEmptyWindowBackupPath);
            }
            catch (ex) {
                this.logService.error(`Backup: Could not rename backup folder: ${ex.toString()}`);
                return false;
            }
            this.emptyWorkspaces.push({ backupFolder: newBackupFolder });
            return true;
        }
        async hasBackups(backupPath) {
            try {
                const backupSchemas = await pfs_1.readdir(backupPath);
                for (const backupSchema of backupSchemas) {
                    try {
                        const backupSchemaChildren = await pfs_1.readdir(path.join(backupPath, backupSchema));
                        if (backupSchemaChildren.length > 0) {
                            return true;
                        }
                    }
                    catch (error) {
                        // invalid folder
                    }
                }
            }
            catch (error) {
                // backup path does not exist
            }
            return false;
        }
        saveSync() {
            try {
                pfs_1.writeFileSync(this.workspacesJsonPath, JSON.stringify(this.serializeBackups()));
            }
            catch (ex) {
                this.logService.error(`Backup: Could not save workspaces.json: ${ex.toString()}`);
            }
        }
        async save() {
            try {
                await pfs_1.writeFile(this.workspacesJsonPath, JSON.stringify(this.serializeBackups()));
            }
            catch (ex) {
                this.logService.error(`Backup: Could not save workspaces.json: ${ex.toString()}`);
            }
        }
        serializeBackups() {
            return {
                rootURIWorkspaces: this.rootWorkspaces.map(f => ({ id: f.workspace.id, configURIPath: f.workspace.configPath.toString(), remoteAuthority: f.remoteAuthority })),
                folderURIWorkspaces: this.folderWorkspaces.map(f => f.toString()),
                emptyWorkspaceInfos: this.emptyWorkspaces,
                emptyWorkspaces: this.emptyWorkspaces.map(info => info.backupFolder)
            };
        }
        getRandomEmptyWindowId() {
            return (Date.now() + Math.round(Math.random() * 1000)).toString();
        }
        getFolderHash(folderUri) {
            let key;
            if (folderUri.scheme === network_1.Schemas.file) {
                // for backward compatibility, use the fspath as key
                key = platform.isLinux ? folderUri.fsPath : folderUri.fsPath.toLowerCase();
            }
            else {
                key = resources_1.hasToIgnoreCase(folderUri) ? folderUri.toString().toLowerCase() : folderUri.toString();
            }
            return crypto.createHash('md5').update(key).digest('hex');
        }
        getLegacyFolderHash(folderPath) {
            return crypto.createHash('md5').update(platform.isLinux ? folderPath : folderPath.toLowerCase()).digest('hex');
        }
    };
    BackupMainService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], BackupMainService);
    exports.BackupMainService = BackupMainService;
});
//# sourceMappingURL=backupMainService.js.map