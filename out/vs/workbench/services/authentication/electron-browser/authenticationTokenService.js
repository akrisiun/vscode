/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/authentication/common/authentication"], function (require, exports, sharedProcessService_1, extensions_1, lifecycle_1, event_1, authentication_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationTokenService = void 0;
    let AuthenticationTokenService = /** @class */ (() => {
        let AuthenticationTokenService = class AuthenticationTokenService extends lifecycle_1.Disposable {
            constructor(sharedProcessService) {
                super();
                this._onDidChangeToken = this._register(new event_1.Emitter());
                this.onDidChangeToken = this._onDidChangeToken.event;
                this._onTokenFailed = this._register(new event_1.Emitter());
                this.onTokenFailed = this._onTokenFailed.event;
                this.channel = sharedProcessService.getChannel('authToken');
                this._register(this.channel.listen('onTokenFailed')(_ => this.sendTokenFailed()));
            }
            getToken() {
                return this.channel.call('getToken');
            }
            setToken(token) {
                return this.channel.call('setToken', token);
            }
            sendTokenFailed() {
                this._onTokenFailed.fire();
            }
        };
        AuthenticationTokenService = __decorate([
            __param(0, sharedProcessService_1.ISharedProcessService)
        ], AuthenticationTokenService);
        return AuthenticationTokenService;
    })();
    exports.AuthenticationTokenService = AuthenticationTokenService;
    extensions_1.registerSingleton(authentication_1.IAuthenticationTokenService, AuthenticationTokenService);
});
//# sourceMappingURL=authenticationTokenService.js.map