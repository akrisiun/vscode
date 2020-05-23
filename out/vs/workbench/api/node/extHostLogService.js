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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/services/extensions/common/extensions", "vs/workbench/api/common/extHostInitDataService", "vs/base/common/network", "vs/platform/log/node/spdlogService", "vs/base/common/resources"], function (require, exports, log_1, extensions_1, extHostInitDataService_1, network_1, spdlogService_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLogService = void 0;
    let ExtHostLogService = /** @class */ (() => {
        let ExtHostLogService = class ExtHostLogService extends log_1.DelegatedLogService {
            constructor(initData) {
                if (initData.logFile.scheme !== network_1.Schemas.file) {
                    throw new Error('Only file-logging supported');
                }
                super(new spdlogService_1.SpdLogService(extensions_1.ExtensionHostLogFileName, resources_1.dirname(initData.logFile).fsPath, initData.logLevel));
            }
            $setLevel(level) {
                this.setLevel(level);
            }
        };
        ExtHostLogService = __decorate([
            __param(0, extHostInitDataService_1.IExtHostInitDataService)
        ], ExtHostLogService);
        return ExtHostLogService;
    })();
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map