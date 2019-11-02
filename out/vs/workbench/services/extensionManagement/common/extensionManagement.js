/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtensionManagementServerService = instantiation_1.createDecorator('extensionManagementServerService');
    var EnablementState;
    (function (EnablementState) {
        EnablementState[EnablementState["DisabledByExtensionKind"] = 0] = "DisabledByExtensionKind";
        EnablementState[EnablementState["DisabledByEnvironemt"] = 1] = "DisabledByEnvironemt";
        EnablementState[EnablementState["DisabledGlobally"] = 2] = "DisabledGlobally";
        EnablementState[EnablementState["DisabledWorkspace"] = 3] = "DisabledWorkspace";
        EnablementState[EnablementState["EnabledGlobally"] = 4] = "EnabledGlobally";
        EnablementState[EnablementState["EnabledWorkspace"] = 5] = "EnabledWorkspace";
    })(EnablementState = exports.EnablementState || (exports.EnablementState = {}));
    exports.IExtensionEnablementService = instantiation_1.createDecorator('extensionEnablementService');
    exports.IExtensionTipsService = instantiation_1.createDecorator('extensionTipsService');
    var ExtensionRecommendationReason;
    (function (ExtensionRecommendationReason) {
        ExtensionRecommendationReason[ExtensionRecommendationReason["Workspace"] = 0] = "Workspace";
        ExtensionRecommendationReason[ExtensionRecommendationReason["File"] = 1] = "File";
        ExtensionRecommendationReason[ExtensionRecommendationReason["Executable"] = 2] = "Executable";
        ExtensionRecommendationReason[ExtensionRecommendationReason["DynamicWorkspace"] = 3] = "DynamicWorkspace";
        ExtensionRecommendationReason[ExtensionRecommendationReason["Experimental"] = 4] = "Experimental";
    })(ExtensionRecommendationReason = exports.ExtensionRecommendationReason || (exports.ExtensionRecommendationReason = {}));
});
//# sourceMappingURL=extensionManagement.js.map