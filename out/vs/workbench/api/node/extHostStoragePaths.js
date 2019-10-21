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
define(["require", "exports", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/pfs", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/types"], function (require, exports, path, uri_1, pfs, extHostInitDataService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtensionStoragePaths = class ExtensionStoragePaths {
        constructor(initData) {
            this._workspace = types_1.withNullAsUndefined(initData.workspace);
            this._environment = initData.environment;
            this.whenReady = this._getOrCreateWorkspaceStoragePath().then(value => this._value = value);
        }
        workspaceValue(extension) {
            if (this._value) {
                return path.join(this._value, extension.identifier.value);
            }
            return undefined;
        }
        globalValue(extension) {
            return path.join(this._environment.globalStorageHome.fsPath, extension.identifier.value.toLowerCase());
        }
        async _getOrCreateWorkspaceStoragePath() {
            if (!this._workspace) {
                return Promise.resolve(undefined);
            }
            if (!this._environment.appSettingsHome) {
                return undefined;
            }
            const storageName = this._workspace.id;
            const storagePath = path.join(this._environment.appSettingsHome.fsPath, 'workspaceStorage', storageName);
            const exists = await pfs.dirExists(storagePath);
            if (exists) {
                return storagePath;
            }
            try {
                await pfs.mkdirp(storagePath);
                await pfs.writeFile(path.join(storagePath, 'meta.json'), JSON.stringify({
                    id: this._workspace.id,
                    configuration: this._workspace.configuration && uri_1.URI.revive(this._workspace.configuration).toString(),
                    name: this._workspace.name
                }, undefined, 2));
                return storagePath;
            }
            catch (e) {
                console.error(e);
                return undefined;
            }
        }
    };
    ExtensionStoragePaths = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtensionStoragePaths);
    exports.ExtensionStoragePaths = ExtensionStoragePaths;
});
//# sourceMappingURL=extHostStoragePaths.js.map