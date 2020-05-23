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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/environment/common/environmentService", "vs/platform/electron/node/electron", "vs/base/common/network"], function (require, exports, nls_1, actions_1, files_1, uri_1, environmentService_1, electron_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenExtensionsFolderAction = void 0;
    let OpenExtensionsFolderAction = /** @class */ (() => {
        let OpenExtensionsFolderAction = class OpenExtensionsFolderAction extends actions_1.Action {
            constructor(id, label, electronService, fileService, environmentService) {
                super(id, label, undefined, true);
                this.electronService = electronService;
                this.fileService = fileService;
                this.environmentService = environmentService;
            }
            async run() {
                if (this.environmentService.extensionsPath) {
                    const extensionsHome = uri_1.URI.file(this.environmentService.extensionsPath);
                    const file = await this.fileService.resolve(extensionsHome);
                    let itemToShow;
                    if (file.children && file.children.length > 0) {
                        itemToShow = file.children[0].resource;
                    }
                    else {
                        itemToShow = extensionsHome;
                    }
                    if (itemToShow.scheme === network_1.Schemas.file) {
                        return this.electronService.showItemInFolder(itemToShow.fsPath);
                    }
                }
            }
        };
        OpenExtensionsFolderAction.ID = 'workbench.extensions.action.openExtensionsFolder';
        OpenExtensionsFolderAction.LABEL = nls_1.localize('openExtensionsFolder', "Open Extensions Folder");
        OpenExtensionsFolderAction = __decorate([
            __param(2, electron_1.IElectronService),
            __param(3, files_1.IFileService),
            __param(4, environmentService_1.IWorkbenchEnvironmentService)
        ], OpenExtensionsFolderAction);
        return OpenExtensionsFolderAction;
    })();
    exports.OpenExtensionsFolderAction = OpenExtensionsFolderAction;
});
//# sourceMappingURL=extensionsActions.js.map