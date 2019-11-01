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
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net", "vs/workbench/services/electron/electron-browser/electronEnvironmentService", "vs/base/parts/ipc/common/ipc", "vs/platform/ipc/electron-browser/mainProcessService", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/instantiation/common/extensions"], function (require, exports, ipc_net_1, electronEnvironmentService_1, ipc_1, mainProcessService_1, sharedProcessService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SharedProcessService = class SharedProcessService {
        constructor(mainProcessService, environmentService) {
            this.sharedProcessMainChannel = mainProcessService.getChannel('sharedProcess');
            this.withSharedProcessConnection = this.whenSharedProcessReady()
                .then(() => ipc_net_1.connect(environmentService.sharedIPCHandle, `window:${environmentService.windowId}`));
        }
        whenSharedProcessReady() {
            return this.sharedProcessMainChannel.call('whenSharedProcessReady');
        }
        getChannel(channelName) {
            return ipc_1.getDelayedChannel(this.withSharedProcessConnection.then(connection => connection.getChannel(channelName)));
        }
        registerChannel(channelName, channel) {
            this.withSharedProcessConnection.then(connection => connection.registerChannel(channelName, channel));
        }
        toggleSharedProcessWindow() {
            return this.sharedProcessMainChannel.call('toggleSharedProcessWindow');
        }
    };
    SharedProcessService = __decorate([
        __param(0, mainProcessService_1.IMainProcessService),
        __param(1, electronEnvironmentService_1.IElectronEnvironmentService)
    ], SharedProcessService);
    exports.SharedProcessService = SharedProcessService;
    extensions_1.registerSingleton(sharedProcessService_1.ISharedProcessService, SharedProcessService, true);
});
//# sourceMappingURL=sharedProcessService.js.map