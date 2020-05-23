/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/base/common/uri"], function (require, exports, nls_1, editor_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsInput = void 0;
    let ExtensionsInput = /** @class */ (() => {
        class ExtensionsInput extends editor_1.EditorInput {
            constructor(_extension) {
                super();
                this._extension = _extension;
            }
            get extension() { return this._extension; }
            get resource() {
                return uri_1.URI.from({
                    scheme: 'extension',
                    path: this.extension.identifier.id
                });
            }
            getTypeId() {
                return ExtensionsInput.ID;
            }
            getName() {
                return nls_1.localize('extensionsInputName', "Extension: {0}", this.extension.displayName);
            }
            matches(other) {
                if (super.matches(other) === true) {
                    return true;
                }
                if (!(other instanceof ExtensionsInput)) {
                    return false;
                }
                const otherExtensionInput = other;
                // TODO@joao is this correct?
                return this.extension === otherExtensionInput.extension;
            }
            resolve() {
                return Promise.resolve(null);
            }
            supportsSplitEditor() {
                return false;
            }
        }
        ExtensionsInput.ID = 'workbench.extensions.input2';
        return ExtensionsInput;
    })();
    exports.ExtensionsInput = ExtensionsInput;
});
//# sourceMappingURL=extensionsInput.js.map