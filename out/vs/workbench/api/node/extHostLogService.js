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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uri", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/network", "vs/platform/log/node/spdlogService", "vs/workbench/api/common/extHostOutput"], function (require, exports, nls_1, path_1, log_1, extensions_1, uri_1, extHostInitDataService_1, network_1, spdlogService_1, extHostOutput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ExtHostLogService = class ExtHostLogService extends log_1.DelegatedLogService {
        constructor(initData, extHostOutputService) {
            if (initData.logsLocation.scheme !== network_1.Schemas.file) {
                throw new Error('Only file-logging supported');
            }
            super(new spdlogService_1.SpdLogService(extensions_1.ExtensionHostLogFileName, initData.logsLocation.fsPath, initData.logLevel));
            // Register an output channel for exthost log
            extHostOutputService.createOutputChannelFromLogFile(initData.remote.isRemote ? nls_1.localize('remote extension host Log', "Remote Extension Host") : nls_1.localize('extension host Log', "Extension Host"), uri_1.URI.file(path_1.join(initData.logsLocation.fsPath, `${extensions_1.ExtensionHostLogFileName}.log`)));
        }
        $setLevel(level) {
            this.setLevel(level);
        }
    };
    ExtHostLogService = __decorate([
        __param(0, extHostInitDataService_1.IExtHostInitDataService),
        __param(1, extHostOutput_1.IExtHostOutputService)
    ], ExtHostLogService);
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map