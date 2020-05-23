/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/userDataSync/browser/userDataSync", "vs/workbench/contrib/userDataSync/browser/userDataSyncView"], function (require, exports, contributions_1, platform_1, userDataSync_1, userDataSyncView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(userDataSync_1.UserDataSyncWorkbenchContribution, 2 /* Ready */);
    workbenchRegistry.registerWorkbenchContribution(userDataSyncView_1.UserDataSyncViewContribution, 2 /* Ready */);
});
//# sourceMappingURL=userDataSync.contribution.js.map