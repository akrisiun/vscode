/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/platform", "electron", "vs/platform/state/node/state", "vs/platform/instantiation/common/instantiation"], function (require, exports, platform_1, electron_1, state_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const DEFAULT_BG_LIGHT = '#FFFFFF';
    const DEFAULT_BG_DARK = '#1E1E1E';
    const DEFAULT_BG_HC_BLACK = '#000000';
    const THEME_STORAGE_KEY = 'theme';
    const THEME_BG_STORAGE_KEY = 'themeBackground';
    exports.IThemeMainService = instantiation_1.createDecorator('themeMainService');
    let ThemeMainService = class ThemeMainService {
        constructor(stateService) {
            this.stateService = stateService;
            electron_1.ipcMain.on('vscode:changeColorTheme', (e, windowId, broadcast) => {
                // Theme changes
                if (typeof broadcast === 'string') {
                    this.storeBackgroundColor(JSON.parse(broadcast));
                }
            });
        }
        storeBackgroundColor(data) {
            this.stateService.setItem(THEME_STORAGE_KEY, data.baseTheme);
            this.stateService.setItem(THEME_BG_STORAGE_KEY, data.background);
        }
        getBackgroundColor() {
            if (platform_1.isWindows && electron_1.systemPreferences.isInvertedColorScheme()) {
                return DEFAULT_BG_HC_BLACK;
            }
            let background = this.stateService.getItem(THEME_BG_STORAGE_KEY, null);
            if (!background) {
                let baseTheme;
                if (platform_1.isWindows && electron_1.systemPreferences.isInvertedColorScheme()) {
                    baseTheme = 'hc-black';
                }
                else {
                    baseTheme = this.stateService.getItem(THEME_STORAGE_KEY, 'vs-dark').split(' ')[0];
                }
                background = (baseTheme === 'hc-black') ? DEFAULT_BG_HC_BLACK : (baseTheme === 'vs' ? DEFAULT_BG_LIGHT : DEFAULT_BG_DARK);
            }
            if (platform_1.isMacintosh && background.toUpperCase() === DEFAULT_BG_DARK) {
                background = '#171717'; // https://github.com/electron/electron/issues/5150
            }
            return background;
        }
    };
    ThemeMainService = __decorate([
        __param(0, state_1.IStateService)
    ], ThemeMainService);
    exports.ThemeMainService = ThemeMainService;
});
//# sourceMappingURL=themeMainService.js.map