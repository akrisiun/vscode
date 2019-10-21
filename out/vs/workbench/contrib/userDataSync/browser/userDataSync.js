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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/nls", "vs/base/common/lifecycle", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/activity/common/activity", "vs/workbench/common/activity", "vs/platform/notification/common/notification", "vs/base/common/uri", "vs/base/common/amd", "vs/workbench/common/resources", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/event", "vs/workbench/services/history/common/history", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/platform/auth/common/auth", "vs/platform/quickinput/common/quickInput", "vs/base/common/async"], function (require, exports, userDataSync_1, nls_1, lifecycle_1, commands_1, configuration_1, actions_1, contextkey_1, activity_1, activity_2, notification_1, uri_1, amd_1, resources_1, editorService_1, textfiles_1, event_1, history_1, environmentService_1, resources_2, auth_1, quickInput_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CONTEXT_AUTH_TOKEN_STATE = new contextkey_1.RawContextKey('authTokenStatus', "Inactive" /* Inactive */);
    const SYNC_PUSH_LIGHT_ICON_URI = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL(`vs/workbench/contrib/userDataSync/browser/media/check-light.svg`));
    const SYNC_PUSH_DARK_ICON_URI = uri_1.URI.parse(amd_1.registerAndGetAmdImageURL(`vs/workbench/contrib/userDataSync/browser/media/check-dark.svg`));
    let UserDataSyncWorkbenchContribution = class UserDataSyncWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(userDataSyncService, authTokenService, contextKeyService, activityService, notificationService, configurationService, editorService, textFileService, historyService, workbenchEnvironmentService, quickInputService) {
            super();
            this.userDataSyncService = userDataSyncService;
            this.authTokenService = authTokenService;
            this.activityService = activityService;
            this.notificationService = notificationService;
            this.configurationService = configurationService;
            this.editorService = editorService;
            this.textFileService = textFileService;
            this.historyService = historyService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.quickInputService = quickInputService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.conflictsWarningDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.signInNotificationDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.syncStatusContext = userDataSync_1.CONTEXT_SYNC_STATE.bindTo(contextKeyService);
            this.authTokenContext = CONTEXT_AUTH_TOKEN_STATE.bindTo(contextKeyService);
            this.onDidChangeAuthTokenStatus(this.authTokenService.status);
            this.onDidChangeSyncStatus(this.userDataSyncService.status);
            this._register(event_1.Event.debounce(authTokenService.onDidChangeStatus, () => undefined, 500)(() => this.onDidChangeAuthTokenStatus(this.authTokenService.status)));
            this._register(event_1.Event.debounce(userDataSyncService.onDidChangeStatus, () => undefined, 500)(() => this.onDidChangeSyncStatus(this.userDataSyncService.status)));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('configurationSync.enable'))(() => this.updateBadge()));
            this.registerActions();
            async_1.timeout(2000).then(() => {
                if (this.authTokenService.status === "Inactive" /* Inactive */ && configurationService.getValue('configurationSync.enable')) {
                    this.showSignInNotification();
                }
            });
        }
        onDidChangeAuthTokenStatus(status) {
            this.authTokenContext.set(status);
            if (status === "Active" /* Active */) {
                this.signInNotificationDisposable.clear();
            }
            this.updateBadge();
        }
        onDidChangeSyncStatus(status) {
            this.syncStatusContext.set(status);
            this.updateBadge();
            if (this.userDataSyncService.status === "hasConflicts" /* HasConflicts */) {
                if (!this.conflictsWarningDisposable.value) {
                    const handle = this.notificationService.prompt(notification_1.Severity.Warning, nls_1.localize('conflicts detected', "Unable to sync due to conflicts. Please resolve them to continue."), [
                        {
                            label: nls_1.localize('resolve', "Resolve Conflicts"),
                            run: () => this.handleConflicts()
                        }
                    ]);
                    this.conflictsWarningDisposable.value = lifecycle_1.toDisposable(() => handle.close());
                    handle.onDidClose(() => this.conflictsWarningDisposable.clear());
                }
            }
            else {
                const previewEditorInput = this.getPreviewEditorInput();
                if (previewEditorInput) {
                    previewEditorInput.dispose();
                }
                this.conflictsWarningDisposable.clear();
            }
        }
        updateBadge() {
            this.badgeDisposable.clear();
            let badge = undefined;
            let clazz;
            if (this.authTokenService.status === "Inactive" /* Inactive */ && this.configurationService.getValue('configurationSync.enable')) {
                badge = new activity_1.NumberBadge(1, () => nls_1.localize('sign in', "Sign in..."));
            }
            else if (this.userDataSyncService.status === "hasConflicts" /* HasConflicts */) {
                badge = new activity_1.NumberBadge(1, () => nls_1.localize('resolve conflicts', "Resolve Conflicts"));
            }
            else if (this.userDataSyncService.status === "syncing" /* Syncing */) {
                badge = new activity_1.ProgressBadge(() => nls_1.localize('syncing', "Synchronizing User Configuration..."));
                clazz = 'progress-badge';
            }
            if (badge) {
                this.badgeDisposable.value = this.activityService.showActivity(activity_2.GLOBAL_ACTIVITY_ID, badge, clazz);
            }
        }
        showSignInNotification() {
            const handle = this.notificationService.prompt(notification_1.Severity.Info, nls_1.localize('show sign in', "Please sign in to Settings Sync service to start syncing configuration."), [
                {
                    label: nls_1.localize('sign in', "Sign in..."),
                    run: () => this.signIn()
                }
            ]);
            this.signInNotificationDisposable.value = lifecycle_1.toDisposable(() => handle.close());
            handle.onDidClose(() => this.signInNotificationDisposable.clear());
        }
        async signIn() {
            const token = await this.quickInputService.input({ placeHolder: nls_1.localize('enter token', "Please provide the auth bearer token"), ignoreFocusLost: true, });
            if (token) {
                await this.authTokenService.updateToken(token);
            }
        }
        async signOut() {
            await this.authTokenService.deleteToken();
        }
        async continueSync() {
            // Get the preview editor
            const previewEditorInput = this.getPreviewEditorInput();
            // Save the preview
            if (previewEditorInput && previewEditorInput.isDirty()) {
                await this.textFileService.save(previewEditorInput.getResource());
            }
            try {
                // Continue Sync
                await this.userDataSyncService.sync(true);
            }
            catch (error) {
                this.notificationService.error(error);
                return;
            }
            // Close the preview editor
            if (previewEditorInput) {
                previewEditorInput.dispose();
            }
        }
        getPreviewEditorInput() {
            return this.editorService.editors.filter(input => resources_2.isEqual(input.getResource(), this.workbenchEnvironmentService.settingsSyncPreviewResource))[0];
        }
        async handleConflicts() {
            if (this.userDataSyncService.conflictsSource === 1 /* Settings */) {
                const resourceInput = {
                    resource: this.workbenchEnvironmentService.settingsSyncPreviewResource,
                    options: {
                        preserveFocus: false,
                        pinned: false,
                        revealIfVisible: true,
                    },
                    mode: 'jsonc'
                };
                this.editorService.openEditor(resourceInput)
                    .then(editor => {
                    this.historyService.remove(resourceInput);
                    if (editor && editor.input) {
                        // Trigger sync after closing the conflicts editor.
                        const disposable = editor.input.onDispose(() => {
                            disposable.dispose();
                            this.userDataSyncService.sync(true);
                        });
                    }
                });
            }
        }
        registerActions() {
            const signInMenuItem = {
                group: '5_sync',
                command: {
                    id: 'workbench.userData.actions.login',
                    title: nls_1.localize('sign in', "Sign in...")
                },
                when: contextkey_1.ContextKeyExpr.and(CONTEXT_AUTH_TOKEN_STATE.isEqualTo("Inactive" /* Inactive */), contextkey_1.ContextKeyExpr.has('config.configurationSync.enable')),
            };
            commands_1.CommandsRegistry.registerCommand(signInMenuItem.command.id, () => this.signIn());
            actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, signInMenuItem);
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, signInMenuItem);
            const signOutMenuItem = {
                command: {
                    id: 'workbench.userData.actions.logout',
                    title: nls_1.localize('sign out', "Sign Out")
                },
                when: contextkey_1.ContextKeyExpr.and(CONTEXT_AUTH_TOKEN_STATE.isEqualTo("Active" /* Active */)),
            };
            commands_1.CommandsRegistry.registerCommand(signOutMenuItem.command.id, () => this.signOut());
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, signOutMenuItem);
            const startSyncMenuItem = {
                group: '5_sync',
                command: {
                    id: 'workbench.userData.actions.syncStart',
                    title: nls_1.localize('start sync', "Configuration Sync: Turn On")
                },
                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), contextkey_1.ContextKeyExpr.not('config.configurationSync.enable')),
            };
            commands_1.CommandsRegistry.registerCommand(startSyncMenuItem.command.id, () => this.configurationService.updateValue('configurationSync.enable', true));
            actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, startSyncMenuItem);
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, startSyncMenuItem);
            const stopSyncMenuItem = {
                group: '5_sync',
                command: {
                    id: 'workbench.userData.actions.stopSync',
                    title: nls_1.localize('stop sync', "Configuration Sync: Turn Off")
                },
                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* Uninitialized */), contextkey_1.ContextKeyExpr.has('config.configurationSync.enable')),
            };
            commands_1.CommandsRegistry.registerCommand(stopSyncMenuItem.command.id, () => this.configurationService.updateValue('configurationSync.enable', false));
            actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, stopSyncMenuItem);
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, stopSyncMenuItem);
            const resolveConflictsMenuItem = {
                group: '5_sync',
                command: {
                    id: 'sync.resolveConflicts',
                    title: nls_1.localize('resolveConflicts', "Configuration Sync: Resolve Conflicts"),
                },
                when: userDataSync_1.CONTEXT_SYNC_STATE.isEqualTo("hasConflicts" /* HasConflicts */),
            };
            commands_1.CommandsRegistry.registerCommand(resolveConflictsMenuItem.command.id, () => this.handleConflicts());
            actions_1.MenuRegistry.appendMenuItem(45 /* GlobalActivity */, resolveConflictsMenuItem);
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, resolveConflictsMenuItem);
            const continueSyncCommandId = 'workbench.userData.actions.continueSync';
            commands_1.CommandsRegistry.registerCommand(continueSyncCommandId, () => this.continueSync());
            actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
                command: {
                    id: continueSyncCommandId,
                    title: nls_1.localize('continue sync', "Configuration Sync: Continue")
                },
                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.isEqualTo("hasConflicts" /* HasConflicts */)),
            });
            actions_1.MenuRegistry.appendMenuItem(8 /* EditorTitle */, {
                command: {
                    id: continueSyncCommandId,
                    title: nls_1.localize('continue sync', "Configuration Sync: Continue"),
                    iconLocation: {
                        light: SYNC_PUSH_LIGHT_ICON_URI,
                        dark: SYNC_PUSH_DARK_ICON_URI
                    }
                },
                group: 'navigation',
                order: 1,
                when: contextkey_1.ContextKeyExpr.and(userDataSync_1.CONTEXT_SYNC_STATE.isEqualTo("hasConflicts" /* HasConflicts */), resources_1.ResourceContextKey.Resource.isEqualTo(this.workbenchEnvironmentService.settingsSyncPreviewResource.toString())),
            });
        }
    };
    UserDataSyncWorkbenchContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, auth_1.IAuthTokenService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, activity_1.IActivityService),
        __param(4, notification_1.INotificationService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, history_1.IHistoryService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, quickInput_1.IQuickInputService)
    ], UserDataSyncWorkbenchContribution);
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution;
});
//# sourceMappingURL=userDataSync.js.map