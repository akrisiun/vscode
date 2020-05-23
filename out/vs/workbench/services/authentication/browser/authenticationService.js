/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls, event_1, lifecycle_1, extensions_1, instantiation_1, actions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationService = exports.IAuthenticationService = void 0;
    exports.IAuthenticationService = instantiation_1.createDecorator('IAuthenticationService');
    class AuthenticationService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._authenticationProviders = new Map();
            this._onDidRegisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidRegisterAuthenticationProvider = this._onDidRegisterAuthenticationProvider.event;
            this._onDidUnregisterAuthenticationProvider = this._register(new event_1.Emitter());
            this.onDidUnregisterAuthenticationProvider = this._onDidUnregisterAuthenticationProvider.event;
            this._onDidChangeSessions = this._register(new event_1.Emitter());
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                command: {
                    id: 'noAuthenticationProviders',
                    title: nls.localize('loading', "Loading..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
            });
        }
        isAuthenticationProviderRegistered(id) {
            return this._authenticationProviders.has(id);
        }
        updateAccountsMenuItem() {
            let hasSession = false;
            this._authenticationProviders.forEach(async (provider) => {
                hasSession = hasSession || provider.hasSessions();
            });
            if (hasSession && this._noAccountsMenuItem) {
                this._noAccountsMenuItem.dispose();
                this._noAccountsMenuItem = undefined;
            }
            if (!hasSession && !this._noAccountsMenuItem) {
                this._noAccountsMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    group: '0_accounts',
                    command: {
                        id: 'noAccounts',
                        title: nls.localize('noAccounts', "You are not signed in to any accounts"),
                        precondition: contextkey_1.ContextKeyExpr.false()
                    },
                });
            }
        }
        registerAuthenticationProvider(id, authenticationProvider) {
            this._authenticationProviders.set(id, authenticationProvider);
            this._onDidRegisterAuthenticationProvider.fire(id);
            if (this._placeholderMenuItem) {
                this._placeholderMenuItem.dispose();
                this._placeholderMenuItem = undefined;
            }
            this.updateAccountsMenuItem();
        }
        unregisterAuthenticationProvider(id) {
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                provider.dispose();
                this._authenticationProviders.delete(id);
                this._onDidUnregisterAuthenticationProvider.fire(id);
                this.updateAccountsMenuItem();
            }
            if (!this._authenticationProviders.size) {
                this._placeholderMenuItem = actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.AccountsContext, {
                    command: {
                        id: 'noAuthenticationProviders',
                        title: nls.localize('loading', "Loading..."),
                        precondition: contextkey_1.ContextKeyExpr.false()
                    },
                });
            }
        }
        async sessionsUpdate(id, event) {
            this._onDidChangeSessions.fire({ providerId: id, event: event });
            const provider = this._authenticationProviders.get(id);
            if (provider) {
                await provider.updateSessionItems(event);
                this.updateAccountsMenuItem();
            }
        }
        getDisplayName(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.displayName;
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async getSessions(id) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return await authProvider.getSessions();
            }
            return undefined;
        }
        async login(id, scopes) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.login(scopes);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
        async logout(id, accountId) {
            const authProvider = this._authenticationProviders.get(id);
            if (authProvider) {
                return authProvider.logout(accountId);
            }
            else {
                throw new Error(`No authentication provider '${id}' is currently registered.`);
            }
        }
    }
    exports.AuthenticationService = AuthenticationService;
    extensions_1.registerSingleton(exports.IAuthenticationService, AuthenticationService);
});
//# sourceMappingURL=authenticationService.js.map