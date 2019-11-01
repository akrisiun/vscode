/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/editorOptions", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, editorOptions_1, colorRegistry, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getWebviewThemeData(theme, configurationService) {
        const configuration = configurationService.getValue('editor');
        const editorFontFamily = configuration.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
        const editorFontWeight = configuration.fontWeight || editorOptions_1.EDITOR_FONT_DEFAULTS.fontWeight;
        const editorFontSize = configuration.fontSize || editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize;
        const exportedColors = colorRegistry.getColorRegistry().getColors().reduce((colors, entry) => {
            const color = theme.getColor(entry.id);
            if (color) {
                colors['vscode-' + entry.id.replace('.', '-')] = color.toString();
            }
            return colors;
        }, {});
        const styles = Object.assign({ 'vscode-font-family': '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "Ubuntu", "Droid Sans", sans-serif', 'vscode-font-weight': 'normal', 'vscode-font-size': '13px', 'vscode-editor-font-family': editorFontFamily, 'vscode-editor-font-weight': editorFontWeight, 'vscode-editor-font-size': editorFontSize }, exportedColors);
        const activeTheme = ApiThemeClassName.fromTheme(theme);
        return { styles, activeTheme };
    }
    exports.getWebviewThemeData = getWebviewThemeData;
    var ApiThemeClassName;
    (function (ApiThemeClassName) {
        ApiThemeClassName["light"] = "vscode-light";
        ApiThemeClassName["dark"] = "vscode-dark";
        ApiThemeClassName["highContrast"] = "vscode-high-contrast";
    })(ApiThemeClassName || (ApiThemeClassName = {}));
    (function (ApiThemeClassName) {
        function fromTheme(theme) {
            if (theme.type === themeService_1.LIGHT) {
                return ApiThemeClassName.light;
            }
            else if (theme.type === themeService_1.DARK) {
                return ApiThemeClassName.dark;
            }
            else {
                return ApiThemeClassName.highContrast;
            }
        }
        ApiThemeClassName.fromTheme = fromTheme;
    })(ApiThemeClassName || (ApiThemeClassName = {}));
});
//# sourceMappingURL=themeing.js.map