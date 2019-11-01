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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/environment/common/environmentService"], function (require, exports, actions_1, nls, host_1, workspace_1, workspaceEditing_1, workspaces_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SaveWorkspaceAsAction = class SaveWorkspaceAsAction extends actions_1.Action {
        constructor(id, label, contextService, workspaceEditingService) {
            super(id, label);
            this.contextService = contextService;
            this.workspaceEditingService = workspaceEditingService;
        }
        async run() {
            const configPathUri = await this.workspaceEditingService.pickNewWorkspacePath();
            if (configPathUri) {
                switch (this.contextService.getWorkbenchState()) {
                    case 1 /* EMPTY */:
                    case 2 /* FOLDER */:
                        const folders = this.contextService.getWorkspace().folders.map(folder => ({ uri: folder.uri }));
                        return this.workspaceEditingService.createAndEnterWorkspace(folders, configPathUri);
                    case 3 /* WORKSPACE */:
                        return this.workspaceEditingService.saveAndEnterWorkspace(configPathUri);
                }
            }
        }
    };
    SaveWorkspaceAsAction.ID = 'workbench.action.saveWorkspaceAs';
    SaveWorkspaceAsAction.LABEL = nls.localize('saveWorkspaceAsAction', "Save Workspace As...");
    SaveWorkspaceAsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceEditing_1.IWorkspaceEditingService)
    ], SaveWorkspaceAsAction);
    exports.SaveWorkspaceAsAction = SaveWorkspaceAsAction;
    let DuplicateWorkspaceInNewWindowAction = class DuplicateWorkspaceInNewWindowAction extends actions_1.Action {
        constructor(id, label, workspaceContextService, workspaceEditingService, hostService, workspacesService, environmentService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.workspaceEditingService = workspaceEditingService;
            this.hostService = hostService;
            this.workspacesService = workspacesService;
            this.environmentService = environmentService;
        }
        async run() {
            const folders = this.workspaceContextService.getWorkspace().folders;
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            const newWorkspace = await this.workspacesService.createUntitledWorkspace(folders, remoteAuthority);
            await this.workspaceEditingService.copyWorkspaceSettings(newWorkspace);
            return this.hostService.openWindow([{ workspaceUri: newWorkspace.configPath }], { forceNewWindow: true });
        }
    };
    DuplicateWorkspaceInNewWindowAction.ID = 'workbench.action.duplicateWorkspaceInNewWindow';
    DuplicateWorkspaceInNewWindowAction.LABEL = nls.localize('duplicateWorkspaceInNewWindow', "Duplicate Workspace in New Window");
    DuplicateWorkspaceInNewWindowAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, workspaceEditing_1.IWorkspaceEditingService),
        __param(4, host_1.IHostService),
        __param(5, workspaces_1.IWorkspacesService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService)
    ], DuplicateWorkspaceInNewWindowAction);
    exports.DuplicateWorkspaceInNewWindowAction = DuplicateWorkspaceInNewWindowAction;
});
//# sourceMappingURL=workspaceActions.js.map