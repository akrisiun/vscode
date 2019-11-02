/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Protocol {
        constructor(sender, onMessage) {
            this.sender = sender;
            this.onMessage = onMessage;
        }
        send(message) {
            try {
                this.sender.send('ipc:message', message.buffer);
            }
            catch (e) {
                // systems are going down
            }
        }
        dispose() {
            this.sender.send('ipc:disconnect', null);
        }
    }
    exports.Protocol = Protocol;
});
//# sourceMappingURL=ipc.electron.js.map