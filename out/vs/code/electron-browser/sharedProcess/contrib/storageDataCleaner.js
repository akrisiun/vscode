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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/errors", "vs/base/common/lifecycle"], function (require, exports, environment_1, path_1, pfs_1, errors_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let StorageDataCleaner = class StorageDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService) {
            super();
            this.environmentService = environmentService;
            this.cleanUpStorageSoon();
        }
        cleanUpStorageSoon() {
            let handle = setTimeout(() => {
                handle = undefined;
                // Leverage the backup workspace file to find out which empty workspace is currently in use to
                // determine which empty workspace storage can safely be deleted
                pfs_1.readFile(this.environmentService.backupWorkspacesPath, 'utf8').then(contents => {
                    const workspaces = JSON.parse(contents);
                    const emptyWorkspaces = workspaces.emptyWorkspaceInfos.map(info => info.backupFolder);
                    // Read all workspace storage folders that exist
                    return pfs_1.readdir(this.environmentService.workspaceStorageHome).then(storageFolders => {
                        const deletes = [];
                        storageFolders.forEach(storageFolder => {
                            if (storageFolder.length === StorageDataCleaner.NON_EMPTY_WORKSPACE_ID_LENGTH) {
                                return;
                            }
                            if (emptyWorkspaces.indexOf(storageFolder) === -1) {
                                deletes.push(pfs_1.rimraf(path_1.join(this.environmentService.workspaceStorageHome, storageFolder)));
                            }
                        });
                        return Promise.all(deletes);
                    });
                }).then(null, errors_1.onUnexpectedError);
            }, 30 * 1000);
            this._register(lifecycle_1.toDisposable(() => {
                if (handle) {
                    clearTimeout(handle);
                    handle = undefined;
                }
            }));
        }
    };
    // Workspace/Folder storage names are MD5 hashes (128bits / 4 due to hex presentation)
    StorageDataCleaner.NON_EMPTY_WORKSPACE_ID_LENGTH = 128 / 4;
    StorageDataCleaner = __decorate([
        __param(0, environment_1.IEnvironmentService)
    ], StorageDataCleaner);
    exports.StorageDataCleaner = StorageDataCleaner;
});
//# sourceMappingURL=storageDataCleaner.js.map