/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/extensions/common/extensions"], function (require, exports, event_1, extHost_protocol_1, extHostTypes_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostAuthentication = void 0;
    class ExtHostAuthentication {
        constructor(mainContext) {
            this._authenticationProviders = new Map();
            this._onDidChangeAuthenticationProviders = new event_1.Emitter();
            this.onDidChangeAuthenticationProviders = this._onDidChangeAuthenticationProviders.event;
            this._onDidChangeSessions = new event_1.Emitter();
            this.onDidChangeSessions = this._onDidChangeSessions.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadAuthentication);
        }
        get providerIds() {
            const ids = [];
            this._authenticationProviders.forEach(provider => {
                ids.push(provider.id);
            });
            return ids;
        }
        async getSessions(requestingExtension, providerId, scopes) {
            const provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                throw new Error(`No authentication provider with id '${providerId}' is currently registered.`);
            }
            const extensionId = extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier);
            const orderedScopes = scopes.sort().join(' ');
            return (await provider.getSessions())
                .filter(session => session.scopes.sort().join(' ') === orderedScopes)
                .map(session => {
                return {
                    id: session.id,
                    account: session.account,
                    scopes: session.scopes,
                    getAccessToken: async () => {
                        const isAllowed = await this._proxy.$getSessionsPrompt(provider.id, session.account.displayName, provider.displayName, extensionId, requestingExtension.displayName || requestingExtension.name);
                        if (!isAllowed) {
                            throw new Error('User did not consent to token access.');
                        }
                        return session.getAccessToken();
                    }
                };
            });
        }
        async login(requestingExtension, providerId, scopes) {
            const provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                throw new Error(`No authentication provider with id '${providerId}' is currently registered.`);
            }
            const extensionName = requestingExtension.displayName || requestingExtension.name;
            const isAllowed = await this._proxy.$loginPrompt(provider.displayName, extensionName);
            if (!isAllowed) {
                throw new Error('User did not consent to login.');
            }
            const session = await provider.login(scopes);
            await this._proxy.$setTrustedExtension(provider.id, session.account.displayName, extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier), extensionName);
            return {
                id: session.id,
                account: session.account,
                scopes: session.scopes,
                getAccessToken: async () => {
                    const isAllowed = await this._proxy.$getSessionsPrompt(provider.id, session.account.displayName, provider.displayName, extensions_1.ExtensionIdentifier.toKey(requestingExtension.identifier), requestingExtension.displayName || requestingExtension.name);
                    if (!isAllowed) {
                        throw new Error('User did not consent to token access.');
                    }
                    return session.getAccessToken();
                }
            };
        }
        async logout(providerId, sessionId) {
            const provider = this._authenticationProviders.get(providerId);
            if (!provider) {
                throw new Error(`No authentication provider with id '${providerId}' is currently registered.`);
            }
            return provider.logout(sessionId);
        }
        registerAuthenticationProvider(provider) {
            if (this._authenticationProviders.get(provider.id)) {
                throw new Error(`An authentication provider with id '${provider.id}' is already registered.`);
            }
            this._authenticationProviders.set(provider.id, provider);
            const listener = provider.onDidChangeSessions(e => {
                this._proxy.$onDidChangeSessions(provider.id, e);
                this._onDidChangeSessions.fire({ [provider.id]: e });
            });
            this._proxy.$registerAuthenticationProvider(provider.id, provider.displayName);
            this._onDidChangeAuthenticationProviders.fire({ added: [provider.id], removed: [] });
            return new extHostTypes_1.Disposable(() => {
                listener.dispose();
                this._authenticationProviders.delete(provider.id);
                this._proxy.$unregisterAuthenticationProvider(provider.id);
                this._onDidChangeAuthenticationProviders.fire({ added: [], removed: [provider.id] });
            });
        }
        $login(providerId, scopes) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.login(scopes));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $logout(providerId, sessionId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.logout(sessionId));
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        $getSessions(providerId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                return Promise.resolve(authProvider.getSessions());
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
        async $getSessionAccessToken(providerId, sessionId) {
            const authProvider = this._authenticationProviders.get(providerId);
            if (authProvider) {
                const sessions = await authProvider.getSessions();
                const session = sessions.find(session => session.id === sessionId);
                if (session) {
                    return session.getAccessToken();
                }
                throw new Error(`Unable to find session with id: ${sessionId}`);
            }
            throw new Error(`Unable to find authentication provider with handle: ${providerId}`);
        }
    }
    exports.ExtHostAuthentication = ExtHostAuthentication;
});
//# sourceMappingURL=extHostAuthentication.js.map