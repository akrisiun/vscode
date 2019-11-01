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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/request/browser/requestService", "vs/platform/instantiation/common/extensions", "vs/platform/request/common/request", "vs/platform/electron/node/electron"], function (require, exports, configuration_1, log_1, requestService_1, extensions_1, request_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeRequestService = class NativeRequestService extends requestService_1.RequestService {
        constructor(configurationService, logService, electronService) {
            super(configurationService, logService);
            this.electronService = electronService;
        }
        async resolveProxy(url) {
            return this.electronService.resolveProxy(url);
        }
    };
    NativeRequestService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, log_1.ILogService),
        __param(2, electron_1.IElectronService)
    ], NativeRequestService);
    exports.NativeRequestService = NativeRequestService;
    extensions_1.registerSingleton(request_1.IRequestService, NativeRequestService, true);
});
//# sourceMappingURL=requestService.js.map