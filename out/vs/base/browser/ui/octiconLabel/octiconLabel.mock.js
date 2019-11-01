/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function renderOcticons(text) {
        return strings_1.escape(text);
    }
    exports.renderOcticons = renderOcticons;
    class OcticonLabel {
        constructor(container) {
            this._container = container;
        }
        set text(text) {
            this._container.innerHTML = renderOcticons(text || '');
        }
    }
    exports.OcticonLabel = OcticonLabel;
});
//# sourceMappingURL=octiconLabel.mock.js.map