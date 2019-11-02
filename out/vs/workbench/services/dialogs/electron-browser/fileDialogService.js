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
define(["require", "exports", "vs/workbench/services/host/browser/host", "vs/platform/dialogs/common/dialogs", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/electron/node/electron", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network"], function (require, exports, host_1, dialogs_1, workspace_1, history_1, environmentService_1, uri_1, instantiation_1, configuration_1, extensions_1, files_1, opener_1, electron_1, abstractFileDialogService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileDialogService = class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        constructor(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, electronService) {
            super(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService);
            this.electronService = electronService;
        }
        toNativeOpenDialogOptions(options) {
            return {
                forceNewWindow: options.forceNewWindow,
                telemetryExtraData: options.telemetryExtraData,
                defaultPath: options.defaultUri && options.defaultUri.fsPath
            };
        }
        shouldUseSimplified(schema) {
            const setting = (this.configurationService.getValue('files.simpleDialog.enable') === true);
            const newWindowSetting = (this.configurationService.getValue('window.openFilesInNewWindow') === 'on');
            return { useSimplified: (schema !== network_1.Schemas.file) || setting, isSetting: newWindowSetting };
        }
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            const shouldUseSimplified = this.shouldUseSimplified(schema);
            if (shouldUseSimplified.useSimplified) {
                return this.pickFileFolderAndOpenSimplified(schema, options, shouldUseSimplified.isSetting);
            }
            return this.electronService.pickFileFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFilePath(schema);
            }
            const shouldUseSimplified = this.shouldUseSimplified(schema);
            if (shouldUseSimplified.useSimplified) {
                return this.pickFileAndOpenSimplified(schema, options, shouldUseSimplified.isSetting);
            }
            return this.electronService.pickFileAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickFolderAndOpenSimplified(schema, options);
            }
            return this.electronService.pickFolderAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickWorkspaceAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickWorkspaceAndOpenSimplified(schema, options);
            }
            return this.electronService.pickWorkspaceAndOpen(this.toNativeOpenDialogOptions(options));
        }
        async pickFileToSave(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.pickFileToSaveSimplified(schema, options);
            }
            else {
                const result = await this.electronService.showSaveDialog(this.toNativeSaveDialogOptions(options));
                if (result && !result.canceled && result.filePath) {
                    return uri_1.URI.file(result.filePath);
                }
            }
            return;
        }
        toNativeSaveDialogOptions(options) {
            options.defaultUri = options.defaultUri ? uri_1.URI.file(options.defaultUri.path) : undefined;
            return {
                defaultPath: options.defaultUri && options.defaultUri.fsPath,
                buttonLabel: options.saveLabel,
                filters: options.filters,
                title: options.title
            };
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.showSaveDialogSimplified(schema, options);
            }
            const result = await this.electronService.showSaveDialog(this.toNativeSaveDialogOptions(options));
            if (result && !result.canceled && result.filePath) {
                return uri_1.URI.file(result.filePath);
            }
            return;
        }
        async showOpenDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema).useSimplified) {
                return this.showOpenDialogSimplified(schema, options);
            }
            const defaultUri = options.defaultUri;
            const newOptions = {
                title: options.title,
                defaultPath: defaultUri && defaultUri.fsPath,
                buttonLabel: options.openLabel,
                filters: options.filters,
                properties: []
            };
            newOptions.properties.push('createDirectory');
            if (options.canSelectFiles) {
                newOptions.properties.push('openFile');
            }
            if (options.canSelectFolders) {
                newOptions.properties.push('openDirectory');
            }
            if (options.canSelectMany) {
                newOptions.properties.push('multiSelections');
            }
            const result = await this.electronService.showOpenDialog(newOptions);
            return result && Array.isArray(result.filePaths) && result.filePaths.length > 0 ? result.filePaths.map(uri_1.URI.file) : undefined;
        }
        addFileSchemaIfNeeded(schema) {
            // Include File schema unless the schema is web
            // Don't allow untitled schema through.
            return schema === network_1.Schemas.untitled ? [network_1.Schemas.file] : (schema !== network_1.Schemas.file ? [schema, network_1.Schemas.file] : [schema]);
        }
    };
    FileDialogService = __decorate([
        __param(0, host_1.IHostService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService),
        __param(7, opener_1.IOpenerService),
        __param(8, electron_1.IElectronService)
    ], FileDialogService);
    exports.FileDialogService = FileDialogService;
    extensions_1.registerSingleton(dialogs_1.IFileDialogService, FileDialogService, true);
});
//# sourceMappingURL=fileDialogService.js.map