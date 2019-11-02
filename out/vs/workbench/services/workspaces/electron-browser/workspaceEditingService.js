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
define(["require", "exports", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/platform/workspaces/common/workspaces", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/backup/common/backup", "vs/workbench/services/backup/electron-browser/backup", "vs/platform/commands/common/commands", "vs/base/common/resources", "vs/platform/notification/common/notification", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/platform/lifecycle/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/workspaces/browser/abstractWorkspaceEditingService", "vs/platform/electron/node/electron", "vs/base/common/platform", "vs/base/common/labels", "vs/workbench/services/backup/common/backupFileService"], function (require, exports, workspaceEditing_1, nls, workspace_1, jsonEditing_1, workspaces_1, storage_1, extensions_1, backup_1, backup_2, commands_1, resources_1, notification_1, files_1, environmentService_1, lifecycle_1, dialogs_1, configuration_1, extensions_2, label_1, textfiles_1, host_1, abstractWorkspaceEditingService_1, electron_1, platform_1, labels_1, backupFileService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeWorkspaceEditingService = class NativeWorkspaceEditingService extends abstractWorkspaceEditingService_1.AbstractWorkspaceEditingService {
        constructor(jsonEditingService, contextService, electronService, configurationService, storageService, extensionService, backupFileService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, lifecycleService, labelService, hostService) {
            super(jsonEditingService, contextService, configurationService, notificationService, commandService, fileService, textFileService, workspacesService, environmentService, fileDialogService, dialogService, hostService);
            this.electronService = electronService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.backupFileService = backupFileService;
            this.dialogService = dialogService;
            this.lifecycleService = lifecycleService;
            this.labelService = labelService;
            this.registerListeners();
        }
        registerListeners() {
            this.lifecycleService.onBeforeShutdown(e => {
                const saveOperation = this.saveUntitedBeforeShutdown(e.reason);
                if (saveOperation) {
                    e.veto(saveOperation);
                }
            });
        }
        async saveUntitedBeforeShutdown(reason) {
            if (reason !== 4 /* LOAD */ && reason !== 1 /* CLOSE */) {
                return false; // only interested when window is closing or loading
            }
            const workspaceIdentifier = this.getCurrentWorkspaceIdentifier();
            if (!workspaceIdentifier || !workspaces_1.isUntitledWorkspace(workspaceIdentifier.configPath, this.environmentService)) {
                return false; // only care about untitled workspaces to ask for saving
            }
            const windowCount = await this.electronService.getWindowCount();
            if (reason === 1 /* CLOSE */ && !platform_1.isMacintosh && windowCount === 1) {
                return false; // Windows/Linux: quits when last window is closed, so do not ask then
            }
            let ConfirmResult;
            (function (ConfirmResult) {
                ConfirmResult[ConfirmResult["SAVE"] = 0] = "SAVE";
                ConfirmResult[ConfirmResult["DONT_SAVE"] = 1] = "DONT_SAVE";
                ConfirmResult[ConfirmResult["CANCEL"] = 2] = "CANCEL";
            })(ConfirmResult || (ConfirmResult = {}));
            const save = { label: labels_1.mnemonicButtonLabel(nls.localize('save', "Save")), result: ConfirmResult.SAVE };
            const dontSave = { label: labels_1.mnemonicButtonLabel(nls.localize('doNotSave', "Don't Save")), result: ConfirmResult.DONT_SAVE };
            const cancel = { label: nls.localize('cancel', "Cancel"), result: ConfirmResult.CANCEL };
            const buttons = [];
            if (platform_1.isWindows) {
                buttons.push(save, dontSave, cancel);
            }
            else if (platform_1.isLinux) {
                buttons.push(dontSave, cancel, save);
            }
            else {
                buttons.push(save, cancel, dontSave);
            }
            const message = nls.localize('saveWorkspaceMessage', "Do you want to save your workspace configuration as a file?");
            const detail = nls.localize('saveWorkspaceDetail', "Save your workspace if you plan to open it again.");
            const cancelId = buttons.indexOf(cancel);
            const { choice } = await this.dialogService.show(notification_1.Severity.Warning, message, buttons.map(button => button.label), { detail, cancelId });
            switch (buttons[choice].result) {
                // Cancel: veto unload
                case ConfirmResult.CANCEL:
                    return true;
                // Don't Save: delete workspace
                case ConfirmResult.DONT_SAVE:
                    this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                    return false;
                // Save: save workspace, but do not veto unload if path provided
                case ConfirmResult.SAVE: {
                    const newWorkspacePath = await this.pickNewWorkspacePath();
                    if (!newWorkspacePath) {
                        return true; // keep veto if no target was provided
                    }
                    try {
                        await this.saveWorkspaceAs(workspaceIdentifier, newWorkspacePath);
                        const newWorkspaceIdentifier = await this.workspacesService.getWorkspaceIdentifier(newWorkspacePath);
                        const label = this.labelService.getWorkspaceLabel(newWorkspaceIdentifier, { verbose: true });
                        this.workspacesService.addRecentlyOpened([{ label, workspace: newWorkspaceIdentifier }]);
                        this.workspacesService.deleteUntitledWorkspace(workspaceIdentifier);
                    }
                    catch (error) {
                        // ignore
                    }
                    return false;
                }
            }
            return false;
        }
        async isValidTargetWorkspacePath(path) {
            const windows = await this.electronService.getWindows();
            // Prevent overwriting a workspace that is currently opened in another window
            if (windows.some(window => !!window.workspace && resources_1.isEqual(window.workspace.configPath, path))) {
                await this.dialogService.show(notification_1.Severity.Info, nls.localize('workspaceOpenedMessage', "Unable to save workspace '{0}'", resources_1.basename(path)), [nls.localize('ok', "OK")], {
                    detail: nls.localize('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again.")
                });
                return false;
            }
            return true; // OK
        }
        async enterWorkspace(path) {
            const result = await this.doEnterWorkspace(path);
            if (result) {
                // Migrate storage to new workspace
                await this.migrateStorage(result.workspace);
                // Reinitialize backup service
                this.environmentService.configuration.backupPath = result.backupPath;
                this.environmentService.configuration.backupWorkspaceResource = result.backupPath ? backup_2.toBackupWorkspaceResource(result.backupPath, this.environmentService) : undefined;
                if (this.backupFileService instanceof backupFileService_1.BackupFileService) {
                    this.backupFileService.reinitialize();
                }
            }
            // TODO@aeschli: workaround until restarting works
            if (this.environmentService.configuration.remoteAuthority) {
                this.hostService.reload();
            }
            // Restart the extension host: entering a workspace means a new location for
            // storage and potentially a change in the workspace.rootPath property.
            else {
                this.extensionService.restartExtensionHost();
            }
        }
        migrateStorage(toWorkspace) {
            return this.storageService.migrate(toWorkspace);
        }
    };
    NativeWorkspaceEditingService = __decorate([
        __param(0, jsonEditing_1.IJSONEditingService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, electron_1.IElectronService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, storage_1.IStorageService),
        __param(5, extensions_1.IExtensionService),
        __param(6, backup_1.IBackupFileService),
        __param(7, notification_1.INotificationService),
        __param(8, commands_1.ICommandService),
        __param(9, files_1.IFileService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, workspaces_1.IWorkspacesService),
        __param(12, environmentService_1.IWorkbenchEnvironmentService),
        __param(13, dialogs_1.IFileDialogService),
        __param(14, dialogs_1.IDialogService),
        __param(15, lifecycle_1.ILifecycleService),
        __param(16, label_1.ILabelService),
        __param(17, host_1.IHostService)
    ], NativeWorkspaceEditingService);
    exports.NativeWorkspaceEditingService = NativeWorkspaceEditingService;
    extensions_2.registerSingleton(workspaceEditing_1.IWorkspaceEditingService, NativeWorkspaceEditingService, true);
});
//# sourceMappingURL=workspaceEditingService.js.map