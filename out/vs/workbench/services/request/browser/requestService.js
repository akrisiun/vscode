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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/common/requestIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/request/browser/requestService", "vs/platform/instantiation/common/extensions", "vs/platform/request/common/request"], function (require, exports, configuration_1, log_1, requestIpc_1, remoteAgentService_1, requestService_1, extensions_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserRequestService = class BrowserRequestService extends requestService_1.RequestService {
        constructor(remoteAgentService, configurationService, logService) {
            super(configurationService, logService);
            const connection = remoteAgentService.getConnection();
            this.remoteRequestChannel = connection ? new requestIpc_1.RequestChannelClient(connection.getChannel('request')) : null;
        }
        async request(options, token) {
            try {
                const context = await super.request(options, token);
                if (this.remoteRequestChannel && context.res.statusCode === 405) {
                    return this.remoteRequestChannel.request(options, token);
                }
                return context;
            }
            catch (error) {
                if (this.remoteRequestChannel) {
                    const result = await this.remoteRequestChannel.request(options, token);
                    return result;
                }
                throw error;
            }
        }
    };
    BrowserRequestService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], BrowserRequestService);
    exports.BrowserRequestService = BrowserRequestService;
    extensions_1.registerSingleton(request_1.IRequestService, BrowserRequestService, true);
});
//# sourceMappingURL=requestService.js.map