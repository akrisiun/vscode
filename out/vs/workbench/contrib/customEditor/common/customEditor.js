/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ICustomEditorService = instantiation_1.createDecorator('customEditorService');
    var CustomEditorPriority;
    (function (CustomEditorPriority) {
        CustomEditorPriority["default"] = "default";
        CustomEditorPriority["option"] = "option";
    })(CustomEditorPriority = exports.CustomEditorPriority || (exports.CustomEditorPriority = {}));
});
//# sourceMappingURL=customEditor.js.map