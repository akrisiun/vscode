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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/registry/common/platform", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/userDataSync/common/settingsSyncIpc"], function (require, exports, contributions_1, userDataSync_1, platform_1, sharedProcessService_1, settingsSyncIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncServicesContribution = class UserDataSyncServicesContribution {
        constructor(settingsMergeService, sharedProcessService) {
            sharedProcessService.registerChannel('settingsMerge', new settingsSyncIpc_1.SettingsMergeChannel(settingsMergeService));
        }
    };
    UserDataSyncServicesContribution = __decorate([
        __param(0, userDataSync_1.ISettingsMergeService),
        __param(1, sharedProcessService_1.ISharedProcessService)
    ], UserDataSyncServicesContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(UserDataSyncServicesContribution, 1 /* Starting */);
});
//# sourceMappingURL=userDataSync.contribution.js.map