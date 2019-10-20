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
define(["require", "exports", "vs/base/common/event", "vs/platform/credentials/common/credentials", "vs/base/common/lifecycle", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration"], function (require, exports, event_1, credentials_1, lifecycle_1, productService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const SERVICE_NAME = 'VS Code';
    const ACCOUNT = 'MyAccount';
    let AuthTokenService = class AuthTokenService extends lifecycle_1.Disposable {
        constructor(credentialsService, productService, configurationService) {
            super();
            this.credentialsService = credentialsService;
            this._status = "Disabled" /* Disabled */;
            this._onDidChangeStatus = this._register(new event_1.Emitter());
            this.onDidChangeStatus = this._onDidChangeStatus.event;
            if (productService.settingsSyncStoreUrl && configurationService.getValue('configurationSync.enableAuth')) {
                this._status = "Inactive" /* Inactive */;
                this.getToken().then(token => {
                    if (token) {
                        this.setStatus("Active" /* Active */);
                    }
                });
            }
        }
        get status() { return this._status; }
        getToken() {
            if (this.status === "Disabled" /* Disabled */) {
                throw new Error('Not enabled');
            }
            return this.credentialsService.getPassword(SERVICE_NAME, ACCOUNT);
        }
        async updateToken(token) {
            if (this.status === "Disabled" /* Disabled */) {
                throw new Error('Not enabled');
            }
            await this.credentialsService.setPassword(SERVICE_NAME, ACCOUNT, token);
            this.setStatus("Active" /* Active */);
        }
        async refreshToken() {
            if (this.status === "Disabled" /* Disabled */) {
                throw new Error('Not enabled');
            }
            await this.deleteToken();
        }
        async deleteToken() {
            if (this.status === "Disabled" /* Disabled */) {
                throw new Error('Not enabled');
            }
            await this.credentialsService.deletePassword(SERVICE_NAME, ACCOUNT);
            this.setStatus("Inactive" /* Inactive */);
        }
        setStatus(status) {
            if (this._status !== status) {
                this._status = status;
                this._onDidChangeStatus.fire(status);
            }
        }
    };
    AuthTokenService = __decorate([
        __param(0, credentials_1.ICredentialsService),
        __param(1, productService_1.IProductService),
        __param(2, configuration_1.IConfigurationService)
    ], AuthTokenService);
    exports.AuthTokenService = AuthTokenService;
});
//# sourceMappingURL=authTokenService.js.map