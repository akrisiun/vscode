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
define(["require", "exports", "electron", "vs/base/common/path", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/contributions", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/base/common/performance", "vs/workbench/services/electron/electron-browser/electronEnvironmentService", "vs/base/common/types"], function (require, exports, electron_1, path_1, browser_1, dom_1, color_1, event_1, lifecycle_1, lifecycle_2, platform_1, colorRegistry_1, themeService_1, editor_1, contributions_1, themes, layoutService_1, environmentService_1, textfiles_1, uri_1, editorGroupsService_1, configuration_1, perf, electronEnvironmentService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let PartsSplash = class PartsSplash {
        constructor(_themeService, _layoutService, _textFileService, _envService, _electronEnvService, lifecycleService, editorGroupsService, configService) {
            this._themeService = _themeService;
            this._layoutService = _layoutService;
            this._textFileService = _textFileService;
            this._envService = _envService;
            this._electronEnvService = _electronEnvService;
            this._disposables = new lifecycle_1.DisposableStore();
            lifecycleService.when(3 /* Restored */).then(_ => {
                this._removePartsSplash();
                perf.mark('didRemovePartsSplash');
            });
            event_1.Event.debounce(event_1.Event.any(browser_1.onDidChangeFullscreen, editorGroupsService.onDidLayout), () => { }, 800)(this._savePartsSplash, this, this._disposables);
            configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.titleBarStyle')) {
                    this._didChangeTitleBarStyle = true;
                    this._savePartsSplash();
                }
                else if (e.affectsConfiguration('workbench.colorTheme') || e.affectsConfiguration('workbench.colorCustomizations')) {
                    this._savePartsSplash();
                }
            }, this, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        _savePartsSplash() {
            var _a;
            const baseTheme = themeService_1.getThemeTypeSelector(this._themeService.getTheme().type);
            const colorInfo = {
                foreground: this._getThemeColor(colorRegistry_1.foreground),
                editorBackground: this._getThemeColor(colorRegistry_1.editorBackground),
                titleBarBackground: this._getThemeColor(themes.TITLE_BAR_ACTIVE_BACKGROUND),
                activityBarBackground: this._getThemeColor(themes.ACTIVITY_BAR_BACKGROUND),
                sideBarBackground: this._getThemeColor(themes.SIDE_BAR_BACKGROUND),
                statusBarBackground: this._getThemeColor(themes.STATUS_BAR_BACKGROUND),
                statusBarNoFolderBackground: this._getThemeColor(themes.STATUS_BAR_NO_FOLDER_BACKGROUND),
                windowBorder: (_a = this._getThemeColor(themes.WINDOW_ACTIVE_BORDER), (_a !== null && _a !== void 0 ? _a : this._getThemeColor(themes.WINDOW_INACTIVE_BORDER)))
            };
            const layoutInfo = !this._shouldSaveLayoutInfo() ? undefined : {
                sideBarSide: this._layoutService.getSideBarPosition() === 1 /* RIGHT */ ? 'right' : 'left',
                editorPartMinWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                titleBarHeight: this._layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */) ? dom_1.getTotalHeight(types_1.assertIsDefined(this._layoutService.getContainer("workbench.parts.titlebar" /* TITLEBAR_PART */))) : 0,
                activityBarWidth: this._layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */) ? dom_1.getTotalWidth(types_1.assertIsDefined(this._layoutService.getContainer("workbench.parts.activitybar" /* ACTIVITYBAR_PART */))) : 0,
                sideBarWidth: this._layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */) ? dom_1.getTotalWidth(types_1.assertIsDefined(this._layoutService.getContainer("workbench.parts.sidebar" /* SIDEBAR_PART */))) : 0,
                statusBarHeight: this._layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */) ? dom_1.getTotalHeight(types_1.assertIsDefined(this._layoutService.getContainer("workbench.parts.statusbar" /* STATUSBAR_PART */))) : 0,
                windowBorder: this._layoutService.hasWindowBorder(),
                windowBorderRadius: this._layoutService.getWindowBorderRadius()
            };
            this._textFileService.write(uri_1.URI.file(path_1.join(this._envService.userDataPath, 'rapid_render.json')), JSON.stringify({
                id: PartsSplash._splashElementId,
                colorInfo,
                layoutInfo,
                baseTheme
            }), { encoding: 'utf8', overwriteEncoding: true });
            if (baseTheme !== this._lastBaseTheme || colorInfo.editorBackground !== this._lastBackground) {
                // notify the main window on background color changes: the main window sets the background color to new windows
                this._lastBaseTheme = baseTheme;
                this._lastBackground = colorInfo.editorBackground;
                // the color needs to be in hex
                const backgroundColor = this._themeService.getTheme().getColor(colorRegistry_1.editorBackground) || themes.WORKBENCH_BACKGROUND(this._themeService.getTheme());
                const payload = JSON.stringify({ baseTheme, background: color_1.Color.Format.CSS.formatHex(backgroundColor) });
                electron_1.ipcRenderer.send('vscode:changeColorTheme', this._electronEnvService.windowId, payload);
            }
        }
        _getThemeColor(id) {
            const theme = this._themeService.getTheme();
            const color = theme.getColor(id);
            return color ? color.toString() : undefined;
        }
        _shouldSaveLayoutInfo() {
            return !browser_1.isFullscreen() && !this._envService.isExtensionDevelopment && !this._didChangeTitleBarStyle;
        }
        _removePartsSplash() {
            let element = document.getElementById(PartsSplash._splashElementId);
            if (element) {
                element.style.display = 'none';
            }
            // remove initial colors
            let defaultStyles = document.head.getElementsByClassName('initialShellColors');
            if (defaultStyles.length) {
                document.head.removeChild(defaultStyles[0]);
            }
        }
    };
    PartsSplash._splashElementId = 'monaco-parts-splash';
    PartsSplash = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, electronEnvironmentService_1.IElectronEnvironmentService),
        __param(5, lifecycle_2.ILifecycleService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, configuration_1.IConfigurationService)
    ], PartsSplash);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(PartsSplash, 1 /* Starting */);
});
//# sourceMappingURL=partsSplash.contribution.js.map