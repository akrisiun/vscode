/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeytarCredentialsService = void 0;
    class KeytarCredentialsService {
        constructor() {
            this._keytar = new async_1.IdleValue(() => new Promise((resolve_1, reject_1) => { require(['keytar'], resolve_1, reject_1); }));
        }
        async getPassword(service, account) {
            const keytar = await this._keytar.getValue();
            return keytar.getPassword(service, account);
        }
        async setPassword(service, account, password) {
            const keytar = await this._keytar.getValue();
            return keytar.setPassword(service, account, password);
        }
        async deletePassword(service, account) {
            const keytar = await this._keytar.getValue();
            return keytar.deletePassword(service, account);
        }
        async findPassword(service) {
            const keytar = await this._keytar.getValue();
            return keytar.findPassword(service);
        }
        async findCredentials(service) {
            const keytar = await this._keytar.getValue();
            return keytar.findCredentials(service);
        }
    }
    exports.KeytarCredentialsService = KeytarCredentialsService;
});
//# sourceMappingURL=credentialsService.js.map