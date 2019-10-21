/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/backup/common/backupFileService", "vs/base/common/network", "crypto", "vs/platform/instantiation/common/extensions", "vs/workbench/services/backup/common/backup"], function (require, exports, backupFileService_1, network_1, crypto, extensions_1, backup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BackupFileService extends backupFileService_1.BackupFileService {
        hashPath(resource) {
            return hashPath(resource);
        }
    }
    exports.BackupFileService = BackupFileService;
    /*
     * Exported only for testing
     */
    function hashPath(resource) {
        const str = resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.untitled ? resource.fsPath : resource.toString();
        return crypto.createHash('md5').update(str).digest('hex');
    }
    exports.hashPath = hashPath;
    extensions_1.registerSingleton(backup_1.IBackupFileService, BackupFileService);
});
//# sourceMappingURL=backupFileService.js.map