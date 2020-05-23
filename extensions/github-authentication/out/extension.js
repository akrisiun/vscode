"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const github_1 = require("./github");
const githubServer_1 = require("./githubServer");
const logger_1 = require("./common/logger");
const vscode_extension_telemetry_1 = require("vscode-extension-telemetry");
async function activate(context) {
    const { name, version, aiKey } = require('../package.json');
    const telemetryReporter = new vscode_extension_telemetry_1.default(name, version, aiKey);
    context.subscriptions.push(vscode.window.registerUriHandler(githubServer_1.uriHandler));
    const loginService = new github_1.GitHubAuthenticationProvider();
    await loginService.initialize();
    context.subscriptions.push(vscode.commands.registerCommand('github.provide-token', () => {
        return loginService.manuallyProvideToken();
    }));
    vscode.authentication.registerAuthenticationProvider({
        id: 'github',
        displayName: 'GitHub',
        onDidChangeSessions: github_1.onDidChangeSessions.event,
        getSessions: () => Promise.resolve(loginService.sessions),
        login: async (scopeList) => {
            try {
                telemetryReporter.sendTelemetryEvent('login');
                const session = await loginService.login(scopeList.sort().join(' '));
                logger_1.default.info('Login success!');
                github_1.onDidChangeSessions.fire({ added: [session.id], removed: [], changed: [] });
                return session;
            }
            catch (e) {
                telemetryReporter.sendTelemetryEvent('loginFailed');
                vscode.window.showErrorMessage(`Sign in failed: ${e}`);
                logger_1.default.error(e);
                throw e;
            }
        },
        logout: async (id) => {
            try {
                telemetryReporter.sendTelemetryEvent('logout');
                await loginService.logout(id);
                github_1.onDidChangeSessions.fire({ added: [], removed: [id], changed: [] });
            }
            catch (e) {
                telemetryReporter.sendTelemetryEvent('logoutFailed');
                vscode.window.showErrorMessage(`Sign out failed: ${e}`);
                logger_1.default.error(e);
                throw e;
            }
        }
    });
    return;
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map