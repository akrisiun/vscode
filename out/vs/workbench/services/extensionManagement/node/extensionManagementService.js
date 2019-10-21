/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/uuid", "vs/platform/extensionManagement/common/extensionManagement", "vs/base/common/uri", "vs/workbench/services/extensionManagement/common/extensionManagementService", "vs/platform/instantiation/common/extensions", "vs/base/common/network", "vs/base/common/path"], function (require, exports, os_1, uuid_1, extensionManagement_1, uri_1, extensionManagementService_1, extensions_1, network_1, path) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionManagementService extends extensionManagementService_1.ExtensionManagementService {
        async installVSIX(vsix, server) {
            if (vsix.scheme === network_1.Schemas.vscodeRemote && server === this.extensionManagementServerService.localExtensionManagementServer) {
                const downloadedLocation = uri_1.URI.file(path.join(os_1.tmpdir(), uuid_1.generateUuid()));
                await this.downloadService.download(vsix, downloadedLocation);
                vsix = downloadedLocation;
            }
            return server.extensionManagementService.install(vsix);
        }
    }
    exports.ExtensionManagementService = ExtensionManagementService;
    extensions_1.registerSingleton(extensionManagement_1.IExtensionManagementService, ExtensionManagementService);
});
//# sourceMappingURL=extensionManagementService.js.map