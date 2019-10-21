/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/base/common/resources"], function (require, exports, uri_1, instantiation_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IBackupFileService = instantiation_1.createDecorator('backupFileService');
    function toBackupWorkspaceResource(backupWorkspacePath, environmentService) {
        return resources_1.joinPath(environmentService.userRoamingDataHome, resources_1.relativePath(uri_1.URI.file(environmentService.userDataPath), uri_1.URI.file(backupWorkspacePath)));
    }
    exports.toBackupWorkspaceResource = toBackupWorkspaceResource;
});
//# sourceMappingURL=backup.js.map