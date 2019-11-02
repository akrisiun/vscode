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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/uri", "vs/workbench/services/layout/browser/layoutService", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/platform/contextview/browser/contextView", "vs/workbench/services/extensions/common/extensions", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/contrib/remote/common/remote.contribution", "vs/workbench/browser/parts/views/panelViewlet", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/platform/list/browser/listService", "vs/base/common/event", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/commands/common/commands", "vs/workbench/browser/viewlet", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/progress/common/progress", "vs/workbench/common/contributions", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/dialogs/common/dialogs", "vs/base/common/severity", "vs/workbench/browser/actions/windowActions", "vs/workbench/services/environment/common/environmentService", "vs/css!./remoteViewlet"], function (require, exports, nls, dom, uri_1, layoutService_1, telemetry_1, workspace_1, storage_1, configuration_1, instantiation_1, themeService_1, contextView_1, extensions_1, viewsViewlet_1, remote_contribution_1, panelViewlet_1, keybinding_1, contextkey_1, views_1, platform_1, extensionsRegistry_1, listService_1, event_1, opener_1, quickInput_1, commands_1, viewlet_1, viewlet_2, editorGroupsService_1, actions_1, actions_2, progress_1, contributions_1, remoteAgentService_1, dialogs_1, severity_1, windowActions_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const remoteHelpExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'remoteHelp',
        jsonSchema: {
            description: nls.localize('RemoteHelpInformationExtPoint', 'Contributes help information for Remote'),
            type: 'object',
            properties: {
                'getStarted': {
                    description: nls.localize('RemoteHelpInformationExtPoint.getStarted', "The url to your project's Getting Started page"),
                    type: 'string'
                },
                'documentation': {
                    description: nls.localize('RemoteHelpInformationExtPoint.documentation', "The url to your project's documentation page"),
                    type: 'string'
                },
                'feedback': {
                    description: nls.localize('RemoteHelpInformationExtPoint.feedback', "The url to your project's feedback reporter"),
                    type: 'string'
                },
                'issues': {
                    description: nls.localize('RemoteHelpInformationExtPoint.issues', "The url to your project's issues list"),
                    type: 'string'
                }
            }
        }
    });
    class HelpTreeVirtualDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'HelpItemTemplate';
        }
    }
    class HelpTreeRenderer {
        constructor() {
            this.templateId = 'HelpItemTemplate';
        }
        renderTemplate(container) {
            dom.addClass(container, 'remote-help-tree-node-item');
            const icon = dom.append(container, dom.$('.remote-help-tree-node-item-icon'));
            const data = Object.create(null);
            data.parent = container;
            data.icon = icon;
            return data;
        }
        renderElement(element, index, templateData, height) {
            const container = templateData.parent;
            dom.append(container, templateData.icon);
            dom.addClass(templateData.icon, element.element.key);
            const labelContainer = dom.append(container, dom.$('.help-item-label'));
            labelContainer.innerText = element.element.label;
        }
        disposeTemplate(templateData) {
        }
    }
    class HelpDataSource {
        hasChildren(element) {
            return element instanceof HelpModel;
        }
        getChildren(element) {
            if (element instanceof HelpModel && element.items) {
                return element.items;
            }
            return [];
        }
    }
    class HelpItem {
        constructor(key, label, values, openerService, quickInputService) {
            this.key = key;
            this.label = label;
            this.values = values;
            this.openerService = openerService;
            this.quickInputService = quickInputService;
        }
        async handleClick() {
            if (this.values.length > 1) {
                let actions = this.values.map(value => {
                    return {
                        label: value.extensionDescription.displayName || value.extensionDescription.identifier.value,
                        description: value.url
                    };
                });
                const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtension', "Select url to open") });
                if (action) {
                    await this.openerService.open(uri_1.URI.parse(action.description));
                }
            }
            else {
                await this.openerService.open(uri_1.URI.parse(this.values[0].url));
            }
        }
    }
    class IssueReporterItem {
        constructor(key, label, extensionDescriptions, quickInputService, commandService) {
            this.key = key;
            this.label = label;
            this.extensionDescriptions = extensionDescriptions;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
        }
        async handleClick() {
            if (this.extensionDescriptions.length > 1) {
                let actions = this.extensionDescriptions.map(extension => {
                    return {
                        label: extension.displayName || extension.identifier.value,
                        identifier: extension.identifier
                    };
                });
                const action = await this.quickInputService.pick(actions, { placeHolder: nls.localize('pickRemoteExtensionToReportIssue', "Select an extension to report issue") });
                if (action) {
                    await this.commandService.executeCommand('workbench.action.openIssueReporter', [action.identifier.value]);
                }
            }
            else {
                await this.commandService.executeCommand('workbench.action.openIssueReporter', [this.extensionDescriptions[0].identifier.value]);
            }
        }
    }
    class HelpModel {
        constructor(viewModel, openerService, quickInputService, commandService) {
            let helpItems = [];
            const getStarted = viewModel.helpInformations.filter(info => info.getStarted);
            if (getStarted.length) {
                helpItems.push(new HelpItem('getStarted', nls.localize('remote.help.getStarted', "Get Started"), getStarted.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.getStarted
                })), openerService, quickInputService));
            }
            const documentation = viewModel.helpInformations.filter(info => info.documentation);
            if (documentation.length) {
                helpItems.push(new HelpItem('documentation', nls.localize('remote.help.documentation', "Read Documentation"), documentation.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.documentation
                })), openerService, quickInputService));
            }
            const feedback = viewModel.helpInformations.filter(info => info.feedback);
            if (feedback.length) {
                helpItems.push(new HelpItem('feedback', nls.localize('remote.help.feedback', "Provide Feedback"), feedback.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.feedback
                })), openerService, quickInputService));
            }
            const issues = viewModel.helpInformations.filter(info => info.issues);
            if (issues.length) {
                helpItems.push(new HelpItem('issues', nls.localize('remote.help.issues', "Review Issues"), issues.map((info) => ({
                    extensionDescription: info.extensionDescription,
                    url: info.issues
                })), openerService, quickInputService));
            }
            if (helpItems.length) {
                helpItems.push(new IssueReporterItem('issueReporter', nls.localize('remote.help.report', "Report Issue"), viewModel.helpInformations.map(info => info.extensionDescription), quickInputService, commandService));
            }
            if (helpItems.length) {
                this.items = helpItems;
            }
        }
    }
    let HelpPanel = class HelpPanel extends panelViewlet_1.ViewletPanel {
        constructor(viewModel, options, keybindingService, contextMenuService, contextKeyService, configurationService, instantiationService, openerService, quickInputService, commandService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService);
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.quickInputService = quickInputService;
            this.commandService = commandService;
        }
        renderBody(container) {
            dom.addClass(container, 'remote-help');
            const treeContainer = document.createElement('div');
            dom.addClass(treeContainer, 'remote-help-content');
            container.appendChild(treeContainer);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'RemoteHelp', treeContainer, new HelpTreeVirtualDelegate(), [new HelpTreeRenderer()], new HelpDataSource(), {
                keyboardSupport: true,
            });
            const model = new HelpModel(this.viewModel, this.openerService, this.quickInputService, this.commandService);
            this.tree.setInput(model);
            const helpItemNavigator = this._register(new listService_1.TreeResourceNavigator2(this.tree, { openOnFocus: false, openOnSelection: false }));
            this._register(event_1.Event.debounce(helpItemNavigator.onDidOpenResource, (last, event) => event, 75, true)(e => {
                e.element.handleClick();
            }));
        }
        layoutBody(height, width) {
            this.tree.layout(height, width);
        }
    };
    HelpPanel.ID = '~remote.helpPanel';
    HelpPanel.TITLE = nls.localize('remote.help', "Help and feedback");
    HelpPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, quickInput_1.IQuickInputService),
        __param(9, commands_1.ICommandService)
    ], HelpPanel);
    class HelpPanelDescriptor {
        constructor(viewModel) {
            this.id = HelpPanel.ID;
            this.name = HelpPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.workspace = true;
            this.ctorDescriptor = { ctor: HelpPanel, arguments: [viewModel] };
        }
    }
    let RemoteViewlet = class RemoteViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, contextService, storageService, configurationService, instantiationService, themeService, contextMenuService, extensionService, environmentService) {
            super(remote_contribution_1.VIEWLET_ID, `${remote_contribution_1.VIEWLET_ID}.state`, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.environmentService = environmentService;
            this.helpPanelDescriptor = new HelpPanelDescriptor(this);
            this.helpInformations = [];
            remoteHelpExtPoint.setHandler((extensions) => {
                let helpInformation = [];
                for (let extension of extensions) {
                    this._handleRemoteInfoExtensionPoint(extension, helpInformation);
                }
                this.helpInformations = helpInformation;
                const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
                if (this.helpInformations.length) {
                    viewsRegistry.registerViews([this.helpPanelDescriptor], remote_contribution_1.VIEW_CONTAINER);
                }
                else {
                    viewsRegistry.deregisterViews([this.helpPanelDescriptor], remote_contribution_1.VIEW_CONTAINER);
                }
            });
        }
        _handleRemoteInfoExtensionPoint(extension, helpInformation) {
            if (!extension.description.enableProposedApi) {
                return;
            }
            if (!extension.value.documentation && !extension.value.feedback && !extension.value.getStarted && !extension.value.issues) {
                return;
            }
            helpInformation.push({
                extensionDescription: extension.description,
                getStarted: extension.value.getStarted,
                documentation: extension.value.documentation,
                feedback: extension.value.feedback,
                issues: extension.value.issues
            });
        }
        onDidAddViews(added) {
            // too late, already added to the view model
            const result = super.onDidAddViews(added);
            const remoteAuthority = this.environmentService.configuration.remoteAuthority;
            if (remoteAuthority) {
                const actualRemoteAuthority = remoteAuthority.split('+')[0];
                added.forEach((descriptor) => {
                    const panel = this.getView(descriptor.viewDescriptor.id);
                    if (!panel) {
                        return;
                    }
                    const descriptorAuthority = descriptor.viewDescriptor.remoteAuthority;
                    if (typeof descriptorAuthority === 'undefined') {
                        panel.setExpanded(true);
                    }
                    else if (descriptor.viewDescriptor.id === HelpPanel.ID) {
                        // Do nothing, keep the default behavior for Help
                    }
                    else {
                        const descriptorAuthorityArr = Array.isArray(descriptorAuthority) ? descriptorAuthority : [descriptorAuthority];
                        if (descriptorAuthorityArr.indexOf(actualRemoteAuthority) >= 0) {
                            panel.setExpanded(true);
                        }
                        else {
                            panel.setExpanded(false);
                        }
                    }
                });
            }
            return result;
        }
        getTitle() {
            const title = nls.localize('remote.explorer', "Remote Explorer");
            return title;
        }
    };
    RemoteViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, extensions_1.IExtensionService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService)
    ], RemoteViewlet);
    exports.RemoteViewlet = RemoteViewlet;
    platform_1.Registry.as(viewlet_1.Extensions.Viewlets).registerViewlet(new viewlet_1.ViewletDescriptor(RemoteViewlet, remote_contribution_1.VIEWLET_ID, nls.localize('remote.explorer', "Remote Explorer"), 'codicon-remote-explorer', 4));
    let OpenRemoteViewletAction = class OpenRemoteViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, remote_contribution_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenRemoteViewletAction.ID = remote_contribution_1.VIEWLET_ID;
    OpenRemoteViewletAction.LABEL = nls.localize('toggleRemoteViewlet', "Show Remote Explorer");
    OpenRemoteViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService), __param(3, editorGroupsService_1.IEditorGroupsService), __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenRemoteViewletAction);
    // Register Action to Open Viewlet
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions).registerWorkbenchAction(new actions_2.SyncActionDescriptor(OpenRemoteViewletAction, remote_contribution_1.VIEWLET_ID, nls.localize('toggleRemoteViewlet', "Show Remote Explorer"), {
        primary: 0
    }), 'View: Show Remote Explorer', nls.localize('view', "View"));
    class ProgressReporter {
        constructor(currentProgress) {
            this._currentProgress = null;
            this.lastReport = null;
            this._currentProgress = currentProgress;
        }
        set currentProgress(progress) {
            this._currentProgress = progress;
        }
        report(message) {
            if (message) {
                this.lastReport = message;
            }
            if (this.lastReport && this._currentProgress) {
                this._currentProgress.report({ message: this.lastReport });
            }
        }
    }
    let RemoteAgentConnectionStatusListener = class RemoteAgentConnectionStatusListener {
        constructor(remoteAgentService, progressService, dialogService, commandService, contextKeyService) {
            const connection = remoteAgentService.getConnection();
            if (connection) {
                let currentProgressPromiseResolve = null;
                let progressReporter = null;
                let lastLocation = null;
                let currentTimer = null;
                let reconnectWaitEvent = null;
                let disposableListener = null;
                function showProgress(location, buttons) {
                    if (currentProgressPromiseResolve) {
                        currentProgressPromiseResolve();
                    }
                    const promise = new Promise((resolve) => currentProgressPromiseResolve = resolve);
                    lastLocation = location;
                    if (location === 20 /* Dialog */) {
                        // Show dialog
                        progressService.withProgress({ location: 20 /* Dialog */, buttons }, (progress) => { if (progressReporter) {
                            progressReporter.currentProgress = progress;
                        } return promise; }, (choice) => {
                            // Handle choice from dialog
                            if (choice === 0 && buttons && reconnectWaitEvent) {
                                reconnectWaitEvent.skipWait();
                            }
                            else {
                                showProgress(15 /* Notification */, buttons);
                            }
                            progressReporter.report();
                        });
                    }
                    else {
                        // Show notification
                        progressService.withProgress({ location: 15 /* Notification */, buttons }, (progress) => { if (progressReporter) {
                            progressReporter.currentProgress = progress;
                        } return promise; }, (choice) => {
                            // Handle choice from notification
                            if (choice === 0 && buttons && reconnectWaitEvent) {
                                reconnectWaitEvent.skipWait();
                            }
                            else {
                                hideProgress();
                            }
                        });
                    }
                }
                function hideProgress() {
                    if (currentProgressPromiseResolve) {
                        currentProgressPromiseResolve();
                    }
                    currentProgressPromiseResolve = null;
                }
                connection.onDidStateChange((e) => {
                    if (currentTimer) {
                        currentTimer.dispose();
                        currentTimer = null;
                    }
                    if (disposableListener) {
                        disposableListener.dispose();
                        disposableListener = null;
                    }
                    switch (e.type) {
                        case 0 /* ConnectionLost */:
                            if (!currentProgressPromiseResolve) {
                                progressReporter = new ProgressReporter(null);
                                showProgress(20 /* Dialog */, [nls.localize('reconnectNow', "Reconnect Now")]);
                            }
                            progressReporter.report(nls.localize('connectionLost', "Connection Lost"));
                            break;
                        case 1 /* ReconnectionWait */:
                            hideProgress();
                            reconnectWaitEvent = e;
                            showProgress(lastLocation || 15 /* Notification */, [nls.localize('reconnectNow', "Reconnect Now")]);
                            currentTimer = new ReconnectionTimer(progressReporter, Date.now() + 1000 * e.durationSeconds);
                            break;
                        case 2 /* ReconnectionRunning */:
                            hideProgress();
                            showProgress(lastLocation || 15 /* Notification */);
                            progressReporter.report(nls.localize('reconnectionRunning', "Attempting to reconnect..."));
                            // Register to listen for quick input is opened
                            disposableListener = contextKeyService.onDidChangeContext((contextKeyChangeEvent) => {
                                const reconnectInteraction = new Set(['inQuickOpen']);
                                if (contextKeyChangeEvent.affectsSome(reconnectInteraction)) {
                                    // Need to move from dialog if being shown and user needs to type in a prompt
                                    if (lastLocation === 20 /* Dialog */ && progressReporter !== null) {
                                        hideProgress();
                                        showProgress(15 /* Notification */);
                                        progressReporter.report();
                                    }
                                }
                            });
                            break;
                        case 3 /* ReconnectionPermanentFailure */:
                            hideProgress();
                            progressReporter = null;
                            dialogService.show(severity_1.default.Error, nls.localize('reconnectionPermanentFailure', "Cannot reconnect. Please reload the window."), [nls.localize('reloadWindow', "Reload Window"), nls.localize('cancel', "Cancel")], { cancelId: 1 }).then(result => {
                                // Reload the window
                                if (result.choice === 0) {
                                    commandService.executeCommand(windowActions_1.ReloadWindowAction.ID);
                                }
                            });
                            break;
                        case 4 /* ConnectionGain */:
                            hideProgress();
                            progressReporter = null;
                            break;
                    }
                });
            }
        }
    };
    RemoteAgentConnectionStatusListener = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, progress_1.IProgressService),
        __param(2, dialogs_1.IDialogService),
        __param(3, commands_1.ICommandService),
        __param(4, contextkey_1.IContextKeyService)
    ], RemoteAgentConnectionStatusListener);
    class ReconnectionTimer {
        constructor(progressReporter, completionTime) {
            this._progressReporter = progressReporter;
            this._completionTime = completionTime;
            this._token = setInterval(() => this._render(), 1000);
            this._render();
        }
        dispose() {
            clearInterval(this._token);
        }
        _render() {
            const remainingTimeMs = this._completionTime - Date.now();
            if (remainingTimeMs < 0) {
                return;
            }
            const remainingTime = Math.ceil(remainingTimeMs / 1000);
            if (remainingTime === 1) {
                this._progressReporter.report(nls.localize('reconnectionWaitOne', "Attempting to reconnect in {0} second...", remainingTime));
            }
            else {
                this._progressReporter.report(nls.localize('reconnectionWaitMany', "Attempting to reconnect in {0} seconds...", remainingTime));
            }
        }
    }
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RemoteAgentConnectionStatusListener, 4 /* Eventually */);
});
//# sourceMappingURL=remote.js.map