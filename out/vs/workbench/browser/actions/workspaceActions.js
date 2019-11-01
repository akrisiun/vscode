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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/dialogs/common/dialogs", "vs/platform/actions/common/actions", "vs/workbench/browser/contextkeys", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/base/common/keyCodes", "vs/platform/contextkey/common/contextkey"], function (require, exports, actions_1, nls, workspace_1, workspaceEditing_1, editorService_1, commands_1, workspaceCommands_1, dialogs_1, actions_2, contextkeys_1, instantiation_1, platform_1, actions_3, notification_1, host_1, keyCodes_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenFileAction = class OpenFileAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFileAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFileAction.ID = 'workbench.action.files.openFile';
    OpenFileAction.LABEL = nls.localize('openFile', "Open File...");
    OpenFileAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFileAction);
    exports.OpenFileAction = OpenFileAction;
    let OpenFolderAction = class OpenFolderAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFolderAction.ID = 'workbench.action.files.openFolder';
    OpenFolderAction.LABEL = nls.localize('openFolder', "Open Folder...");
    OpenFolderAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFolderAction);
    exports.OpenFolderAction = OpenFolderAction;
    let OpenFileFolderAction = class OpenFileFolderAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickFileFolderAndOpen({ forceNewWindow: false, telemetryExtraData: data });
        }
    };
    OpenFileFolderAction.ID = 'workbench.action.files.openFileFolder';
    OpenFileFolderAction.LABEL = nls.localize('openFileFolder', "Open...");
    OpenFileFolderAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenFileFolderAction);
    exports.OpenFileFolderAction = OpenFileFolderAction;
    let OpenWorkspaceAction = class OpenWorkspaceAction extends actions_1.Action {
        constructor(id, label, dialogService) {
            super(id, label);
            this.dialogService = dialogService;
        }
        run(event, data) {
            return this.dialogService.pickWorkspaceAndOpen({ telemetryExtraData: data });
        }
    };
    OpenWorkspaceAction.ID = 'workbench.action.openWorkspace';
    OpenWorkspaceAction.LABEL = nls.localize('openWorkspaceAction', "Open Workspace...");
    OpenWorkspaceAction = __decorate([
        __param(2, dialogs_1.IFileDialogService)
    ], OpenWorkspaceAction);
    exports.OpenWorkspaceAction = OpenWorkspaceAction;
    let CloseWorkspaceAction = class CloseWorkspaceAction extends actions_1.Action {
        constructor(id, label, contextService, notificationService, hostService) {
            super(id, label);
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.hostService = hostService;
        }
        run() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                this.notificationService.info(nls.localize('noWorkspaceOpened', "There is currently no workspace opened in this instance to close."));
                return Promise.resolve(undefined);
            }
            return this.hostService.closeWorkspace();
        }
    };
    CloseWorkspaceAction.ID = 'workbench.action.closeFolder';
    CloseWorkspaceAction.LABEL = nls.localize('closeWorkspace', "Close Workspace");
    CloseWorkspaceAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, host_1.IHostService)
    ], CloseWorkspaceAction);
    exports.CloseWorkspaceAction = CloseWorkspaceAction;
    let OpenWorkspaceConfigFileAction = class OpenWorkspaceConfigFileAction extends actions_1.Action {
        constructor(id, label, workspaceContextService, editorService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.editorService = editorService;
            this.enabled = !!this.workspaceContextService.getWorkspace().configuration;
        }
        run() {
            const configuration = this.workspaceContextService.getWorkspace().configuration;
            if (configuration) {
                return this.editorService.openEditor({ resource: configuration });
            }
            return Promise.resolve();
        }
    };
    OpenWorkspaceConfigFileAction.ID = 'workbench.action.openWorkspaceConfigFile';
    OpenWorkspaceConfigFileAction.LABEL = nls.localize('openWorkspaceConfigFile', "Open Workspace Configuration File");
    OpenWorkspaceConfigFileAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, editorService_1.IEditorService)
    ], OpenWorkspaceConfigFileAction);
    exports.OpenWorkspaceConfigFileAction = OpenWorkspaceConfigFileAction;
    let AddRootFolderAction = class AddRootFolderAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label);
            this.commandService = commandService;
        }
        run() {
            return this.commandService.executeCommand(workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID);
        }
    };
    AddRootFolderAction.ID = 'workbench.action.addRootFolder';
    AddRootFolderAction.LABEL = workspaceCommands_1.ADD_ROOT_FOLDER_LABEL;
    AddRootFolderAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], AddRootFolderAction);
    exports.AddRootFolderAction = AddRootFolderAction;
    let GlobalRemoveRootFolderAction = class GlobalRemoveRootFolderAction extends actions_1.Action {
        constructor(id, label, workspaceEditingService, contextService, commandService) {
            super(id, label);
            this.workspaceEditingService = workspaceEditingService;
            this.contextService = contextService;
            this.commandService = commandService;
        }
        async run() {
            const state = this.contextService.getWorkbenchState();
            // Workspace / Folder
            if (state === 3 /* WORKSPACE */ || state === 2 /* FOLDER */) {
                const folder = await this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID);
                if (folder) {
                    await this.workspaceEditingService.removeFolders([folder.uri]);
                }
            }
            return true;
        }
    };
    GlobalRemoveRootFolderAction.ID = 'workbench.action.removeRootFolder';
    GlobalRemoveRootFolderAction.LABEL = nls.localize('globalRemoveFolderFromWorkspace', "Remove Folder from Workspace...");
    GlobalRemoveRootFolderAction = __decorate([
        __param(2, workspaceEditing_1.IWorkspaceEditingService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, commands_1.ICommandService)
    ], GlobalRemoveRootFolderAction);
    exports.GlobalRemoveRootFolderAction = GlobalRemoveRootFolderAction;
    // --- Actions Registration
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    const workspacesCategory = nls.localize('workspaces', "Workspaces");
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(AddRootFolderAction, AddRootFolderAction.ID, AddRootFolderAction.LABEL), 'Workspaces: Add Folder to Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(GlobalRemoveRootFolderAction, GlobalRemoveRootFolderAction.ID, GlobalRemoveRootFolderAction.LABEL), 'Workspaces: Remove Folder from Workspace...', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(CloseWorkspaceAction, CloseWorkspaceAction.ID, CloseWorkspaceAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 36 /* KEY_F */) }), 'Workspaces: Close Workspace', workspacesCategory, contextkeys_1.SupportsWorkspacesContext);
    // --- Menu Registration
    commands_1.CommandsRegistry.registerCommand(OpenWorkspaceConfigFileAction.ID, serviceAccessor => {
        serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(OpenWorkspaceConfigFileAction, OpenWorkspaceConfigFileAction.ID, OpenWorkspaceConfigFileAction.LABEL).run();
    });
    actions_2.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '3_workspace',
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: nls.localize({ key: 'miAddFolderToWorkspace', comment: ['&& denotes a mnemonic'] }, "A&&dd Folder to Workspace...")
        },
        order: 1,
        when: contextkeys_1.SupportsWorkspacesContext
    });
    actions_2.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: OpenWorkspaceConfigFileAction.ID,
            title: { value: `${workspacesCategory}: ${OpenWorkspaceConfigFileAction.LABEL}`, original: 'Workspaces: Open Workspace Configuration File' },
        },
        when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
    });
    actions_2.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: nls.localize({ key: 'miCloseFolder', comment: ['&& denotes a mnemonic'] }, "Close &&Folder"),
            precondition: contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0')
        },
        order: 3,
        when: contextkeys_1.WorkbenchStateContext.notEqualsTo('workspace')
    });
    actions_2.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        group: '6_close',
        command: {
            id: CloseWorkspaceAction.ID,
            title: nls.localize({ key: 'miCloseWorkspace', comment: ['&& denotes a mnemonic'] }, "Close &&Workspace")
        },
        order: 3,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'), contextkeys_1.SupportsWorkspacesContext)
    });
});
//# sourceMappingURL=workspaceActions.js.map