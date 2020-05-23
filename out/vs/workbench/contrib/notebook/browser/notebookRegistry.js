/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerOutputTransform = exports.NotebookRegistry = void 0;
    var NotebookRegistry;
    (function (NotebookRegistry) {
        function getOutputTransformContributions() {
            return NotebookRegistryImpl.INSTANCE.getNotebookOutputTransform();
        }
        NotebookRegistry.getOutputTransformContributions = getOutputTransformContributions;
    })(NotebookRegistry = exports.NotebookRegistry || (exports.NotebookRegistry = {}));
    function registerOutputTransform(id, kind, ctor) {
        NotebookRegistryImpl.INSTANCE.registerOutputTransform(id, kind, ctor);
    }
    exports.registerOutputTransform = registerOutputTransform;
    let NotebookRegistryImpl = /** @class */ (() => {
        class NotebookRegistryImpl {
            constructor() {
                this.outputTransforms = [];
            }
            registerOutputTransform(id, kind, ctor) {
                this.outputTransforms.push({ id: id, kind: kind, ctor: ctor });
            }
            getNotebookOutputTransform() {
                return this.outputTransforms.slice(0);
            }
        }
        NotebookRegistryImpl.INSTANCE = new NotebookRegistryImpl();
        return NotebookRegistryImpl;
    })();
});
//# sourceMappingURL=notebookRegistry.js.map