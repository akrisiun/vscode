/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UserDataSyncChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
                case 'onDidChangeLocal': return this.service.onDidChangeLocal;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'sync': return this.service.sync(args[0]);
                case '_getInitialStatus': return Promise.resolve(this.service.status);
                case 'getConflictsSource': return Promise.resolve(this.service.conflictsSource);
                case 'removeExtension': return this.service.removeExtension(args[0]);
                case 'stop':
                    this.service.stop();
                    return Promise.resolve();
            }
            throw new Error('Invalid call');
        }
    }
    exports.UserDataSyncChannel = UserDataSyncChannel;
});
//# sourceMappingURL=userDataSyncIpc.js.map