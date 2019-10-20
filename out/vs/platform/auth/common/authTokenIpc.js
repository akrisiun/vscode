/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuthTokenChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeStatus': return this.service.onDidChangeStatus;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case '_getInitialStatus': return Promise.resolve(this.service.status);
                case 'getToken': return this.service.getToken();
                case 'updateToken': return this.service.updateToken(args[0]);
                case 'refreshToken': return this.service.refreshToken();
                case 'deleteToken': return this.service.deleteToken();
            }
            throw new Error('Invalid call');
        }
    }
    exports.AuthTokenChannel = AuthTokenChannel;
});
//# sourceMappingURL=authTokenIpc.js.map