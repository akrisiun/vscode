/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/workbench/common/editor"], function (require, exports, nls, uri_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RuntimeExtensionsInput extends editor_1.EditorInput {
        constructor() {
            super();
        }
        getTypeId() {
            return RuntimeExtensionsInput.ID;
        }
        getName() {
            return nls.localize('extensionsInputName', "Running Extensions");
        }
        matches(other) {
            if (!(other instanceof RuntimeExtensionsInput)) {
                return false;
            }
            return true;
        }
        resolve() {
            return Promise.resolve(null);
        }
        supportsSplitEditor() {
            return false;
        }
        getResource() {
            return uri_1.URI.from({
                scheme: 'runtime-extensions',
                path: 'default'
            });
        }
    }
    exports.RuntimeExtensionsInput = RuntimeExtensionsInput;
    RuntimeExtensionsInput.ID = 'workbench.runtimeExtensions.input';
});
//# sourceMappingURL=runtimeExtensionsInput.js.map