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
define(["require", "exports", "vs/workbench/services/authentication/browser/authenticationService", "vs/platform/quickinput/common/quickInput", "vs/platform/authentication/common/authentication", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/userDataSync/common/userDataSync", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry", "vs/base/common/map", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/common/arrays", "vs/workbench/services/environment/common/environmentService"], function (require, exports, authenticationService_1, quickInput_1, authentication_1, productService_1, storage_1, nls_1, lifecycle_1, event_1, userDataSync_1, configuration_1, telemetry_1, map_1, log_1, extensions_1, arrays_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncAccounts = exports.AccountStatus = exports.UserDataSyncAccount = void 0;
    class UserDataSyncAccount {
        constructor(authenticationProviderId, session) {
            this.authenticationProviderId = authenticationProviderId;
            this.session = session;
        }
        get sessionId() { return this.session.id; }
        get accountName() { return this.session.account.displayName; }
        get accountId() { return this.session.account.id; }
        getToken() { return this.session.getAccessToken(); }
    }
    exports.UserDataSyncAccount = UserDataSyncAccount;
    var AccountStatus;
    (function (AccountStatus) {
        AccountStatus["Uninitialized"] = "uninitialized";
        AccountStatus["Unavailable"] = "unavailable";
        AccountStatus["Available"] = "available";
    })(AccountStatus = exports.AccountStatus || (exports.AccountStatus = {}));
    let UserDataSyncAccounts = /** @class */ (() => {
        let UserDataSyncAccounts = class UserDataSyncAccounts extends lifecycle_1.Disposable {
            constructor(authenticationService, authenticationTokenService, quickInputService, storageService, userDataSyncEnablementService, telemetryService, logService, productService, configurationService, extensionService, environmentService) {
                var _a;
                super();
                this.authenticationService = authenticationService;
                this.authenticationTokenService = authenticationTokenService;
                this.quickInputService = quickInputService;
                this.storageService = storageService;
                this.userDataSyncEnablementService = userDataSyncEnablementService;
                this.telemetryService = telemetryService;
                this.logService = logService;
                this.environmentService = environmentService;
                this._status = "uninitialized" /* Uninitialized */;
                this._onDidChangeStatus = this._register(new event_1.Emitter());
                this.onDidChangeStatus = this._onDidChangeStatus.event;
                this._onDidSignOut = this._register(new event_1.Emitter());
                this.onDidSignOut = this._onDidSignOut.event;
                this._all = new Map();
                this._cachedCurrentSessionId = null;
                this.authenticationProviders = ((_a = userDataSync_1.getUserDataSyncStore(productService, configurationService)) === null || _a === void 0 ? void 0 : _a.authenticationProviders) || [];
                if (this.authenticationProviders.length) {
                    extensionService.whenInstalledExtensionsRegistered().then(() => {
                        if (this.authenticationProviders.every(({ id }) => authenticationService.isAuthenticationProviderRegistered(id))) {
                            this.initialize();
                        }
                        else {
                            const disposable = this.authenticationService.onDidRegisterAuthenticationProvider(() => {
                                if (this.authenticationProviders.every(({ id }) => authenticationService.isAuthenticationProviderRegistered(id))) {
                                    disposable.dispose();
                                    this.initialize();
                                }
                            });
                        }
                    });
                }
            }
            get status() { return this._status; }
            get all() { return arrays_1.flatten(map_1.values(this._all)); }
            get current() { return this.all.filter(account => this.isCurrentAccount(account))[0]; }
            async initialize() {
                var _a;
                if (this.currentSessionId === undefined && this.useWorkbenchSessionId && ((_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.authenticationSessionId)) {
                    this.currentSessionId = this.environmentService.options.authenticationSessionId;
                    this.useWorkbenchSessionId = false;
                }
                await this.update();
                this._register(event_1.Event.any(event_1.Event.filter(event_1.Event.any(this.authenticationService.onDidRegisterAuthenticationProvider, this.authenticationService.onDidUnregisterAuthenticationProvider), authenticationProviderId => this.isSupportedAuthenticationProviderId(authenticationProviderId)), this.authenticationTokenService.onTokenFailed)(() => this.update()));
                this._register(event_1.Event.filter(this.authenticationService.onDidChangeSessions, e => this.isSupportedAuthenticationProviderId(e.providerId))(({ event }) => this.onDidChangeSessions(event)));
                this._register(this.storageService.onDidChangeStorage(e => this.onDidChangeStorage(e)));
            }
            isSupportedAuthenticationProviderId(authenticationProviderId) {
                return this.authenticationProviders.some(({ id }) => id === authenticationProviderId);
            }
            async update() {
                const allAccounts = new Map();
                for (const { id } of this.authenticationProviders) {
                    const accounts = await this.getAccounts(id);
                    allAccounts.set(id, accounts);
                }
                this._all = allAccounts;
                const current = this.current;
                await this.updateToken(current);
                this.updateStatus(current);
            }
            async getAccounts(authenticationProviderId) {
                let accounts = new Map();
                let currentAccount = null;
                const sessions = await this.authenticationService.getSessions(authenticationProviderId) || [];
                for (const session of sessions) {
                    const account = new UserDataSyncAccount(authenticationProviderId, session);
                    accounts.set(account.accountName, account);
                    if (this.isCurrentAccount(account)) {
                        currentAccount = account;
                    }
                }
                if (currentAccount) {
                    // Always use current account if available
                    accounts.set(currentAccount.accountName, currentAccount);
                }
                return map_1.values(accounts);
            }
            async updateToken(current) {
                let value = undefined;
                if (current) {
                    try {
                        this.logService.trace('Preferences Sync: Updating the token for the account', current.accountName);
                        const token = await current.getToken();
                        this.logService.trace('Preferences Sync: Token updated for the account', current.accountName);
                        value = { token, authenticationProviderId: current.authenticationProviderId };
                    }
                    catch (e) {
                        this.logService.error(e);
                    }
                }
                await this.authenticationTokenService.setToken(value);
            }
            updateStatus(current) {
                // set status
                const status = current ? "available" /* Available */ : "unavailable" /* Unavailable */;
                if (this._status !== status) {
                    const previous = this._status;
                    this.logService.debug('Sync account status changed', previous, status);
                    if (previous === "available" /* Available */ && status === "unavailable" /* Unavailable */) {
                        this._onDidSignOut.fire();
                    }
                    this._status = status;
                    this._onDidChangeStatus.fire(status);
                }
            }
            isCurrentAccount(account) {
                return account.sessionId === this.currentSessionId;
            }
            async pick() {
                const result = await this.doPick();
                if (!result) {
                    return false;
                }
                let sessionId, accountName, accountId;
                if (userDataSync_1.isAuthenticationProvider(result)) {
                    const session = await this.authenticationService.login(result.id, result.scopes);
                    sessionId = session.id;
                    accountName = session.account.displayName;
                    accountId = session.account.id;
                }
                else {
                    sessionId = result.sessionId;
                    accountName = result.accountName;
                    accountId = result.accountId;
                }
                await this.switch(sessionId, accountName, accountId);
                return true;
            }
            async doPick() {
                if (this.authenticationProviders.length === 0) {
                    return undefined;
                }
                await this.update();
                // Single auth provider and no accounts available
                if (this.authenticationProviders.length === 1 && !this.all.length) {
                    return this.authenticationProviders[0];
                }
                return new Promise(async (c, e) => {
                    let result;
                    const disposables = new lifecycle_1.DisposableStore();
                    const quickPick = this.quickInputService.createQuickPick();
                    disposables.add(quickPick);
                    quickPick.title = nls_1.localize('pick an account', "Preferences Sync");
                    quickPick.ok = false;
                    quickPick.placeholder = nls_1.localize('choose account placeholder', "Select an account");
                    quickPick.ignoreFocusOut = true;
                    quickPick.items = this.createQuickpickItems();
                    disposables.add(quickPick.onDidAccept(() => {
                        var _a, _b, _c;
                        result = ((_a = quickPick.selectedItems[0]) === null || _a === void 0 ? void 0 : _a.account) ? (_b = quickPick.selectedItems[0]) === null || _b === void 0 ? void 0 : _b.account : (_c = quickPick.selectedItems[0]) === null || _c === void 0 ? void 0 : _c.authenticationProvider;
                        quickPick.hide();
                    }));
                    disposables.add(quickPick.onDidHide(() => {
                        disposables.dispose();
                        c(result);
                    }));
                    quickPick.show();
                });
            }
            createQuickpickItems() {
                var _a;
                const quickPickItems = [];
                // Signed in Accounts
                if (this.all.length) {
                    const authenticationProviders = [...this.authenticationProviders].sort(({ id }) => { var _a; return id === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.authenticationProviderId) ? -1 : 1; });
                    quickPickItems.push({ type: 'separator', label: nls_1.localize('signed in', "Signed in") });
                    for (const authenticationProvider of authenticationProviders) {
                        const accounts = (this._all.get(authenticationProvider.id) || []).sort(({ sessionId }) => { var _a; return sessionId === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.sessionId) ? -1 : 1; });
                        const providerName = this.authenticationService.getDisplayName(authenticationProvider.id);
                        for (const account of accounts) {
                            quickPickItems.push({
                                label: `${account.accountName} (${providerName})`,
                                description: account.sessionId === ((_a = this.current) === null || _a === void 0 ? void 0 : _a.sessionId) ? nls_1.localize('last used', "Last Used with Sync") : undefined,
                                account,
                                authenticationProvider,
                            });
                        }
                    }
                    quickPickItems.push({ type: 'separator', label: nls_1.localize('others', "Others") });
                }
                // Account proviers
                for (const authenticationProvider of this.authenticationProviders) {
                    const providerName = this.authenticationService.getDisplayName(authenticationProvider.id);
                    quickPickItems.push({ label: nls_1.localize('sign in using account', "Sign in with {0}", providerName), authenticationProvider });
                }
                return quickPickItems;
            }
            async switch(sessionId, accountName, accountId) {
                const currentAccount = this.current;
                if (this.userDataSyncEnablementService.isEnabled() && (currentAccount && currentAccount.accountName !== accountName)) {
                    // accounts are switched while sync is enabled.
                }
                this.currentSessionId = sessionId;
                this.telemetryService.publicLog2('sync.userAccount', { id: accountId });
                await this.update();
            }
            onDidChangeSessions(e) {
                if (this.currentSessionId && e.removed.includes(this.currentSessionId)) {
                    this.currentSessionId = undefined;
                }
                this.update();
            }
            onDidChangeStorage(e) {
                if (e.key === UserDataSyncAccounts.CACHED_SESSION_STORAGE_KEY && e.scope === 0 /* GLOBAL */
                    && this.currentSessionId !== this.getStoredCachedSessionId() /* This checks if current window changed the value or not */) {
                    this._cachedCurrentSessionId = null;
                    this.update();
                }
            }
            get currentSessionId() {
                if (this._cachedCurrentSessionId === null) {
                    this._cachedCurrentSessionId = this.getStoredCachedSessionId();
                }
                return this._cachedCurrentSessionId;
            }
            set currentSessionId(cachedSessionId) {
                if (this._cachedCurrentSessionId !== cachedSessionId) {
                    this._cachedCurrentSessionId = cachedSessionId;
                    if (cachedSessionId === undefined) {
                        this.storageService.remove(UserDataSyncAccounts.CACHED_SESSION_STORAGE_KEY, 0 /* GLOBAL */);
                    }
                    else {
                        this.storageService.store(UserDataSyncAccounts.CACHED_SESSION_STORAGE_KEY, cachedSessionId, 0 /* GLOBAL */);
                    }
                }
            }
            getStoredCachedSessionId() {
                return this.storageService.get(UserDataSyncAccounts.CACHED_SESSION_STORAGE_KEY, 0 /* GLOBAL */);
            }
            get useWorkbenchSessionId() {
                return !this.storageService.getBoolean(UserDataSyncAccounts.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, 0 /* GLOBAL */, false);
            }
            set useWorkbenchSessionId(useWorkbenchSession) {
                this.storageService.store(UserDataSyncAccounts.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY, !useWorkbenchSession, 0 /* GLOBAL */);
            }
        };
        UserDataSyncAccounts.DONOT_USE_WORKBENCH_SESSION_STORAGE_KEY = 'userDataSyncAccount.donotUseWorkbenchSession';
        UserDataSyncAccounts.CACHED_SESSION_STORAGE_KEY = 'userDataSyncAccountPreference';
        UserDataSyncAccounts = __decorate([
            __param(0, authenticationService_1.IAuthenticationService),
            __param(1, authentication_1.IAuthenticationTokenService),
            __param(2, quickInput_1.IQuickInputService),
            __param(3, storage_1.IStorageService),
            __param(4, userDataSync_1.IUserDataSyncEnablementService),
            __param(5, telemetry_1.ITelemetryService),
            __param(6, log_1.ILogService),
            __param(7, productService_1.IProductService),
            __param(8, configuration_1.IConfigurationService),
            __param(9, extensions_1.IExtensionService),
            __param(10, environmentService_1.IWorkbenchEnvironmentService)
        ], UserDataSyncAccounts);
        return UserDataSyncAccounts;
    })();
    exports.UserDataSyncAccounts = UserDataSyncAccounts;
});
//# sourceMappingURL=userDataSyncAccount.js.map