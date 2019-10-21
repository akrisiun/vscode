/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isEqualOrParent(tree, element, candidateParent) {
        const nav = tree.getNavigator(element);
        do {
            if (element === candidateParent) {
                return true;
            }
        } while (element = nav.parent());
        return false;
    }
    exports.isEqualOrParent = isEqualOrParent;
});
//# sourceMappingURL=treeUtils.js.map