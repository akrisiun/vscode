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
define(["require", "exports", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/backup/common/backup", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/dialogs/common/dialogs", "vs/platform/configuration/common/configuration", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/instantiation/common/extensions"], function (require, exports, workspace_1, jsonEditing_1, workspaces_1, storage_1, extensions_1, backup_1, commands_1, notification_1, files_1, environmentService_1, dialogs_1, configuration_1, textfiles_1, host_1, abstractWorkspaceEditingService_1, workspaceEditing_1, extensions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserWorkspaceEditingService = class BrowserWorkspaceEditingService extends abstractWorkspaceEditingService_1.AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, configurationService, storageService, extensionService, backupFileService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService) {
            super(jsonEditingService, contextService, configurationService, storageService, extensionService, backupFileService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService);
        }
    };
    BrowserWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, extensions_1.IExtensionService),
        __param(5, backup_1.IBackupFileService),
        __param(6, notification_1.INotificationService),
        __param(7, commands_1.ICommandService),
        __param(8, files_1.IFileService),
        __param(9, textfiles_1.ITextFileService),
        __param(10, workspaces_1.IWorkspacesService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, dialogs_1.IFileDialogService),
        __param(13, dialogs_1.IDialogService),
        __param(14, host_1.IHostService)
    ], BrowserWorkspaceEditingService);
    exports.BrowserWorkspaceEditingService = BrowserWorkspaceEditingService;
    extensions_2.registerSingleton(workspaceEditing_1.IWorkspaceEditingService, BrowserWorkspaceEditingService, true);
});
//# sourceMappingURL=workspaceEditingService.js.map