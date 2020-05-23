"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubCredentialProviderManager = exports.GitHubCredentialProvider = void 0;
const util_1 = require("./util");
const vscode_1 = require("vscode");
class GitHubCredentialProvider {
    async getCredentials(host) {
        if (!/github\.com/i.test(host.authority)) {
            return;
        }
        const session = await this.getSession();
        return { username: session.account.id, password: await session.getAccessToken() };
    }
    async getSession() {
        const authenticationSessions = await vscode_1.authentication.getSessions('github', ['repo']);
        if (authenticationSessions.length) {
            return await authenticationSessions[0];
        }
        else {
            return await vscode_1.authentication.login('github', ['repo']);
        }
    }
}
exports.GitHubCredentialProvider = GitHubCredentialProvider;
class GithubCredentialProviderManager {
    constructor(askpass) {
        this.askpass = askpass;
        this.providerDisposable = util_1.EmptyDisposable;
        this._enabled = false;
        this.disposable = util_1.filterEvent(vscode_1.workspace.onDidChangeConfiguration, e => e.affectsConfiguration('git'))(this.refresh, this);
        this.refresh();
    }
    set enabled(enabled) {
        if (this._enabled === enabled) {
            return;
        }
        this._enabled = enabled;
        if (enabled) {
            this.providerDisposable = this.askpass.registerCredentialsProvider(new GitHubCredentialProvider());
        }
        else {
            this.providerDisposable.dispose();
        }
    }
    refresh() {
        const config = vscode_1.workspace.getConfiguration('git', null);
        this.enabled = config.get('enabled', true) && config.get('githubAuthentication', true);
    }
    dispose() {
        this.enabled = false;
        this.disposable.dispose();
    }
}
exports.GithubCredentialProviderManager = GithubCredentialProviderManager;
//# sourceMappingURL=github.js.map