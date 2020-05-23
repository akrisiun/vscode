/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AuthenticationTokenServiceChannel = void 0;
    class AuthenticationTokenServiceChannel {
        constructor(service) {
            this.service = service;
        }
        listen(_, event) {
            switch (event) {
                case 'onDidChangeToken': return this.service.onDidChangeToken;
                case 'onTokenFailed': return this.service.onTokenFailed;
            }
            throw new Error(`Event not found: ${event}`);
        }
        call(context, command, args) {
            switch (command) {
                case 'setToken': return this.service.setToken(args);
                case 'getToken': return this.service.getToken();
            }
            throw new Error('Invalid call');
        }
    }
    exports.AuthenticationTokenServiceChannel = AuthenticationTokenServiceChannel;
});
//# sourceMappingURL=authenticationIpc.js.map