/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/parts/ipc/electron-browser/ipc.electron-browser", "vs/base/common/lifecycle"], function (require, exports, instantiation_1, ipc_electron_browser_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMainProcessService = instantiation_1.createDecorator('mainProcessService');
    class MainProcessService extends lifecycle_1.Disposable {
        constructor(windowId) {
            super();
            this.mainProcessConnection = this._register(new ipc_electron_browser_1.Client(`window:${windowId}`));
        }
        getChannel(channelName) {
            return this.mainProcessConnection.getChannel(channelName);
        }
        registerChannel(channelName, channel) {
            this.mainProcessConnection.registerChannel(channelName, channel);
        }
    }
    exports.MainProcessService = MainProcessService;
});
//# sourceMappingURL=mainProcessService.js.map