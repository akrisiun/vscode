/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationTokenService = exports.IAuthenticationTokenService = void 0;
    exports.IAuthenticationTokenService = instantiation_1.createDecorator('IAuthenticationTokenService');
    class AuthenticationTokenService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onDidChangeToken = this._register(new event_1.Emitter());
            this.onDidChangeToken = this._onDidChangeToken.event;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
        }
        async getToken() {
            return this._token;
        }
        async setToken(token) {
            if (token && this._token ? token.token !== this._token.token || token.authenticationProviderId !== this._token.authenticationProviderId : token !== this._token) {
                this._token = token;
                this._onDidChangeToken.fire(token);
            }
        }
        sendTokenFailed() {
            this.setToken(undefined);
            this._onTokenFailed.fire();
        }
    }
    exports.AuthenticationTokenService = AuthenticationTokenService;
});
//# sourceMappingURL=authentication.js.map