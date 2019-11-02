/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/css!./codicon/codicon", "vs/css!./codicon/codicon-animations"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function expand(text) {
        return text.replace(/\$\((([a-z0-9\-]+?)(~([a-z0-9\-]*?))?)\)/gi, (_match, _g1, name, _g3, animation) => {
            return `<span class="codicon codicon-${name} ${animation ? `codicon-animation-${animation}` : ''}"></span>`;
        });
    }
    function renderCodicons(label) {
        return expand(strings_1.escape(label));
    }
    exports.renderCodicons = renderCodicons;
    class CodiconLabel {
        constructor(_container) {
            this._container = _container;
        }
        set text(text) {
            this._container.innerHTML = renderCodicons(text || '');
        }
        set title(title) {
            this._container.title = title;
        }
    }
    exports.CodiconLabel = CodiconLabel;
});
//# sourceMappingURL=codiconLabel.js.map