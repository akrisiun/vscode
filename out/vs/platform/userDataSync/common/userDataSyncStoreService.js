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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/platform/request/common/request", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/platform/authentication/common/authentication", "vs/platform/product/common/productService", "vs/platform/serviceMachineId/common/serviceMachineId", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/base/common/objects"], function (require, exports, lifecycle_1, userDataSync_1, request_1, resources_1, cancellation_1, configuration_1, authentication_1, productService_1, serviceMachineId_1, environment_1, files_1, storage_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncStoreService = void 0;
    let UserDataSyncStoreService = /** @class */ (() => {
        let UserDataSyncStoreService = class UserDataSyncStoreService extends lifecycle_1.Disposable {
            constructor(productService, configurationService, requestService, authTokenService, logService, environmentService, fileService, storageService) {
                super();
                this.requestService = requestService;
                this.authTokenService = authTokenService;
                this.logService = logService;
                this.userDataSyncStore = userDataSync_1.getUserDataSyncStore(productService, configurationService);
                this.commonHeadersPromise = serviceMachineId_1.getServiceMachineId(environmentService, fileService, storageService)
                    .then(uuid => {
                    const headers = {
                        'X-Sync-Client-Id': productService.version,
                    };
                    headers['X-Sync-Machine-Id'] = uuid;
                    return headers;
                });
            }
            async getAllRefs(resource) {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const uri = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource);
                const headers = {};
                const context = await this.request({ type: 'GET', url: uri.toString(), headers }, undefined, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown, undefined);
                }
                const result = await request_1.asJson(context) || [];
                return result.map(({ url, created }) => ({ ref: resources_1.relativePath(uri, uri.with({ path: url })), created: created * 1000 /* Server returns in seconds */ }));
            }
            async resolveContent(resource, ref) {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource, ref).toString();
                const headers = {};
                headers['Cache-Control'] = 'no-cache';
                const context = await this.request({ type: 'GET', url, headers }, undefined, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown, undefined);
                }
                const content = await request_1.asText(context);
                return content;
            }
            async delete(resource) {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource).toString();
                const headers = {};
                const context = await this.request({ type: 'DELETE', url, headers }, undefined, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown, undefined);
                }
            }
            async read(resource, oldValue) {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource, 'latest').toString();
                const headers = {};
                // Disable caching as they are cached by synchronisers
                headers['Cache-Control'] = 'no-cache';
                if (oldValue) {
                    headers['If-None-Match'] = oldValue.ref;
                }
                const context = await this.request({ type: 'GET', url, headers }, resource, cancellation_1.CancellationToken.None);
                if (context.res.statusCode === 304) {
                    // There is no new value. Hence return the old value.
                    return oldValue;
                }
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown, resource);
                }
                const ref = context.res.headers['etag'];
                if (!ref) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', userDataSync_1.UserDataSyncErrorCode.NoRef, resource);
                }
                const content = await request_1.asText(context);
                return { ref, content };
            }
            async write(resource, data, ref) {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource).toString();
                const headers = { 'Content-Type': 'text/plain' };
                if (ref) {
                    headers['If-Match'] = ref;
                }
                const context = await this.request({ type: 'POST', url, data, headers }, resource, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown, resource);
                }
                const newRef = context.res.headers['etag'];
                if (!newRef) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', userDataSync_1.UserDataSyncErrorCode.NoRef, resource);
                }
                return newRef;
            }
            async manifest() {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'manifest').toString();
                const headers = { 'Content-Type': 'application/json' };
                const context = await this.request({ type: 'GET', url, headers }, undefined, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
                }
                return request_1.asJson(context);
            }
            async clear() {
                if (!this.userDataSyncStore) {
                    throw new Error('No settings sync store url configured.');
                }
                const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource').toString();
                const headers = { 'Content-Type': 'text/plain' };
                const context = await this.request({ type: 'DELETE', url, headers }, undefined, cancellation_1.CancellationToken.None);
                if (!request_1.isSuccess(context)) {
                    throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
                }
            }
            async request(options, source, token) {
                var _a, _b, _c, _d, _e;
                const authToken = await this.authTokenService.getToken();
                if (!authToken) {
                    throw new userDataSync_1.UserDataSyncStoreError('No Auth Token Available', userDataSync_1.UserDataSyncErrorCode.Unauthorized, source);
                }
                const commonHeaders = await this.commonHeadersPromise;
                options.headers = objects_1.assign(options.headers || {}, commonHeaders, {
                    'X-Account-Type': authToken.authenticationProviderId,
                    'authorization': `Bearer ${authToken.token}`,
                });
                this.logService.trace('Sending request to server', { url: options.url, type: options.type, headers: Object.assign(Object.assign({}, options.headers), { authorization: undefined }) });
                let context;
                try {
                    context = await this.requestService.request(options, token);
                    this.logService.trace('Request finished', { url: options.url, status: context.res.statusCode });
                }
                catch (e) {
                    throw new userDataSync_1.UserDataSyncStoreError(`Connection refused for the request '${(_a = options.url) === null || _a === void 0 ? void 0 : _a.toString()}'.`, userDataSync_1.UserDataSyncErrorCode.ConnectionRefused, source);
                }
                if (context.res.statusCode === 401) {
                    this.authTokenService.sendTokenFailed();
                    throw new userDataSync_1.UserDataSyncStoreError(`Request '${(_b = options.url) === null || _b === void 0 ? void 0 : _b.toString()}' failed because of Unauthorized (401).`, userDataSync_1.UserDataSyncErrorCode.Unauthorized, source);
                }
                if (context.res.statusCode === 403) {
                    throw new userDataSync_1.UserDataSyncStoreError(`Request '${(_c = options.url) === null || _c === void 0 ? void 0 : _c.toString()}' is Forbidden (403).`, userDataSync_1.UserDataSyncErrorCode.Forbidden, source);
                }
                if (context.res.statusCode === 412) {
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_d = options.url) === null || _d === void 0 ? void 0 : _d.toString()}' failed because of Precondition Failed (412). There is new data exists for this resource. Make the request again with latest data.`, userDataSync_1.UserDataSyncErrorCode.RemotePreconditionFailed, source);
                }
                if (context.res.statusCode === 413) {
                    throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_e = options.url) === null || _e === void 0 ? void 0 : _e.toString()}' failed because of too large payload (413).`, userDataSync_1.UserDataSyncErrorCode.TooLarge, source);
                }
                return context;
            }
        };
        UserDataSyncStoreService = __decorate([
            __param(0, productService_1.IProductService),
            __param(1, configuration_1.IConfigurationService),
            __param(2, request_1.IRequestService),
            __param(3, authentication_1.IAuthenticationTokenService),
            __param(4, userDataSync_1.IUserDataSyncLogService),
            __param(5, environment_1.IEnvironmentService),
            __param(6, files_1.IFileService),
            __param(7, storage_1.IStorageService)
        ], UserDataSyncStoreService);
        return UserDataSyncStoreService;
    })();
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
});
//# sourceMappingURL=userDataSyncStoreService.js.map