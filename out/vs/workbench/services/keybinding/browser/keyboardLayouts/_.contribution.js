/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KeyboardLayoutContribution {
        constructor() {
            this._layoutInfos = [];
        }
        get layoutInfos() {
            return this._layoutInfos;
        }
        registerKeyboardLayout(layout) {
            this._layoutInfos.push(layout);
        }
    }
    exports.KeyboardLayoutContribution = KeyboardLayoutContribution;
    KeyboardLayoutContribution.INSTANCE = new KeyboardLayoutContribution();
});
//# sourceMappingURL=_.contribution.js.map