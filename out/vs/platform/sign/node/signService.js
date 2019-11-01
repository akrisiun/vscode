/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SignService {
        vsda() {
            return new Promise((resolve_1, reject_1) => { require(['vsda'], resolve_1, reject_1); });
        }
        async sign(value) {
            try {
                const vsda = await this.vsda();
                const signer = new vsda.signer();
                if (signer) {
                    return signer.sign(value);
                }
            }
            catch (e) {
                console.error('signer.sign: ' + e);
            }
            return value;
        }
    }
    exports.SignService = SignService;
});
//# sourceMappingURL=signService.js.map