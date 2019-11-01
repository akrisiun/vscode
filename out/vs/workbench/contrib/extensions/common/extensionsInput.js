/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/base/common/uri"], function (require, exports, nls_1, editor_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionsInput extends editor_1.EditorInput {
        constructor(_extension) {
            super();
            this._extension = _extension;
        }
        get extension() { return this._extension; }
        getTypeId() {
            return ExtensionsInput.ID;
        }
        getName() {
            return nls_1.localize('extensionsInputName', "Extension: {0}", this.extension.displayName);
        }
        matches(other) {
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
        getResource() {
            return uri_1.URI.from({
                scheme: 'extension',
                path: this.extension.identifier.id
            });
        }
    }
    exports.ExtensionsInput = ExtensionsInput;
    ExtensionsInput.ID = 'workbench.extensions.input2';
});
//# sourceMappingURL=extensionsInput.js.map