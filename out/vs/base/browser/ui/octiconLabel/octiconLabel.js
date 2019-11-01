/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/css!./octicons/octicons", "vs/css!./octicons/octicons-animations"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function expand(text) {
        return text.replace(/\$\(((.+?)(~(.*?))?)\)/g, (_match, _g1, name, _g3, animation) => {
            return `<span class="octicon octicon-${name} ${animation ? `octicon-animation-${animation}` : ''}"></span>`;
        });
    }
    function renderOcticons(label) {
        return expand(strings_1.escape(label));
    }
    exports.renderOcticons = renderOcticons;
    class OcticonLabel {
        constructor(_container) {
            this._container = _container;
        }
        set text(text) {
            this._container.innerHTML = renderOcticons(text || '');
        }
        set title(title) {
            this._container.title = title;
        }
    }
    exports.OcticonLabel = OcticonLabel;
});
//# sourceMappingURL=octiconLabel.js.map