/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/electron-browser/logsActions"], function (require, exports, nls, platform_1, actions_1, actions_2, logsActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    const devCategory = nls.localize('developer', "Developer");
    workbenchActionsRegistry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(logsActions_1.OpenLogsFolderAction, logsActions_1.OpenLogsFolderAction.ID, logsActions_1.OpenLogsFolderAction.LABEL), 'Developer: Open Logs Folder', devCategory);
});
//# sourceMappingURL=logs.contribution.js.map