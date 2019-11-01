/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/theme/common/themeService", "vs/base/common/color"], function (require, exports, event_1, themeService_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTheme {
        constructor(colors = {}, type = themeService_1.DARK) {
            this.colors = colors;
            this.type = type;
        }
        getColor(color, useDefault) {
            let value = this.colors[color];
            if (value) {
                return color_1.Color.fromHex(value);
            }
            return undefined;
        }
        defines(color) {
            throw new Error('Method not implemented.');
        }
    }
    exports.TestTheme = TestTheme;
    class TestIconTheme {
        constructor() {
            this.hasFileIcons = false;
            this.hasFolderIcons = false;
            this.hidesExplorerArrows = false;
        }
    }
    exports.TestIconTheme = TestIconTheme;
    class TestThemeService {
        constructor(theme = new TestTheme(), iconTheme = new TestIconTheme()) {
            this._onThemeChange = new event_1.Emitter();
            this._onIconThemeChange = new event_1.Emitter();
            this._theme = theme;
            this._iconTheme = iconTheme;
        }
        getTheme() {
            return this._theme;
        }
        setTheme(theme) {
            this._theme = theme;
            this.fireThemeChange();
        }
        fireThemeChange() {
            this._onThemeChange.fire(this._theme);
        }
        get onThemeChange() {
            return this._onThemeChange.event;
        }
        getIconTheme() {
            return this._iconTheme;
        }
        get onIconThemeChange() {
            return this._onIconThemeChange.event;
        }
    }
    exports.TestThemeService = TestThemeService;
});
//# sourceMappingURL=testThemeService.js.map