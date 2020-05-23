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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/browser/parts/editor/editorWidgets", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/contrib/output/common/output", "vs/workbench/contrib/userDataSync/browser/userDataSyncTrigger", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/platform/authentication/common/authentication", "vs/base/common/date", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/opener/common/opener", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/contrib/userDataSync/browser/userDataSyncAccount"], function (require, exports, actions_1, errorMessage_1, errors_1, event_1, lifecycle_1, platform_1, resources_1, uri_1, editorExtensions_1, modelService_1, modeService_1, resolverService_1, nls_1, actions_2, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, notification_1, quickInput_1, telemetry_1, userDataSync_1, editorWidgets_1, editor_1, diffEditorInput_1, Constants, output_1, userDataSyncTrigger_1, activity_1, editorService_1, environmentService_1, preferences_1, authentication_1, date_1, productService_1, storage_1, opener_1, authenticationService_1, userDataSyncAccount_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchContribution = void 0;
    const CONTEXT_CONFLICTS_SOURCES = new contextkey_1.RawContextKey('conflictsSources', '');
    function getSyncAreaLabel(source) {
        switch (source) {
            case "settings" /* Settings */: return nls_1.localize('settings', "Settings");
            case "keybindings" /* Keybindings */: return nls_1.localize('keybindings', "Keyboard Shortcuts");
            case "snippets" /* Snippets */: return nls_1.localize('snippets', "User Snippets");
            case "extensions" /* Extensions */: return nls_1.localize('extensions', "Extensions");
            case "globalState" /* GlobalState */: return nls_1.localize('ui state label', "UI State");
        }
    }
    const turnOnSyncCommand = { id: 'workbench.userData.actions.syncStart', title: nls_1.localize('turn on sync with category', "Preferences Sync: Turn On...") };
    const stopSyncCommand = { id: 'workbench.userData.actions.stopSync', title: nls_1.localize('stop sync', "Preferences Sync: Turn Off") };
    const resolveSettingsConflictsCommand = { id: 'workbench.userData.actions.resolveSettingsConflicts', title: nls_1.localize('showConflicts', "Preferences Sync: Show Settings Conflicts") };
    const resolveKeybindingsConflictsCommand = { id: 'workbench.userData.actions.resolveKeybindingsConflicts', title: nls_1.localize('showKeybindingsConflicts', "Preferences Sync: Show Keybindings Conflicts") };
    const resolveSnippetsConflictsCommand = { id: 'workbench.userData.actions.resolveSnippetsConflicts', title: nls_1.localize('showSnippetsConflicts', "Preferences Sync: Show User Snippets Conflicts") };
    const configureSyncCommand = { id: 'workbench.userData.actions.configureSync', title: nls_1.localize('configure sync', "Preferences Sync: Configure...") };
    const showSyncActivityCommand = {
        id: 'workbench.userData.actions.showSyncActivity',
        title: nls_1.localize('show sync log', "Preferences Sync: Show Log"),
        description(userDataSyncService) {
            if (userDataSyncService.status === "syncing" /* Syncing */) {
                return nls_1.localize('sync is on with syncing', "syncing");
            }
            if (userDataSyncService.lastSyncTime) {
                return nls_1.localize('sync is on with time', "synced {0}", date_1.fromNow(userDataSyncService.lastSyncTime, true));
            }
            return undefined;
        }
    };
    const showSyncSettingsCommand = { id: 'workbench.userData.actions.syncSettings', title: nls_1.localize('sync settings', "Preferences Sync: Show Settings"), };
    const CONTEXT_TURNING_ON_STATE = new contextkey_1.RawContextKey('userDataSyncTurningOn', false);
    const CONTEXT_ACCOUNT_STATE = new contextkey_1.RawContextKey('userDataSyncAccountStatus', "uninitialized" /* Uninitialized */);
    let UserDataSyncWorkbenchContribution = /** @class */ (() => {
        let UserDataSyncWorkbenchContribution = class UserDataSyncWorkbenchContribution extends lifecycle_1.Disposable {
            constructor(userDataSyncEnablementService, userDataSyncService, contextKeyService, activityService, notificationService, editorService, workbenchEnvironmentService, dialogService, quickInputService, instantiationService, outputService, authTokenService, userDataAutoSyncService, textModelResolverService, preferencesService, telemetryService, productService, storageService, openerService, authenticationService) {
                super();
                this.userDataSyncEnablementService = userDataSyncEnablementService;
                this.userDataSyncService = userDataSyncService;
                this.activityService = activityService;
                this.notificationService = notificationService;
                this.editorService = editorService;
                this.workbenchEnvironmentService = workbenchEnvironmentService;
                this.dialogService = dialogService;
                this.quickInputService = quickInputService;
                this.outputService = outputService;
                this.authTokenService = authTokenService;
                this.textModelResolverService = textModelResolverService;
                this.preferencesService = preferencesService;
                this.telemetryService = telemetryService;
                this.productService = productService;
                this.storageService = storageService;
                this.openerService = openerService;
                this.authenticationService = authenticationService;
                this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
                this.conflictsDisposables = new Map();
                this.invalidContentErrorDisposables = new Map();
                this._snippetsConflictsActionsDisposable = new lifecycle_1.DisposableStore();
                this.turningOnSyncContext = CONTEXT_TURNING_ON_STATE.bindTo(contextKeyService);
                this.syncEnablementContext = userDataSync_1.CONTEXT_SYNC_ENABLEMENT.bindTo(contextKeyService);
                this.syncStatusContext = userDataSync_1.CONTEXT_SYNC_STATE.bindTo(contextKeyService);
                this.accountStatusContext = CONTEXT_ACCOUNT_STATE.bindTo(contextKeyService);
                this.conflictsSources = CONTEXT_CONFLICTS_SOURCES.bindTo(contextKeyService);
                this.userDataSyncAccounts = instantiationService.createInstance(userDataSyncAccount_1.UserDataSyncAccounts);
                if (this.userDataSyncAccounts.authenticationProviders.length) {
                    userDataSync_1.registerConfiguration();
                    this.onDidChangeSyncStatus(this.userDataSyncService.status);
                    this.onDidChangeConflicts(this.userDataSyncService.conflicts);
                    this.onDidChangeEnablement(this.userDataSyncEnablementService.isEnabled());
                    this.onDidChangeAccountStatus(this.userDataSyncAccounts.status);
                    this._register(event_1.Event.debounce(userDataSyncService.onDidChangeStatus, () => undefined, 500)(() => this.onDidChangeSyncStatus(this.userDataSyncService.status)));
                    this._register(userDataSyncService.onDidChangeConflicts(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                    this._register(userDataSyncService.onSyncErrors(errors => this.onSyncErrors(errors)));
                    this._register(this.userDataSyncEnablementService.onDidChangeEnablement(enabled => this.onDidChangeEnablement(enabled)));
                    this._register(userDataAutoSyncService.onError(error => this.onAutoSyncError(error)));
                    this._register(this.userDataSyncAccounts.onDidChangeStatus(status => this.onDidChangeAccountStatus(status)));
                    this._register(this.userDataSyncAccounts.onDidSignOut(() => this.doTurnOff(false)));
                    this.registerActions();
                    textModelResolverService.registerTextModelContentProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, instantiationService.createInstance(UserDataRemoteContentProvider));
                    editorExtensions_1.registerEditorContribution(AcceptChangesContribution.ID, AcceptChangesContribution);
                    if (!platform_1.isWeb) {
                        this._register(instantiationService.createInstance(userDataSyncTrigger_1.UserDataSyncTrigger).onDidTriggerSync(source => userDataAutoSyncService.triggerAutoSync([source])));
                    }
                }
            }
            onDidChangeAccountStatus(status) {
                this.accountStatusContext.set(status);
                this.updateBadge();
            }
            onDidChangeSyncStatus(status) {
                this.syncStatusContext.set(status);
                this.updateBadge();
            }
            onDidChangeConflicts(conflicts) {
                this.updateBadge();
                if (conflicts.length) {
                    const conflictsSources = conflicts.map(conflict => conflict.syncResource);
                    this.conflictsSources.set(conflictsSources.join(','));
                    if (conflictsSources.indexOf("snippets" /* Snippets */) !== -1) {
                        this.registerShowSnippetsConflictsAction();
                    }
                    // Clear and dispose conflicts those were cleared
                    this.conflictsDisposables.forEach((disposable, conflictsSource) => {
                        if (conflictsSources.indexOf(conflictsSource) === -1) {
                            disposable.dispose();
                            this.conflictsDisposables.delete(conflictsSource);
                        }
                    });
                    for (const { syncResource, conflicts } of this.userDataSyncService.conflicts) {
                        const conflictsEditorInputs = this.getConflictsEditorInputs(syncResource);
                        // close stale conflicts editor previews
                        if (conflictsEditorInputs.length) {
                            conflictsEditorInputs.forEach(input => {
                                if (!conflicts.some(({ local }) => resources_1.isEqual(local, input.master.resource))) {
                                    input.dispose();
                                }
                            });
                        }
                        // Show conflicts notification if not shown before
                        else if (!this.conflictsDisposables.has(syncResource)) {
                            const conflictsArea = getSyncAreaLabel(syncResource);
                            const handle = this.notificationService.prompt(notification_1.Severity.Warning, nls_1.localize('conflicts detected', "Unable to sync due to conflicts in {0}. Please resolve them to continue.", conflictsArea.toLowerCase()), [
                                {
                                    label: nls_1.localize('accept remote', "Accept Remote"),
                                    run: () => {
                                        this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResource, action: 'acceptRemote' });
                                        this.acceptRemote(syncResource, conflicts);
                                    }
                                },
                                {
                                    label: nls_1.localize('accept local', "Accept Local"),
                                    run: () => {
                                        this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResource, action: 'acceptLocal' });
                                        this.acceptLocal(syncResource, conflicts);
                                    }
                                },
                                {
                                    label: nls_1.localize('show conflicts', "Show Conflicts"),
                                    run: () => {
                                        this.telemetryService.publicLog2('sync/showConflicts', { source: syncResource });
                                        this.handleConflicts({ syncResource, conflicts });
                                    }
                                }
                            ], {
                                sticky: true
                            });
                            this.conflictsDisposables.set(syncResource, lifecycle_1.toDisposable(() => {
                                // close the conflicts warning notification
                                handle.close();
                                // close opened conflicts editor previews
                                const conflictsEditorInputs = this.getConflictsEditorInputs(syncResource);
                                if (conflictsEditorInputs.length) {
                                    conflictsEditorInputs.forEach(input => input.dispose());
                                }
                                this.conflictsDisposables.delete(syncResource);
                            }));
                        }
                    }
                }
                else {
                    this.conflictsSources.reset();
                    this.getAllConflictsEditorInputs().forEach(input => input.dispose());
                    this.conflictsDisposables.forEach(disposable => disposable.dispose());
                    this.conflictsDisposables.clear();
                }
            }
            async acceptRemote(syncResource, conflicts) {
                try {
                    for (const conflict of conflicts) {
                        const modelRef = await this.textModelResolverService.createModelReference(conflict.remote);
                        await this.userDataSyncService.acceptConflict(conflict.remote, modelRef.object.textEditorModel.getValue());
                        modelRef.dispose();
                    }
                }
                catch (e) {
                    this.notificationService.error(e);
                }
            }
            async acceptLocal(syncResource, conflicts) {
                try {
                    for (const conflict of conflicts) {
                        const modelRef = await this.textModelResolverService.createModelReference(conflict.local);
                        await this.userDataSyncService.acceptConflict(conflict.local, modelRef.object.textEditorModel.getValue());
                        modelRef.dispose();
                    }
                }
                catch (e) {
                    this.notificationService.error(e);
                }
            }
            onDidChangeEnablement(enabled) {
                this.syncEnablementContext.set(enabled);
                this.updateBadge();
            }
            onAutoSyncError(error) {
                switch (error.code) {
                    case userDataSync_1.UserDataSyncErrorCode.TurnedOff:
                    case userDataSync_1.UserDataSyncErrorCode.SessionExpired:
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: nls_1.localize('turned off', "Preferences sync was turned off from another device."),
                            actions: {
                                primary: [new actions_1.Action('turn on sync', nls_1.localize('turn on sync', "Turn on Preferences Sync..."), undefined, true, () => this.turnOn())]
                            }
                        });
                        return;
                    case userDataSync_1.UserDataSyncErrorCode.TooLarge:
                        if (error.resource === "keybindings" /* Keybindings */ || error.resource === "settings" /* Settings */) {
                            this.disableSync(error.resource);
                            const sourceArea = getSyncAreaLabel(error.resource);
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: nls_1.localize('too large', "Disabled syncing {0} because size of the {1} file to sync is larger than {2}. Please open the file and reduce the size and enable sync", sourceArea.toLowerCase(), sourceArea.toLowerCase(), '100kb'),
                                actions: {
                                    primary: [new actions_1.Action('open sync file', nls_1.localize('open file', "Open {0} File", sourceArea), undefined, true, () => error.resource === "settings" /* Settings */ ? this.preferencesService.openGlobalSettings(true) : this.preferencesService.openGlobalKeybindingSettings(true))]
                                }
                            });
                        }
                        return;
                    case userDataSync_1.UserDataSyncErrorCode.Incompatible:
                        this.disableSync();
                        this.notificationService.notify({
                            severity: notification_1.Severity.Error,
                            message: nls_1.localize('error incompatible', "Turned off sync because local data is incompatible with the data in the cloud. Please update {0} and turn on sync to continue syncing.", this.productService.nameLong),
                        });
                        return;
                }
            }
            onSyncErrors(errors) {
                if (errors.length) {
                    for (const [source, error] of errors) {
                        switch (error.code) {
                            case userDataSync_1.UserDataSyncErrorCode.LocalInvalidContent:
                                this.handleInvalidContentError(source);
                                break;
                            default:
                                const disposable = this.invalidContentErrorDisposables.get(source);
                                if (disposable) {
                                    disposable.dispose();
                                    this.invalidContentErrorDisposables.delete(source);
                                }
                        }
                    }
                }
                else {
                    this.invalidContentErrorDisposables.forEach(disposable => disposable.dispose());
                    this.invalidContentErrorDisposables.clear();
                }
            }
            handleInvalidContentError(source) {
                if (this.invalidContentErrorDisposables.has(source)) {
                    return;
                }
                if (source !== "settings" /* Settings */ && source !== "keybindings" /* Keybindings */) {
                    return;
                }
                const resource = source === "settings" /* Settings */ ? this.workbenchEnvironmentService.settingsResource : this.workbenchEnvironmentService.keybindingsResource;
                if (resources_1.isEqual(resource, editor_1.toResource(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.MASTER }))) {
                    // Do not show notification if the file in error is active
                    return;
                }
                const errorArea = getSyncAreaLabel(source);
                const handle = this.notificationService.notify({
                    severity: notification_1.Severity.Error,
                    message: nls_1.localize('errorInvalidConfiguration', "Unable to sync {0} because there are some errors/warnings in the file. Please open the file to correct errors/warnings in it.", errorArea.toLowerCase()),
                    actions: {
                        primary: [new actions_1.Action('open sync file', nls_1.localize('open file', "Open {0} File", errorArea), undefined, true, () => source === "settings" /* Settings */ ? this.preferencesService.openGlobalSettings(true) : this.preferencesService.openGlobalKeybindingSettings(true))]
                    }
                });
                this.invalidContentErrorDisposables.set(source, lifecycle_1.toDisposable(() => {
                    // close the error warning notification
                    handle.close();
                    this.invalidContentErrorDisposables.delete(source);
                }));
            }
            async updateBadge() {
                this.badgeDisposable.clear();
                let badge = undefined;
                let clazz;
                let priority = undefined;
                if (this.userDataSyncService.status !== "uninitialized" /* Uninitialized */ && this.userDataSyncEnablementService.isEnabled() && this.userDataSyncAccounts.status === "unavailable" /* Unavailable */) {
                    badge = new activity_1.NumberBadge(1, () => nls_1.localize('sign in to sync preferences', "Sign in to Sync Preferences"));
                }
                else if (this.userDataSyncService.conflicts.length) {
                    badge = new activity_1.NumberBadge(this.userDataSyncService.conflicts.reduce((result, syncResourceConflict) => { return result + syncResourceConflict.conflicts.length; }, 0), () => nls_1.localize('has conflicts', "Preferences Sync: Conflicts Detected"));
                }
                else if (this.turningOnSync) {
                    badge = new activity_1.ProgressBadge(() => nls_1.localize('turning on syncing', "Turning on Preferences Sync..."));
                    clazz = 'progress-badge';
                    priority = 1;
                }
                if (badge) {
                    this.badgeDisposable.value = this.activityService.showGlobalActivity({ badge, clazz, priority });
                }
            }
            get turningOnSync() {
                return !!this.turningOnSyncContext.get();
            }
            set turningOnSync(turningOn) {
                this.turningOnSyncContext.set(turningOn);
                this.updateBadge();
            }
            async turnOn() {
                this.turningOnSync = true;
                try {
                    if (!this.storageService.getBoolean('sync.donotAskPreviewConfirmation', 0 /* GLOBAL */, false)) {
                        if (!await this.askForConfirmation()) {
                            return;
                        }
                    }
                    const turnOn = await this.askToConfigure();
                    if (!turnOn) {
                        return;
                    }
                    await this.doTurnOn();
                    this.storageService.store('sync.donotAskPreviewConfirmation', true, 0 /* GLOBAL */);
                }
                finally {
                    this.turningOnSync = false;
                }
            }
            async askForConfirmation() {
                const result = await this.dialogService.show(notification_1.Severity.Info, nls_1.localize('sync preview message', "Synchronizing your preferences is a preview feature, please read the documentation before turning it on."), [
                    nls_1.localize('open doc', "Open Documentation"),
                    nls_1.localize('turn on', "Turn On"),
                    nls_1.localize('cancel', "Cancel"),
                ], {
                    cancelId: 2
                });
                switch (result.choice) {
                    case 0:
                        this.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-settings-sync-help'));
                        return false;
                    case 2: return false;
                }
                return true;
            }
            async askToConfigure() {
                return new Promise((c, e) => {
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = this.quickInputService.createQuickPick();
                    disposables.add(quickPick);
                    quickPick.title = nls_1.localize('Preferences Sync Title', "Preferences Sync");
                    quickPick.ok = false;
                    quickPick.customButton = true;
                    if (this.userDataSyncAccounts.all.length) {
                        quickPick.customLabel = nls_1.localize('turn on', "Turn On");
                    }
                    else {
                        const orTerm = nls_1.localize({ key: 'or', comment: ['Here is the context where it is used - Sign in with your A or B or C account to synchronize your data across devices.'] }, "or");
                        const displayName = this.userDataSyncAccounts.authenticationProviders.length === 1
                            ? this.authenticationService.getDisplayName(this.userDataSyncAccounts.authenticationProviders[0].id)
                            : this.userDataSyncAccounts.authenticationProviders.map(({ id }) => this.authenticationService.getDisplayName(id)).join(` ${orTerm} `);
                        quickPick.description = nls_1.localize('sign in and turn on sync detail', "Sign in with your {0} account to synchronize your data across devices.", displayName);
                        quickPick.customLabel = nls_1.localize('sign in and turn on sync', "Sign in & Turn on");
                    }
                    quickPick.placeholder = nls_1.localize('configure sync placeholder', "Choose what to sync");
                    quickPick.canSelectMany = true;
                    quickPick.ignoreFocusOut = true;
                    const items = this.getConfigureSyncQuickPickItems();
                    quickPick.items = items;
                    quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                    let accepted = false;
                    disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(() => {
                        accepted = true;
                        quickPick.hide();
                    }));
                    disposables.add(quickPick.onDidHide(() => {
                        try {
                            if (accepted) {
                                this.updateConfiguration(items, quickPick.selectedItems);
                            }
                            c(accepted);
                        }
                        catch (error) {
                            e(error);
                        }
                        finally {
                            disposables.dispose();
                        }
                    }));
                    quickPick.show();
                });
            }
            async doTurnOn() {
                const picked = await this.userDataSyncAccounts.pick();
                if (!picked) {
                    throw errors_1.canceled();
                }
                // User did not pick an account or login failed
                if (this.userDataSyncAccounts.status !== "available" /* Available */) {
                    throw new Error(nls_1.localize('no account', "No account available"));
                }
                await this.handleFirstTimeSync();
                this.userDataSyncEnablementService.setEnablement(true);
                this.notificationService.info(nls_1.localize('sync turned on', "Preferences sync is turned on"));
            }
            getConfigureSyncQuickPickItems() {
                return [{
                        id: "settings" /* Settings */,
                        label: getSyncAreaLabel("settings" /* Settings */)
                    }, {
                        id: "keybindings" /* Keybindings */,
                        label: getSyncAreaLabel("keybindings" /* Keybindings */)
                    }, {
                        id: "snippets" /* Snippets */,
                        label: getSyncAreaLabel("snippets" /* Snippets */)
                    }, {
                        id: "extensions" /* Extensions */,
                        label: getSyncAreaLabel("extensions" /* Extensions */)
                    }, {
                        id: "globalState" /* GlobalState */,
                        label: getSyncAreaLabel("globalState" /* GlobalState */),
                    }];
            }
            updateConfiguration(items, selectedItems) {
                for (const item of items) {
                    const wasEnabled = this.userDataSyncEnablementService.isResourceEnabled(item.id);
                    const isEnabled = !!selectedItems.filter(selected => selected.id === item.id)[0];
                    if (wasEnabled !== isEnabled) {
                        this.userDataSyncEnablementService.setResourceEnablement(item.id, isEnabled);
                    }
                }
            }
            async configureSyncOptions() {
                return new Promise((c, e) => {
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = this.quickInputService.createQuickPick();
                    disposables.add(quickPick);
                    quickPick.title = nls_1.localize('configure sync', "Preferences Sync: Configure...");
                    quickPick.placeholder = nls_1.localize('configure sync placeholder', "Choose what to sync");
                    quickPick.canSelectMany = true;
                    quickPick.ignoreFocusOut = true;
                    quickPick.ok = true;
                    const items = this.getConfigureSyncQuickPickItems();
                    quickPick.items = items;
                    quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                    disposables.add(quickPick.onDidAccept(async () => {
                        if (quickPick.selectedItems.length) {
                            this.updateConfiguration(items, quickPick.selectedItems);
                            quickPick.hide();
                        }
                    }));
                    disposables.add(quickPick.onDidHide(() => {
                        disposables.dispose();
                        c();
                    }));
                    quickPick.show();
                });
            }
            async handleFirstTimeSync() {
                const isFirstSyncWithMerge = await this.userDataSyncService.isFirstTimeSyncWithMerge();
                if (!isFirstSyncWithMerge) {
                    return;
                }
                const result = await this.dialogService.show(notification_1.Severity.Info, nls_1.localize('firs time sync', "Sync"), [
                    nls_1.localize('merge', "Merge"),
                    nls_1.localize('cancel', "Cancel"),
                    nls_1.localize('replace', "Replace Local"),
                ], {
                    cancelId: 1,
                    detail: nls_1.localize('first time sync detail', "It looks like this is the first time sync is set up.\nWould you like to merge or replace with the data from the cloud?"),
                });
                switch (result.choice) {
                    case 0:
                        this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'merge' });
                        break;
                    case 1:
                        this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'cancelled' });
                        throw errors_1.canceled();
                    case 2:
                        this.telemetryService.publicLog2('sync/firstTimeSync', { action: 'replace-local' });
                        await this.userDataSyncService.pull();
                        break;
                }
            }
            async turnOff() {
                const result = await this.dialogService.confirm({
                    type: 'info',
                    message: nls_1.localize('turn off sync confirmation', "Do you want to turn off sync?"),
                    detail: nls_1.localize('turn off sync detail', "Your settings, keybindings, extensions and UI State will no longer be synced."),
                    primaryButton: nls_1.localize('turn off', "Turn Off"),
                    checkbox: {
                        label: nls_1.localize('turn off sync everywhere', "Turn off sync on all your devices and clear the data from the cloud.")
                    }
                });
                if (result.confirmed) {
                    return this.doTurnOff(!!result.checkboxChecked);
                }
            }
            async doTurnOff(turnOffEveryWhere) {
                if (!this.userDataSyncEnablementService.isEnabled()) {
                    return;
                }
                if (!this.userDataSyncEnablementService.canToggleEnablement()) {
                    return;
                }
                if (turnOffEveryWhere) {
                    this.telemetryService.publicLog2('sync/turnOffEveryWhere');
                    await this.userDataSyncService.reset();
                }
                else {
                    await this.userDataSyncService.resetLocal();
                }
                this.disableSync();
            }
            disableSync(source) {
                if (source === undefined) {
                    this.userDataSyncEnablementService.setEnablement(false);
                }
                else {
                    switch (source) {
                        case "settings" /* Settings */: return this.userDataSyncEnablementService.setResourceEnablement("settings" /* Settings */, false);
                        case "keybindings" /* Keybindings */: return this.userDataSyncEnablementService.setResourceEnablement("keybindings" /* Keybindings */, false);
                        case "snippets" /* Snippets */: return this.userDataSyncEnablementService.setResourceEnablement("snippets" /* Snippets */, false);
                        case "extensions" /* Extensions */: return this.userDataSyncEnablementService.setResourceEnablement("extensions" /* Extensions */, false);
                        case "globalState" /* GlobalState */: return this.userDataSyncEnablementService.setResourceEnablement("globalState" /* GlobalState */, false);
                    }
                }
            }
            getConflictsEditorInputs(syncResource) {
                return this.editorService.editors.filter(input => {
                    const resource = input instanceof diffEditorInput_1.DiffEditorInput ? input.master.resource : input.resource;
                    return resource && userDataSync_1.getSyncResourceFromLocalPreview(resource, this.workbenchEnvironmentService) === syncResource;
                });
            }
            getAllConflictsEditorInputs() {
                return this.editorService.editors.filter(input => {
                    const resource = input instanceof diffEditorInput_1.DiffEditorInput ? input.master.resource : input.resource;
                    return resource && userDataSync_1.getSyncResourceFromLocalPreview(resource, this.workbenchEnvironmentService) !== undefined;
                });
            }
            async handleSyncResourceConflicts(resource) {
                const syncResourceCoflicts = this.userDataSyncService.conflicts.filter(({ syncResource }) => syncResource === resource)[0];
                if (syncResourceCoflicts) {
                    this.handleConflicts(syncResourceCoflicts);
                }
            }
            async handleConflicts({ syncResource, conflicts }) {
                for (const conflict of conflicts) {
                    let label = undefined;
                    if (syncResource === "settings" /* Settings */) {
                        label = nls_1.localize('settings conflicts preview', "Settings Conflicts (Remote ↔ Local)");
                    }
                    else if (syncResource === "keybindings" /* Keybindings */) {
                        label = nls_1.localize('keybindings conflicts preview', "Keybindings Conflicts (Remote ↔ Local)");
                    }
                    else if (syncResource === "snippets" /* Snippets */) {
                        label = nls_1.localize('snippets conflicts preview', "User Snippet Conflicts (Remote ↔ Local) - {0}", resources_1.basename(conflict.local));
                    }
                    await this.editorService.openEditor({
                        leftResource: conflict.remote,
                        rightResource: conflict.local,
                        label,
                        options: {
                            preserveFocus: false,
                            pinned: true,
                            revealIfVisible: true,
                        },
                    });
                }
            }
            showSyncActivity() {
                return this.outputService.showChannel(Constants.userDataSyncLogChannelId);
            }
            registerActions() {
                if (this.userDataSyncEnablementService.canToggleEnablement()) {
                    this.registerTurnOnSyncAction();
                    this.registerTurnOffSyncAction();
                }
                this.registerTurninOnSyncAction();
                this.registerSignInAction(); // When Sync is turned on from CLI
                this.registerShowSettingsConflictsAction();
                this.registerShowKeybindingsConflictsAction();
                this.registerShowSnippetsConflictsAction();
                this.registerSyncStatusAction();
                this.registerConfigureSyncAction();
                this.registerShowActivityAction();
                this.registerShowSettingsAction();
            }
            registerTurnOnSyncAction() {
                const turnOnSyncWhenContext = contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_1.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_ACCOUNT_STATE.notEqualsTo("uninitialized" /* Uninitialized */), CONTEXT_TURNING_ON_STATE.negate());
                commands_1.CommandsRegistry.registerCommand(turnOnSyncCommand.id, async () => {
                    try {
                        await this.turnOn();
                    }
                    catch (e) {
                        if (!errors_1.isPromiseCanceledError(e)) {
                            this.notificationService.error(nls_1.localize('turn on failed', "Error while starting Sync: {0}", errorMessage_1.toErrorMessage(e)));
                        }
                    }
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                    group: '5_sync',
                    command: {
                        id: turnOnSyncCommand.id,
                        title: nls_1.localize('global activity turn on sync', "Turn on Preferences Sync...")
                    },
                    when: turnOnSyncWhenContext,
                    order: 1
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                    command: turnOnSyncCommand,
                    when: turnOnSyncWhenContext,
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                    group: '5_sync',
                    command: {
                        id: turnOnSyncCommand.id,
                        title: nls_1.localize('global activity turn on sync', "Turn on Preferences Sync...")
                    },
                    when: turnOnSyncWhenContext,
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                    group: '1_sync',
                    command: {
                        id: turnOnSyncCommand.id,
                        title: nls_1.localize('global activity turn on sync', "Turn on Preferences Sync...")
                    },
                    when: turnOnSyncWhenContext
                });
            }
            registerTurninOnSyncAction() {
                const when = contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_1.CONTEXT_SYNC_ENABLEMENT.toNegated(), CONTEXT_ACCOUNT_STATE.notEqualsTo("uninitialized" /* Uninitialized */), CONTEXT_TURNING_ON_STATE);
                this._register(actions_2.registerAction2(class TurningOnSyncAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.userData.actions.turningOn',
                            title: nls_1.localize('turnin on sync', "Turning on Preferences Sync..."),
                            precondition: contextkey_1.ContextKeyExpr.false(),
                            menu: [{
                                    group: '5_sync',
                                    id: actions_2.MenuId.GlobalActivity,
                                    when,
                                    order: 2
                                }, {
                                    group: '1_sync',
                                    id: actions_2.MenuId.AccountsContext,
                                    when,
                                }]
                        });
                    }
                    async run() { }
                }));
            }
            registerSignInAction() {
                const that = this;
                const id = 'workbench.userData.actions.signin';
                const when = contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_1.CONTEXT_SYNC_ENABLEMENT, CONTEXT_ACCOUNT_STATE.isEqualTo("unavailable" /* Unavailable */));
                this._register(actions_2.registerAction2(class StopSyncAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.userData.actions.signin',
                            title: nls_1.localize('sign in global', "Sign in to Sync Preferences(1)"),
                            menu: {
                                group: '5_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 2
                            }
                        });
                    }
                    async run() {
                        try {
                            await that.userDataSyncAccounts.pick();
                        }
                        catch (e) {
                            that.notificationService.error(e);
                        }
                    }
                }));
                this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                    group: '1_sync',
                    command: {
                        id,
                        title: nls_1.localize('sign in accounts', "Sign in to Sync Preferences"),
                    },
                    when
                }));
            }
            registerShowSettingsConflictsAction() {
                const resolveSettingsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*settings.*/i);
                commands_1.CommandsRegistry.registerCommand(resolveSettingsConflictsCommand.id, () => this.handleSyncResourceConflicts("settings" /* Settings */));
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                    group: '5_sync',
                    command: {
                        id: resolveSettingsConflictsCommand.id,
                        title: nls_1.localize('resolveConflicts_global', "Preferences Sync: Show Settings Conflicts (1)"),
                    },
                    when: resolveSettingsConflictsWhenContext,
                    order: 2
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                    group: '5_sync',
                    command: {
                        id: resolveSettingsConflictsCommand.id,
                        title: nls_1.localize('resolveConflicts_global', "Preferences Sync: Show Settings Conflicts (1)"),
                    },
                    when: resolveSettingsConflictsWhenContext,
                    order: 2
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                    command: resolveSettingsConflictsCommand,
                    when: resolveSettingsConflictsWhenContext,
                });
            }
            registerShowKeybindingsConflictsAction() {
                const resolveKeybindingsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*keybindings.*/i);
                commands_1.CommandsRegistry.registerCommand(resolveKeybindingsConflictsCommand.id, () => this.handleSyncResourceConflicts("keybindings" /* Keybindings */));
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                    group: '5_sync',
                    command: {
                        id: resolveKeybindingsConflictsCommand.id,
                        title: nls_1.localize('resolveKeybindingsConflicts_global', "Preferences Sync: Show Keybindings Conflicts (1)"),
                    },
                    when: resolveKeybindingsConflictsWhenContext,
                    order: 2
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                    group: '5_sync',
                    command: {
                        id: resolveKeybindingsConflictsCommand.id,
                        title: nls_1.localize('resolveKeybindingsConflicts_global', "Preferences Sync: Show Keybindings Conflicts (1)"),
                    },
                    when: resolveKeybindingsConflictsWhenContext,
                    order: 2
                });
                actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                    command: resolveKeybindingsConflictsCommand,
                    when: resolveKeybindingsConflictsWhenContext,
                });
            }
            registerShowSnippetsConflictsAction() {
                var _a;
                this._snippetsConflictsActionsDisposable.clear();
                const resolveSnippetsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*snippets.*/i);
                const conflicts = (_a = this.userDataSyncService.conflicts.filter(({ syncResource }) => syncResource === "snippets" /* Snippets */)[0]) === null || _a === void 0 ? void 0 : _a.conflicts;
                this._snippetsConflictsActionsDisposable.add(commands_1.CommandsRegistry.registerCommand(resolveSnippetsConflictsCommand.id, () => this.handleSyncResourceConflicts("snippets" /* Snippets */)));
                this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                    group: '5_sync',
                    command: {
                        id: resolveSnippetsConflictsCommand.id,
                        title: nls_1.localize('resolveSnippetsConflicts_global', "Preferences Sync: Show User Snippets Conflicts ({0})", (conflicts === null || conflicts === void 0 ? void 0 : conflicts.length) || 1),
                    },
                    when: resolveSnippetsConflictsWhenContext,
                    order: 2
                }));
                this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                    group: '5_sync',
                    command: {
                        id: resolveSnippetsConflictsCommand.id,
                        title: nls_1.localize('resolveSnippetsConflicts_global', "Preferences Sync: Show User Snippets Conflicts ({0})", (conflicts === null || conflicts === void 0 ? void 0 : conflicts.length) || 1),
                    },
                    when: resolveSnippetsConflictsWhenContext,
                    order: 2
                }));
                this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                    command: resolveSnippetsConflictsCommand,
                    when: resolveSnippetsConflictsWhenContext,
                }));
            }
            registerSyncStatusAction() {
                const that = this;
                const when = contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_ENABLEMENT, CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* Available */), userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */));
                this._register(actions_2.registerAction2(class SyncStatusAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: 'workbench.userData.actions.syncStatus',
                            title: nls_1.localize('sync is on', "Preferences Sync is On"),
                            menu: [
                                {
                                    id: actions_2.MenuId.GlobalActivity,
                                    group: '5_sync',
                                    when,
                                    order: 3
                                },
                                {
                                    id: actions_2.MenuId.MenubarPreferencesMenu,
                                    group: '5_sync',
                                    when,
                                    order: 3,
                                },
                                {
                                    id: actions_2.MenuId.AccountsContext,
                                    group: '1_sync',
                                    when,
                                }
                            ],
                        });
                    }
                    run(accessor) {
                        return new Promise((c, e) => {
                            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                            const commandService = accessor.get(commands_1.ICommandService);
                            const disposables = new lifecycle_1.DisposableStore();
                            const quickPick = quickInputService.createQuickPick();
                            disposables.add(quickPick);
                            const items = [];
                            if (that.userDataSyncService.conflicts.length) {
                                for (const { syncResource } of that.userDataSyncService.conflicts) {
                                    switch (syncResource) {
                                        case "settings" /* Settings */:
                                            items.push({ id: resolveSettingsConflictsCommand.id, label: resolveSettingsConflictsCommand.title });
                                            break;
                                        case "keybindings" /* Keybindings */:
                                            items.push({ id: resolveKeybindingsConflictsCommand.id, label: resolveKeybindingsConflictsCommand.title });
                                            break;
                                        case "snippets" /* Snippets */:
                                            items.push({ id: resolveSnippetsConflictsCommand.id, label: resolveSnippetsConflictsCommand.title });
                                            break;
                                    }
                                }
                                items.push({ type: 'separator' });
                            }
                            items.push({ id: configureSyncCommand.id, label: configureSyncCommand.title });
                            items.push({ id: showSyncSettingsCommand.id, label: showSyncSettingsCommand.title });
                            items.push({ id: showSyncActivityCommand.id, label: showSyncActivityCommand.title, description: showSyncActivityCommand.description(that.userDataSyncService) });
                            items.push({ type: 'separator' });
                            if (that.userDataSyncEnablementService.canToggleEnablement()) {
                                const account = that.userDataSyncAccounts.current;
                                items.push({ id: stopSyncCommand.id, label: stopSyncCommand.title, description: account ? `${account.accountName} (${that.authenticationService.getDisplayName(account.authenticationProviderId)})` : undefined });
                            }
                            quickPick.items = items;
                            disposables.add(quickPick.onDidAccept(() => {
                                if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                                    commandService.executeCommand(quickPick.selectedItems[0].id);
                                }
                                quickPick.hide();
                            }));
                            disposables.add(quickPick.onDidHide(() => {
                                disposables.dispose();
                                c();
                            }));
                            quickPick.show();
                        });
                    }
                }));
            }
            registerTurnOffSyncAction() {
                const that = this;
                this._register(actions_2.registerAction2(class StopSyncAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: stopSyncCommand.id,
                            title: stopSyncCommand.title,
                            menu: {
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_1.CONTEXT_SYNC_ENABLEMENT),
                            },
                        });
                    }
                    async run() {
                        try {
                            await that.turnOff();
                        }
                        catch (e) {
                            if (!errors_1.isPromiseCanceledError(e)) {
                                that.notificationService.error(nls_1.localize('turn off failed', "Error while turning off sync: {0}", errorMessage_1.toErrorMessage(e)));
                            }
                        }
                    }
                }));
            }
            registerConfigureSyncAction() {
                const that = this;
                this._register(actions_2.registerAction2(class ShowSyncActivityAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: configureSyncCommand.id,
                            title: configureSyncCommand.title,
                            menu: {
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), userDataSync_1.CONTEXT_SYNC_ENABLEMENT),
                            },
                        });
                    }
                    run() { return that.configureSyncOptions(); }
                }));
            }
            registerShowActivityAction() {
                const that = this;
                this._register(actions_2.registerAction2(class ShowSyncActivityAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: showSyncActivityCommand.id,
                            title: showSyncActivityCommand.title,
                            menu: {
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */)),
                            },
                        });
                    }
                    run() { return that.showSyncActivity(); }
                }));
            }
            registerShowSettingsAction() {
                this._register(actions_2.registerAction2(class ShowSyncSettingsAction extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: showSyncSettingsCommand.id,
                            title: showSyncSettingsCommand.title,
                            menu: {
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */)),
                            },
                        });
                    }
                    run(accessor) {
                        accessor.get(preferences_1.IPreferencesService).openGlobalSettings(false, { query: '@tag:sync' });
                    }
                }));
            }
        };
        UserDataSyncWorkbenchContribution = __decorate([
            __param(0, userDataSync_1.IUserDataSyncEnablementService),
            __param(1, userDataSync_1.IUserDataSyncService),
            __param(2, contextkey_1.IContextKeyService),
            __param(3, activity_1.IActivityService),
            __param(4, notification_1.INotificationService),
            __param(5, editorService_1.IEditorService),
            __param(6, environmentService_1.IWorkbenchEnvironmentService),
            __param(7, dialogs_1.IDialogService),
            __param(8, quickInput_1.IQuickInputService),
            __param(9, instantiation_1.IInstantiationService),
            __param(10, output_1.IOutputService),
            __param(11, authentication_1.IAuthenticationTokenService),
            __param(12, userDataSync_1.IUserDataAutoSyncService),
            __param(13, resolverService_1.ITextModelService),
            __param(14, preferences_1.IPreferencesService),
            __param(15, telemetry_1.ITelemetryService),
            __param(16, productService_1.IProductService),
            __param(17, storage_1.IStorageService),
            __param(18, opener_1.IOpenerService),
            __param(19, authenticationService_1.IAuthenticationService)
        ], UserDataSyncWorkbenchContribution);
        return UserDataSyncWorkbenchContribution;
    })();
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution;
    let UserDataRemoteContentProvider = /** @class */ (() => {
        let UserDataRemoteContentProvider = class UserDataRemoteContentProvider {
            constructor(userDataSyncService, modelService, modeService) {
                this.userDataSyncService = userDataSyncService;
                this.modelService = modelService;
                this.modeService = modeService;
            }
            provideTextContent(uri) {
                if (uri.scheme === userDataSync_1.USER_DATA_SYNC_SCHEME) {
                    return this.userDataSyncService.resolveContent(uri).then(content => this.modelService.createModel(content || '', this.modeService.create('jsonc'), uri));
                }
                return null;
            }
        };
        UserDataRemoteContentProvider = __decorate([
            __param(0, userDataSync_1.IUserDataSyncService),
            __param(1, modelService_1.IModelService),
            __param(2, modeService_1.IModeService)
        ], UserDataRemoteContentProvider);
        return UserDataRemoteContentProvider;
    })();
    let AcceptChangesContribution = /** @class */ (() => {
        let AcceptChangesContribution = class AcceptChangesContribution extends lifecycle_1.Disposable {
            constructor(editor, instantiationService, userDataSyncService, notificationService, dialogService, configurationService, telemetryService) {
                super();
                this.editor = editor;
                this.instantiationService = instantiationService;
                this.userDataSyncService = userDataSyncService;
                this.notificationService = notificationService;
                this.dialogService = dialogService;
                this.configurationService = configurationService;
                this.telemetryService = telemetryService;
                this.update();
                this.registerListeners();
            }
            static get(editor) {
                return editor.getContribution(AcceptChangesContribution.ID);
            }
            registerListeners() {
                this._register(this.editor.onDidChangeModel(() => this.update()));
                this._register(this.userDataSyncService.onDidChangeConflicts(() => this.update()));
                this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('diffEditor.renderSideBySide'))(() => this.update()));
            }
            update() {
                if (!this.shouldShowButton(this.editor)) {
                    this.disposeAcceptChangesWidgetRenderer();
                    return;
                }
                this.createAcceptChangesWidgetRenderer();
            }
            shouldShowButton(editor) {
                const model = editor.getModel();
                if (!model) {
                    return false; // we need a model
                }
                const syncResourceConflicts = this.getSyncResourceConflicts(model.uri);
                if (!syncResourceConflicts) {
                    return false;
                }
                if (syncResourceConflicts.conflicts.some(({ local }) => resources_1.isEqual(local, model.uri))) {
                    return true;
                }
                if (syncResourceConflicts.conflicts.some(({ remote }) => resources_1.isEqual(remote, model.uri))) {
                    return this.configurationService.getValue('diffEditor.renderSideBySide');
                }
                return false;
            }
            createAcceptChangesWidgetRenderer() {
                if (!this.acceptChangesButton) {
                    const resource = this.editor.getModel().uri;
                    const syncResourceConflicts = this.getSyncResourceConflicts(resource);
                    const isRemote = syncResourceConflicts.conflicts.some(({ remote }) => resources_1.isEqual(remote, resource));
                    const acceptRemoteLabel = nls_1.localize('accept remote', "Accept Remote");
                    const acceptLocalLabel = nls_1.localize('accept local', "Accept Local");
                    this.acceptChangesButton = this.instantiationService.createInstance(editorWidgets_1.FloatingClickWidget, this.editor, isRemote ? acceptRemoteLabel : acceptLocalLabel, null);
                    this._register(this.acceptChangesButton.onClick(async () => {
                        const model = this.editor.getModel();
                        if (model) {
                            this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResourceConflicts.syncResource, action: isRemote ? 'acceptRemote' : 'acceptLocal' });
                            const syncAreaLabel = getSyncAreaLabel(syncResourceConflicts.syncResource);
                            const result = await this.dialogService.confirm({
                                type: 'info',
                                title: isRemote
                                    ? nls_1.localize('Sync accept remote', "Preferences Sync: {0}", acceptRemoteLabel)
                                    : nls_1.localize('Sync accept local', "Preferences Sync: {0}", acceptLocalLabel),
                                message: isRemote
                                    ? nls_1.localize('confirm replace and overwrite local', "Would you like to accept remote {0} and replace local {1}?", syncAreaLabel.toLowerCase(), syncAreaLabel.toLowerCase())
                                    : nls_1.localize('confirm replace and overwrite remote', "Would you like to accept local {0} and replace remote {1}?", syncAreaLabel.toLowerCase(), syncAreaLabel.toLowerCase()),
                                primaryButton: isRemote ? acceptRemoteLabel : acceptLocalLabel
                            });
                            if (result.confirmed) {
                                try {
                                    await this.userDataSyncService.acceptConflict(model.uri, model.getValue());
                                }
                                catch (e) {
                                    if (e instanceof userDataSync_1.UserDataSyncError && e.code === userDataSync_1.UserDataSyncErrorCode.LocalPreconditionFailed) {
                                        const syncResourceCoflicts = this.userDataSyncService.conflicts.filter(({ syncResource }) => syncResource === syncResourceConflicts.syncResource)[0];
                                        if (syncResourceCoflicts && syncResourceCoflicts.conflicts.some(conflict => resources_1.isEqual(conflict.local, model.uri) || resources_1.isEqual(conflict.remote, model.uri))) {
                                            this.notificationService.warn(nls_1.localize('update conflicts', "Could not resolve conflicts as there is new local version available. Please try again."));
                                        }
                                    }
                                    else {
                                        this.notificationService.error(e);
                                    }
                                }
                            }
                        }
                    }));
                    this.acceptChangesButton.render();
                }
            }
            getSyncResourceConflicts(resource) {
                return this.userDataSyncService.conflicts.filter(({ conflicts }) => conflicts.some(({ local, remote }) => resources_1.isEqual(local, resource) || resources_1.isEqual(remote, resource)))[0];
            }
            disposeAcceptChangesWidgetRenderer() {
                lifecycle_1.dispose(this.acceptChangesButton);
                this.acceptChangesButton = undefined;
            }
            dispose() {
                this.disposeAcceptChangesWidgetRenderer();
                super.dispose();
            }
        };
        AcceptChangesContribution.ID = 'editor.contrib.acceptChangesButton';
        AcceptChangesContribution = __decorate([
            __param(1, instantiation_1.IInstantiationService),
            __param(2, userDataSync_1.IUserDataSyncService),
            __param(3, notification_1.INotificationService),
            __param(4, dialogs_1.IDialogService),
            __param(5, configuration_1.IConfigurationService),
            __param(6, telemetry_1.ITelemetryService)
        ], AcceptChangesContribution);
        return AcceptChangesContribution;
    })();
});
//# sourceMappingURL=userDataSync.js.map