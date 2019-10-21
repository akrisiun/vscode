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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/electron/node/electron", "vs/platform/instantiation/common/extensions", "vs/platform/label/common/label", "vs/workbench/services/environment/common/environmentService", "vs/platform/windows/common/windows", "vs/base/common/lifecycle", "vs/workbench/services/electron/electron-browser/electronEnvironmentService"], function (require, exports, event_1, host_1, electron_1, extensions_1, label_1, environmentService_1, windows_1, lifecycle_1, electronEnvironmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DesktopHostService = class DesktopHostService extends lifecycle_1.Disposable {
        constructor(electronService, labelService, environmentService, electronEnvironmentService) {
            super();
            this.electronService = electronService;
            this.labelService = labelService;
            this.environmentService = environmentService;
            this.electronEnvironmentService = electronEnvironmentService;
            this._onDidChangeFocus = event_1.Event.any(event_1.Event.map(event_1.Event.filter(this.electronService.onWindowFocus, id => id === this.electronEnvironmentService.windowId), _ => true), event_1.Event.map(event_1.Event.filter(this.electronService.onWindowBlur, id => id === this.electronEnvironmentService.windowId), _ => false));
            // Resolve initial window focus state
            this._hasFocus = document.hasFocus();
            electronService.isWindowFocused().then(focused => this._hasFocus = focused);
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.onDidChangeFocus(focus => this._hasFocus = focus));
        }
        get onDidChangeFocus() { return this._onDidChangeFocus; }
        get hasFocus() { return this._hasFocus; }
        openWindow(arg1, arg2) {
            if (Array.isArray(arg1)) {
                return this.doOpenWindow(arg1, arg2);
            }
            return this.doOpenEmptyWindow(arg1);
        }
        doOpenWindow(toOpen, options) {
            if (!!this.environmentService.configuration.remoteAuthority) {
                toOpen.forEach(openable => openable.label = openable.label || this.getRecentLabel(openable));
            }
            return this.electronService.openWindow(toOpen, options);
        }
        getRecentLabel(openable) {
            if (windows_1.isFolderToOpen(openable)) {
                return this.labelService.getWorkspaceLabel(openable.folderUri, { verbose: true });
            }
            if (windows_1.isWorkspaceToOpen(openable)) {
                return this.labelService.getWorkspaceLabel({ id: '', configPath: openable.workspaceUri }, { verbose: true });
            }
            return this.labelService.getUriLabel(openable.fileUri);
        }
        doOpenEmptyWindow(options) {
            return this.electronService.openWindow(options);
        }
        toggleFullScreen() {
            return this.electronService.toggleFullScreen();
        }
        focus() {
            return this.electronService.focusWindow();
        }
        restart() {
            return this.electronService.relaunch();
        }
        reload() {
            return this.electronService.reload();
        }
    };
    DesktopHostService = __decorate([
        __param(0, electron_1.IElectronService),
        __param(1, label_1.ILabelService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, electronEnvironmentService_1.IElectronEnvironmentService)
    ], DesktopHostService);
    exports.DesktopHostService = DesktopHostService;
    extensions_1.registerSingleton(host_1.IHostService, DesktopHostService, true);
});
//# sourceMappingURL=desktopHostService.js.map