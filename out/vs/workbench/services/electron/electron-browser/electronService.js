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
define(["require", "exports", "vs/platform/electron/node/electron", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/instantiation/common/extensions", "vs/base/parts/ipc/node/ipc", "vs/workbench/services/environment/common/environmentService"], function (require, exports, electron_1, mainProcessService_1, extensions_1, ipc_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronService = void 0;
    let ElectronService = /** @class */ (() => {
        let ElectronService = class ElectronService {
            constructor(mainProcessService, environmentService) {
                return ipc_1.createChannelSender(mainProcessService.getChannel('electron'), { context: environmentService.configuration.windowId });
            }
        };
        ElectronService = __decorate([
            __param(0, mainProcessService_1.IMainProcessService),
            __param(1, environmentService_1.IWorkbenchEnvironmentService)
        ], ElectronService);
        return ElectronService;
    })();
    exports.ElectronService = ElectronService;
    extensions_1.registerSingleton(electron_1.IElectronService, ElectronService, true);
});
//# sourceMappingURL=electronService.js.map