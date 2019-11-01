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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/services/preferences/common/preferences"], function (require, exports, actions_1, lifecycle_1, uri_1, getIconClasses_1, modelService_1, modeService_1, nls, commands_1, quickInput_1, workspace_1, workspaceCommands_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenRawDefaultSettingsAction = class OpenRawDefaultSettingsAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openRawDefaultSettings();
        }
    };
    OpenRawDefaultSettingsAction.ID = 'workbench.action.openRawDefaultSettings';
    OpenRawDefaultSettingsAction.LABEL = nls.localize('openRawDefaultSettings', "Open Default Settings (JSON)");
    OpenRawDefaultSettingsAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenRawDefaultSettingsAction);
    exports.OpenRawDefaultSettingsAction = OpenRawDefaultSettingsAction;
    let OpenSettings2Action = class OpenSettings2Action extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openSettings(false, undefined);
        }
    };
    OpenSettings2Action.ID = 'workbench.action.openSettings2';
    OpenSettings2Action.LABEL = nls.localize('openSettings2', "Open Settings (UI)");
    OpenSettings2Action = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenSettings2Action);
    exports.OpenSettings2Action = OpenSettings2Action;
    let OpenSettingsJsonAction = class OpenSettingsJsonAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openSettings(true, undefined);
        }
    };
    OpenSettingsJsonAction.ID = 'workbench.action.openSettingsJson';
    OpenSettingsJsonAction.LABEL = nls.localize('openSettingsJson', "Open Settings (JSON)");
    OpenSettingsJsonAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenSettingsJsonAction);
    exports.OpenSettingsJsonAction = OpenSettingsJsonAction;
    let OpenGlobalSettingsAction = class OpenGlobalSettingsAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openGlobalSettings();
        }
    };
    OpenGlobalSettingsAction.ID = 'workbench.action.openGlobalSettings';
    OpenGlobalSettingsAction.LABEL = nls.localize('openGlobalSettings', "Open User Settings");
    OpenGlobalSettingsAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenGlobalSettingsAction);
    exports.OpenGlobalSettingsAction = OpenGlobalSettingsAction;
    let OpenRemoteSettingsAction = class OpenRemoteSettingsAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openRemoteSettings();
        }
    };
    OpenRemoteSettingsAction.ID = 'workbench.action.openRemoteSettings';
    OpenRemoteSettingsAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenRemoteSettingsAction);
    exports.OpenRemoteSettingsAction = OpenRemoteSettingsAction;
    let OpenGlobalKeybindingsAction = class OpenGlobalKeybindingsAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openGlobalKeybindingSettings(false);
        }
    };
    OpenGlobalKeybindingsAction.ID = 'workbench.action.openGlobalKeybindings';
    OpenGlobalKeybindingsAction.LABEL = nls.localize('openGlobalKeybindings', "Open Keyboard Shortcuts");
    OpenGlobalKeybindingsAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenGlobalKeybindingsAction);
    exports.OpenGlobalKeybindingsAction = OpenGlobalKeybindingsAction;
    let OpenGlobalKeybindingsFileAction = class OpenGlobalKeybindingsFileAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openGlobalKeybindingSettings(true);
        }
    };
    OpenGlobalKeybindingsFileAction.ID = 'workbench.action.openGlobalKeybindingsFile';
    OpenGlobalKeybindingsFileAction.LABEL = nls.localize('openGlobalKeybindingsFile', "Open Keyboard Shortcuts (JSON)");
    OpenGlobalKeybindingsFileAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenGlobalKeybindingsFileAction);
    exports.OpenGlobalKeybindingsFileAction = OpenGlobalKeybindingsFileAction;
    let OpenDefaultKeybindingsFileAction = class OpenDefaultKeybindingsFileAction extends actions_1.Action {
        constructor(id, label, preferencesService) {
            super(id, label);
            this.preferencesService = preferencesService;
        }
        run(event) {
            return this.preferencesService.openDefaultKeybindingsFile();
        }
    };
    OpenDefaultKeybindingsFileAction.ID = 'workbench.action.openDefaultKeybindingsFile';
    OpenDefaultKeybindingsFileAction.LABEL = nls.localize('openDefaultKeybindingsFile', "Open Default Keyboard Shortcuts (JSON)");
    OpenDefaultKeybindingsFileAction = __decorate([
        __param(2, preferences_1.IPreferencesService)
    ], OpenDefaultKeybindingsFileAction);
    exports.OpenDefaultKeybindingsFileAction = OpenDefaultKeybindingsFileAction;
    let OpenWorkspaceSettingsAction = class OpenWorkspaceSettingsAction extends actions_1.Action {
        constructor(id, label, preferencesService, workspaceContextService) {
            super(id, label);
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            this.disposables = new lifecycle_1.DisposableStore();
            this.update();
            this.disposables.add(this.workspaceContextService.onDidChangeWorkbenchState(() => this.update(), this));
        }
        update() {
            this.enabled = this.workspaceContextService.getWorkbenchState() !== 1 /* EMPTY */;
        }
        run(event) {
            return this.preferencesService.openWorkspaceSettings();
        }
        dispose() {
            this.disposables.dispose();
            super.dispose();
        }
    };
    OpenWorkspaceSettingsAction.ID = 'workbench.action.openWorkspaceSettings';
    OpenWorkspaceSettingsAction.LABEL = nls.localize('openWorkspaceSettings', "Open Workspace Settings");
    OpenWorkspaceSettingsAction = __decorate([
        __param(2, preferences_1.IPreferencesService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], OpenWorkspaceSettingsAction);
    exports.OpenWorkspaceSettingsAction = OpenWorkspaceSettingsAction;
    exports.OPEN_FOLDER_SETTINGS_COMMAND = '_workbench.action.openFolderSettings';
    exports.OPEN_FOLDER_SETTINGS_LABEL = nls.localize('openFolderSettings', "Open Folder Settings");
    let OpenFolderSettingsAction = class OpenFolderSettingsAction extends actions_1.Action {
        constructor(id, label, workspaceContextService, preferencesService, commandService) {
            super(id, label);
            this.workspaceContextService = workspaceContextService;
            this.preferencesService = preferencesService;
            this.commandService = commandService;
            this.disposables = [];
            this.update();
            this.workspaceContextService.onDidChangeWorkbenchState(() => this.update(), this, this.disposables);
            this.workspaceContextService.onDidChangeWorkspaceFolders(() => this.update(), this, this.disposables);
        }
        update() {
            this.enabled = this.workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */ && this.workspaceContextService.getWorkspace().folders.length > 0;
        }
        run() {
            return this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID)
                .then(workspaceFolder => {
                if (workspaceFolder) {
                    return this.preferencesService.openFolderSettings(workspaceFolder.uri);
                }
                return undefined;
            });
        }
        dispose() {
            this.disposables = lifecycle_1.dispose(this.disposables);
            super.dispose();
        }
    };
    OpenFolderSettingsAction.ID = 'workbench.action.openFolderSettings';
    OpenFolderSettingsAction.LABEL = exports.OPEN_FOLDER_SETTINGS_LABEL;
    OpenFolderSettingsAction = __decorate([
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, preferences_1.IPreferencesService),
        __param(4, commands_1.ICommandService)
    ], OpenFolderSettingsAction);
    exports.OpenFolderSettingsAction = OpenFolderSettingsAction;
    let ConfigureLanguageBasedSettingsAction = class ConfigureLanguageBasedSettingsAction extends actions_1.Action {
        constructor(id, label, modelService, modeService, quickInputService, preferencesService) {
            super(id, label);
            this.modelService = modelService;
            this.modeService = modeService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
        }
        run() {
            const languages = this.modeService.getRegisteredLanguageNames();
            const picks = languages.sort().map((lang, index) => {
                const description = nls.localize('languageDescriptionConfigured', "({0})", this.modeService.getModeIdForLanguageName(lang.toLowerCase()));
                // construct a fake resource to be able to show nice icons if any
                let fakeResource;
                const extensions = this.modeService.getExtensions(lang);
                if (extensions && extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = this.modeService.getFilenames(lang);
                    if (filenames && filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
                return {
                    label: lang,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, fakeResource),
                    description
                };
            });
            return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language") })
                .then(pick => {
                if (pick) {
                    const modeId = this.modeService.getModeIdForLanguageName(pick.label.toLowerCase());
                    if (typeof modeId === 'string') {
                        return this.preferencesService.configureSettingsForLanguage(modeId);
                    }
                }
                return undefined;
            });
        }
    };
    ConfigureLanguageBasedSettingsAction.ID = 'workbench.action.configureLanguageBasedSettings';
    ConfigureLanguageBasedSettingsAction.LABEL = nls.localize('configureLanguageBasedSettings', "Configure Language Specific Settings...");
    ConfigureLanguageBasedSettingsAction = __decorate([
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, preferences_1.IPreferencesService)
    ], ConfigureLanguageBasedSettingsAction);
    exports.ConfigureLanguageBasedSettingsAction = ConfigureLanguageBasedSettingsAction;
});
//# sourceMappingURL=preferencesActions.js.map