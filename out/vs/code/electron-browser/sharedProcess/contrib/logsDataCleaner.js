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
    let LogsDataCleaner = class LogsDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService) {
            super();
            this.environmentService = environmentService;
            this.cleanUpOldLogsSoon();
        }
        cleanUpOldLogsSoon() {
            let handle = setTimeout(() => {
                handle = undefined;
                const currentLog = path_1.basename(this.environmentService.logsPath);
                const logsRoot = path_1.dirname(this.environmentService.logsPath);
                pfs_1.readdir(logsRoot).then(children => {
                    const allSessions = children.filter(name => /^\d{8}T\d{6}$/.test(name));
                    const oldSessions = allSessions.sort().filter((d, i) => d !== currentLog);
                    const toDelete = oldSessions.slice(0, Math.max(0, oldSessions.length - 9));
                    return Promise.all(toDelete.map(name => pfs_1.rimraf(path_1.join(logsRoot, name))));
                }).then(null, errors_1.onUnexpectedError);
            }, 10 * 1000);
            this._register(lifecycle_1.toDisposable(() => {
                if (handle) {
                    clearTimeout(handle);
                    handle = undefined;
                }
            }));
        }
    };
    LogsDataCleaner = __decorate([
        __param(0, environment_1.IEnvironmentService)
    ], LogsDataCleaner);
    exports.LogsDataCleaner = LogsDataCleaner;
});
//# sourceMappingURL=logsDataCleaner.js.map