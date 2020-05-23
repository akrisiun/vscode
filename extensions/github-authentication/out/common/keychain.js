"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.keychain = exports.Keychain = void 0;
const vscode = require("vscode");
const logger_1 = require("./logger");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function getKeytar() {
    try {
        return require('keytar');
    }
    catch (err) {
        console.log(err);
    }
    return undefined;
}
const SERVICE_ID = `${vscode.env.uriScheme}-github.login`;
const ACCOUNT_ID = 'account';
class Keychain {
    constructor() {
        const keytar = getKeytar();
        if (!keytar) {
            throw new Error('System keychain unavailable');
        }
        this.keytar = keytar;
    }
    async setToken(token) {
        try {
            return await this.keytar.setPassword(SERVICE_ID, ACCOUNT_ID, token);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Setting token failed: ${e}`);
            const troubleshooting = localize('troubleshooting', "Troubleshooting Guide");
            const result = await vscode.window.showErrorMessage(localize('keychainWriteError', "Writing login information to the keychain failed with error '{0}'.", e.message), troubleshooting);
            if (result === troubleshooting) {
                vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/editor/settings-sync#_troubleshooting-keychain-issues'));
            }
        }
    }
    async getToken() {
        try {
            return await this.keytar.getPassword(SERVICE_ID, ACCOUNT_ID);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Getting token failed: ${e}`);
            return Promise.resolve(undefined);
        }
    }
    async deleteToken() {
        try {
            return await this.keytar.deletePassword(SERVICE_ID, ACCOUNT_ID);
        }
        catch (e) {
            // Ignore
            logger_1.default.error(`Deleting token failed: ${e}`);
            return Promise.resolve(undefined);
        }
    }
}
exports.Keychain = Keychain;
exports.keychain = new Keychain();
//# sourceMappingURL=keychain.js.map