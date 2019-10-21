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
define(["require", "exports", "vs/nls", "os", "vs/platform/product/common/product", "vs/base/common/actions", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/platform/list/browser/listService", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/base/common/async", "electron", "vs/platform/contextview/browser/contextView", "vs/platform/electron/node/electron", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/base/common/decorators", "vs/base/common/arrays", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/electron-browser/runtimeExtensionsInput", "vs/workbench/contrib/debug/common/debug", "vs/platform/dialogs/common/dialogs", "vs/base/node/ports", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/label/common/label", "vs/base/browser/ui/codiconLabel/codiconLabel", "vs/platform/extensions/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/workbench/contrib/extensions/electron-browser/extensionsSlowActions", "vs/workbench/services/environment/common/environmentService", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/css!./media/runtimeExtensionsEditor"], function (require, exports, nls, os, product_1, actions_1, baseEditor_1, telemetry_1, instantiation_1, extensions_1, themeService_1, editorService_1, extensions_2, listService_1, dom_1, actionbar_1, lifecycle_1, async_1, electron_1, contextView_1, electron_2, pfs_1, environment_1, decorators_1, arrays_1, notification_1, runtimeExtensionsInput_1, debug_1, dialogs_1, ports_1, contextkey_1, storage_1, label_1, codiconLabel_1, extensions_3, remoteHosts_1, extensionsSlowActions_1, environmentService_1, opener_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionHostProfileService = instantiation_1.createDecorator('extensionHostProfileService');
    exports.CONTEXT_PROFILE_SESSION_STATE = new contextkey_1.RawContextKey('profileSessionState', 'none');
    exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED = new contextkey_1.RawContextKey('extensionHostProfileRecorded', false);
    var ProfileSessionState;
    (function (ProfileSessionState) {
        ProfileSessionState[ProfileSessionState["None"] = 0] = "None";
        ProfileSessionState[ProfileSessionState["Starting"] = 1] = "Starting";
        ProfileSessionState[ProfileSessionState["Running"] = 2] = "Running";
        ProfileSessionState[ProfileSessionState["Stopping"] = 3] = "Stopping";
    })(ProfileSessionState = exports.ProfileSessionState || (exports.ProfileSessionState = {}));
    let RuntimeExtensionsEditor = class RuntimeExtensionsEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, contextKeyService, _extensionsWorkbenchService, _extensionService, _notificationService, _contextMenuService, _instantiationService, _extensionHostProfileService, storageService, _labelService, _environmentService, _openerService) {
            super(RuntimeExtensionsEditor.ID, telemetryService, themeService, storageService);
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._extensionHostProfileService = _extensionHostProfileService;
            this._labelService = _labelService;
            this._environmentService = _environmentService;
            this._openerService = _openerService;
            this._list = null;
            this._profileInfo = this._extensionHostProfileService.lastProfile;
            this._register(this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this._profileInfo = this._extensionHostProfileService.lastProfile;
                this._extensionsHostRecorded.set(!!this._profileInfo);
                this._updateExtensions();
            }));
            this._register(this._extensionHostProfileService.onDidChangeState(() => {
                const state = this._extensionHostProfileService.state;
                this._profileSessionState.set(ProfileSessionState[state].toLowerCase());
            }));
            this._elements = null;
            this._extensionsDescriptions = [];
            this._updateExtensions();
            this._profileSessionState = exports.CONTEXT_PROFILE_SESSION_STATE.bindTo(contextKeyService);
            this._extensionsHostRecorded = exports.CONTEXT_EXTENSION_HOST_PROFILE_RECORDED.bindTo(contextKeyService);
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._updateExtensions(), 200));
            this._extensionService.getExtensions().then((extensions) => {
                // We only deal with extensions with source code!
                this._extensionsDescriptions = extensions.filter((extension) => {
                    return !!extension.main;
                });
                this._updateExtensions();
            });
            this._register(this._extensionService.onDidChangeExtensionsStatus(() => this._updateSoon.schedule()));
        }
        _updateExtensions() {
            this._elements = this._resolveExtensions();
            if (this._list) {
                this._list.splice(0, this._list.length, this._elements);
            }
        }
        _resolveExtensions() {
            let marketplaceMap = Object.create(null);
            for (let extension of this._extensionsWorkbenchService.local) {
                marketplaceMap[extensions_3.ExtensionIdentifier.toKey(extension.identifier.id)] = extension;
            }
            let statusMap = this._extensionService.getExtensionsStatus();
            // group profile segments by extension
            let segments = Object.create(null);
            if (this._profileInfo) {
                let currentStartTime = this._profileInfo.startTime;
                for (let i = 0, len = this._profileInfo.deltas.length; i < len; i++) {
                    const id = this._profileInfo.ids[i];
                    const delta = this._profileInfo.deltas[i];
                    let extensionSegments = segments[extensions_3.ExtensionIdentifier.toKey(id)];
                    if (!extensionSegments) {
                        extensionSegments = [];
                        segments[extensions_3.ExtensionIdentifier.toKey(id)] = extensionSegments;
                    }
                    extensionSegments.push(currentStartTime);
                    currentStartTime = currentStartTime + delta;
                    extensionSegments.push(currentStartTime);
                }
            }
            let result = [];
            for (let i = 0, len = this._extensionsDescriptions.length; i < len; i++) {
                const extensionDescription = this._extensionsDescriptions[i];
                let profileInfo = null;
                if (this._profileInfo) {
                    let extensionSegments = segments[extensions_3.ExtensionIdentifier.toKey(extensionDescription.identifier)] || [];
                    let extensionTotalTime = 0;
                    for (let j = 0, lenJ = extensionSegments.length / 2; j < lenJ; j++) {
                        const startTime = extensionSegments[2 * j];
                        const endTime = extensionSegments[2 * j + 1];
                        extensionTotalTime += (endTime - startTime);
                    }
                    profileInfo = {
                        segments: extensionSegments,
                        totalTime: extensionTotalTime
                    };
                }
                result[i] = {
                    originalIndex: i,
                    description: extensionDescription,
                    marketplaceInfo: marketplaceMap[extensions_3.ExtensionIdentifier.toKey(extensionDescription.identifier)],
                    status: statusMap[extensionDescription.identifier.value],
                    profileInfo: profileInfo || undefined,
                    unresponsiveProfile: this._extensionHostProfileService.getUnresponsiveProfile(extensionDescription.identifier)
                };
            }
            result = result.filter(element => element.status.activationTimes);
            // bubble up extensions that have caused slowness
            result = result.sort((a, b) => {
                if (a.unresponsiveProfile === this._profileInfo && !b.unresponsiveProfile) {
                    return -1;
                }
                else if (!a.unresponsiveProfile && b.unresponsiveProfile === this._profileInfo) {
                    return 1;
                }
                return a.originalIndex - b.originalIndex;
            });
            return result;
        }
        createEditor(parent) {
            dom_1.addClass(parent, 'runtime-extensions-editor');
            const TEMPLATE_ID = 'runtimeExtensionElementTemplate';
            const delegate = new class {
                getHeight(element) {
                    return 62;
                }
                getTemplateId(element) {
                    return TEMPLATE_ID;
                }
            };
            const renderer = {
                templateId: TEMPLATE_ID,
                renderTemplate: (root) => {
                    const element = dom_1.append(root, dom_1.$('.extension'));
                    const desc = dom_1.append(element, dom_1.$('div.desc'));
                    const name = dom_1.append(desc, dom_1.$('div.name'));
                    const msgContainer = dom_1.append(desc, dom_1.$('div.msg'));
                    const actionbar = new actionbar_1.ActionBar(desc, { animated: false });
                    actionbar.onDidRun(({ error }) => error && this._notificationService.error(error));
                    const timeContainer = dom_1.append(element, dom_1.$('.time'));
                    const activationTime = dom_1.append(timeContainer, dom_1.$('div.activation-time'));
                    const profileTime = dom_1.append(timeContainer, dom_1.$('div.profile-time'));
                    const disposables = [actionbar];
                    return {
                        root,
                        element,
                        name,
                        actionbar,
                        activationTime,
                        profileTime,
                        msgContainer,
                        disposables,
                        elementDisposables: []
                    };
                },
                renderElement: (element, index, data) => {
                    data.elementDisposables = lifecycle_1.dispose(data.elementDisposables);
                    dom_1.toggleClass(data.root, 'odd', index % 2 === 1);
                    data.name.textContent = element.marketplaceInfo ? element.marketplaceInfo.displayName : element.description.displayName || '';
                    const activationTimes = element.status.activationTimes;
                    let syncTime = activationTimes.codeLoadingTime + activationTimes.activateCallTime;
                    data.activationTime.textContent = activationTimes.activationReason.startup ? `Startup Activation: ${syncTime}ms` : `Activation: ${syncTime}ms`;
                    data.actionbar.clear();
                    if (element.unresponsiveProfile) {
                        data.actionbar.push(this._instantiationService.createInstance(extensionsSlowActions_1.SlowExtensionAction, element.description, element.unresponsiveProfile), { icon: true, label: true });
                    }
                    if (arrays_1.isNonEmptyArray(element.status.runtimeErrors)) {
                        data.actionbar.push(new ReportExtensionIssueAction(element, this._openerService), { icon: true, label: true });
                    }
                    let title;
                    const activationId = activationTimes.activationReason.extensionId.value;
                    const activationEvent = activationTimes.activationReason.activationEvent;
                    if (activationEvent === '*') {
                        title = nls.localize('starActivation', "Activated by {0} on start-up", activationId);
                    }
                    else if (/^workspaceContains:/.test(activationEvent)) {
                        let fileNameOrGlob = activationEvent.substr('workspaceContains:'.length);
                        if (fileNameOrGlob.indexOf('*') >= 0 || fileNameOrGlob.indexOf('?') >= 0) {
                            title = nls.localize({
                                key: 'workspaceContainsGlobActivation',
                                comment: [
                                    '{0} will be a glob pattern'
                                ]
                            }, "Activated by {1} because a file matching {1} exists in your workspace", fileNameOrGlob, activationId);
                        }
                        else {
                            title = nls.localize({
                                key: 'workspaceContainsFileActivation',
                                comment: [
                                    '{0} will be a file name'
                                ]
                            }, "Activated by {1} because file {0} exists in your workspace", fileNameOrGlob, activationId);
                        }
                    }
                    else if (/^workspaceContainsTimeout:/.test(activationEvent)) {
                        const glob = activationEvent.substr('workspaceContainsTimeout:'.length);
                        title = nls.localize({
                            key: 'workspaceContainsTimeout',
                            comment: [
                                '{0} will be a glob pattern'
                            ]
                        }, "Activated by {1} because searching for {0} took too long", glob, activationId);
                    }
                    else if (/^onLanguage:/.test(activationEvent)) {
                        let language = activationEvent.substr('onLanguage:'.length);
                        title = nls.localize('languageActivation', "Activated by {1} because you opened a {0} file", language, activationId);
                    }
                    else {
                        title = nls.localize({
                            key: 'workspaceGenericActivation',
                            comment: [
                                'The {0} placeholder will be an activation event, like e.g. \'language:typescript\', \'debug\', etc.'
                            ]
                        }, "Activated by {1} on {0}", activationEvent, activationId);
                    }
                    data.activationTime.title = title;
                    dom_1.clearNode(data.msgContainer);
                    if (this._extensionHostProfileService.getUnresponsiveProfile(element.description.identifier)) {
                        const el = dom_1.$('span');
                        el.innerHTML = codiconLabel_1.renderCodicons(` $(alert) Unresponsive`);
                        el.title = nls.localize('unresponsive.title', "Extension has caused the extension host to freeze.");
                        data.msgContainer.appendChild(el);
                    }
                    if (arrays_1.isNonEmptyArray(element.status.runtimeErrors)) {
                        const el = dom_1.$('span');
                        el.innerHTML = codiconLabel_1.renderCodicons(`$(bug) ${nls.localize('errors', "{0} uncaught errors", element.status.runtimeErrors.length)}`);
                        data.msgContainer.appendChild(el);
                    }
                    if (element.status.messages && element.status.messages.length > 0) {
                        const el = dom_1.$('span');
                        el.innerHTML = codiconLabel_1.renderCodicons(`$(alert) ${element.status.messages[0].message}`);
                        data.msgContainer.appendChild(el);
                    }
                    if (element.description.extensionLocation.scheme !== 'file') {
                        const el = dom_1.$('span');
                        el.innerHTML = codiconLabel_1.renderCodicons(`$(remote) ${element.description.extensionLocation.authority}`);
                        data.msgContainer.appendChild(el);
                        const hostLabel = this._labelService.getHostLabel(remoteHosts_1.REMOTE_HOST_SCHEME, this._environmentService.configuration.remoteAuthority);
                        if (hostLabel) {
                            el.innerHTML = codiconLabel_1.renderCodicons(`$(remote) ${hostLabel}`);
                        }
                    }
                    if (this._profileInfo && element.profileInfo) {
                        data.profileTime.textContent = `Profile: ${(element.profileInfo.totalTime / 1000).toFixed(2)}ms`;
                    }
                    else {
                        data.profileTime.textContent = '';
                    }
                },
                disposeTemplate: (data) => {
                    data.disposables = lifecycle_1.dispose(data.disposables);
                }
            };
            this._list = this._instantiationService.createInstance(listService_1.WorkbenchList, 'RuntimeExtensions', parent, delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false
            });
            this._list.splice(0, this._list.length, this._elements || undefined);
            this._list.onContextMenu((e) => {
                if (!e.element) {
                    return;
                }
                const actions = [];
                actions.push(new ReportExtensionIssueAction(e.element, this._openerService));
                actions.push(new actionbar_1.Separator());
                if (e.element.marketplaceInfo) {
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disableWorkspace', nls.localize('disable workspace', "Disable (Workspace)"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 3 /* DisabledWorkspace */)));
                    actions.push(new actions_1.Action('runtimeExtensionsEditor.action.disable', nls.localize('disable', "Disable"), undefined, true, () => this._extensionsWorkbenchService.setEnablement(e.element.marketplaceInfo, 2 /* DisabledGlobally */)));
                    actions.push(new actionbar_1.Separator());
                }
                const state = this._extensionHostProfileService.state;
                if (state === ProfileSessionState.Running) {
                    actions.push(this._instantiationService.createInstance(StopExtensionHostProfileAction, StopExtensionHostProfileAction.ID, StopExtensionHostProfileAction.LABEL));
                }
                else {
                    actions.push(this._instantiationService.createInstance(StartExtensionHostProfileAction, StartExtensionHostProfileAction.ID, StartExtensionHostProfileAction.LABEL));
                }
                actions.push(this.saveExtensionHostProfileAction);
                this._contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => actions
                });
            });
        }
        get saveExtensionHostProfileAction() {
            return this._instantiationService.createInstance(SaveExtensionHostProfileAction, SaveExtensionHostProfileAction.ID, SaveExtensionHostProfileAction.LABEL);
        }
        layout(dimension) {
            if (this._list) {
                this._list.layout(dimension.height);
            }
        }
    };
    RuntimeExtensionsEditor.ID = 'workbench.editor.runtimeExtensions';
    __decorate([
        decorators_1.memoize
    ], RuntimeExtensionsEditor.prototype, "saveExtensionHostProfileAction", null);
    RuntimeExtensionsEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, extensions_2.IExtensionService),
        __param(5, notification_1.INotificationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, exports.IExtensionHostProfileService),
        __param(9, storage_1.IStorageService),
        __param(10, label_1.ILabelService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, opener_1.IOpenerService)
    ], RuntimeExtensionsEditor);
    exports.RuntimeExtensionsEditor = RuntimeExtensionsEditor;
    let ShowRuntimeExtensionsAction = class ShowRuntimeExtensionsAction extends actions_1.Action {
        constructor(id, label, _editorService, _instantiationService) {
            super(id, label);
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
        }
        async run(e) {
            await this._editorService.openEditor(this._instantiationService.createInstance(runtimeExtensionsInput_1.RuntimeExtensionsInput), { revealIfOpened: true });
        }
    };
    ShowRuntimeExtensionsAction.ID = 'workbench.action.showRuntimeExtensions';
    ShowRuntimeExtensionsAction.LABEL = nls.localize('showRuntimeExtensions', "Show Running Extensions");
    ShowRuntimeExtensionsAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService)
    ], ShowRuntimeExtensionsAction);
    exports.ShowRuntimeExtensionsAction = ShowRuntimeExtensionsAction;
    let ReportExtensionIssueAction = class ReportExtensionIssueAction extends actions_1.Action {
        constructor(extension, openerService) {
            super(ReportExtensionIssueAction._id, ReportExtensionIssueAction._label, 'extension-action report-issue');
            this.openerService = openerService;
            this.enabled = extension.marketplaceInfo
                && extension.marketplaceInfo.type === 1 /* User */
                && !!extension.description.repository && !!extension.description.repository.url;
            this._url = ReportExtensionIssueAction._generateNewIssueUrl(extension);
        }
        async run() {
            this.openerService.open(uri_1.URI.parse(this._url));
        }
        static _generateNewIssueUrl(extension) {
            let baseUrl = extension.marketplaceInfo && extension.marketplaceInfo.type === 1 /* User */ && extension.description.repository ? extension.description.repository.url : undefined;
            if (!!baseUrl) {
                baseUrl = `${baseUrl.indexOf('.git') !== -1 ? baseUrl.substr(0, baseUrl.length - 4) : baseUrl}/issues/new/`;
            }
            else {
                baseUrl = product_1.default.reportIssueUrl;
            }
            let reason = 'Bug';
            let title = 'Extension issue';
            let message = ':warning: We have written the needed data into your clipboard. Please paste! :warning:';
            electron_1.clipboard.writeText('```json \n' + JSON.stringify(extension.status, null, '\t') + '\n```');
            const osVersion = `${os.type()} ${os.arch()} ${os.release()}`;
            const queryStringPrefix = baseUrl.indexOf('?') === -1 ? '?' : '&';
            const body = encodeURIComponent(`- Issue Type: \`${reason}\`
- Extension Name: \`${extension.description.name}\`
- Extension Version: \`${extension.description.version}\`
- OS Version: \`${osVersion}\`
- VSCode version: \`${product_1.default.version}\`\n\n${message}`);
            return `${baseUrl}${queryStringPrefix}body=${body}&title=${encodeURIComponent(title)}`;
        }
    };
    ReportExtensionIssueAction._id = 'workbench.extensions.action.reportExtensionIssue';
    ReportExtensionIssueAction._label = nls.localize('reportExtensionIssue', "Report Issue");
    ReportExtensionIssueAction = __decorate([
        __param(1, opener_1.IOpenerService)
    ], ReportExtensionIssueAction);
    exports.ReportExtensionIssueAction = ReportExtensionIssueAction;
    let DebugExtensionHostAction = class DebugExtensionHostAction extends actions_1.Action {
        constructor(_debugService, _electronService, _dialogService, _extensionService) {
            super(DebugExtensionHostAction.ID, DebugExtensionHostAction.LABEL, DebugExtensionHostAction.CSS_CLASS);
            this._debugService = _debugService;
            this._electronService = _electronService;
            this._dialogService = _dialogService;
            this._extensionService = _extensionService;
        }
        async run() {
            const inspectPort = await this._extensionService.getInspectPort(false);
            if (!inspectPort) {
                const res = await this._dialogService.confirm({
                    type: 'info',
                    message: nls.localize('restart1', "Profile Extensions"),
                    detail: nls.localize('restart2', "In order to profile extensions a restart is required. Do you want to restart '{0}' now?", product_1.default.nameLong),
                    primaryButton: nls.localize('restart3', "Restart"),
                    secondaryButton: nls.localize('cancel', "Cancel")
                });
                if (res.confirmed) {
                    await this._electronService.relaunch({ addArgs: [`--inspect-extensions=${ports_1.randomPort()}`] });
                }
                return;
            }
            return this._debugService.startDebugging(undefined, {
                type: 'node',
                name: nls.localize('debugExtensionHost.launch.name', "Attach Extension Host"),
                request: 'attach',
                port: inspectPort
            });
        }
    };
    DebugExtensionHostAction.ID = 'workbench.extensions.action.debugExtensionHost';
    DebugExtensionHostAction.LABEL = nls.localize('debugExtensionHost', "Start Debugging Extension Host");
    DebugExtensionHostAction.CSS_CLASS = 'debug-extension-host';
    DebugExtensionHostAction = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, electron_2.IElectronService),
        __param(2, dialogs_1.IDialogService),
        __param(3, extensions_2.IExtensionService)
    ], DebugExtensionHostAction);
    exports.DebugExtensionHostAction = DebugExtensionHostAction;
    let StartExtensionHostProfileAction = class StartExtensionHostProfileAction extends actions_1.Action {
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.startProfiling();
            return Promise.resolve();
        }
    };
    StartExtensionHostProfileAction.ID = 'workbench.extensions.action.extensionHostProfile';
    StartExtensionHostProfileAction.LABEL = nls.localize('extensionHostProfileStart', "Start Extension Host Profile");
    StartExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StartExtensionHostProfileAction);
    exports.StartExtensionHostProfileAction = StartExtensionHostProfileAction;
    let StopExtensionHostProfileAction = class StopExtensionHostProfileAction extends actions_1.Action {
        constructor(id = StartExtensionHostProfileAction.ID, label = StartExtensionHostProfileAction.LABEL, _extensionHostProfileService) {
            super(id, label);
            this._extensionHostProfileService = _extensionHostProfileService;
        }
        run() {
            this._extensionHostProfileService.stopProfiling();
            return Promise.resolve();
        }
    };
    StopExtensionHostProfileAction.ID = 'workbench.extensions.action.stopExtensionHostProfile';
    StopExtensionHostProfileAction.LABEL = nls.localize('stopExtensionHostProfileStart', "Stop Extension Host Profile");
    StopExtensionHostProfileAction = __decorate([
        __param(2, exports.IExtensionHostProfileService)
    ], StopExtensionHostProfileAction);
    exports.StopExtensionHostProfileAction = StopExtensionHostProfileAction;
    let SaveExtensionHostProfileAction = class SaveExtensionHostProfileAction extends actions_1.Action {
        constructor(id = SaveExtensionHostProfileAction.ID, label = SaveExtensionHostProfileAction.LABEL, _electronService, _environmentService, _extensionHostProfileService) {
            super(id, label, undefined, false);
            this._electronService = _electronService;
            this._environmentService = _environmentService;
            this._extensionHostProfileService = _extensionHostProfileService;
            this._extensionHostProfileService.onDidChangeLastProfile(() => {
                this.enabled = (this._extensionHostProfileService.lastProfile !== null);
            });
        }
        run() {
            return Promise.resolve(this._asyncRun());
        }
        async _asyncRun() {
            let picked = await this._electronService.showSaveDialog({
                title: 'Save Extension Host Profile',
                buttonLabel: 'Save',
                defaultPath: `CPU-${new Date().toISOString().replace(/[\-:]/g, '')}.cpuprofile`,
                filters: [{
                        name: 'CPU Profiles',
                        extensions: ['cpuprofile', 'txt']
                    }]
            });
            if (!picked || !picked.filePath || picked.canceled) {
                return;
            }
            const profileInfo = this._extensionHostProfileService.lastProfile;
            let dataToWrite = profileInfo ? profileInfo.data : {};
            let savePath = picked.filePath;
            if (this._environmentService.isBuilt) {
                const profiler = await new Promise((resolve_1, reject_1) => { require(['v8-inspect-profiler'], resolve_1, reject_1); });
                // when running from a not-development-build we remove
                // absolute filenames because we don't want to reveal anything
                // about users. We also append the `.txt` suffix to make it
                // easier to attach these files to GH issues
                let tmp = profiler.rewriteAbsolutePaths({ profile: dataToWrite }, 'piiRemoved');
                dataToWrite = tmp.profile;
                savePath = savePath + '.txt';
            }
            return pfs_1.writeFile(savePath, JSON.stringify(profileInfo ? profileInfo.data : {}, null, '\t'));
        }
    };
    SaveExtensionHostProfileAction.LABEL = nls.localize('saveExtensionHostProfile', "Save Extension Host Profile");
    SaveExtensionHostProfileAction.ID = 'workbench.extensions.action.saveExtensionHostProfile';
    SaveExtensionHostProfileAction = __decorate([
        __param(2, electron_2.IElectronService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, exports.IExtensionHostProfileService)
    ], SaveExtensionHostProfileAction);
    exports.SaveExtensionHostProfileAction = SaveExtensionHostProfileAction;
});
//# sourceMappingURL=runtimeExtensionsEditor.js.map