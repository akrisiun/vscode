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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/contrib/output/common/output", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensionsInput", "vs/workbench/browser/viewlet", "vs/workbench/contrib/extensions/browser/extensionEditor", "vs/workbench/contrib/extensions/browser/extensionsViewlet", "vs/workbench/browser/quickopen", "vs/platform/configuration/common/configurationRegistry", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/extensions/common/extensionsFileTemplate", "vs/platform/commands/common/commands", "vs/workbench/contrib/extensions/common/extensionsUtils", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsQuickOpen", "vs/workbench/browser/editor", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/extensionsActivationProgress", "vs/base/common/errors", "vs/workbench/contrib/extensions/browser/extensionsDependencyChecker", "vs/base/common/cancellation", "vs/workbench/contrib/extensions/browser/remoteExtensionsInstaller", "vs/workbench/contrib/extensions/browser/extensionTipsService"], function (require, exports, nls_1, keyCodes_1, platform_1, actions_1, extensions_1, extensionManagement_1, extensionManagement_2, actions_2, contributions_1, output_1, descriptors_1, extensions_2, extensionsWorkbenchService_1, extensionsActions_1, extensionsInput_1, viewlet_1, extensionEditor_1, extensionsViewlet_1, quickopen_1, configurationRegistry_1, jsonContributionRegistry, extensionsFileTemplate_1, commands_1, extensionsUtils_1, extensionManagementUtil_1, extensionsQuickOpen_1, editor_1, uri_1, extensionsActivationProgress_1, errors_1, extensionsDependencyChecker_1, cancellation_1, remoteExtensionsInstaller_1, extensionTipsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Singletons
    extensions_1.registerSingleton(extensions_2.IExtensionsWorkbenchService, extensionsWorkbenchService_1.ExtensionsWorkbenchService);
    extensions_1.registerSingleton(extensionManagement_2.IExtensionTipsService, extensionTipsService_1.ExtensionTipsService);
    platform_1.Registry.as(output_1.Extensions.OutputChannels)
        .registerChannel({ id: extensionManagement_1.ExtensionsChannelId, label: extensionManagement_1.ExtensionsLabel, log: false });
    // Quickopen
    platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(extensionsQuickOpen_1.ExtensionsHandler, extensionsQuickOpen_1.ExtensionsHandler.ID, 'ext ', undefined, nls_1.localize('extensionsCommands', "Manage Extensions"), true));
    // Editor
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(new editor_1.EditorDescriptor(extensionEditor_1.ExtensionEditor, extensionEditor_1.ExtensionEditor.ID, nls_1.localize('extension', "Extension")), [
        new descriptors_1.SyncDescriptor(extensionsInput_1.ExtensionsInput)
    ]);
    // Viewlet
    const viewletDescriptor = new viewlet_1.ViewletDescriptor(extensionsViewlet_1.ExtensionsViewlet, extensions_2.VIEWLET_ID, nls_1.localize('extensions', "Extensions"), 'codicon-extensions', 4);
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets)
        .registerViewlet(viewletDescriptor);
    // Global actions
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    const openViewletActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.OpenExtensionsViewletAction, extensionsActions_1.OpenExtensionsViewletAction.ID, extensionsActions_1.OpenExtensionsViewletAction.LABEL, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 54 /* KEY_X */ });
    actionRegistry.registerWorkbenchAction(openViewletActionDescriptor, 'View: Show Extensions', nls_1.localize('view', "View"));
    const installActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.InstallExtensionsAction, extensionsActions_1.InstallExtensionsAction.ID, extensionsActions_1.InstallExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(installActionDescriptor, 'Extensions: Install Extensions', extensionManagement_1.ExtensionsLabel);
    const listOutdatedActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowOutdatedExtensionsAction, extensionsActions_1.ShowOutdatedExtensionsAction.ID, extensionsActions_1.ShowOutdatedExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(listOutdatedActionDescriptor, 'Extensions: Show Outdated Extensions', extensionManagement_1.ExtensionsLabel);
    const recommendationsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowRecommendedExtensionsAction, extensionsActions_1.ShowRecommendedExtensionsAction.ID, extensionsActions_1.ShowRecommendedExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(recommendationsActionDescriptor, 'Extensions: Show Recommended Extensions', extensionManagement_1.ExtensionsLabel);
    const keymapRecommendationsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowRecommendedKeymapExtensionsAction, extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID, extensionsActions_1.ShowRecommendedKeymapExtensionsAction.SHORT_LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 43 /* KEY_M */) });
    actionRegistry.registerWorkbenchAction(keymapRecommendationsActionDescriptor, 'Preferences: Keymaps', extensionManagement_1.PreferencesLabel);
    const languageExtensionsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowLanguageExtensionsAction, extensionsActions_1.ShowLanguageExtensionsAction.ID, extensionsActions_1.ShowLanguageExtensionsAction.SHORT_LABEL);
    actionRegistry.registerWorkbenchAction(languageExtensionsActionDescriptor, 'Preferences: Language Extensions', extensionManagement_1.PreferencesLabel);
    const azureExtensionsActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowAzureExtensionsAction, extensionsActions_1.ShowAzureExtensionsAction.ID, extensionsActions_1.ShowAzureExtensionsAction.SHORT_LABEL);
    actionRegistry.registerWorkbenchAction(azureExtensionsActionDescriptor, 'Preferences: Azure Extensions', extensionManagement_1.PreferencesLabel);
    const popularActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowPopularExtensionsAction, extensionsActions_1.ShowPopularExtensionsAction.ID, extensionsActions_1.ShowPopularExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(popularActionDescriptor, 'Extensions: Show Popular Extensions', extensionManagement_1.ExtensionsLabel);
    const enabledActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowEnabledExtensionsAction, extensionsActions_1.ShowEnabledExtensionsAction.ID, extensionsActions_1.ShowEnabledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(enabledActionDescriptor, 'Extensions: Show Enabled Extensions', extensionManagement_1.ExtensionsLabel);
    const installedActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowInstalledExtensionsAction, extensionsActions_1.ShowInstalledExtensionsAction.ID, extensionsActions_1.ShowInstalledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(installedActionDescriptor, 'Extensions: Show Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disabledActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowDisabledExtensionsAction, extensionsActions_1.ShowDisabledExtensionsAction.ID, extensionsActions_1.ShowDisabledExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(disabledActionDescriptor, 'Extensions: Show Disabled Extensions', extensionManagement_1.ExtensionsLabel);
    const builtinActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.ShowBuiltInExtensionsAction, extensionsActions_1.ShowBuiltInExtensionsAction.ID, extensionsActions_1.ShowBuiltInExtensionsAction.LABEL);
    actionRegistry.registerWorkbenchAction(builtinActionDescriptor, 'Extensions: Show Built-in Extensions', extensionManagement_1.ExtensionsLabel);
    const updateAllActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.UpdateAllAction, extensionsActions_1.UpdateAllAction.ID, extensionsActions_1.UpdateAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(updateAllActionDescriptor, 'Extensions: Update All Extensions', extensionManagement_1.ExtensionsLabel);
    const installVSIXActionDescriptor = new actions_1.SyncActionDescriptor(extensionsActions_1.InstallVSIXAction, extensionsActions_1.InstallVSIXAction.ID, extensionsActions_1.InstallVSIXAction.LABEL);
    actionRegistry.registerWorkbenchAction(installVSIXActionDescriptor, 'Extensions: Install from VSIX...', extensionManagement_1.ExtensionsLabel);
    const disableAllAction = new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAllAction, extensionsActions_1.DisableAllAction.ID, extensionsActions_1.DisableAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(disableAllAction, 'Extensions: Disable All Installed Extensions', extensionManagement_1.ExtensionsLabel);
    const disableAllWorkspaceAction = new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAllWorkspaceAction, extensionsActions_1.DisableAllWorkspaceAction.ID, extensionsActions_1.DisableAllWorkspaceAction.LABEL);
    actionRegistry.registerWorkbenchAction(disableAllWorkspaceAction, 'Extensions: Disable All Installed Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const enableAllAction = new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAllAction, extensionsActions_1.EnableAllAction.ID, extensionsActions_1.EnableAllAction.LABEL);
    actionRegistry.registerWorkbenchAction(enableAllAction, 'Extensions: Enable All Extensions', extensionManagement_1.ExtensionsLabel);
    const enableAllWorkspaceAction = new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAllWorkspaceAction, extensionsActions_1.EnableAllWorkspaceAction.ID, extensionsActions_1.EnableAllWorkspaceAction.LABEL);
    actionRegistry.registerWorkbenchAction(enableAllWorkspaceAction, 'Extensions: Enable All Extensions for this Workspace', extensionManagement_1.ExtensionsLabel);
    const checkForUpdatesAction = new actions_1.SyncActionDescriptor(extensionsActions_1.CheckForUpdatesAction, extensionsActions_1.CheckForUpdatesAction.ID, extensionsActions_1.CheckForUpdatesAction.LABEL);
    actionRegistry.registerWorkbenchAction(checkForUpdatesAction, `Extensions: Check for Extension Updates`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.EnableAutoUpdateAction, extensionsActions_1.EnableAutoUpdateAction.ID, extensionsActions_1.EnableAutoUpdateAction.LABEL), `Extensions: Enable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.DisableAutoUpdateAction, extensionsActions_1.DisableAutoUpdateAction.ID, extensionsActions_1.DisableAutoUpdateAction.LABEL), `Extensions: Disable Auto Updating Extensions`, extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.InstallSpecificVersionOfExtensionAction, extensionsActions_1.InstallSpecificVersionOfExtensionAction.ID, extensionsActions_1.InstallSpecificVersionOfExtensionAction.LABEL), 'Install Specific Version of Extension...', extensionManagement_1.ExtensionsLabel);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(extensionsActions_1.ReinstallAction, extensionsActions_1.ReinstallAction.ID, extensionsActions_1.ReinstallAction.LABEL), 'Reinstall Extension...', nls_1.localize('developer', "Developer"));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'extensions',
        order: 30,
        title: nls_1.localize('extensionsConfigurationTitle', "Extensions"),
        type: 'object',
        properties: {
            'extensions.autoUpdate': {
                type: 'boolean',
                description: nls_1.localize('extensionsAutoUpdate', "When enabled, automatically installs updates for extensions. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.autoCheckUpdates': {
                type: 'boolean',
                description: nls_1.localize('extensionsCheckUpdates', "When enabled, automatically checks extensions for updates. If an extension has an update, it is marked as outdated in the Extensions view. The updates are fetched from a Microsoft online service."),
                default: true,
                scope: 1 /* APPLICATION */,
                tags: ['usesOnlineServices']
            },
            'extensions.ignoreRecommendations': {
                type: 'boolean',
                description: nls_1.localize('extensionsIgnoreRecommendations', "When enabled, the notifications for extension recommendations will not be shown."),
                default: false
            },
            'extensions.showRecommendationsOnlyOnDemand': {
                type: 'boolean',
                description: nls_1.localize('extensionsShowRecommendationsOnlyOnDemand', "When enabled, recommendations will not be fetched or shown unless specifically requested by the user. Some recommendations are fetched from a Microsoft online service."),
                default: false,
                tags: ['usesOnlineServices']
            },
            'extensions.closeExtensionDetailsOnViewChange': {
                type: 'boolean',
                description: nls_1.localize('extensionsCloseExtensionDetailsOnViewChange', "When enabled, editors with extension details will be automatically closed upon navigating away from the Extensions View."),
                default: false
            },
            'extensions.confirmedUriHandlerExtensionIds': {
                type: 'array',
                description: nls_1.localize('handleUriConfirmedExtensions', "When an extension is listed here, a confirmation prompt will not be shown when that extension handles a URI."),
                default: []
            }
        }
    });
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry.Extensions.JSONContribution);
    jsonRegistry.registerSchema(extensionsFileTemplate_1.ExtensionsConfigurationSchemaId, extensionsFileTemplate_1.ExtensionsConfigurationSchema);
    // Register Commands
    commands_1.CommandsRegistry.registerCommand('_extensions.manage', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        const extension = extensionService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id: extensionId }));
        if (extension.length === 1) {
            extensionService.open(extension[0]);
        }
    });
    commands_1.CommandsRegistry.registerCommand('extension.open', (accessor, extensionId) => {
        const extensionService = accessor.get(extensions_2.IExtensionsWorkbenchService);
        return extensionService.queryGallery({ names: [extensionId], pageSize: 1 }, cancellation_1.CancellationToken.None).then(pager => {
            if (pager.total !== 1) {
                return;
            }
            extensionService.open(pager.firstPage[0]);
        });
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.installExtension',
        description: {
            description: nls_1.localize('workbench.extensions.installExtension.description', "Install the given extension"),
            args: [
                {
                    name: nls_1.localize('workbench.extensions.installExtension.arg.name', "Extension id or VSIX resource uri"),
                    schema: {
                        'type': ['object', 'string']
                    }
                }
            ]
        },
        handler: async (accessor, arg) => {
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const extensionGalleryService = accessor.get(extensionManagement_1.IExtensionGalleryService);
            try {
                if (typeof arg === 'string') {
                    const extension = await extensionGalleryService.getCompatibleExtension({ id: arg });
                    if (extension) {
                        await extensionManagementService.installFromGallery(extension);
                    }
                    else {
                        throw new Error(nls_1.localize('notFound', "Extension '{0}' not found.", arg));
                    }
                }
                else {
                    const vsix = uri_1.URI.revive(arg);
                    await extensionManagementService.install(vsix);
                }
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.extensions.uninstallExtension',
        description: {
            description: nls_1.localize('workbench.extensions.uninstallExtension.description', "Uninstall the given extension"),
            args: [
                {
                    name: nls_1.localize('workbench.extensions.uninstallExtension.arg.name', "Id of the extension to uninstall"),
                    schema: {
                        'type': 'string'
                    }
                }
            ]
        },
        handler: async (accessor, id) => {
            if (!id) {
                throw new Error(nls_1.localize('id required', "Extension id required."));
            }
            const extensionManagementService = accessor.get(extensionManagement_1.IExtensionManagementService);
            const installed = await extensionManagementService.getInstalled(1 /* User */);
            const [extensionToUninstall] = installed.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, { id }));
            if (!extensionToUninstall) {
                throw new Error(nls_1.localize('notInstalled', "Extension '{0}' is not installed. Make sure you use the full extension ID, including the publisher, e.g.: ms-vscode.csharp.", id));
            }
            try {
                await extensionManagementService.uninstall(extensionToUninstall, true);
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
            }
        }
    });
    // File menu registration
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '2_keybindings',
        command: {
            id: extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID,
            title: nls_1.localize({ key: 'miOpenKeymapExtensions', comment: ['&& denotes a mnemonic'] }, "&&Keymaps")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '2_keybindings',
        command: {
            id: extensionsActions_1.ShowRecommendedKeymapExtensionsAction.ID,
            title: nls_1.localize('miOpenKeymapExtensions2', "Keymaps")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(20 /* MenubarPreferencesMenu */, {
        group: '1_settings',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miPreferencesExtensions', comment: ['&& denotes a mnemonic'] }, "&&Extensions")
        },
        order: 3
    });
    // View menu
    actions_1.MenuRegistry.appendMenuItem(26 /* MenubarViewMenu */, {
        group: '3_views',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize({ key: 'miViewExtensions', comment: ['&& denotes a mnemonic'] }, "E&&xtensions")
        },
        order: 5
    });
    // Global Activity Menu
    actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, {
        group: '2_configuration',
        command: {
            id: extensions_2.VIEWLET_ID,
            title: nls_1.localize('showExtensions', "Extensions")
        },
        order: 3
    });
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    let ExtensionsContributions = class ExtensionsContributions {
        constructor(extensionManagementServerService) {
            const canManageExtensions = extensionManagementServerService.localExtensionManagementServer || extensionManagementServerService.remoteExtensionManagementServer;
            if (canManageExtensions) {
                platform_1.Registry.as(quickopen_1.Extensions.Quickopen).registerQuickOpenHandler(new quickopen_1.QuickOpenHandlerDescriptor(extensionsQuickOpen_1.GalleryExtensionsHandler, extensionsQuickOpen_1.GalleryExtensionsHandler.ID, 'ext install ', undefined, nls_1.localize('galleryExtensionsCommands', "Install Gallery Extensions"), true));
            }
        }
    };
    ExtensionsContributions = __decorate([
        __param(0, extensionManagement_2.IExtensionManagementServerService)
    ], ExtensionsContributions);
    workbenchRegistry.registerWorkbenchContribution(ExtensionsContributions, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.StatusUpdater, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.MaliciousExtensionChecker, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActions_1.ConfigureRecommendedExtensionsCommandsContributor, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsUtils_1.KeymapExtensions, 3 /* Restored */);
    workbenchRegistry.registerWorkbenchContribution(extensionsViewlet_1.ExtensionsViewletViewsContribution, 1 /* Starting */);
    workbenchRegistry.registerWorkbenchContribution(extensionsActivationProgress_1.ExtensionActivationProgress, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(extensionsDependencyChecker_1.ExtensionDependencyChecker, 4 /* Eventually */);
    workbenchRegistry.registerWorkbenchContribution(remoteExtensionsInstaller_1.RemoteExtensionsInstaller, 4 /* Eventually */);
});
//# sourceMappingURL=extensions.contribution.js.map