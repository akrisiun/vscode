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
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/dialogs/browser/simpleFileDialog", "vs/platform/workspaces/common/workspaces", "vs/platform/remote/common/remoteHosts", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/workbench/services/host/browser/host"], function (require, exports, nls, workspace_1, history_1, environmentService_1, network_1, resources, instantiation_1, simpleFileDialog_1, workspaces_1, remoteHosts_1, configuration_1, files_1, opener_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AbstractFileDialogService = class AbstractFileDialogService {
        constructor(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService) {
            this.hostService = hostService;
            this.contextService = contextService;
            this.historyService = historyService;
            this.environmentService = environmentService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.openerService = openerService;
        }
        defaultFilePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file first...
            let candidate = this.historyService.getLastActiveFile(schemeFilter);
            // ...then for last active file root
            if (!candidate) {
                candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            }
            else {
                candidate = candidate && resources.dirname(candidate);
            }
            return candidate || undefined;
        }
        defaultFolderPath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for last active file root first...
            let candidate = this.historyService.getLastActiveWorkspaceRoot(schemeFilter);
            // ...then for last active file
            if (!candidate) {
                candidate = this.historyService.getLastActiveFile(schemeFilter);
            }
            return candidate && resources.dirname(candidate) || undefined;
        }
        defaultWorkspacePath(schemeFilter = this.getSchemeFilterForWindow()) {
            // Check for current workspace config file first...
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const configuration = this.contextService.getWorkspace().configuration;
                if (configuration && !workspaces_1.isUntitledWorkspace(configuration, this.environmentService)) {
                    return resources.dirname(configuration) || undefined;
                }
            }
            // ...then fallback to default file path
            return this.defaultFilePath(schemeFilter);
        }
        async pickFileFolderAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFileOrFolder.title', 'Open File Or Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                const stat = await this.fileService.resolve(uri);
                const toOpen = stat.isDirectory ? { folderUri: uri } : { fileUri: uri };
                if (stat.isDirectory || options.forceNewWindow || preferNewWindow) {
                    return this.hostService.openWindow([toOpen], { forceNewWindow: options.forceNewWindow });
                }
                else {
                    return this.openerService.open(uri, { fromUserGesture: true });
                }
            }
        }
        async pickFileAndOpenSimplified(schema, options, preferNewWindow) {
            const title = nls.localize('openFile.title', 'Open File');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                if (options.forceNewWindow || preferNewWindow) {
                    return this.hostService.openWindow([{ fileUri: uri }], { forceNewWindow: options.forceNewWindow });
                }
                else {
                    return this.openerService.open(uri, { fromUserGesture: true });
                }
            }
        }
        async pickFolderAndOpenSimplified(schema, options) {
            const title = nls.localize('openFolder.title', 'Open Folder');
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, defaultUri: options.defaultUri, title, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ folderUri: uri }], { forceNewWindow: options.forceNewWindow });
            }
        }
        async pickWorkspaceAndOpenSimplified(schema, options) {
            const title = nls.localize('openWorkspace.title', 'Open Workspace');
            const filters = [{ name: nls.localize('filterName.workspace', 'Workspace'), extensions: [workspaces_1.WORKSPACE_EXTENSION] }];
            const availableFileSystems = this.addFileSchemaIfNeeded(schema);
            const uri = await this.pickResource({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, defaultUri: options.defaultUri, title, filters, availableFileSystems });
            if (uri) {
                return this.hostService.openWindow([{ workspaceUri: uri }], { forceNewWindow: options.forceNewWindow });
            }
        }
        async pickFileToSaveSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            options.title = nls.localize('saveFileAs.title', 'Save As');
            return this.saveRemoteResource(options);
        }
        async showSaveDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            return this.saveRemoteResource(options);
        }
        async showOpenDialogSimplified(schema, options) {
            if (!options.availableFileSystems) {
                options.availableFileSystems = this.addFileSchemaIfNeeded(schema);
            }
            const uri = await this.pickResource(options);
            return uri ? [uri] : undefined;
        }
        pickResource(options) {
            const simpleFileDialog = this.instantiationService.createInstance(simpleFileDialog_1.SimpleFileDialog);
            return simpleFileDialog.showOpenDialog(options);
        }
        saveRemoteResource(options) {
            const remoteFileDialog = this.instantiationService.createInstance(simpleFileDialog_1.SimpleFileDialog);
            return remoteFileDialog.showSaveDialog(options);
        }
        getSchemeFilterForWindow() {
            return !this.environmentService.configuration.remoteAuthority ? network_1.Schemas.file : remoteHosts_1.REMOTE_HOST_SCHEME;
        }
        getFileSystemSchema(options) {
            return options.availableFileSystems && options.availableFileSystems[0] || this.getSchemeFilterForWindow();
        }
    };
    AbstractFileDialogService = __decorate([
        __param(0, host_1.IHostService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, history_1.IHistoryService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, files_1.IFileService),
        __param(7, opener_1.IOpenerService)
    ], AbstractFileDialogService);
    exports.AbstractFileDialogService = AbstractFileDialogService;
});
//# sourceMappingURL=abstractFileDialogService.js.map