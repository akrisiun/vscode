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
define(["require", "exports", "vs/base/common/event", "vs/platform/windows/electron-main/windows", "electron", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/dialogs/electron-main/dialogs"], function (require, exports, event_1, windows_1, electron_1, lifecycleMainService_1, platform_1, environment_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ElectronMainService = class ElectronMainService {
        constructor(windowsMainService, dialogMainService, lifecycleMainService, environmentService) {
            this.windowsMainService = windowsMainService;
            this.dialogMainService = dialogMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.environmentService = environmentService;
            //#region Events
            this.onWindowOpen = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-created', (_, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onWindowMaximize = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-maximize', (_, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onWindowUnmaximize = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-unmaximize', (_, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onWindowBlur = event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-blur', (_, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId));
            this.onWindowFocus = event_1.Event.any(event_1.Event.map(event_1.Event.filter(event_1.Event.map(this.windowsMainService.onWindowsCountChanged, () => this.windowsMainService.getLastActiveWindow()), window => !!window), window => window.id), event_1.Event.filter(event_1.Event.fromNodeEventEmitter(electron_1.app, 'browser-window-focus', (_, window) => window.id), windowId => !!this.windowsMainService.getWindowById(windowId)));
        }
        //#endregion
        //#region Window
        async getWindows() {
            const windows = this.windowsMainService.getWindows();
            return windows.map(window => ({
                id: window.id,
                workspace: window.openedWorkspace,
                folderUri: window.openedFolderUri,
                title: window.win.getTitle(),
                filename: window.getRepresentedFilename()
            }));
        }
        async getWindowCount(windowId) {
            return this.windowsMainService.getWindowCount();
        }
        async getActiveWindowId(windowId) {
            const activeWindow = electron_1.BrowserWindow.getFocusedWindow() || this.windowsMainService.getLastActiveWindow();
            if (activeWindow) {
                return activeWindow.id;
            }
            return undefined;
        }
        openWindow(windowId, arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(windowId, arg1, arg2);
            }
            return this.doOpenEmptyWindow(windowId, arg1);
        }
        async doOpenWindow(windowId, toOpen, options = Object.create(null)) {
            if (toOpen.length > 0) {
                this.windowsMainService.open({
                    context: 5 /* API */,
                    contextWindowId: windowId,
                    urisToOpen: toOpen,
                    cli: this.environmentService.args,
                    forceNewWindow: options.forceNewWindow,
                    forceReuseWindow: options.forceReuseWindow,
                    diffMode: options.diffMode,
                    addMode: options.addMode,
                    gotoLineMode: options.gotoLineMode,
                    noRecentEntry: options.noRecentEntry,
                    waitMarkerFileURI: options.waitMarkerFileURI
                });
            }
        }
        async doOpenEmptyWindow(windowId, options) {
            this.windowsMainService.openEmptyWindow(5 /* API */, options);
        }
        async toggleFullScreen(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.toggleFullScreen();
            }
        }
        async handleTitleDoubleClick(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.handleTitleDoubleClick();
            }
        }
        async isMaximized(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return window.win.isMaximized();
            }
            return false;
        }
        async maximizeWindow(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.win.maximize();
            }
        }
        async unmaximizeWindow(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.win.unmaximize();
            }
        }
        async minimizeWindow(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.win.minimize();
            }
        }
        async isWindowFocused(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return window.win.isFocused();
            }
            return false;
        }
        async focusWindow(windowId, options) {
            if (options && typeof options.windowId === 'number') {
                windowId = options.windowId;
            }
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                if (platform_1.isMacintosh) {
                    window.win.show();
                }
                else {
                    window.win.focus();
                }
            }
        }
        //#endregion
        //#region Dialog
        async showMessageBox(windowId, options) {
            return this.dialogMainService.showMessageBox(options, this.toBrowserWindow(windowId));
        }
        async showSaveDialog(windowId, options) {
            return this.dialogMainService.showSaveDialog(options, this.toBrowserWindow(windowId));
        }
        async showOpenDialog(windowId, options) {
            return this.dialogMainService.showOpenDialog(options, this.toBrowserWindow(windowId));
        }
        toBrowserWindow(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return window.win;
            }
            return undefined;
        }
        async pickFileFolderAndOpen(windowId, options) {
            return this.windowsMainService.pickFileFolderAndOpen(options, this.windowsMainService.getWindowById(windowId));
        }
        async pickFileAndOpen(windowId, options) {
            return this.windowsMainService.pickFileAndOpen(options, this.windowsMainService.getWindowById(windowId));
        }
        async pickFolderAndOpen(windowId, options) {
            return this.windowsMainService.pickFolderAndOpen(options, this.windowsMainService.getWindowById(windowId));
        }
        async pickWorkspaceAndOpen(windowId, options) {
            return this.windowsMainService.pickWorkspaceAndOpen(options, this.windowsMainService.getWindowById(windowId));
        }
        //#endregion
        //#region OS
        async showItemInFolder(windowId, path) {
            electron_1.shell.showItemInFolder(path);
        }
        async setRepresentedFilename(windowId, path) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.setRepresentedFilename(path);
            }
        }
        async setDocumentEdited(windowId, edited) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.win.setDocumentEdited(edited);
            }
        }
        async openExternal(windowId, url) {
            electron_1.shell.openExternal(url);
            return true;
        }
        async updateTouchBar(windowId, items) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.updateTouchBar(items);
            }
        }
        //#endregion
        //#region macOS Touchbar
        async newWindowTab() {
            this.windowsMainService.open({ context: 5 /* API */, cli: this.environmentService.args, forceNewTabbedWindow: true, forceEmpty: true });
        }
        async showPreviousWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectPreviousTab:');
        }
        async showNextWindowTab() {
            electron_1.Menu.sendActionToFirstResponder('selectNextTab:');
        }
        async moveWindowTabToNewWindow() {
            electron_1.Menu.sendActionToFirstResponder('moveTabToNewWindow:');
        }
        async mergeAllWindowTabs() {
            electron_1.Menu.sendActionToFirstResponder('mergeAllWindows:');
        }
        async toggleWindowTabsBar() {
            electron_1.Menu.sendActionToFirstResponder('toggleTabBar:');
        }
        //#endregion
        //#region Lifecycle
        async relaunch(windowId, options) {
            return this.lifecycleMainService.relaunch(options);
        }
        async reload(windowId, options) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return this.windowsMainService.reload(window, options && options.disableExtensions ? { _: [], 'disable-extensions': true } : undefined);
            }
        }
        async closeWorkspace(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return this.windowsMainService.closeWorkspace(window);
            }
        }
        async closeWindow(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return window.win.close();
            }
        }
        async quit(windowId) {
            return this.windowsMainService.quit();
        }
        //#endregion
        //#region Connectivity
        async resolveProxy(windowId, url) {
            return new Promise(resolve => {
                const window = this.windowsMainService.getWindowById(windowId);
                if (window && window.win && window.win.webContents && window.win.webContents.session) {
                    window.win.webContents.session.resolveProxy(url, proxy => resolve(proxy));
                }
                else {
                    resolve();
                }
            });
        }
        //#endregion
        //#region Development
        async openDevTools(windowId, options) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                window.win.webContents.openDevTools(options);
            }
        }
        async toggleDevTools(windowId) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                const contents = window.win.webContents;
                if (platform_1.isMacintosh && window.hasHiddenTitleBarStyle() && !window.isFullScreen() && !contents.isDevToolsOpened()) {
                    contents.openDevTools({ mode: 'undocked' }); // due to https://github.com/electron/electron/issues/3647
                }
                else {
                    contents.toggleDevTools();
                }
            }
        }
        async startCrashReporter(windowId, options) {
            electron_1.crashReporter.start(options);
        }
        //#endregion
        //#region Debug
        // TODO@Isidor move into debug IPC channel (https://github.com/microsoft/vscode/issues/81060)
        async openExtensionDevelopmentHostWindow(windowId, args, env) {
            const extDevPaths = args.extensionDevelopmentPath;
            if (extDevPaths) {
                this.windowsMainService.openExtensionDevelopmentHostWindow(extDevPaths, {
                    context: 5 /* API */,
                    cli: args,
                    userEnv: Object.keys(env).length > 0 ? env : undefined
                });
            }
        }
    };
    ElectronMainService = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, dialogs_1.IDialogMainService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, environment_1.IEnvironmentService)
    ], ElectronMainService);
    exports.ElectronMainService = ElectronMainService;
});
//# sourceMappingURL=electronMainService.js.map