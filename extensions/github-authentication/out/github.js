"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubAuthenticationProvider = exports.onDidChangeSessions = void 0;
const vscode = require("vscode");
const uuid = require("uuid");
const keychain_1 = require("./common/keychain");
const githubServer_1 = require("./githubServer");
const logger_1 = require("./common/logger");
exports.onDidChangeSessions = new vscode.EventEmitter();
function isOldSessionData(x) {
    return !!x.accountName;
}
class GitHubAuthenticationProvider {
    constructor() {
        this._sessions = [];
        this._githubServer = new githubServer_1.GitHubServer();
    }
    async initialize() {
        try {
            this._sessions = await this.readSessions();
        }
        catch (e) {
            // Ignore, network request failed
        }
        // TODO revert Cannot validate tokens from auth server, no available clientId
        // await this.validateSessions();
        this.pollForChange();
    }
    pollForChange() {
        setTimeout(async () => {
            let storedSessions;
            try {
                storedSessions = await this.readSessions();
            }
            catch (e) {
                // Ignore, network request failed
                return;
            }
            const added = [];
            const removed = [];
            storedSessions.forEach(session => {
                const matchesExisting = this._sessions.some(s => s.id === session.id);
                // Another window added a session to the keychain, add it to our state as well
                if (!matchesExisting) {
                    logger_1.default.info('Adding session found in keychain');
                    this._sessions.push(session);
                    added.push(session.id);
                }
            });
            this._sessions.map(session => {
                const matchesExisting = storedSessions.some(s => s.id === session.id);
                // Another window has logged out, remove from our state
                if (!matchesExisting) {
                    logger_1.default.info('Removing session no longer found in keychain');
                    const sessionIndex = this._sessions.findIndex(s => s.id === session.id);
                    if (sessionIndex > -1) {
                        this._sessions.splice(sessionIndex, 1);
                    }
                    removed.push(session.id);
                }
            });
            if (added.length || removed.length) {
                exports.onDidChangeSessions.fire({ added, removed, changed: [] });
            }
            this.pollForChange();
        }, 1000 * 30);
    }
    async readSessions() {
        const storedSessions = await keychain_1.keychain.getToken();
        if (storedSessions) {
            try {
                const sessionData = JSON.parse(storedSessions);
                const sessionPromises = sessionData.map(async (session) => {
                    var _a, _b, _c, _d;
                    const needsUserInfo = isOldSessionData(session) || !session.account;
                    let userInfo;
                    if (needsUserInfo) {
                        userInfo = await this._githubServer.getUserInfo(session.accessToken);
                    }
                    return {
                        id: session.id,
                        account: {
                            displayName: isOldSessionData(session)
                                ? session.accountName
                                : (_b = (_a = session.account) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : userInfo.accountName,
                            id: isOldSessionData(session)
                                ? userInfo.id
                                : (_d = (_c = session.account) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : userInfo.id
                        },
                        scopes: session.scopes,
                        getAccessToken: () => Promise.resolve(session.accessToken)
                    };
                });
                return Promise.all(sessionPromises);
            }
            catch (e) {
                if (e === githubServer_1.NETWORK_ERROR) {
                    return [];
                }
                logger_1.default.error(`Error reading sessions: ${e}`);
                await keychain_1.keychain.deleteToken();
            }
        }
        return [];
    }
    async storeSessions() {
        const sessionData = await Promise.all(this._sessions.map(async (session) => {
            const resolvedAccessToken = await session.getAccessToken();
            return {
                id: session.id,
                account: session.account,
                scopes: session.scopes,
                accessToken: resolvedAccessToken
            };
        }));
        await keychain_1.keychain.setToken(JSON.stringify(sessionData));
    }
    get sessions() {
        return this._sessions;
    }
    async login(scopes) {
        const token = scopes === 'vso' ? await this.loginAndInstallApp(scopes) : await this._githubServer.login(scopes);
        const session = await this.tokenToSession(token, scopes.split(' '));
        await this.setToken(session);
        return session;
    }
    async loginAndInstallApp(scopes) {
        const token = await this._githubServer.login(scopes);
        const hasUserInstallation = await this._githubServer.hasUserInstallation(token);
        if (hasUserInstallation) {
            return token;
        }
        else {
            return this._githubServer.installApp();
        }
    }
    async manuallyProvideToken() {
        this._githubServer.manuallyProvideToken();
    }
    async tokenToSession(token, scopes) {
        const userInfo = await this._githubServer.getUserInfo(token);
        return {
            id: uuid(),
            getAccessToken: () => Promise.resolve(token),
            account: {
                displayName: userInfo.accountName,
                id: userInfo.id
            },
            scopes: scopes
        };
    }
    async setToken(session) {
        const sessionIndex = this._sessions.findIndex(s => s.id === session.id);
        if (sessionIndex > -1) {
            this._sessions.splice(sessionIndex, 1, session);
        }
        else {
            this._sessions.push(session);
        }
        await this.storeSessions();
    }
    async logout(id) {
        const sessionIndex = this._sessions.findIndex(session => session.id === id);
        if (sessionIndex > -1) {
            this._sessions.splice(sessionIndex, 1);
            // TODO revert
            // Cannot revoke tokens from auth server, no clientId available
            // const token = await session.getAccessToken();
            // try {
            // 	await this._githubServer.revokeToken(token);
            // } catch (_) {
            // 	// ignore, should still remove from keychain
            // }
        }
        await this.storeSessions();
    }
}
exports.GitHubAuthenticationProvider = GitHubAuthenticationProvider;
//# sourceMappingURL=github.js.map