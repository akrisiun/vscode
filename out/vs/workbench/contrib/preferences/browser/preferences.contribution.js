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
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/contrib/suggest/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/workbench/browser/contextkeys", "vs/workbench/services/environment/common/environmentService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/workspace/common/workspace", "vs/workbench/browser/editor", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/resources", "vs/workbench/contrib/preferences/browser/keybindingsEditor", "vs/workbench/contrib/preferences/browser/preferencesActions", "vs/workbench/contrib/preferences/browser/preferencesEditor", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/preferences/common/preferencesContribution", "vs/workbench/contrib/preferences/browser/settingsEditor2", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/contrib/files/common/files", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/base/common/amd", "vs/css!../browser/media/preferences"], function (require, exports, keyCodes_1, lifecycle_1, uri_1, editorExtensions_1, suggest_1, nls, actions_1, commands_1, contextkey_1, contextkeys_1, environmentService_1, descriptors_1, instantiation_1, keybindingsRegistry_1, platform_1, workspace_1, editor_1, actions_2, contributions_1, editor_2, resources_1, keybindingsEditor_1, preferencesActions_1, preferencesEditor_1, preferences_1, preferencesContribution_1, settingsEditor2_1, editorService_1, preferences_2, preferencesEditorInput_1, files_1, label_1, extensions_1, remoteHosts_1, amd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(preferencesEditor_1.PreferencesEditor, preferencesEditor_1.PreferencesEditor.ID, nls.localize('defaultPreferencesEditor', "Default Preferences Editor")), [
        new descriptors_1.SyncDescriptor(preferencesEditorInput_1.PreferencesEditorInput)
    ]);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(settingsEditor2_1.SettingsEditor2, settingsEditor2_1.SettingsEditor2.ID, nls.localize('settingsEditor2', "Settings Editor 2")), [
        new descriptors_1.SyncDescriptor(preferencesEditorInput_1.SettingsEditor2Input)
    ]);
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(keybindingsEditor_1.KeybindingsEditor, keybindingsEditor_1.KeybindingsEditor.ID, nls.localize('keybindingsEditor', "Keybindings Editor")), [
        new descriptors_1.SyncDescriptor(preferencesEditorInput_1.KeybindingsEditorInput)
    ]);
    // Register Preferences Editor Input Factory
    class PreferencesEditorInputFactory {
        serialize(editorInput) {
            const input = editorInput;
            if (input.details && input.master) {
                const registry = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories);
                const detailsInputFactory = registry.getEditorInputFactory(input.details.getTypeId());
                const masterInputFactory = registry.getEditorInputFactory(input.master.getTypeId());
                if (detailsInputFactory && masterInputFactory) {
                    const detailsSerialized = detailsInputFactory.serialize(input.details);
                    const masterSerialized = masterInputFactory.serialize(input.master);
                    if (detailsSerialized && masterSerialized) {
                        return JSON.stringify({
                            name: input.getName(),
                            description: input.getDescription(),
                            detailsSerialized,
                            masterSerialized,
                            detailsTypeId: input.details.getTypeId(),
                            masterTypeId: input.master.getTypeId()
                        });
                    }
                }
            }
            return undefined;
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            const registry = platform_1.Registry.as(editor_2.Extensions.EditorInputFactories);
            const detailsInputFactory = registry.getEditorInputFactory(deserialized.detailsTypeId);
            const masterInputFactory = registry.getEditorInputFactory(deserialized.masterTypeId);
            if (detailsInputFactory && masterInputFactory) {
                const detailsInput = detailsInputFactory.deserialize(instantiationService, deserialized.detailsSerialized);
                const masterInput = masterInputFactory.deserialize(instantiationService, deserialized.masterSerialized);
                if (detailsInput && masterInput) {
                    return new preferencesEditorInput_1.PreferencesEditorInput(deserialized.name, deserialized.description, detailsInput, masterInput);
                }
            }
            return undefined;
        }
    }
    class KeybindingsEditorInputFactory {
        serialize(editorInput) {
            const input = editorInput;
            return JSON.stringify({
                name: input.getName(),
                typeId: input.getTypeId()
            });
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.createInstance(preferencesEditorInput_1.KeybindingsEditorInput);
        }
    }
    class SettingsEditor2InputFactory {
        serialize(input) {
            const serialized = {};
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            return instantiationService.createInstance(preferencesEditorInput_1.SettingsEditor2Input);
        }
    }
    // Register Default Preferences Editor Input Factory
    class DefaultPreferencesEditorInputFactory {
        serialize(editorInput) {
            const input = editorInput;
            const serialized = { resource: input.getResource().toString() };
            return JSON.stringify(serialized);
        }
        deserialize(instantiationService, serializedEditorInput) {
            const deserialized = JSON.parse(serializedEditorInput);
            return instantiationService.createInstance(preferencesEditorInput_1.DefaultPreferencesEditorInput, uri_1.URI.parse(deserialized.resource));
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(preferencesEditorInput_1.PreferencesEditorInput.ID, PreferencesEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(preferencesEditorInput_1.DefaultPreferencesEditorInput.ID, DefaultPreferencesEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(preferencesEditorInput_1.KeybindingsEditorInput.ID, KeybindingsEditorInputFactory);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(preferencesEditorInput_1.SettingsEditor2Input.ID, SettingsEditor2InputFactory);
    // Contribute Global Actions
    const category = nls.localize('preferences', "Preferences");
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenRawDefaultSettingsAction, preferencesActions_1.OpenRawDefaultSettingsAction.ID, preferencesActions_1.OpenRawDefaultSettingsAction.LABEL), 'Preferences: Open Default Settings (JSON)', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenSettingsJsonAction, preferencesActions_1.OpenSettingsJsonAction.ID, preferencesActions_1.OpenSettingsJsonAction.LABEL), 'Preferences: Open Settings (JSON)', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenSettings2Action, preferencesActions_1.OpenSettings2Action.ID, preferencesActions_1.OpenSettings2Action.LABEL), 'Preferences: Open Settings (UI)', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenGlobalSettingsAction, preferencesActions_1.OpenGlobalSettingsAction.ID, preferencesActions_1.OpenGlobalSettingsAction.LABEL), 'Preferences: Open User Settings', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenGlobalKeybindingsAction, preferencesActions_1.OpenGlobalKeybindingsAction.ID, preferencesActions_1.OpenGlobalKeybindingsAction.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 49 /* KEY_S */) }), 'Preferences: Open Keyboard Shortcuts', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenDefaultKeybindingsFileAction, preferencesActions_1.OpenDefaultKeybindingsFileAction.ID, preferencesActions_1.OpenDefaultKeybindingsFileAction.LABEL), 'Preferences: Open Default Keyboard Shortcuts (JSON)', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.OpenGlobalKeybindingsFileAction, preferencesActions_1.OpenGlobalKeybindingsFileAction.ID, preferencesActions_1.OpenGlobalKeybindingsFileAction.LABEL, { primary: 0 }), 'Preferences: Open Keyboard Shortcuts (JSON)', category);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(preferencesActions_1.ConfigureLanguageBasedSettingsAction, preferencesActions_1.ConfigureLanguageBasedSettingsAction.ID, preferencesActions_1.ConfigureLanguageBasedSettingsAction.LABEL), 'Preferences: Configure Language Specific Settings...', category);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.SETTINGS_COMMAND_OPEN_SETTINGS,
        weight: 200 /* WorkbenchContrib */,
        when: null,
        primary: 2048 /* CtrlCmd */ | 82 /* US_COMMA */,
        handler: (accessor, args) => {
            accessor.get(preferences_2.IPreferencesService).openSettings(undefined, typeof args === 'string' ? args : undefined);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */),
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.defineKeybinding(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 35 /* KEY_E */),
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor && control.activeKeybindingEntry.keybindingItem.keybinding) {
                control.defineWhenExpression(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: 20 /* Delete */,
        mac: {
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 1 /* Backspace */)
        },
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.removeKeybinding(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: 0,
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.resetKeybinding(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SEARCH,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
        primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.focusSearch();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
        primary: 512 /* Alt */ | 41 /* KEY_K */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 41 /* KEY_K */ },
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.recordSearchKeys();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
        primary: 512 /* Alt */ | 46 /* KEY_P */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 46 /* KEY_P */ },
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control && control instanceof keybindingsEditor_1.KeybindingsEditor) {
                control.toggleSortByPrecedence();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: 0,
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control) {
                control.showSimilarKeybindings(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: async (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control) {
                await control.copyKeybinding(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDING_FOCUS),
        primary: 0,
        handler: async (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control) {
                await control.copyKeybindingCommand(control.activeKeybindingEntry);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
        primary: 18 /* DownArrow */,
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control) {
                control.focusKeybindings();
            }
        }
    });
    const PREFERENCES_EDITOR_LIGHT_ICON_URI = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL(`vs/workbench/contrib/preferences/browser/media/preferences-editor-light.svg`));
    const PREFERENCES_EDITOR_DARK_ICON_URI = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL(`vs/workbench/contrib/preferences/browser/media/preferences-editor-dark.svg`));
    let PreferencesActionsContribution = class PreferencesActionsContribution extends lifecycle_1.Disposable {
        constructor(environmentService, preferencesService, workspaceContextService, labelService, extensionService) {
            super();
            this.preferencesService = preferencesService;
            this.workspaceContextService = workspaceContextService;
            actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
                command: {
                    id: preferencesActions_1.OpenGlobalKeybindingsAction.ID,
                    title: preferencesActions_1.OpenGlobalKeybindingsAction.LABEL,
                    iconLocation: {
                        light: PREFERENCES_EDITOR_LIGHT_ICON_URI,
                        dark: PREFERENCES_EDITOR_DARK_ICON_URI
                    }
                },
                when: resources_1.ResourceContextKey.Resource.isEqualTo(environmentService.keybindingsResource.toString()),
                group: 'navigation',
                order: 1
            });
            const commandId = '_workbench.openUserSettingsEditor';
            commands_1.CommandsRegistry.registerCommand(commandId, () => this.preferencesService.openGlobalSettings(false));
            actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
                command: {
                    id: commandId,
                    title: preferencesActions_1.OpenSettings2Action.LABEL,
                    iconLocation: {
                        light: PREFERENCES_EDITOR_LIGHT_ICON_URI,
                        dark: PREFERENCES_EDITOR_DARK_ICON_URI
                    }
                },
                when: resources_1.ResourceContextKey.Resource.isEqualTo(environmentService.settingsResource.toString()),
                group: 'navigation',
                order: 1
            });
            this.updatePreferencesEditorMenuItem();
            this._register(workspaceContextService.onDidChangeWorkbenchState(() => this.updatePreferencesEditorMenuItem()));
            this._register(workspaceContextService.onDidChangeWorkspaceFolders(() => this.updatePreferencesEditorMenuItemForWorkspaceFolders()));
            extensionService.whenInstalledExtensionsRegistered()
                .then(() => {
                const remoteAuthority = environmentService.configuration.remoteAuthority;
                const hostLabel = labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, remoteAuthority) || remoteAuthority;
                const label = nls.localize('openRemoteSettings', "Open Remote Settings ({0})", hostLabel);
                commands_1.CommandsRegistry.registerCommand(preferencesActions_1.OpenRemoteSettingsAction.ID, serviceAccessor => {
                    serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.OpenRemoteSettingsAction, preferencesActions_1.OpenRemoteSettingsAction.ID, label).run();
                });
                actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                    command: {
                        id: preferencesActions_1.OpenRemoteSettingsAction.ID,
                        title: { value: label, original: `Open Remote Settings (${hostLabel})` },
                        category: { value: nls.localize('preferencesCategory', "Preferences"), original: 'Preferences' }
                    },
                    when: contextkeys_1.RemoteNameContext.notEqualsTo('')
                });
            });
        }
        updatePreferencesEditorMenuItem() {
            const commandId = '_workbench.openWorkspaceSettingsEditor';
            if (this.workspaceContextService.getWorkbenchState() === 3 /* WORKSPACE */ && !commands_1.CommandsRegistry.getCommand(commandId)) {
                commands_1.CommandsRegistry.registerCommand(commandId, () => this.preferencesService.openWorkspaceSettings(false));
                actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
                    command: {
                        id: commandId,
                        title: preferencesActions_1.OpenSettings2Action.LABEL,
                        iconLocation: {
                            light: PREFERENCES_EDITOR_LIGHT_ICON_URI,
                            dark: PREFERENCES_EDITOR_DARK_ICON_URI
                        }
                    },
                    when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.Resource.isEqualTo(this.preferencesService.workspaceSettingsResource.toString()), contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')),
                    group: 'navigation',
                    order: 1
                });
            }
            this.updatePreferencesEditorMenuItemForWorkspaceFolders();
        }
        updatePreferencesEditorMenuItemForWorkspaceFolders() {
            for (const folder of this.workspaceContextService.getWorkspace().folders) {
                const commandId = `_workbench.openFolderSettings.${folder.uri.toString()}`;
                if (!commands_1.CommandsRegistry.getCommand(commandId)) {
                    commands_1.CommandsRegistry.registerCommand(commandId, () => {
                        if (this.workspaceContextService.getWorkbenchState() === 2 /* FOLDER */) {
                            return this.preferencesService.openWorkspaceSettings(false);
                        }
                        else {
                            return this.preferencesService.openFolderSettings(folder.uri, false);
                        }
                    });
                    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
                        command: {
                            id: commandId,
                            title: preferencesActions_1.OpenSettings2Action.LABEL,
                            iconLocation: {
                                light: PREFERENCES_EDITOR_LIGHT_ICON_URI,
                                dark: PREFERENCES_EDITOR_DARK_ICON_URI
                            }
                        },
                        when: contextkey_1.ContextKeyExpr.and(resources_1.ResourceContextKey.Resource.isEqualTo(this.preferencesService.getFolderSettingsResource(folder.uri).toString())),
                        group: 'navigation',
                        order: 1
                    });
                }
            }
        }
    };
    PreferencesActionsContribution = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, preferences_2.IPreferencesService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, label_1.ILabelService),
        __param(4, extensions_1.IExtensionService)
    ], PreferencesActionsContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(PreferencesActionsContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(preferencesContribution_1.PreferencesContribution, 1 /* Starting */);
    commands_1.CommandsRegistry.registerCommand(preferencesActions_1.OPEN_FOLDER_SETTINGS_COMMAND, function (accessor, resource) {
        const preferencesService = accessor.get(preferences_2.IPreferencesService);
        return preferencesService.openFolderSettings(resource);
    });
    commands_1.CommandsRegistry.registerCommand(preferencesActions_1.OpenFolderSettingsAction.ID, serviceAccessor => {
        serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.OpenFolderSettingsAction, preferencesActions_1.OpenFolderSettingsAction.ID, preferencesActions_1.OpenFolderSettingsAction.LABEL).run();
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: preferencesActions_1.OpenFolderSettingsAction.ID,
            title: { value: preferencesActions_1.OpenFolderSettingsAction.LABEL, original: 'Open Folder Settings' },
            category: { value: nls.localize('preferencesCategory', "Preferences"), original: 'Preferences' }
        },
        when: contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')
    });
    commands_1.CommandsRegistry.registerCommand(preferencesActions_1.OpenWorkspaceSettingsAction.ID, serviceAccessor => {
        serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.OpenWorkspaceSettingsAction, preferencesActions_1.OpenWorkspaceSettingsAction.ID, preferencesActions_1.OpenWorkspaceSettingsAction.LABEL).run();
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: preferencesActions_1.OpenWorkspaceSettingsAction.ID,
            title: { value: preferencesActions_1.OpenWorkspaceSettingsAction.LABEL, original: 'Open Workspace Settings' },
            category: { value: nls.localize('preferencesCategory', "Preferences"), original: 'Preferences' }
        },
        when: contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR, preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS),
        primary: 9 /* Escape */,
        handler: (accessor, args) => {
            const control = accessor.get(editorService_1.IEditorService).activeControl;
            if (control) {
                control.clearSearchResults();
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand(preferencesActions_1.OpenGlobalKeybindingsFileAction.ID, serviceAccessor => {
        serviceAccessor.get(instantiation_1.IInstantiationService).createInstance(preferencesActions_1.OpenGlobalKeybindingsFileAction, preferencesActions_1.OpenGlobalKeybindingsFileAction.ID, preferencesActions_1.OpenGlobalKeybindingsFileAction.LABEL).run();
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferencesActions_1.OpenGlobalKeybindingsFileAction.ID,
            title: preferencesActions_1.OpenGlobalKeybindingsFileAction.LABEL,
            iconLocation: {
                light: PREFERENCES_EDITOR_LIGHT_ICON_URI,
                dark: PREFERENCES_EDITOR_DARK_ICON_URI
            }
        },
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
        group: 'navigation',
    });
    commands_1.CommandsRegistry.registerCommand(preferences_1.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS, serviceAccessor => {
        const control = serviceAccessor.get(editorService_1.IEditorService).activeControl;
        if (control) {
            control.search('@source:default');
        }
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferences_1.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS,
            title: nls.localize('showDefaultKeybindings', "Show Default Keybindings")
        },
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
        group: '1_keyboard_preferences_actions'
    });
    commands_1.CommandsRegistry.registerCommand(preferences_1.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS, serviceAccessor => {
        const control = serviceAccessor.get(editorService_1.IEditorService).activeControl;
        if (control) {
            control.search('@source:user');
        }
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferences_1.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS,
            title: nls.localize('showUserKeybindings', "Show User Keybindings")
        },
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_KEYBINDINGS_EDITOR),
        group: '1_keyboard_preferences_actions'
    });
    class SettingsCommand extends editorExtensions_1.Command {
        getPreferencesEditor(accessor) {
            const activeControl = accessor.get(editorService_1.IEditorService).activeControl;
            if (activeControl instanceof preferencesEditor_1.PreferencesEditor || activeControl instanceof settingsEditor2_1.SettingsEditor2) {
                return activeControl;
            }
            return null;
        }
    }
    class StartSearchDefaultSettingsCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor) {
                preferencesEditor.focusSearch();
            }
        }
    }
    const startSearchCommand = new StartSearchDefaultSettingsCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_SEARCH,
        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR),
        kbOpts: { primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */, weight: 100 /* EditorContrib */ }
    });
    startSearchCommand.register();
    class ClearSearchResultsCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor) {
                preferencesEditor.clearSearchResults();
            }
        }
    }
    const clearSearchResultsCommand = new ClearSearchResultsCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS,
        precondition: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS,
        kbOpts: { primary: 9 /* Escape */, weight: 100 /* EditorContrib */ }
    });
    clearSearchResultsCommand.register();
    class FocusSettingsFileEditorCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof preferencesEditor_1.PreferencesEditor) {
                preferencesEditor.focusSettingsFileEditor();
            }
            else if (preferencesEditor) {
                preferencesEditor.focusSettings();
            }
        }
    }
    const focusSettingsFileEditorCommand = new FocusSettingsFileEditorCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_FOCUS_FILE,
        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
        kbOpts: { primary: 18 /* DownArrow */, weight: 100 /* EditorContrib */ }
    });
    focusSettingsFileEditorCommand.register();
    const focusSettingsFromSearchCommand = new FocusSettingsFileEditorCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_FROM_SEARCH,
        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS, suggest_1.Context.Visible.toNegated()),
        kbOpts: { primary: 18 /* DownArrow */, weight: 200 /* WorkbenchContrib */ }
    });
    focusSettingsFromSearchCommand.register();
    class FocusNextSearchResultCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof preferencesEditor_1.PreferencesEditor) {
                preferencesEditor.focusNextResult();
            }
        }
    }
    const focusNextSearchResultCommand = new FocusNextSearchResultCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_FOCUS_NEXT_SETTING,
        precondition: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS,
        kbOpts: { primary: 3 /* Enter */, weight: 100 /* EditorContrib */ }
    });
    focusNextSearchResultCommand.register();
    class FocusPreviousSearchResultCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof preferencesEditor_1.PreferencesEditor) {
                preferencesEditor.focusPreviousResult();
            }
        }
    }
    const focusPreviousSearchResultCommand = new FocusPreviousSearchResultCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_FOCUS_PREVIOUS_SETTING,
        precondition: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS,
        kbOpts: { primary: 1024 /* Shift */ | 3 /* Enter */, weight: 100 /* EditorContrib */ }
    });
    focusPreviousSearchResultCommand.register();
    class EditFocusedSettingCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof preferencesEditor_1.PreferencesEditor) {
                preferencesEditor.editFocusedPreference();
            }
        }
    }
    const editFocusedSettingCommand = new EditFocusedSettingCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_EDIT_FOCUSED_SETTING,
        precondition: preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS,
        kbOpts: { primary: 2048 /* CtrlCmd */ | 84 /* US_DOT */, weight: 100 /* EditorContrib */ }
    });
    editFocusedSettingCommand.register();
    class FocusSettingsListCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                preferencesEditor.focusSettings();
            }
        }
    }
    const focusSettingsListCommand = new FocusSettingsListCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_FOCUS_SETTINGS_LIST,
        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_TOC_ROW_FOCUS),
        kbOpts: { primary: 3 /* Enter */, weight: 200 /* WorkbenchContrib */ }
    });
    focusSettingsListCommand.register();
    class ShowContextMenuCommand extends SettingsCommand {
        runCommand(accessor, args) {
            const preferencesEditor = this.getPreferencesEditor(accessor);
            if (preferencesEditor instanceof settingsEditor2_1.SettingsEditor2) {
                preferencesEditor.showContextMenu();
            }
        }
    }
    const showContextMenuCommand = new ShowContextMenuCommand({
        id: preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU,
        precondition: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR),
        kbOpts: { primary: 1024 /* Shift */ | 67 /* F9 */, weight: 200 /* WorkbenchContrib */ }
    });
    showContextMenuCommand.register();
    commands_1.CommandsRegistry.registerCommand(preferences_1.SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON, serviceAccessor => {
        const control = serviceAccessor.get(editorService_1.IEditorService).activeControl;
        if (control instanceof settingsEditor2_1.SettingsEditor2) {
            return control.switchToSettingsFile();
        }
        return Promise.resolve(null);
    });
    commands_1.CommandsRegistry.registerCommand(preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_MODIFIED, serviceAccessor => {
        const control = serviceAccessor.get(editorService_1.IEditorService).activeControl;
        if (control instanceof settingsEditor2_1.SettingsEditor2) {
            control.focusSearch(`@${preferences_1.MODIFIED_SETTING_TAG}`);
        }
    });
    commands_1.CommandsRegistry.registerCommand(preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_ONLINE, serviceAccessor => {
        const control = serviceAccessor.get(editorService_1.IEditorService).activeControl;
        if (control instanceof settingsEditor2_1.SettingsEditor2) {
            control.focusSearch(`@tag:usesOnlineServices`);
        }
        else {
            serviceAccessor.get(preferences_2.IPreferencesService).openSettings(false, '@tag:usesOnlineServices');
        }
    });
    // Preferences menu
    actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
        title: nls.localize({ key: 'miPreferences', comment: ['&& denotes a mnemonic'] }, "&&Preferences"),
        submenu: 20 /* MenubarPreferencesMenu */,
        group: '5_autosave',
        order: 2,
        when: contextkeys_1.IsMacNativeContext.toNegated() // on macOS native the preferences menu is separate under the application menu
    });
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '1_settings',
        command: {
            id: preferences_1.SETTINGS_COMMAND_OPEN_SETTINGS,
            title: nls.localize({ key: 'miOpenSettings', comment: ['&& denotes a mnemonic'] }, "&&Settings")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '2_configuration',
        command: {
            id: preferences_1.SETTINGS_COMMAND_OPEN_SETTINGS,
            title: nls.localize('settings', "Settings")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '1_settings',
        command: {
            id: preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_ONLINE,
            title: nls.localize({ key: 'miOpenOnlineSettings', comment: ['&& denotes a mnemonic'] }, "&&Online Services Settings")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '2_configuration',
        command: {
            id: preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_ONLINE,
            title: nls.localize('onlineServices', "Online Services Settings")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '2_keybindings',
        command: {
            id: preferencesActions_1.OpenGlobalKeybindingsAction.ID,
            title: nls.localize({ key: 'miOpenKeymap', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '2_keybindings',
        command: {
            id: preferencesActions_1.OpenGlobalKeybindingsAction.ID,
            title: nls.localize('keyboardShortcuts', "Keyboard Shortcuts")
        },
        order: 1
    });
    // Editor tool items
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferences_1.SETTINGS_EDITOR_COMMAND_SWITCH_TO_JSON,
            title: nls.localize('openSettingsJson', "Open Settings (JSON)"),
            iconLocation: {
                dark: PREFERENCES_EDITOR_DARK_ICON_URI,
                light: PREFERENCES_EDITOR_LIGHT_ICON_URI
            }
        },
        group: 'navigation',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_MODIFIED,
            title: nls.localize('filterModifiedLabel', "Show modified settings")
        },
        group: '1_filter',
        order: 1,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
        command: {
            id: preferences_1.SETTINGS_EDITOR_COMMAND_FILTER_ONLINE,
            title: nls.localize('filterOnlineServicesLabel', "Show settings for online services"),
        },
        group: '1_filter',
        order: 2,
        when: contextkey_1.ContextKeyExpr.and(preferences_1.CONTEXT_SETTINGS_EDITOR, preferences_1.CONTEXT_SETTINGS_JSON_EDITOR.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: '2_workspace',
        order: 20,
        command: {
            id: preferencesActions_1.OPEN_FOLDER_SETTINGS_COMMAND,
            title: preferencesActions_1.OPEN_FOLDER_SETTINGS_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext)
    });
});
//# sourceMappingURL=preferences.contribution.js.map