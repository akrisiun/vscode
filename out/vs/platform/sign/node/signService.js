/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    class SignService {
        vsda() {
            return new Promise((resolve, reject) => require(['vsda'], resolve, reject));
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
                // ignore errors silently
            }
            return value;
        }
    }
    exports.SignService = SignService;
});
//# sourceMappingURL=signService.js.map