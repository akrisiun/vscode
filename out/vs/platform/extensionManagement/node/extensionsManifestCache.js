/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/platform/extensions/common/extensions", "vs/base/node/pfs"], function (require, exports, lifecycle_1, path_1, extensions_1, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionsManifestCache extends lifecycle_1.Disposable {
        constructor(environmentService, extensionsManagementService) {
            super();
            this.environmentService = environmentService;
            this.extensionsManifestCache = path_1.join(this.environmentService.userDataPath, extensions_1.MANIFEST_CACHE_FOLDER, extensions_1.USER_MANIFEST_CACHE_FILE);
            this._register(extensionsManagementService.onDidInstallExtension(e => this.onDidInstallExtension(e)));
            this._register(extensionsManagementService.onDidUninstallExtension(e => this.onDidUnInstallExtension(e)));
        }
        onDidInstallExtension(e) {
            if (!e.error) {
                this.invalidate();
            }
        }
        onDidUnInstallExtension(e) {
            if (!e.error) {
                this.invalidate();
            }
        }
        invalidate() {
            pfs.rimraf(this.extensionsManifestCache, pfs.RimRafMode.MOVE).then(() => { }, () => { });
        }
    }
    exports.ExtensionsManifestCache = ExtensionsManifestCache;
});
//# sourceMappingURL=extensionsManifestCache.js.map