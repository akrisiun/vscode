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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionTipsService", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/platform/log/common/log", "vs/base/common/network"], function (require, exports, extensions_1, sharedProcessService_1, extensionManagement_1, extensionTipsService_1, files_1, productService_1, request_1, log_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeExtensionTipsService = /** @class */ (() => {
        let NativeExtensionTipsService = class NativeExtensionTipsService extends extensionTipsService_1.ExtensionTipsService {
            constructor(fileService, productService, requestService, logService, sharedProcessService) {
                super(fileService, productService, requestService, logService);
                this.channel = sharedProcessService.getChannel('extensionTipsService');
            }
            getConfigBasedTips(folder) {
                if (folder.scheme === network_1.Schemas.file) {
                    return this.channel.call('getConfigBasedTips', [folder]);
                }
                return super.getConfigBasedTips(folder);
            }
            getImportantExecutableBasedTips() {
                return this.channel.call('getImportantExecutableBasedTips');
            }
            getOtherExecutableBasedTips() {
                return this.channel.call('getOtherExecutableBasedTips');
            }
            getAllWorkspacesTips() {
                return this.channel.call('getAllWorkspacesTips');
            }
        };
        NativeExtensionTipsService = __decorate([
            __param(0, files_1.IFileService),
            __param(1, productService_1.IProductService),
            __param(2, request_1.IRequestService),
            __param(3, log_1.ILogService),
            __param(4, sharedProcessService_1.ISharedProcessService)
        ], NativeExtensionTipsService);
        return NativeExtensionTipsService;
    })();
    extensions_1.registerSingleton(extensionManagement_1.IExtensionTipsService, NativeExtensionTipsService);
});
//# sourceMappingURL=extensionTipsService.js.map