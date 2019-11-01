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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/keyCodes", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/actions/common/actions", "vs/workbench/common/contributions", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/label/common/label", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/extensions/common/extensions", "vs/platform/quickinput/common/quickInput", "vs/platform/log/common/log", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/electron-browser/dialogIpc", "vs/platform/download/common/downloadIpc", "vs/platform/log/common/logIpc", "electron", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/host/browser/host", "vs/workbench/browser/contextkeys", "vs/platform/download/common/download", "vs/workbench/services/dialogs/browser/simpleFileDialog"], function (require, exports, nls, platform_1, theme_1, themeService_1, remoteAgentService_1, lifecycle_1, platform_2, keyCodes_1, keybindingsRegistry_1, actions_1, contributions_1, statusbar_1, label_1, contextkey_1, commands_1, remoteHosts_1, extensions_1, quickInput_1, log_1, dialogs_1, dialogIpc_1, downloadIpc_1, logIpc_1, electron_1, environmentService_1, configuration_1, configurationRegistry_1, remoteAuthorityResolver_1, host_1, contextkeys_1, download_1, simpleFileDialog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WINDOW_ACTIONS_COMMAND_ID = 'workbench.action.remote.showMenu';
    const CLOSE_REMOTE_COMMAND_ID = 'workbench.action.remote.close';
    let RemoteWindowActiveIndicator = class RemoteWindowActiveIndicator extends lifecycle_1.Disposable {
        constructor(statusbarService, environmentService, labelService, contextKeyService, menuService, quickInputService, commandService, extensionService, remoteAgentService, remoteAuthorityResolverService, hostService) {
            super();
            this.statusbarService = statusbarService;
            this.labelService = labelService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
            this.hasWindowActions = false;
            this.connectionState = undefined;
            this.windowCommandMenu = this.menuService.createMenu(36 /* StatusBarWindowIndicatorMenu */, this.contextKeyService);
            this._register(this.windowCommandMenu);
            const category = nls.localize('remote.category', "Remote");
            actions_1.registerAction({
                id: WINDOW_ACTIONS_COMMAND_ID,
                category,
                title: { value: nls.localize('remote.showMenu', "Show Remote Menu"), original: 'Show Remote Menu' },
                menu: {
                    menuId: 0 /* CommandPalette */
                },
                handler: (_accessor) => this.showIndicatorActions(this.windowCommandMenu)
            });
            this.remoteAuthority = environmentService.configuration.remoteAuthority;
            contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(this.remoteAuthority || '');
            if (this.remoteAuthority) {
                actions_1.registerAction({
                    id: CLOSE_REMOTE_COMMAND_ID,
                    category,
                    title: { value: nls.localize('remote.close', "Close Remote Connection"), original: 'Close Remote Connection' },
                    menu: {
                        menuId: 0 /* CommandPalette */
                    },
                    handler: (_accessor) => this.remoteAuthority && hostService.openWindow({ forceReuseWindow: true })
                });
                // Pending entry until extensions are ready
                this.renderWindowIndicator(nls.localize('host.open', "$(sync~spin) Opening Remote..."), undefined, WINDOW_ACTIONS_COMMAND_ID);
                this.connectionState = 'initializing';
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                actions_1.MenuRegistry.appendMenuItem(15 /* MenubarFileMenu */, {
                    group: '6_close',
                    command: {
                        id: CLOSE_REMOTE_COMMAND_ID,
                        title: nls.localize({ key: 'miCloseRemote', comment: ['&& denotes a mnemonic'] }, "Close Re&&mote Connection")
                    },
                    order: 3.5
                });
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    this._register(connection.onDidStateChange((e) => {
                        switch (e.type) {
                            case 0 /* ConnectionLost */:
                            case 3 /* ReconnectionPermanentFailure */:
                            case 2 /* ReconnectionRunning */:
                            case 1 /* ReconnectionWait */:
                                this.setDisconnected(true);
                                break;
                            case 4 /* ConnectionGain */:
                                this.setDisconnected(false);
                                break;
                        }
                    }));
                }
            }
            extensionService.whenInstalledExtensionsRegistered().then(_ => {
                if (this.remoteAuthority) {
                    this._register(this.labelService.onDidChangeFormatters(e => this.updateWindowIndicator()));
                    remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority).then(() => this.setDisconnected(false), () => this.setDisconnected(true));
                }
                this._register(this.windowCommandMenu.onDidChange(e => this.updateWindowActions()));
                this.updateWindowIndicator();
            });
        }
        setDisconnected(isDisconnected) {
            const newState = isDisconnected ? 'disconnected' : 'connected';
            if (this.connectionState !== newState) {
                this.connectionState = newState;
                contextkeys_1.RemoteConnectionState.bindTo(this.contextKeyService).set(this.connectionState);
                contextkeys_1.Deprecated_RemoteAuthorityContext.bindTo(this.contextKeyService).set(isDisconnected ? `disconnected/${this.remoteAuthority}` : this.remoteAuthority);
                this.updateWindowIndicator();
            }
        }
        updateWindowIndicator() {
            const windowActionCommand = (this.remoteAuthority || this.windowCommandMenu.getActions().length) ? WINDOW_ACTIONS_COMMAND_ID : undefined;
            if (this.remoteAuthority) {
                const hostLabel = this.labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, this.remoteAuthority) || this.remoteAuthority;
                if (this.connectionState !== 'disconnected') {
                    this.renderWindowIndicator(`$(remote) ${hostLabel}`, nls.localize('host.tooltip', "Editing on {0}", hostLabel), windowActionCommand);
                }
                else {
                    this.renderWindowIndicator(`$(alert) ${nls.localize('disconnectedFrom', "Disconnected from")} ${hostLabel}`, nls.localize('host.tooltipDisconnected', "Disconnected from {0}", hostLabel), windowActionCommand);
                }
            }
            else {
                if (windowActionCommand) {
                    this.renderWindowIndicator(`$(remote)`, nls.localize('noHost.tooltip', "Open a remote window"), windowActionCommand);
                }
                else if (this.windowIndicatorEntry) {
                    this.windowIndicatorEntry.dispose();
                    this.windowIndicatorEntry = undefined;
                }
            }
        }
        updateWindowActions() {
            const newHasWindowActions = this.windowCommandMenu.getActions().length > 0;
            if (newHasWindowActions !== this.hasWindowActions) {
                this.hasWindowActions = newHasWindowActions;
                this.updateWindowIndicator();
            }
        }
        renderWindowIndicator(text, tooltip, command) {
            const properties = {
                backgroundColor: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_BACKGROUND), color: themeService_1.themeColorFromId(theme_1.STATUS_BAR_HOST_NAME_FOREGROUND), text, tooltip, command
            };
            if (this.windowIndicatorEntry) {
                this.windowIndicatorEntry.update(properties);
            }
            else {
                this.windowIndicatorEntry = this.statusbarService.addEntry(properties, 'status.host', nls.localize('status.host', "Remote Host"), 0 /* LEFT */, Number.MAX_VALUE /* first entry */);
            }
        }
        showIndicatorActions(menu) {
            const actions = menu.getActions();
            const items = [];
            for (let actionGroup of actions) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                for (let action of actionGroup[1]) {
                    if (action instanceof actions_1.MenuItemAction) {
                        let label = typeof action.item.title === 'string' ? action.item.title : action.item.title.value;
                        if (action.item.category) {
                            const category = typeof action.item.category === 'string' ? action.item.category : action.item.category.value;
                            label = nls.localize('cat.title', "{0}: {1}", category, label);
                        }
                        items.push({
                            type: 'item',
                            id: action.item.id,
                            label
                        });
                    }
                }
            }
            if (this.remoteAuthority) {
                if (items.length) {
                    items.push({ type: 'separator' });
                }
                items.push({
                    type: 'item',
                    id: CLOSE_REMOTE_COMMAND_ID,
                    label: nls.localize('closeRemote.title', 'Close Remote Connection')
                });
            }
            const quickPick = this.quickInputService.createQuickPick();
            quickPick.items = items;
            quickPick.canSelectMany = false;
            quickPick.onDidAccept(_ => {
                const selectedItems = quickPick.selectedItems;
                if (selectedItems.length === 1) {
                    this.commandService.executeCommand(selectedItems[0].id);
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    };
    RemoteWindowActiveIndicator = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, label_1.ILabelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_1.IMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, commands_1.ICommandService),
        __param(7, extensions_1.IExtensionService),
        __param(8, remoteAgentService_1.IRemoteAgentService),
        __param(9, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(10, host_1.IHostService)
    ], RemoteWindowActiveIndicator);
    exports.RemoteWindowActiveIndicator = RemoteWindowActiveIndicator;
    let RemoteChannelsContribution = class RemoteChannelsContribution {
        constructor(logService, remoteAgentService, dialogService, downloadService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.registerChannel('dialog', new dialogIpc_1.DialogChannel(dialogService));
                connection.registerChannel('download', new downloadIpc_1.DownloadServiceChannel(downloadService));
                connection.registerChannel('logger', new logIpc_1.LoggerChannel(logService));
            }
        }
    };
    RemoteChannelsContribution = __decorate([
        __param(0, log_1.ILogService),
        __param(1, remoteAgentService_1.IRemoteAgentService),
        __param(2, dialogs_1.IDialogService),
        __param(3, download_1.IDownloadService)
    ], RemoteChannelsContribution);
    let RemoteAgentDiagnosticListener = class RemoteAgentDiagnosticListener {
        constructor(remoteAgentService, labelService) {
            electron_1.ipcRenderer.on('vscode:getDiagnosticInfo', (event, request) => {
                const connection = remoteAgentService.getConnection();
                if (connection) {
                    const hostName = labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, connection.remoteAuthority);
                    remoteAgentService.getDiagnosticInfo(request.args)
                        .then(info => {
                        if (info) {
                            info.hostName = hostName;
                        }
                        electron_1.ipcRenderer.send(request.replyChannel, info);
                    })
                        .catch(e => {
                        const errorMessage = e && e.message ? `Fetching remote diagnostics for '${hostName}' failed: ${e.message}` : `Fetching remote diagnostics for '${hostName}' failed.`;
                        electron_1.ipcRenderer.send(request.replyChannel, { hostName, errorMessage });
                    });
                }
                else {
                    electron_1.ipcRenderer.send(request.replyChannel);
                }
            });
        }
    };
    RemoteAgentDiagnosticListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, label_1.ILabelService)
    ], RemoteAgentDiagnosticListener);
    let RemoteExtensionHostEnvironmentUpdater = class RemoteExtensionHostEnvironmentUpdater {
        constructor(remoteAgentService, remoteResolverService, extensionService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                connection.onDidStateChange(async (e) => {
                    if (e.type === 4 /* ConnectionGain */) {
                        const resolveResult = await remoteResolverService.resolveAuthority(connection.remoteAuthority);
                        if (resolveResult.options && resolveResult.options.extensionHostEnv) {
                            await extensionService.setRemoteEnvironment(resolveResult.options.extensionHostEnv);
                        }
                    }
                });
            }
        }
    };
    RemoteExtensionHostEnvironmentUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, extensions_1.IExtensionService)
    ], RemoteExtensionHostEnvironmentUpdater);
    let RemoteTelemetryEnablementUpdater = class RemoteTelemetryEnablementUpdater extends lifecycle_1.Disposable {
        constructor(remoteAgentService, configurationService) {
            super();
            this.remoteAgentService = remoteAgentService;
            this.configurationService = configurationService;
            this.updateRemoteTelemetryEnablement();
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('telemetry.enableTelemetry')) {
                    this.updateRemoteTelemetryEnablement();
                }
            }));
        }
        updateRemoteTelemetryEnablement() {
            if (!this.configurationService.getValue('telemetry.enableTelemetry')) {
                return this.remoteAgentService.disableTelemetry();
            }
            return Promise.resolve();
        }
    };
    RemoteTelemetryEnablementUpdater = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService)
    ], RemoteTelemetryEnablementUpdater);
    let RemoteEmptyWorkbenchPresentation = class RemoteEmptyWorkbenchPresentation extends lifecycle_1.Disposable {
        constructor(environmentService, remoteAuthorityResolverService, configurationService, commandService) {
            super();
            function shouldShowExplorer() {
                const startupEditor = configurationService.getValue('workbench.startupEditor');
                return startupEditor !== 'welcomePage' && startupEditor !== 'welcomePageInEmptyWorkbench';
            }
            function shouldShowTerminal() {
                return shouldShowExplorer();
            }
            const { remoteAuthority, folderUri, workspace } = environmentService.configuration;
            if (remoteAuthority && !folderUri && !workspace) {
                remoteAuthorityResolverService.resolveAuthority(remoteAuthority).then(() => {
                    if (shouldShowExplorer()) {
                        commandService.executeCommand('workbench.view.explorer');
                    }
                    if (shouldShowTerminal()) {
                        commandService.executeCommand('workbench.action.terminal.toggleTerminal');
                    }
                });
            }
        }
    };
    RemoteEmptyWorkbenchPresentation = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, commands_1.ICommandService)
    ], RemoteEmptyWorkbenchPresentation);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteChannelsContribution, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentDiagnosticListener, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteExtensionHostEnvironmentUpdater, 4 /* Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteWindowActiveIndicator, 1 /* Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteTelemetryEnablementUpdater, 2 /* Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteEmptyWorkbenchPresentation, 1 /* Starting */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration)
        .registerConfiguration({
        id: 'remote',
        title: nls.localize('remote', "Remote"),
        type: 'object',
        properties: {
            'remote.extensionKind': {
                type: 'object',
                markdownDescription: nls.localize('remote.extensionKind', "Override the kind of an extension. `ui` extensions are installed and run on the local machine while `workspace` extensions are run on the remote. By overriding an extension's default kind using this setting, you specify if that extension should be installed and enabled locally or remotely."),
                patternProperties: {
                    '([a-z0-9A-Z][a-z0-9\-A-Z]*)\\.([a-z0-9A-Z][a-z0-9\-A-Z]*)$': {
                        type: 'string',
                        enum: [
                            'ui',
                            'workspace'
                        ],
                        enumDescriptions: [
                            nls.localize('ui', "UI extension kind. In a remote window, such extensions are enabled only when available on the local machine."),
                            nls.localize('workspace', "Workspace extension kind. In a remote window, such extensions are enabled only when available on the remote.")
                        ],
                        default: 'ui'
                    },
                },
                default: {
                    'pub.name': 'ui'
                }
            }
        }
    });
    if (platform_2.isMacintosh) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileFolderCommand.ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */,
            when: contextkeys_1.RemoteFileDialogContext,
            description: { description: simpleFileDialog_1.OpenLocalFileFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileFolderCommand.handler()
        });
    }
    else {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFileCommand.ID,
            weight: 200 /* WorkbenchContrib */,
            primary: 2048 /* CtrlCmd */ | 45 /* KEY_O */,
            when: contextkeys_1.RemoteFileDialogContext,
            description: { description: simpleFileDialog_1.OpenLocalFileCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFileCommand.handler()
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: simpleFileDialog_1.OpenLocalFolderCommand.ID,
            weight: 200 /* WorkbenchContrib */,
            primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 45 /* KEY_O */),
            when: contextkeys_1.RemoteFileDialogContext,
            description: { description: simpleFileDialog_1.OpenLocalFolderCommand.LABEL, args: [] },
            handler: simpleFileDialog_1.OpenLocalFolderCommand.handler()
        });
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: simpleFileDialog_1.SaveLocalFileCommand.ID,
        weight: 200 /* WorkbenchContrib */,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 49 /* KEY_S */,
        when: contextkeys_1.RemoteFileDialogContext,
        description: { description: simpleFileDialog_1.SaveLocalFileCommand.LABEL, args: [] },
        handler: simpleFileDialog_1.SaveLocalFileCommand.handler()
    });
});
//# sourceMappingURL=remote.contribution.js.map