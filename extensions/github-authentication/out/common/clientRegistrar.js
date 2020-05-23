"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registrar = void 0;
const vscode_1 = require("vscode");
const fs = require("fs");
const path = require("path");
class Registrar {
    constructor() {
        try {
            const fileContents = fs.readFileSync(path.join(vscode_1.env.appRoot, 'extensions/github-authentication/src/common/config.json')).toString();
            this._config = JSON.parse(fileContents);
        }
        catch (e) {
            this._config = {
                OSS: {},
                INSIDERS: {},
                STABLE: {},
                EXPLORATION: {},
                VSO: {},
                VSO_PPE: {},
                VSO_DEV: {},
                GITHUB_APP: {}
            };
        }
    }
    getGitHubAppDetails() {
        if (!this._config.GITHUB_APP.id || !this._config.GITHUB_APP.secret) {
            throw new Error(`No GitHub App client configuration available`);
        }
        return this._config.GITHUB_APP;
    }
    getClientDetails(callbackUri) {
        let details;
        switch (callbackUri.scheme) {
            case 'code-oss':
                details = this._config.OSS;
                break;
            case 'vscode-insiders':
                details = this._config.INSIDERS;
                break;
            case 'vscode':
                details = this._config.STABLE;
                break;
            case 'vscode-exploration':
                details = this._config.EXPLORATION;
                break;
            case 'https':
                switch (callbackUri.authority) {
                    case 'online.visualstudio.com':
                        details = this._config.VSO;
                        break;
                    case 'online-ppe.core.vsengsaas.visualstudio.com':
                        details = this._config.VSO_PPE;
                        break;
                    case 'online.dev.core.vsengsaas.visualstudio.com':
                        details = this._config.VSO_DEV;
                        break;
                }
            default:
                throw new Error(`Unrecognized callback ${callbackUri}`);
        }
        if (!details.id || !details.secret) {
            throw new Error(`No client configuration available for ${callbackUri}`);
        }
        return details;
    }
}
exports.Registrar = Registrar;
const ClientRegistrar = new Registrar();
exports.default = ClientRegistrar;
//# sourceMappingURL=clientRegistrar.js.map