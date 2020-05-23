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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/authentication/browser/authenticationService", "../common/extHost.protocol", "vs/platform/dialogs/common/dialogs", "vs/platform/storage/common/storage", "vs/base/common/severity", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/quickinput/common/quickInput", "vs/platform/notification/common/notification", "vs/platform/userDataSync/common/storageKeys", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, lifecycle_1, nls, extHostCustomers_1, authenticationService_1, extHost_protocol_1, dialogs_1, storage_1, severity_1, actions_1, commands_1, quickInput_1, notification_1, storageKeys_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadAuthentication = exports.MainThreadAuthenticationProvider = void 0;
    const accountUsages = new Map();
    const VSO_ALLOWED_EXTENSIONS = ['github.vscode-pull-request-github', 'github.vscode-pull-request-github-insiders', 'vscode.git'];
    function addAccountUsage(providerId, accountName, extensionOrFeatureName) {
        const providerAccountUsage = accountUsages.get(providerId);
        if (!providerAccountUsage) {
            accountUsages.set(providerId, { [accountName]: [extensionOrFeatureName] });
        }
        else {
            if (providerAccountUsage[accountName]) {
                if (!providerAccountUsage[accountName].includes(extensionOrFeatureName)) {
                    providerAccountUsage[accountName].push(extensionOrFeatureName);
                }
            }
            else {
                providerAccountUsage[accountName] = [extensionOrFeatureName];
            }
            accountUsages.set(providerId, providerAccountUsage);
        }
    }
    function readAllowedExtensions(storageService, providerId, accountName) {
        let trustedExtensions = [];
        try {
            const trustedExtensionSrc = storageService.get(`${providerId}-${accountName}`, 0 /* GLOBAL */);
            if (trustedExtensionSrc) {
                trustedExtensions = JSON.parse(trustedExtensionSrc);
            }
        }
        catch (err) { }
        return trustedExtensions;
    }
    class MainThreadAuthenticationProvider extends lifecycle_1.Disposable {
        constructor(_proxy, id, displayName, notificationService, storageKeysSyncRegistryService) {
            super();
            this._proxy = _proxy;
            this.id = id;
            this.displayName = displayName;
            this.notificationService = notificationService;
            this.storageKeysSyncRegistryService = storageKeysSyncRegistryService;
            this._sessionMenuItems = new Map();
            this._accounts = new Map(); // Map account name to session ids
            this._sessions = new Map(); // Map account id to name
        }
        async initialize() {
            return this.registerCommandsAndContextMenuItems();
        }
        hasSessions() {
            return !!this._sessions.size;
        }
        manageTrustedExtensions(quickInputService, storageService, accountName) {
            const quickPick = quickInputService.createQuickPick();
            quickPick.canSelectMany = true;
            const allowedExtensions = readAllowedExtensions(storageService, this.id, accountName);
            const items = allowedExtensions.map(extension => {
                return {
                    label: extension.name,
                    extension
                };
            });
            quickPick.items = items;
            quickPick.selectedItems = items;
            quickPick.title = nls.localize('manageTrustedExtensions', "Manage Trusted Extensions");
            quickPick.placeholder = nls.localize('manageExensions', "Choose which extensions can access this account");
            quickPick.onDidAccept(() => {
                const updatedAllowedList = quickPick.selectedItems.map(item => item.extension);
                storageService.store(`${this.id}-${accountName}`, JSON.stringify(updatedAllowedList), 0 /* GLOBAL */);
                quickPick.dispose();
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.show();
        }
        showUsage(quickInputService, accountName) {
            const quickPick = quickInputService.createQuickPick();
            const providerUsage = accountUsages.get(this.id);
            const accountUsage = (providerUsage || {})[accountName] || [];
            quickPick.items = accountUsage.map(extensionOrFeature => {
                return {
                    label: extensionOrFeature
                };
            });
            quickPick.onDidHide(() => {
                quickPick.dispose();
            });
            quickPick.show();
        }
        async registerCommandsAndContextMenuItems() {
            const sessions = await this._proxy.$getSessions(this.id);
            sessions.forEach(session => this.registerSession(session));
        }
        registerSession(session) {
            this._sessions.set(session.id, session.account.displayName);
            const existingSessionsForAccount = this._accounts.get(session.account.displayName);
            if (existingSessionsForAccount) {
                this._accounts.set(session.account.displayName, existingSessionsForAccount.concat(session.id));
                return;
            }
            else {
                this._accounts.set(session.account.displayName, [session.id]);
            }
            const menuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                group: '1_accounts',
                command: {
                    id: `configureSessions${session.id}`,
                    title: `${session.account.displayName} (${this.displayName})`
                },
                order: 3
            });
            this.storageKeysSyncRegistryService.registerStorageKey({ key: `${this.id}-${session.account.displayName}`, version: 1 });
            const manageCommand = commands_1.CommandsRegistry.registerCommand({
                id: `configureSessions${session.id}`,
                handler: (accessor, args) => {
                    const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                    const storageService = accessor.get(storage_1.IStorageService);
                    const dialogService = accessor.get(dialogs_1.IDialogService);
                    const quickPick = quickInputService.createQuickPick();
                    const showUsage = nls.localize('showUsage', "Show Extensions and Features Using This Account");
                    const manage = nls.localize('manageTrustedExtensions', "Manage Trusted Extensions");
                    const signOut = nls.localize('signOut', "Sign Out");
                    const items = ([{ label: showUsage }, { label: manage }, { label: signOut }]);
                    quickPick.items = items;
                    quickPick.onDidAccept(e => {
                        const selected = quickPick.selectedItems[0];
                        if (selected.label === signOut) {
                            this.signOut(dialogService, session);
                        }
                        if (selected.label === manage) {
                            this.manageTrustedExtensions(quickInputService, storageService, session.account.displayName);
                        }
                        if (selected.label === showUsage) {
                            this.showUsage(quickInputService, session.account.displayName);
                        }
                        quickPick.dispose();
                    });
                    quickPick.onDidHide(_ => {
                        quickPick.dispose();
                    });
                    quickPick.show();
                },
            });
            this._sessionMenuItems.set(session.account.displayName, [menuItem, manageCommand]);
        }
        async signOut(dialogService, session) {
            const providerUsage = accountUsages.get(this.id);
            const accountUsage = (providerUsage || {})[session.account.displayName] || [];
            const sessionsForAccount = this._accounts.get(session.account.displayName);
            // Skip dialog if nothing is using the account
            if (!accountUsage.length) {
                accountUsages.set(this.id, { [session.account.displayName]: [] });
                sessionsForAccount === null || sessionsForAccount === void 0 ? void 0 : sessionsForAccount.forEach(sessionId => this.logout(sessionId));
                return;
            }
            const result = await dialogService.confirm({
                title: nls.localize('signOutConfirm', "Sign out of {0}", session.account.displayName),
                message: nls.localize('signOutMessage', "The account {0} is currently used by: \n\n{1}\n\n Sign out of these features?", session.account.displayName, accountUsage.join('\n'))
            });
            if (result.confirmed) {
                accountUsages.set(this.id, { [session.account.displayName]: [] });
                sessionsForAccount === null || sessionsForAccount === void 0 ? void 0 : sessionsForAccount.forEach(sessionId => this.logout(sessionId));
            }
        }
        async getSessions() {
            return (await this._proxy.$getSessions(this.id)).map(session => {
                return {
                    id: session.id,
                    account: session.account,
                    getAccessToken: () => {
                        addAccountUsage(this.id, session.account.displayName, nls.localize('sync', "Preferences Sync"));
                        return this._proxy.$getSessionAccessToken(this.id, session.id);
                    }
                };
            });
        }
        async updateSessionItems(event) {
            const { added, removed } = event;
            const session = await this._proxy.$getSessions(this.id);
            const addedSessions = session.filter(session => added.some(id => id === session.id));
            removed.forEach(sessionId => {
                const accountName = this._sessions.get(sessionId);
                if (accountName) {
                    this._sessions.delete(sessionId);
                    let sessionsForAccount = this._accounts.get(accountName) || [];
                    const sessionIndex = sessionsForAccount.indexOf(sessionId);
                    sessionsForAccount.splice(sessionIndex);
                    if (!sessionsForAccount.length) {
                        const disposeables = this._sessionMenuItems.get(accountName);
                        if (disposeables) {
                            disposeables.forEach(disposeable => disposeable.dispose());
                            this._sessionMenuItems.delete(accountName);
                        }
                        this._accounts.delete(accountName);
                    }
                }
            });
            addedSessions.forEach(session => this.registerSession(session));
        }
        login(scopes) {
            return this._proxy.$login(this.id, scopes).then(session => {
                return {
                    id: session.id,
                    account: session.account,
                    getAccessToken: () => this._proxy.$getSessionAccessToken(this.id, session.id)
                };
            });
        }
        async logout(sessionId) {
            await this._proxy.$logout(this.id, sessionId);
            this.notificationService.info(nls.localize('signedOut', "Successfully signed out."));
        }
        dispose() {
            super.dispose();
            this._sessionMenuItems.forEach(item => item.forEach(d => d.dispose()));
            this._sessionMenuItems.clear();
        }
    }
    exports.MainThreadAuthenticationProvider = MainThreadAuthenticationProvider;
    let MainThreadAuthentication = /** @class */ (() => {
        let MainThreadAuthentication = class MainThreadAuthentication extends lifecycle_1.Disposable {
            constructor(extHostContext, authenticationService, dialogService, storageService, notificationService, storageKeysSyncRegistryService, remoteAgentService) {
                super();
                this.authenticationService = authenticationService;
                this.dialogService = dialogService;
                this.storageService = storageService;
                this.notificationService = notificationService;
                this.storageKeysSyncRegistryService = storageKeysSyncRegistryService;
                this.remoteAgentService = remoteAgentService;
                this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostAuthentication);
            }
            async $registerAuthenticationProvider(id, displayName) {
                const provider = new MainThreadAuthenticationProvider(this._proxy, id, displayName, this.notificationService, this.storageKeysSyncRegistryService);
                await provider.initialize();
                this.authenticationService.registerAuthenticationProvider(id, provider);
            }
            $unregisterAuthenticationProvider(id) {
                this.authenticationService.unregisterAuthenticationProvider(id);
            }
            $onDidChangeSessions(id, event) {
                this.authenticationService.sessionsUpdate(id, event);
            }
            async $getSessionsPrompt(providerId, accountName, providerName, extensionId, extensionName) {
                addAccountUsage(providerId, accountName, extensionName);
                const allowList = readAllowedExtensions(this.storageService, providerId, accountName);
                const extensionData = allowList.find(extension => extension.id === extensionId);
                if (extensionData) {
                    return true;
                }
                const remoteConnection = this.remoteAgentService.getConnection();
                if (remoteConnection && remoteConnection.remoteAuthority && remoteConnection.remoteAuthority.startsWith('vsonline') && VSO_ALLOWED_EXTENSIONS.includes(extensionId)) {
                    return true;
                }
                const { choice } = await this.dialogService.show(severity_1.default.Info, nls.localize('confirmAuthenticationAccess', "The extension '{0}' wants to access the {1} account '{2}'.", extensionName, providerName, accountName), [nls.localize('allow', "Allow"), nls.localize('cancel', "Cancel")], {
                    cancelId: 1
                });
                const allow = choice === 0;
                if (allow) {
                    allowList.push({ id: extensionId, name: extensionName });
                    this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
                }
                return allow;
            }
            async $loginPrompt(providerName, extensionName) {
                const { choice } = await this.dialogService.show(severity_1.default.Info, nls.localize('confirmLogin', "The extension '{0}' wants to sign in using {1}.", extensionName, providerName), [nls.localize('allow', "Allow"), nls.localize('cancel', "Cancel")], {
                    cancelId: 1
                });
                return choice === 0;
            }
            async $setTrustedExtension(providerId, accountName, extensionId, extensionName) {
                const allowList = readAllowedExtensions(this.storageService, providerId, accountName);
                if (!allowList.find(allowed => allowed.id === extensionId)) {
                    allowList.push({ id: extensionId, name: extensionName });
                    this.storageService.store(`${providerId}-${accountName}`, JSON.stringify(allowList), 0 /* GLOBAL */);
                }
            }
        };
        MainThreadAuthentication = __decorate([
            extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadAuthentication),
            __param(1, authenticationService_1.IAuthenticationService),
            __param(2, dialogs_1.IDialogService),
            __param(3, storage_1.IStorageService),
            __param(4, notification_1.INotificationService),
            __param(5, storageKeys_1.IStorageKeysSyncRegistryService),
            __param(6, remoteAgentService_1.IRemoteAgentService)
        ], MainThreadAuthentication);
        return MainThreadAuthentication;
    })();
    exports.MainThreadAuthentication = MainThreadAuthentication;
});
//# sourceMappingURL=mainThreadAuthentication.js.map