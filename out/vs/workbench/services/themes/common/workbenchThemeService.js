/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkbenchThemeService = instantiation_1.createDecorator('themeService');
    exports.VS_LIGHT_THEME = 'vs';
    exports.VS_DARK_THEME = 'vs-dark';
    exports.VS_HC_THEME = 'hc-black';
    exports.HC_THEME_ID = 'Default High Contrast';
    exports.COLOR_THEME_SETTING = 'workbench.colorTheme';
    exports.DETECT_HC_SETTING = 'window.autoDetectHighContrast';
    exports.ICON_THEME_SETTING = 'workbench.iconTheme';
    exports.CUSTOM_WORKBENCH_COLORS_SETTING = 'workbench.colorCustomizations';
    exports.CUSTOM_EDITOR_COLORS_SETTING = 'editor.tokenColorCustomizations';
});
//# sourceMappingURL=workbenchThemeService.js.map