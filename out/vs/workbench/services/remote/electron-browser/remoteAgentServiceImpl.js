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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/product/common/product", "vs/platform/remote/node/nodeSocketFactory", "vs/workbench/services/remote/common/abstractRemoteAgentService", "vs/platform/sign/common/sign", "vs/platform/log/common/log"], function (require, exports, environment_1, remoteAuthorityResolver_1, product_1, nodeSocketFactory_1, abstractRemoteAgentService_1, sign_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let RemoteAgentService = class RemoteAgentService extends abstractRemoteAgentService_1.AbstractRemoteAgentService {
        constructor({ remoteAuthority }, environmentService, remoteAuthorityResolverService, signService, logService) {
            super(environmentService);
            this._connection = null;
            this.socketFactory = nodeSocketFactory_1.nodeSocketFactory;
            if (remoteAuthority) {
                this._connection = this._register(new abstractRemoteAgentService_1.RemoteAgentConnection(remoteAuthority, product_1.default.commit, nodeSocketFactory_1.nodeSocketFactory, remoteAuthorityResolverService, signService, logService));
            }
        }
        getConnection() {
            return this._connection;
        }
    };
    RemoteAgentService = __decorate([
        __param(1, environment_1.IEnvironmentService),
        __param(2, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(3, sign_1.ISignService),
        __param(4, log_1.ILogService)
    ], RemoteAgentService);
    exports.RemoteAgentService = RemoteAgentService;
});
//# sourceMappingURL=remoteAgentServiceImpl.js.map