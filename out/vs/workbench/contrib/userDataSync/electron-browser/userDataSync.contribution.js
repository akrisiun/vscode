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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/registry/common/platform", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/userDataSync/common/userDataSyncIpc", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/electron/node/electron"], function (require, exports, contributions_1, userDataSync_1, platform_1, sharedProcessService_1, userDataSyncIpc_1, actions_1, nls_1, environment_1, files_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncServicesContribution = /** @class */ (() => {
        let UserDataSyncServicesContribution = class UserDataSyncServicesContribution {
            constructor(userDataSyncUtilService, sharedProcessService) {
                sharedProcessService.registerChannel('userDataSyncUtil', new userDataSyncIpc_1.UserDataSycnUtilServiceChannel(userDataSyncUtilService));
            }
        };
        UserDataSyncServicesContribution = __decorate([
            __param(0, userDataSync_1.IUserDataSyncUtilService),
            __param(1, sharedProcessService_1.ISharedProcessService)
        ], UserDataSyncServicesContribution);
        return UserDataSyncServicesContribution;
    })();
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(UserDataSyncServicesContribution, 1 /* Starting */);
    actions_1.registerAction2(class OpenSyncBackupsFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.userData.actions.openSyncBackupsFolder',
                title: { value: nls_1.localize('Open Backup folder', "Open Local Backups Folder"), original: 'Open Local Backups Folder' },
                category: { value: nls_1.localize('sync preferences', "Preferences Sync"), original: `Preferences Sync` },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */),
                }
            });
        }
        async run(accessor) {
            const syncHome = accessor.get(environment_1.IEnvironmentService).userDataSyncHome;
            const electronService = accessor.get(electron_1.IElectronService);
            const folderStat = await accessor.get(files_1.IFileService).resolve(syncHome);
            const item = folderStat.children && folderStat.children[0] ? folderStat.children[0].resource : syncHome;
            return electronService.showItemInFolder(item.fsPath);
        }
    });
});
//# sourceMappingURL=userDataSync.contribution.js.map