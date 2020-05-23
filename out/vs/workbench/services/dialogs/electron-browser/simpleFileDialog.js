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
define(["require", "exports", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/base/common/network", "vs/platform/files/common/files", "vs/platform/quickinput/common/quickInput", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/path/common/pathService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey"], function (require, exports, simpleFileDialog_1, network_1, files_1, quickInput_1, label_1, workspace_1, notification_1, dialogs_1, modelService_1, modeService_1, environmentService_1, remoteAgentService_1, pathService_1, keybinding_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeSimpleFileDialog = void 0;
    let NativeSimpleFileDialog = /** @class */ (() => {
        let NativeSimpleFileDialog = class NativeSimpleFileDialog extends simpleFileDialog_1.SimpleFileDialog {
            constructor(fileService, quickInputService, labelService, workspaceContextService, notificationService, fileDialogService, modelService, modeService, environmentService, remoteAgentService, pathService, keybindingService, contextKeyService) {
                super(fileService, quickInputService, labelService, workspaceContextService, notificationService, fileDialogService, modelService, modeService, environmentService, remoteAgentService, pathService, keybindingService, contextKeyService);
                this.environmentService = environmentService;
                this.pathService = pathService;
            }
            async getUserHome() {
                if (this.scheme !== network_1.Schemas.file) {
                    return super.getUserHome();
                }
                return this.environmentService.userHome;
            }
        };
        NativeSimpleFileDialog = __decorate([
            __param(0, files_1.IFileService),
            __param(1, quickInput_1.IQuickInputService),
            __param(2, label_1.ILabelService),
            __param(3, workspace_1.IWorkspaceContextService),
            __param(4, notification_1.INotificationService),
            __param(5, dialogs_1.IFileDialogService),
            __param(6, modelService_1.IModelService),
            __param(7, modeService_1.IModeService),
            __param(8, environmentService_1.IWorkbenchEnvironmentService),
            __param(9, remoteAgentService_1.IRemoteAgentService),
            __param(10, pathService_1.IPathService),
            __param(11, keybinding_1.IKeybindingService),
            __param(12, contextkey_1.IContextKeyService)
        ], NativeSimpleFileDialog);
        return NativeSimpleFileDialog;
    })();
    exports.NativeSimpleFileDialog = NativeSimpleFileDialog;
});
//# sourceMappingURL=simpleFileDialog.js.map