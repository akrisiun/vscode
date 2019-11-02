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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/auth/common/auth"], function (require, exports, lifecycle_1, userDataSync_1, productService_1, request_1, uri_1, resources_1, cancellation_1, auth_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncStoreService = class UserDataSyncStoreService extends lifecycle_1.Disposable {
        constructor(productService, requestService, authTokenService) {
            super();
            this.productService = productService;
            this.requestService = requestService;
            this.authTokenService = authTokenService;
        }
        get enabled() { return !!this.productService.settingsSyncStoreUrl; }
        async read(key, oldValue) {
            if (!this.enabled) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(uri_1.URI.parse(this.productService.settingsSyncStoreUrl), 'resource', key, 'latest').toString();
            const headers = {};
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request({ type: 'GET', url, headers }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 304) {
                // There is no new value. Hence return the old value.
                return oldValue;
            }
            if (!request_1.isSuccess(context)) {
                throw new Error('Server returned ' + context.res.statusCode);
            }
            const ref = context.res.headers['etag'];
            if (!ref) {
                throw new Error('Server did not return the ref');
            }
            const content = await request_1.asText(context);
            return { ref, content };
        }
        async write(key, data, ref) {
            if (!this.enabled) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(uri_1.URI.parse(this.productService.settingsSyncStoreUrl), 'resource', key).toString();
            const headers = { 'Content-Type': 'text/plain' };
            if (ref) {
                headers['If-Match'] = ref;
            }
            const context = await this.request({ type: 'POST', url, data, headers }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 412) {
                // There is a new value. Throw Rejected Error
                throw new userDataSync_1.UserDataSyncStoreError('New data exists', userDataSync_1.UserDataSyncStoreErrorCode.Rejected);
            }
            if (!request_1.isSuccess(context)) {
                throw new Error('Server returned ' + context.res.statusCode);
            }
            const newRef = context.res.headers['etag'];
            if (!newRef) {
                throw new Error('Server did not return the ref');
            }
            return newRef;
        }
        async request(options, token) {
            if (this.authTokenService.status !== "Disabled" /* Disabled */) {
                const authToken = await this.authTokenService.getToken();
                if (!authToken) {
                    throw new Error('No Auth Token Available.');
                }
                options.headers = options.headers || {};
                options.headers['authorization'] = `Bearer ${authToken}`;
            }
            const context = await this.requestService.request(options, token);
            if (context.res.statusCode === 401) {
                if (this.authTokenService.status !== "Disabled" /* Disabled */) {
                    this.authTokenService.refreshToken();
                }
                // Throw Unauthorized Error
                throw new userDataSync_1.UserDataSyncStoreError('Unauthorized', userDataSync_1.UserDataSyncStoreErrorCode.Unauthroized);
            }
            return context;
        }
    };
    UserDataSyncStoreService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, request_1.IRequestService),
        __param(2, auth_1.IAuthTokenService)
    ], UserDataSyncStoreService);
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
});
//# sourceMappingURL=userDataSyncStoreService.js.map