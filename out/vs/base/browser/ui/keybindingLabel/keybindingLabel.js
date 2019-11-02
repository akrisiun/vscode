/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/keybindingLabels", "vs/base/browser/dom", "vs/nls", "vs/css!./keybindingLabel"], function (require, exports, objects_1, keybindingLabels_1, dom, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = dom.$;
    class KeybindingLabel {
        constructor(container, os, options) {
            this.os = os;
            this.options = options;
            this.domNode = dom.append(container, $('.monaco-keybinding'));
            this.didEverRender = false;
            container.appendChild(this.domNode);
        }
        get element() {
            return this.domNode;
        }
        set(keybinding, matches) {
            if (this.didEverRender && this.keybinding === keybinding && KeybindingLabel.areSame(this.matches, matches)) {
                return;
            }
            this.keybinding = keybinding;
            this.matches = matches;
            this.render();
        }
        render() {
            dom.clearNode(this.domNode);
            if (this.keybinding) {
                let [firstPart, chordPart] = this.keybinding.getParts();
                if (firstPart) {
                    this.renderPart(this.domNode, firstPart, this.matches ? this.matches.firstPart : null);
                }
                if (chordPart) {
                    dom.append(this.domNode, $('span.monaco-keybinding-key-chord-separator', undefined, ' '));
                    this.renderPart(this.domNode, chordPart, this.matches ? this.matches.chordPart : null);
                }
                this.domNode.title = this.keybinding.getAriaLabel() || '';
            }
            else if (this.options && this.options.renderUnboundKeybindings) {
                this.renderUnbound(this.domNode);
            }
            this.didEverRender = true;
        }
        renderPart(parent, part, match) {
            var _a, _b, _c, _d, _e;
            const modifierLabels = keybindingLabels_1.UILabelProvider.modifierLabels[this.os];
            if (part.ctrlKey) {
                this.renderKey(parent, modifierLabels.ctrlKey, Boolean((_a = match) === null || _a === void 0 ? void 0 : _a.ctrlKey), modifierLabels.separator);
            }
            if (part.shiftKey) {
                this.renderKey(parent, modifierLabels.shiftKey, Boolean((_b = match) === null || _b === void 0 ? void 0 : _b.shiftKey), modifierLabels.separator);
            }
            if (part.altKey) {
                this.renderKey(parent, modifierLabels.altKey, Boolean((_c = match) === null || _c === void 0 ? void 0 : _c.altKey), modifierLabels.separator);
            }
            if (part.metaKey) {
                this.renderKey(parent, modifierLabels.metaKey, Boolean((_d = match) === null || _d === void 0 ? void 0 : _d.metaKey), modifierLabels.separator);
            }
            const keyLabel = part.keyLabel;
            if (keyLabel) {
                this.renderKey(parent, keyLabel, Boolean((_e = match) === null || _e === void 0 ? void 0 : _e.keyCode), '');
            }
        }
        renderKey(parent, label, highlight, separator) {
            dom.append(parent, $('span.monaco-keybinding-key' + (highlight ? '.highlight' : ''), undefined, label));
            if (separator) {
                dom.append(parent, $('span.monaco-keybinding-key-separator', undefined, separator));
            }
        }
        renderUnbound(parent) {
            dom.append(parent, $('span.monaco-keybinding-key', undefined, nls_1.localize('unbound', "Unbound")));
        }
        static areSame(a, b) {
            if (a === b || (!a && !b)) {
                return true;
            }
            return !!a && !!b && objects_1.equals(a.firstPart, b.firstPart) && objects_1.equals(a.chordPart, b.chordPart);
        }
    }
    exports.KeybindingLabel = KeybindingLabel;
});
//# sourceMappingURL=keybindingLabel.js.map