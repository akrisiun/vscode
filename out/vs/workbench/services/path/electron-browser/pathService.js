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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService"], function (require, exports, extensions_1, remoteAgentService_1, environmentService_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativePathService = void 0;
    let NativePathService = /** @class */ (() => {
        let NativePathService = class NativePathService extends pathService_1.AbstractPathService {
            constructor(remoteAgentService, environmentService) {
                super(() => environmentService.userHome, remoteAgentService);
            }
        };
        NativePathService = __decorate([
            __param(0, remoteAgentService_1.IRemoteAgentService),
            __param(1, environmentService_1.IWorkbenchEnvironmentService)
        ], NativePathService);
        return NativePathService;
    })();
    exports.NativePathService = NativePathService;
    extensions_1.registerSingleton(pathService_1.IPathService, NativePathService, true);
});
//# sourceMappingURL=pathService.js.map