/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ICustomEditorService = instantiation_1.createDecorator('customEditorService');
    exports.CONTEXT_HAS_CUSTOM_EDITORS = new contextkey_1.RawContextKey('hasCustomEditors', false);
    var CustomEditorPriority;
    (function (CustomEditorPriority) {
        CustomEditorPriority["default"] = "default";
        CustomEditorPriority["builtin"] = "builtin";
        CustomEditorPriority["option"] = "option";
    })(CustomEditorPriority = exports.CustomEditorPriority || (exports.CustomEditorPriority = {}));
});
//# sourceMappingURL=customEditor.js.map