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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/files/browser/editors/textFileEditor", "vs/platform/files/common/files", "vs/platform/files/node/files", "vs/base/common/errorsWithActions", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/instantiation/common/instantiation", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/resourceConfiguration", "vs/workbench/services/editor/common/editorService", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/common/preferences", "vs/workbench/contrib/files/common/files", "vs/platform/electron/node/electron"], function (require, exports, nls, textFileEditor_1, files_1, files_2, errorsWithActions_1, errorMessage_1, actions_1, telemetry_1, viewlet_1, instantiation_1, workspace_1, storage_1, resourceConfiguration_1, editorService_1, themeService_1, editorGroupsService_1, textfiles_1, host_1, preferences_1, files_3, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An implementation of editor for file system resources.
     */
    let NativeTextFileEditor = class NativeTextFileEditor extends textFileEditor_1.TextFileEditor {
        constructor(telemetryService, fileService, viewletService, instantiationService, contextService, storageService, configurationService, editorService, themeService, editorGroupService, textFileService, electronService, preferencesService, hostService, explorerService) {
            super(telemetryService, fileService, viewletService, instantiationService, contextService, storageService, configurationService, editorService, themeService, editorGroupService, textFileService, hostService, explorerService);
            this.electronService = electronService;
            this.preferencesService = preferencesService;
        }
        handleSetInputError(error, input, options) {
            // Allow to restart with higher memory limit if the file is too large
            if (error.fileOperationResult === 9 /* FILE_EXCEED_MEMORY_LIMIT */) {
                const memoryLimit = Math.max(files_2.MIN_MAX_MEMORY_SIZE_MB, +this.configurationService.getValue(undefined, 'files.maxMemoryForLargeFilesMB') || files_2.FALLBACK_MAX_MEMORY_SIZE_MB);
                throw errorsWithActions_1.createErrorWithActions(errorMessage_1.toErrorMessage(error), {
                    actions: [
                        new actions_1.Action('workbench.window.action.relaunchWithIncreasedMemoryLimit', nls.localize('relaunchWithIncreasedMemoryLimit', "Restart with {0} MB", memoryLimit), undefined, true, () => {
                            return this.electronService.relaunch({
                                addArgs: [
                                    `--max-memory=${memoryLimit}`
                                ]
                            });
                        }),
                        new actions_1.Action('workbench.window.action.configureMemoryLimit', nls.localize('configureMemoryLimit', 'Configure Memory Limit'), undefined, true, () => {
                            return this.preferencesService.openGlobalSettings(undefined, { query: 'files.maxMemoryForLargeFilesMB' });
                        })
                    ]
                });
            }
            // Fallback to handling in super type
            super.handleSetInputError(error, input, options);
        }
    };
    NativeTextFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, files_1.IFileService),
        __param(2, viewlet_1.IViewletService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, themeService_1.IThemeService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, electron_1.IElectronService),
        __param(12, preferences_1.IPreferencesService),
        __param(13, host_1.IHostService),
        __param(14, files_3.IExplorerService)
    ], NativeTextFileEditor);
    exports.NativeTextFileEditor = NativeTextFileEditor;
});
//# sourceMappingURL=textFileEditor.js.map