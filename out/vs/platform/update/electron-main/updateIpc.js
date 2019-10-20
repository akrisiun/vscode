/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UpdateChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onStateChange': return this.service.onStateChange;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'checkForUpdates': return this.service.checkForUpdates(arg);
                case 'downloadUpdate': return this.service.downloadUpdate();
                case 'applyUpdate': return this.service.applyUpdate();
                case 'quitAndInstall': return this.service.quitAndInstall();
                case '_getInitialState': return Promise.resolve(this.service.state);
                case 'isLatestVersion': return this.service.isLatestVersion();
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.UpdateChannel = UpdateChannel;
});
//# sourceMappingURL=updateIpc.js.map