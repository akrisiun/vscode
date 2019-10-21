/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/network"], function (require, exports, nls, async_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Commands
    function revealResourcesInOS(resources, electronService, notificationService, workspaceContextService) {
        if (resources.length) {
            async_1.sequence(resources.map(r => async () => {
                if (r.scheme === network_1.Schemas.file) {
                    electronService.showItemInFolder(r.fsPath);
                }
            }));
        }
        else if (workspaceContextService.getWorkspace().folders.length) {
            const uri = workspaceContextService.getWorkspace().folders[0].uri;
            if (uri.scheme === network_1.Schemas.file) {
                electronService.showItemInFolder(uri.fsPath);
            }
        }
        else {
            notificationService.info(nls.localize('openFileToReveal', "Open a file first to reveal"));
        }
    }
    exports.revealResourcesInOS = revealResourcesInOS;
});
//# sourceMappingURL=fileCommands.js.map