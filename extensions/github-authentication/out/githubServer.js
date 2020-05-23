"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubServer = exports.uriHandler = exports.NETWORK_ERROR = void 0;
const https = require("https");
const nls = require("vscode-nls");
const vscode = require("vscode");
const uuid = require("uuid");
const utils_1 = require("./common/utils");
const logger_1 = require("./common/logger");
const clientRegistrar_1 = require("./common/clientRegistrar");
const localize = nls.loadMessageBundle();
exports.NETWORK_ERROR = 'network error';
const AUTH_RELAY_SERVER = 'vscode-auth.github.com';
class UriEventHandler extends vscode.EventEmitter {
    handleUri(uri) {
        this.fire(uri);
    }
}
exports.uriHandler = new UriEventHandler;
const exchangeCodeForToken = (state, host, getPath) => async (uri, resolve, reject) => {
    logger_1.default.info('Exchanging code for token...');
    const query = parseQuery(uri);
    const code = query.code;
    if (query.state !== state) {
        reject('Received mismatched state');
        return;
    }
    const post = https.request({
        host: host,
        path: getPath(code),
        method: 'POST',
        headers: {
            Accept: 'application/json'
        }
    }, result => {
        const buffer = [];
        result.on('data', (chunk) => {
            buffer.push(chunk);
        });
        result.on('end', () => {
            if (result.statusCode === 200) {
                const json = JSON.parse(Buffer.concat(buffer).toString());
                logger_1.default.info('Token exchange success!');
                resolve(json.access_token);
            }
            else {
                reject(new Error(result.statusMessage));
            }
        });
    });
    post.end();
    post.on('error', err => {
        reject(err);
    });
};
function parseQuery(uri) {
    return uri.query.split('&').reduce((prev, current) => {
        const queryString = current.split('=');
        prev[queryString[0]] = queryString[1];
        return prev;
    }, {});
}
class GitHubServer {
    async login(scopes) {
        logger_1.default.info('Logging in...');
        this.updateStatusBarItem(true);
        const state = uuid();
        const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.github-authentication/did-authenticate`));
        let uri = vscode.Uri.parse(`https://${AUTH_RELAY_SERVER}/authorize/?callbackUri=${encodeURIComponent(callbackUri.toString())}&scope=${scopes}&state=${state}&responseType=code`);
        if (scopes === 'vso') {
            const clientDetails = clientRegistrar_1.default.getGitHubAppDetails();
            uri = vscode.Uri.parse(`https://github.com/login/oauth/authorize?redirect_uri=${encodeURIComponent(callbackUri.toString())}&scope=${scopes}&state=${state}&client_id=${clientDetails.id}`);
        }
        vscode.env.openExternal(uri);
        return utils_1.promiseFromEvent(exports.uriHandler.event, exchangeCodeForToken(state, scopes === 'vso' ? 'github.com' : AUTH_RELAY_SERVER, (code) => {
            if (scopes === 'vso') {
                const clientDetails = clientRegistrar_1.default.getGitHubAppDetails();
                return `/login/oauth/access_token?client_id=${clientDetails.id}&client_secret=${clientDetails.secret}&state=${state}&code=${code}`;
            }
            else {
                return `/token?code=${code}&state=${state}`;
            }
        })).finally(() => {
            this.updateStatusBarItem(false);
        });
    }
    updateStatusBarItem(isStart) {
        if (isStart && !this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this._statusBarItem.text = localize('signingIn', "$(mark-github) Signing in to github.com...");
            this._statusBarItem.command = 'github.provide-token';
            this._statusBarItem.show();
        }
        if (!isStart && this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
    }
    async manuallyProvideToken() {
        const uriOrToken = await vscode.window.showInputBox({ prompt: 'Token', ignoreFocusOut: true });
        if (!uriOrToken) {
            return;
        }
        try {
            const uri = vscode.Uri.parse(uriOrToken);
            if (!uri.scheme || uri.scheme === 'file') {
                throw new Error;
            }
            exports.uriHandler.handleUri(uri);
        }
        catch (e) {
            logger_1.default.error(e);
            vscode.window.showErrorMessage(localize('unexpectedInput', "The input did not matched the expected format"));
        }
    }
    async hasUserInstallation(token) {
        return new Promise((resolve, reject) => {
            logger_1.default.info('Getting user installations...');
            const post = https.request({
                host: 'api.github.com',
                path: `/user/installations`,
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.github.machine-man-preview+json',
                    Authorization: `token ${token}`,
                    'User-Agent': 'Visual-Studio-Code'
                }
            }, result => {
                const buffer = [];
                result.on('data', (chunk) => {
                    buffer.push(chunk);
                });
                result.on('end', () => {
                    if (result.statusCode === 200) {
                        const json = JSON.parse(Buffer.concat(buffer).toString());
                        logger_1.default.info('Got installation info!');
                        const hasInstallation = json.installations.some((installation) => installation.app_slug === 'microsoft-visual-studio-code');
                        resolve(hasInstallation);
                    }
                    else {
                        reject(new Error(result.statusMessage));
                    }
                });
            });
            post.end();
            post.on('error', err => {
                reject(err);
            });
        });
    }
    async installApp() {
        const clientDetails = clientRegistrar_1.default.getGitHubAppDetails();
        const state = uuid();
        const uri = vscode.Uri.parse(`https://github.com/apps/microsoft-visual-studio-code/installations/new?state=${state}`);
        vscode.env.openExternal(uri);
        return utils_1.promiseFromEvent(exports.uriHandler.event, exchangeCodeForToken(state, 'github.com', (code) => `/login/oauth/access_token?client_id=${clientDetails.id}&client_secret=${clientDetails.secret}&state=${state}&code=${code}`));
    }
    async getUserInfo(token) {
        return new Promise((resolve, reject) => {
            logger_1.default.info('Getting account info...');
            const post = https.request({
                host: 'api.github.com',
                path: `/user`,
                method: 'GET',
                headers: {
                    Authorization: `token ${token}`,
                    'User-Agent': 'Visual-Studio-Code'
                }
            }, result => {
                const buffer = [];
                result.on('data', (chunk) => {
                    buffer.push(chunk);
                });
                result.on('end', () => {
                    if (result.statusCode === 200) {
                        const json = JSON.parse(Buffer.concat(buffer).toString());
                        logger_1.default.info('Got account info!');
                        resolve({ id: json.id, accountName: json.login });
                    }
                    else {
                        logger_1.default.error(`Getting account info failed: ${result.statusMessage}`);
                        reject(new Error(result.statusMessage));
                    }
                });
            });
            post.end();
            post.on('error', err => {
                logger_1.default.error(err.message);
                reject(new Error(exports.NETWORK_ERROR));
            });
        });
    }
    async validateToken(token) {
        return new Promise(async (resolve, reject) => {
            const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.github-authentication/did-authenticate`));
            const clientDetails = clientRegistrar_1.default.getClientDetails(callbackUri);
            const detailsString = `${clientDetails.id}:${clientDetails.secret}`;
            const payload = JSON.stringify({ access_token: token });
            logger_1.default.info('Validating token...');
            const post = https.request({
                host: 'api.github.com',
                path: `/applications/${clientDetails.id}/token`,
                method: 'POST',
                headers: {
                    Authorization: `Basic ${Buffer.from(detailsString).toString('base64')}`,
                    'User-Agent': 'Visual-Studio-Code',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, result => {
                const buffer = [];
                result.on('data', (chunk) => {
                    buffer.push(chunk);
                });
                result.on('end', () => {
                    if (result.statusCode === 200) {
                        logger_1.default.info('Validated token!');
                        resolve();
                    }
                    else {
                        logger_1.default.info(`Validating token failed: ${result.statusMessage}`);
                        reject(new Error(result.statusMessage));
                    }
                });
            });
            post.write(payload);
            post.end();
            post.on('error', err => {
                logger_1.default.error(err.message);
                reject(new Error(exports.NETWORK_ERROR));
            });
        });
    }
    async revokeToken(token) {
        return new Promise(async (resolve, reject) => {
            const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://vscode.github-authentication/did-authenticate`));
            const clientDetails = clientRegistrar_1.default.getClientDetails(callbackUri);
            const detailsString = `${clientDetails.id}:${clientDetails.secret}`;
            const payload = JSON.stringify({ access_token: token });
            logger_1.default.info('Revoking token...');
            const post = https.request({
                host: 'api.github.com',
                path: `/applications/${clientDetails.id}/token`,
                method: 'DELETE',
                headers: {
                    Authorization: `Basic ${Buffer.from(detailsString).toString('base64')}`,
                    'User-Agent': 'Visual-Studio-Code',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, result => {
                const buffer = [];
                result.on('data', (chunk) => {
                    buffer.push(chunk);
                });
                result.on('end', () => {
                    if (result.statusCode === 204) {
                        logger_1.default.info('Revoked token!');
                        resolve();
                    }
                    else {
                        logger_1.default.info(`Revoking token failed: ${result.statusMessage}`);
                        reject(new Error(result.statusMessage));
                    }
                });
            });
            post.write(payload);
            post.end();
            post.on('error', err => {
                reject(err);
            });
        });
    }
}
exports.GitHubServer = GitHubServer;
//# sourceMappingURL=githubServer.js.map