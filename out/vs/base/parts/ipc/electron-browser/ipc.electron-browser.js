/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.electron", "electron", "vs/base/common/buffer"], function (require, exports, event_1, ipc_1, ipc_electron_1, electron_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Client extends ipc_1.IPCClient {
        constructor(id) {
            const protocol = Client.createProtocol();
            super(protocol, id);
            this.protocol = protocol;
        }
        static createProtocol() {
            const onMessage = event_1.Event.fromNodeEventEmitter(electron_1.ipcRenderer, 'ipc:message', (_, message) => buffer_1.VSBuffer.wrap(message));
            electron_1.ipcRenderer.send('ipc:hello');
            return new ipc_electron_1.Protocol(electron_1.ipcRenderer, onMessage);
        }
        dispose() {
            this.protocol.dispose();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=ipc.electron-browser.js.map