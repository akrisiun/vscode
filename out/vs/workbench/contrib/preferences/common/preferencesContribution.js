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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/strings", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences"], function (require, exports, lifecycle_1, resources_1, strings_1, modelService_1, modeService_1, resolverService_1, configuration_1, environment_1, JSONContributionRegistry, platform_1, workspace_1, editorService_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const schemaRegistry = platform_1.Registry.as(JSONContributionRegistry.Extensions.JSONContribution);
    let PreferencesContribution = class PreferencesContribution {
        constructor(modelService, textModelResolverService, preferencesService, modeService, editorService, environmentService, workspaceService, configurationService) {
            this.modelService = modelService;
            this.textModelResolverService = textModelResolverService;
            this.preferencesService = preferencesService;
            this.modeService = modeService;
            this.editorService = editorService;
            this.environmentService = environmentService;
            this.workspaceService = workspaceService;
            this.configurationService = configurationService;
            this.settingsListener = this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(preferences_1.USE_SPLIT_JSON_SETTING)) {
                    this.handleSettingsEditorOverride();
                }
            });
            this.handleSettingsEditorOverride();
            this.start();
        }
        handleSettingsEditorOverride() {
            // dispose any old listener we had
            lifecycle_1.dispose(this.editorOpeningListener);
            // install editor opening listener unless user has disabled this
            if (!!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING)) {
                this.editorOpeningListener = this.editorService.overrideOpenEditor((editor, options, group) => this.onEditorOpening(editor, options, group));
            }
        }
        onEditorOpening(editor, options, group) {
            const resource = editor.getResource();
            if (!resource ||
                !strings_1.endsWith(resource.path, 'settings.json') || // resource must end in settings.json
                !this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING) // user has not disabled default settings editor
            ) {
                return undefined;
            }
            // If the resource was already opened before in the group, do not prevent
            // the opening of that resource. Otherwise we would have the same settings
            // opened twice (https://github.com/Microsoft/vscode/issues/36447)
            if (group.isOpened(editor)) {
                return undefined;
            }
            // Global User Settings File
            if (resources_1.isEqual(resource, this.environmentService.settingsResource)) {
                return { override: this.preferencesService.openGlobalSettings(true, options, group) };
            }
            // Single Folder Workspace Settings File
            const state = this.workspaceService.getWorkbenchState();
            if (state === 2 /* FOLDER */) {
                const folders = this.workspaceService.getWorkspace().folders;
                if (resources_1.isEqual(resource, folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                    return { override: this.preferencesService.openWorkspaceSettings(true, options, group) };
                }
            }
            // Multi Folder Workspace Settings File
            else if (state === 3 /* WORKSPACE */) {
                const folders = this.workspaceService.getWorkspace().folders;
                for (const folder of folders) {
                    if (resources_1.isEqual(resource, folder.toResource(preferences_1.FOLDER_SETTINGS_PATH))) {
                        return { override: this.preferencesService.openFolderSettings(folder.uri, true, options, group) };
                    }
                }
            }
            return undefined;
        }
        start() {
            this.textModelResolverService.registerTextModelContentProvider('vscode', {
                provideTextContent: (uri) => {
                    if (uri.scheme !== 'vscode') {
                        return null;
                    }
                    if (uri.authority === 'schemas') {
                        const schemaModel = this.getSchemaModel(uri);
                        if (schemaModel) {
                            return Promise.resolve(schemaModel);
                        }
                    }
                    return this.preferencesService.resolveModel(uri);
                }
            });
        }
        getSchemaModel(uri) {
            let schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
            if (schema) {
                const modelContent = JSON.stringify(schema);
                const languageSelection = this.modeService.create('jsonc');
                const model = this.modelService.createModel(modelContent, languageSelection, uri);
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add(schemaRegistry.onDidChangeSchema(schemaUri => {
                    if (schemaUri === uri.toString()) {
                        schema = schemaRegistry.getSchemaContributions().schemas[uri.toString()];
                        model.setValue(JSON.stringify(schema));
                    }
                }));
                disposables.add(model.onWillDispose(() => disposables.dispose()));
                return model;
            }
            return null;
        }
        dispose() {
            lifecycle_1.dispose(this.editorOpeningListener);
            lifecycle_1.dispose(this.settingsListener);
        }
    };
    PreferencesContribution = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, resolverService_1.ITextModelService),
        __param(2, preferences_1.IPreferencesService),
        __param(3, modeService_1.IModeService),
        __param(4, editorService_1.IEditorService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, configuration_1.IConfigurationService)
    ], PreferencesContribution);
    exports.PreferencesContribution = PreferencesContribution;
});
//# sourceMappingURL=preferencesContribution.js.map