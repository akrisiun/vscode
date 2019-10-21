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
define(["require", "exports", "vs/base/common/path", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/resourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/platform/theme/common/themeService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/configuration/common/configuration", "vs/workbench/common/editor/resourceEditorInput", "vs/base/common/uri", "vs/editor/common/services/resolverService", "vs/workbench/contrib/output/common/output", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host"], function (require, exports, path_1, telemetry_1, storage_1, resourceConfiguration_1, instantiation_1, textResourceEditor_1, themeService_1, textfiles_1, configuration_1, resourceEditorInput_1, uri_1, resolverService_1, output_1, editorGroupsService_1, editorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LogViewerInput = class LogViewerInput extends resourceEditorInput_1.ResourceEditorInput {
        constructor(outputChannelDescriptor, textModelResolverService) {
            super(path_1.basename(outputChannelDescriptor.file.path), path_1.dirname(outputChannelDescriptor.file.path), uri_1.URI.from({ scheme: output_1.LOG_SCHEME, path: outputChannelDescriptor.id }), undefined, textModelResolverService);
            this.outputChannelDescriptor = outputChannelDescriptor;
        }
        getTypeId() {
            return LogViewerInput.ID;
        }
        getResource() {
            return this.outputChannelDescriptor.file;
        }
    };
    LogViewerInput.ID = 'workbench.editorinputs.output';
    LogViewerInput = __decorate([
        __param(1, resolverService_1.ITextModelService)
    ], LogViewerInput);
    exports.LogViewerInput = LogViewerInput;
    let LogViewer = class LogViewer extends textResourceEditor_1.AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, baseConfigurationService, textResourceConfigurationService, themeService, editorGroupService, textFileService, editorService, hostService) {
            super(LogViewer.LOG_VIEWER_EDITOR_ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorGroupService, textFileService, editorService, hostService);
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.wordWrap = 'off'; // all log viewers do not wrap
            options.folding = false;
            options.scrollBeyondLastLine = false;
            return options;
        }
    };
    LogViewer.LOG_VIEWER_EDITOR_ID = 'workbench.editors.logViewer';
    LogViewer = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, editorService_1.IEditorService),
        __param(9, host_1.IHostService)
    ], LogViewer);
    exports.LogViewer = LogViewer;
});
//# sourceMappingURL=logViewer.js.map