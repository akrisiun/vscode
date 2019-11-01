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
define(["require", "exports", "vs/nls", "vs/base/common/network", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteHosts", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/extensions/electron-browser/remoteExtensionManagementIpc", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/label/common/label"], function (require, exports, nls_1, network_1, extensionManagement_1, extensionManagement_2, extensionManagementIpc_1, remoteAgentService_1, remoteHosts_1, sharedProcessService_1, extensions_1, log_1, remoteExtensionManagementIpc_1, configuration_1, productService_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const localExtensionManagementServerAuthority = 'vscode-local';
    let ExtensionManagementServerService = class ExtensionManagementServerService {
        constructor(sharedProcessService, remoteAgentService, galleryService, configurationService, productService, logService, labelService) {
            this.remoteExtensionManagementServer = null;
            this.isSingleServer = false;
            const localExtensionManagementService = new extensionManagementIpc_1.ExtensionManagementChannelClient(sharedProcessService.getChannel('extensions'));
            this.localExtensionManagementServer = { extensionManagementService: localExtensionManagementService, authority: localExtensionManagementServerAuthority, label: nls_1.localize('local', "Local") };
            const remoteAgentConnection = remoteAgentService.getConnection();
            if (remoteAgentConnection) {
                const extensionManagementService = new remoteExtensionManagementIpc_1.RemoteExtensionManagementChannelClient(remoteAgentConnection.getChannel('extensions'), this.localExtensionManagementServer.extensionManagementService, galleryService, logService, configurationService, productService);
                this.remoteExtensionManagementServer = {
                    authority: remoteAgentConnection.remoteAuthority, extensionManagementService,
                    get label() { return labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, remoteAgentConnection.remoteAuthority) || nls_1.localize('remote', "Remote"); }
                };
            }
        }
        getExtensionManagementServer(location) {
            if (location.scheme === network_1.Schemas.file) {
                return this.localExtensionManagementServer;
            }
            if (location.scheme === remoteHosts_1.REMOTE_HOST_SCHEME) {
                return this.remoteExtensionManagementServer;
            }
            return null;
        }
    };
    ExtensionManagementServerService = __decorate([
        __param(0, sharedProcessService_1.ISharedProcessService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, productService_1.IProductService),
        __param(5, log_1.ILogService),
        __param(6, label_1.ILabelService)
    ], ExtensionManagementServerService);
    exports.ExtensionManagementServerService = ExtensionManagementServerService;
    extensions_1.registerSingleton(extensionManagement_2.IExtensionManagementServerService, ExtensionManagementServerService);
});
//# sourceMappingURL=extensionManagementServerService.js.map