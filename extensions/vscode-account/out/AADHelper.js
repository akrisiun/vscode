"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureActiveDirectoryService = exports.REFRESH_NETWORK_FAILURE = exports.onDidChangeSessions = void 0;
const crypto = require("crypto");
const https = require("https");
const querystring = require("querystring");
const vscode = require("vscode");
const uuid = require("uuid");
const authServer_1 = require("./authServer");
const keychain_1 = require("./keychain");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const redirectUrl = 'https://vscode-redirect.azurewebsites.net/';
const loginEndpointUrl = 'https://login.microsoftonline.com/';
const clientId = 'aebc6443-996d-45c2-90f0-388ff96faa56';
const tenant = 'organizations';
function parseQuery(uri) {
    return uri.query.split('&').reduce((prev, current) => {
        const queryString = current.split('=');
        prev[queryString[0]] = queryString[1];
        return prev;
    }, {});
}
exports.onDidChangeSessions = new vscode.EventEmitter();
exports.REFRESH_NETWORK_FAILURE = 'Network failure';
class UriEventHandler extends vscode.EventEmitter {
    handleUri(uri) {
        this.fire(uri);
    }
}
class AzureActiveDirectoryService {
    constructor() {
        this._tokens = [];
        this._refreshTimeouts = new Map();
        this._uriHandler = new UriEventHandler();
        vscode.window.registerUriHandler(this._uriHandler);
    }
    async initialize() {
        // TODO remove, temporary migration
        await keychain_1.keychain.migrateToken();
        const storedData = await keychain_1.keychain.getToken();
        if (storedData) {
            try {
                const sessions = this.parseStoredData(storedData);
                const refreshes = sessions.map(async (session) => {
                    try {
                        await this.refreshToken(session.refreshToken, session.scope, session.id);
                    }
                    catch (e) {
                        if (e.message === exports.REFRESH_NETWORK_FAILURE) {
                            const didSucceedOnRetry = await this.handleRefreshNetworkError(session.id, session.refreshToken, session.scope);
                            if (!didSucceedOnRetry) {
                                this._tokens.push({
                                    accessToken: undefined,
                                    refreshToken: session.refreshToken,
                                    account: {
                                        displayName: session.account.displayName,
                                        id: session.account.id
                                    },
                                    scope: session.scope,
                                    sessionId: session.id
                                });
                                this.pollForReconnect(session.id, session.refreshToken, session.scope);
                            }
                        }
                        else {
                            await this.logout(session.id);
                        }
                    }
                });
                await Promise.all(refreshes);
            }
            catch (e) {
                logger_1.default.info('Failed to initialize stored data');
                await this.clearSessions();
            }
        }
        this.pollForChange();
    }
    parseStoredData(data) {
        return JSON.parse(data);
    }
    async storeTokenData() {
        const serializedData = this._tokens.map(token => {
            return {
                id: token.sessionId,
                refreshToken: token.refreshToken,
                scope: token.scope,
                account: token.account
            };
        });
        await keychain_1.keychain.setToken(JSON.stringify(serializedData));
    }
    pollForChange() {
        setTimeout(async () => {
            const addedIds = [];
            let removedIds = [];
            const storedData = await keychain_1.keychain.getToken();
            if (storedData) {
                try {
                    const sessions = this.parseStoredData(storedData);
                    let promises = sessions.map(async (session) => {
                        const matchesExisting = this._tokens.some(token => token.scope === session.scope && token.sessionId === session.id);
                        if (!matchesExisting) {
                            try {
                                await this.refreshToken(session.refreshToken, session.scope, session.id);
                                addedIds.push(session.id);
                            }
                            catch (e) {
                                if (e.message === exports.REFRESH_NETWORK_FAILURE) {
                                    // Ignore, will automatically retry on next poll.
                                }
                                else {
                                    await this.logout(session.id);
                                }
                            }
                        }
                    });
                    promises = promises.concat(this._tokens.map(async (token) => {
                        const matchesExisting = sessions.some(session => token.scope === session.scope && token.sessionId === session.id);
                        if (!matchesExisting) {
                            await this.logout(token.sessionId);
                            removedIds.push(token.sessionId);
                        }
                    }));
                    await Promise.all(promises);
                }
                catch (e) {
                    logger_1.default.error(e.message);
                    // if data is improperly formatted, remove all of it and send change event
                    removedIds = this._tokens.map(token => token.sessionId);
                    this.clearSessions();
                }
            }
            else {
                if (this._tokens.length) {
                    // Log out all, remove all local data
                    removedIds = this._tokens.map(token => token.sessionId);
                    logger_1.default.info('No stored keychain data, clearing local data');
                    this._tokens = [];
                    this._refreshTimeouts.forEach(timeout => {
                        clearTimeout(timeout);
                    });
                    this._refreshTimeouts.clear();
                }
            }
            if (addedIds.length || removedIds.length) {
                exports.onDidChangeSessions.fire({ added: addedIds, removed: removedIds, changed: [] });
            }
            this.pollForChange();
        }, 1000 * 30);
    }
    convertToSession(token) {
        return {
            id: token.sessionId,
            getAccessToken: () => this.resolveAccessToken(token),
            account: token.account,
            scopes: token.scope.split(' ')
        };
    }
    async resolveAccessToken(token) {
        if (token.accessToken && (!token.expiresAt || token.expiresAt > Date.now())) {
            token.expiresAt
                ? logger_1.default.info(`Token available from cache, expires in ${token.expiresAt - Date.now()} milliseconds`)
                : logger_1.default.info('Token available from cache');
            return Promise.resolve(token.accessToken);
        }
        try {
            logger_1.default.info('Token expired or unavailable, trying refresh');
            const refreshedToken = await this.refreshToken(token.refreshToken, token.scope, token.sessionId);
            if (refreshedToken.accessToken) {
                return refreshedToken.accessToken;
            }
            else {
                throw new Error();
            }
        }
        catch (e) {
            throw new Error('Unavailable due to network problems');
        }
    }
    getTokenClaims(accessToken) {
        try {
            return JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        }
        catch (e) {
            logger_1.default.error(e.message);
            throw new Error('Unable to read token claims');
        }
    }
    get sessions() {
        return this._tokens.map(token => this.convertToSession(token));
    }
    async login(scope) {
        logger_1.default.info('Logging in...');
        if (vscode.env.uiKind === vscode.UIKind.Web) {
            await this.loginWithoutLocalServer(scope);
            return;
        }
        const nonce = crypto.randomBytes(16).toString('base64');
        const { server, redirectPromise, codePromise } = authServer_1.createServer(nonce);
        let token;
        try {
            const port = await authServer_1.startServer(server);
            vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}/signin?nonce=${encodeURIComponent(nonce)}`));
            const redirectReq = await redirectPromise;
            if ('err' in redirectReq) {
                const { err, res } = redirectReq;
                res.writeHead(302, { Location: `/?error=${encodeURIComponent(err && err.message || 'Unknown error')}` });
                res.end();
                throw err;
            }
            const host = redirectReq.req.headers.host || '';
            const updatedPortStr = (/^[^:]+:(\d+)$/.exec(Array.isArray(host) ? host[0] : host) || [])[1];
            const updatedPort = updatedPortStr ? parseInt(updatedPortStr, 10) : port;
            const state = `${updatedPort},${encodeURIComponent(nonce)}`;
            const codeVerifier = utils_1.toBase64UrlEncoding(crypto.randomBytes(32).toString('base64'));
            const codeChallenge = utils_1.toBase64UrlEncoding(crypto.createHash('sha256').update(codeVerifier).digest('base64'));
            const loginUrl = `${loginEndpointUrl}${tenant}/oauth2/v2.0/authorize?response_type=code&response_mode=query&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUrl)}&state=${state}&scope=${encodeURIComponent(scope)}&prompt=select_account&code_challenge_method=S256&code_challenge=${codeChallenge}`;
            await redirectReq.res.writeHead(302, { Location: loginUrl });
            redirectReq.res.end();
            const codeRes = await codePromise;
            const res = codeRes.res;
            try {
                if ('err' in codeRes) {
                    throw codeRes.err;
                }
                token = await this.exchangeCodeForToken(codeRes.code, codeVerifier, scope);
                this.setToken(token, scope);
                logger_1.default.info('Login successful');
                res.writeHead(302, { Location: '/' });
                res.end();
            }
            catch (err) {
                res.writeHead(302, { Location: `/?error=${encodeURIComponent(err && err.message || 'Unknown error')}` });
                res.end();
                throw new Error(err.message);
            }
        }
        catch (e) {
            logger_1.default.error(e.message);
            // If the error was about starting the server, try directly hitting the login endpoint instead
            if (e.message === 'Error listening to server' || e.message === 'Closed' || e.message === 'Timeout waiting for port') {
                await this.loginWithoutLocalServer(scope);
            }
            throw new Error(e.message);
        }
        finally {
            setTimeout(() => {
                server.close();
            }, 5000);
        }
    }
    getCallbackEnvironment(callbackUri) {
        switch (callbackUri.authority) {
            case 'online.visualstudio.com':
                return 'vso,';
            case 'online-ppe.core.vsengsaas.visualstudio.com':
                return 'vsoppe,';
            case 'online.dev.core.vsengsaas.visualstudio.com':
                return 'vsodev,';
            default:
                return '';
        }
    }
    async loginWithoutLocalServer(scope) {
        const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.vscode-account`));
        const nonce = crypto.randomBytes(16).toString('base64');
        const port = (callbackUri.authority.match(/:([0-9]*)$/) || [])[1] || (callbackUri.scheme === 'https' ? 443 : 80);
        const callbackEnvironment = this.getCallbackEnvironment(callbackUri);
        const state = `${callbackEnvironment}${port},${encodeURIComponent(nonce)},${encodeURIComponent(callbackUri.query)}`;
        const signInUrl = `${loginEndpointUrl}${tenant}/oauth2/v2.0/authorize`;
        let uri = vscode.Uri.parse(signInUrl);
        const codeVerifier = utils_1.toBase64UrlEncoding(crypto.randomBytes(32).toString('base64'));
        const codeChallenge = utils_1.toBase64UrlEncoding(crypto.createHash('sha256').update(codeVerifier).digest('base64'));
        uri = uri.with({
            query: `response_type=code&client_id=${encodeURIComponent(clientId)}&response_mode=query&redirect_uri=${redirectUrl}&state=${state}&scope=${scope}&prompt=select_account&code_challenge_method=S256&code_challenge=${codeChallenge}`
        });
        vscode.env.openExternal(uri);
        const timeoutPromise = new Promise((_, reject) => {
            const wait = setTimeout(() => {
                clearTimeout(wait);
                reject('Login timed out.');
            }, 1000 * 60 * 5);
        });
        return Promise.race([this.handleCodeResponse(state, codeVerifier, scope), timeoutPromise]);
    }
    async handleCodeResponse(state, codeVerifier, scope) {
        let uriEventListener;
        return new Promise((resolve, reject) => {
            uriEventListener = this._uriHandler.event(async (uri) => {
                try {
                    const query = parseQuery(uri);
                    const code = query.code;
                    // Workaround double encoding issues of state in web
                    if (query.state !== state && decodeURIComponent(query.state) !== state) {
                        throw new Error('State does not match.');
                    }
                    const token = await this.exchangeCodeForToken(code, codeVerifier, scope);
                    this.setToken(token, scope);
                    resolve(token);
                }
                catch (err) {
                    reject(err);
                }
            });
        }).then(result => {
            uriEventListener.dispose();
            return result;
        }).catch(err => {
            uriEventListener.dispose();
            throw err;
        });
    }
    async setToken(token, scope) {
        const existingTokenIndex = this._tokens.findIndex(t => t.sessionId === token.sessionId);
        if (existingTokenIndex > -1) {
            this._tokens.splice(existingTokenIndex, 1, token);
        }
        else {
            this._tokens.push(token);
        }
        this.clearSessionTimeout(token.sessionId);
        if (token.expiresIn) {
            this._refreshTimeouts.set(token.sessionId, setTimeout(async () => {
                try {
                    await this.refreshToken(token.refreshToken, scope, token.sessionId);
                    exports.onDidChangeSessions.fire({ added: [], removed: [], changed: [token.sessionId] });
                }
                catch (e) {
                    if (e.message === exports.REFRESH_NETWORK_FAILURE) {
                        const didSucceedOnRetry = await this.handleRefreshNetworkError(token.sessionId, token.refreshToken, scope);
                        if (!didSucceedOnRetry) {
                            this.pollForReconnect(token.sessionId, token.refreshToken, token.scope);
                        }
                    }
                    else {
                        await this.logout(token.sessionId);
                        exports.onDidChangeSessions.fire({ added: [], removed: [token.sessionId], changed: [] });
                    }
                }
            }, 1000 * (parseInt(token.expiresIn) - 30)));
        }
        this.storeTokenData();
    }
    getTokenFromResponse(buffer, scope, existingId) {
        const json = JSON.parse(Buffer.concat(buffer).toString());
        const claims = this.getTokenClaims(json.access_token);
        return {
            expiresIn: json.expires_in,
            expiresAt: json.expires_in ? Date.now() + json.expires_in * 1000 : undefined,
            accessToken: json.access_token,
            refreshToken: json.refresh_token,
            scope,
            sessionId: existingId || `${claims.tid}/${(claims.oid || (claims.altsecid || '' + claims.ipd || ''))}/${uuid()}`,
            account: {
                displayName: claims.email || claims.unique_name || 'user@example.com',
                id: `${claims.tid}/${(claims.oid || (claims.altsecid || '' + claims.ipd || ''))}`
            }
        };
    }
    async exchangeCodeForToken(code, codeVerifier, scope) {
        return new Promise((resolve, reject) => {
            logger_1.default.info('Exchanging login code for token');
            try {
                const postData = querystring.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: clientId,
                    scope: scope,
                    code_verifier: codeVerifier,
                    redirect_uri: redirectUrl
                });
                const tokenUrl = vscode.Uri.parse(`${loginEndpointUrl}${tenant}/oauth2/v2.0/token`);
                const post = https.request({
                    host: tokenUrl.authority,
                    path: tokenUrl.path,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length
                    }
                }, result => {
                    const buffer = [];
                    result.on('data', (chunk) => {
                        buffer.push(chunk);
                    });
                    result.on('end', () => {
                        if (result.statusCode === 200) {
                            logger_1.default.info('Exchanging login code for token success');
                            resolve(this.getTokenFromResponse(buffer, scope));
                        }
                        else {
                            logger_1.default.error('Exchanging login code for token failed');
                            reject(new Error('Unable to login.'));
                        }
                    });
                });
                post.write(postData);
                post.end();
                post.on('error', err => {
                    reject(err);
                });
            }
            catch (e) {
                logger_1.default.error(e.message);
                reject(e);
            }
        });
    }
    async refreshToken(refreshToken, scope, sessionId) {
        return new Promise((resolve, reject) => {
            logger_1.default.info('Refreshing token...');
            const postData = querystring.stringify({
                refresh_token: refreshToken,
                client_id: clientId,
                grant_type: 'refresh_token',
                scope: scope
            });
            const post = https.request({
                host: 'login.microsoftonline.com',
                path: `/${tenant}/oauth2/v2.0/token`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            }, result => {
                const buffer = [];
                result.on('data', (chunk) => {
                    buffer.push(chunk);
                });
                result.on('end', async () => {
                    if (result.statusCode === 200) {
                        const token = this.getTokenFromResponse(buffer, scope, sessionId);
                        this.setToken(token, scope);
                        logger_1.default.info('Token refresh success');
                        resolve(token);
                    }
                    else {
                        logger_1.default.error('Refreshing token failed');
                        reject(new Error('Refreshing token failed.'));
                    }
                });
            });
            post.write(postData);
            post.end();
            post.on('error', err => {
                logger_1.default.error(err.message);
                reject(new Error(exports.REFRESH_NETWORK_FAILURE));
            });
        });
    }
    clearSessionTimeout(sessionId) {
        const timeout = this._refreshTimeouts.get(sessionId);
        if (timeout) {
            clearTimeout(timeout);
            this._refreshTimeouts.delete(sessionId);
        }
    }
    removeInMemorySessionData(sessionId) {
        const tokenIndex = this._tokens.findIndex(token => token.sessionId === sessionId);
        if (tokenIndex > -1) {
            this._tokens.splice(tokenIndex, 1);
        }
        this.clearSessionTimeout(sessionId);
    }
    pollForReconnect(sessionId, refreshToken, scope) {
        this.clearSessionTimeout(sessionId);
        this._refreshTimeouts.set(sessionId, setTimeout(async () => {
            try {
                await this.refreshToken(refreshToken, scope, sessionId);
            }
            catch (e) {
                this.pollForReconnect(sessionId, refreshToken, scope);
            }
        }, 1000 * 60 * 30));
    }
    handleRefreshNetworkError(sessionId, refreshToken, scope, attempts = 1) {
        return new Promise((resolve, _) => {
            if (attempts === 3) {
                logger_1.default.error('Token refresh failed after 3 attempts');
                return resolve(false);
            }
            if (attempts === 1) {
                const token = this._tokens.find(token => token.sessionId === sessionId);
                if (token) {
                    token.accessToken = undefined;
                    exports.onDidChangeSessions.fire({ added: [], removed: [], changed: [token.sessionId] });
                }
            }
            const delayBeforeRetry = 5 * attempts * attempts;
            this.clearSessionTimeout(sessionId);
            this._refreshTimeouts.set(sessionId, setTimeout(async () => {
                try {
                    await this.refreshToken(refreshToken, scope, sessionId);
                    return resolve(true);
                }
                catch (e) {
                    return resolve(await this.handleRefreshNetworkError(sessionId, refreshToken, scope, attempts + 1));
                }
            }, 1000 * delayBeforeRetry));
        });
    }
    async logout(sessionId) {
        logger_1.default.info(`Logging out of session '${sessionId}'`);
        this.removeInMemorySessionData(sessionId);
        if (this._tokens.length === 0) {
            await keychain_1.keychain.deleteToken();
        }
        else {
            this.storeTokenData();
        }
    }
    async clearSessions() {
        logger_1.default.info('Logging out of all sessions');
        this._tokens = [];
        await keychain_1.keychain.deleteToken();
        this._refreshTimeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
        this._refreshTimeouts.clear();
    }
}
exports.AzureActiveDirectoryService = AzureActiveDirectoryService;
//# sourceMappingURL=AADHelper.js.map