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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/path", "vs/platform/environment/common/environment", "vs/base/common/uri", "vs/platform/electron/node/electron"], function (require, exports, nls, actions_1, path_1, environment_1, uri_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenLogsFolderAction = class OpenLogsFolderAction extends actions_1.Action {
        constructor(id, label, environmentService, electronService) {
            super(id, label);
            this.environmentService = environmentService;
            this.electronService = electronService;
        }
        run() {
            return this.electronService.showItemInFolder(uri_1.URI.file(path_1.join(this.environmentService.logsPath, 'main.log')).fsPath);
        }
    };
    OpenLogsFolderAction.ID = 'workbench.action.openLogsFolder';
    OpenLogsFolderAction.LABEL = nls.localize('openLogsFolder', "Open Logs Folder");
    OpenLogsFolderAction = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, electron_1.IElectronService)
    ], OpenLogsFolderAction);
    exports.OpenLogsFolderAction = OpenLogsFolderAction;
});
//# sourceMappingURL=logsActions.js.map