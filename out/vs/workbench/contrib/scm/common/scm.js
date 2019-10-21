/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/platform/instantiation/common/instantiation"], function (require, exports, platform_1, views_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VIEWLET_ID = 'workbench.view.scm';
    exports.VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer(exports.VIEWLET_ID);
    exports.ISCMService = instantiation_1.createDecorator('scm');
    var InputValidationType;
    (function (InputValidationType) {
        InputValidationType[InputValidationType["Error"] = 0] = "Error";
        InputValidationType[InputValidationType["Warning"] = 1] = "Warning";
        InputValidationType[InputValidationType["Information"] = 2] = "Information";
    })(InputValidationType = exports.InputValidationType || (exports.InputValidationType = {}));
});
//# sourceMappingURL=scm.js.map