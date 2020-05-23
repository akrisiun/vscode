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
define(["require", "exports", "vs/base/common/event", "vs/workbench/services/host/browser/host", "vs/platform/instantiation/common/extensions", "vs/platform/layout/browser/layoutService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/platform/windows/common/windows", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/label/common/label", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/services/environment/common/environmentService"], function (require, exports, event_1, host_1, extensions_1, layoutService_1, editorService_1, configuration_1, windows_1, editor_1, files_1, label_1, dom_1, lifecycle_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserHostService = void 0;
    let BrowserHostService = /** @class */ (() => {
        let BrowserHostService = class BrowserHostService extends lifecycle_1.Disposable {
            constructor(layoutService, editorService, configurationService, fileService, labelService, environmentService) {
                super();
                this.layoutService = layoutService;
                this.editorService = editorService;
                this.configurationService = configurationService;
                this.fileService = fileService;
                this.labelService = labelService;
                if (environmentService.options && environmentService.options.workspaceProvider) {
                    this.workspaceProvider = environmentService.options.workspaceProvider;
                }
                else {
                    this.workspaceProvider = new class {
                        constructor() {
                            this.workspace = undefined;
                        }
                        async open() { }
                    };
                }
            }
            get onDidChangeFocus() {
                if (!this._onDidChangeFocus) {
                    const focusTracker = this._register(dom_1.trackFocus(window));
                    this._onDidChangeFocus = event_1.Event.any(event_1.Event.map(focusTracker.onDidFocus, () => this.hasFocus), event_1.Event.map(focusTracker.onDidBlur, () => this.hasFocus));
                }
                return this._onDidChangeFocus;
            }
            get hasFocus() {
                return document.hasFocus();
            }
            async hadLastFocus() {
                return true;
            }
            async focus() {
                window.focus();
            }
            openWindow(arg1, arg2) {
                if (Array.isArray(arg1)) {
                    return this.doOpenWindow(arg1, arg2);
                }
                return this.doOpenEmptyWindow(arg1);
            }
            async doOpenWindow(toOpen, options) {
                for (let i = 0; i < toOpen.length; i++) {
                    const openable = toOpen[i];
                    openable.label = openable.label || this.getRecentLabel(openable);
                    // selectively copy payload: for now only extension debugging properties are considered
                    const originalPayload = this.workspaceProvider.payload;
                    let newPayload = undefined;
                    if (originalPayload && Array.isArray(originalPayload)) {
                        for (let pair of originalPayload) {
                            if (Array.isArray(pair) && pair.length === 2) {
                                switch (pair[0]) {
                                    case 'extensionDevelopmentPath':
                                    case 'debugId':
                                    case 'inspect-brk-extensions':
                                        if (!newPayload) {
                                            newPayload = new Array();
                                        }
                                        newPayload.push(pair);
                                        break;
                                }
                            }
                        }
                    }
                    // Folder
                    if (windows_1.isFolderToOpen(openable)) {
                        this.workspaceProvider.open({ folderUri: openable.folderUri }, { reuse: this.shouldReuse(options, false /* no file */), payload: newPayload });
                    }
                    // Workspace
                    else if (windows_1.isWorkspaceToOpen(openable)) {
                        this.workspaceProvider.open({ workspaceUri: openable.workspaceUri }, { reuse: this.shouldReuse(options, false /* no file */), payload: newPayload });
                    }
                    // File
                    else if (windows_1.isFileToOpen(openable)) {
                        // Same Window: open via editor service in current window
                        if (this.shouldReuse(options, true /* file */)) {
                            const inputs = await editor_1.pathsToEditors([openable], this.fileService);
                            this.editorService.openEditors(inputs);
                        }
                        // New Window: open into empty window
                        else {
                            const environment = new Map();
                            environment.set('openFile', openable.fileUri.toString());
                            this.workspaceProvider.open(undefined, { payload: Array.from(environment.entries()) });
                        }
                    }
                }
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
            shouldReuse(options = {}, isFile) {
                const windowConfig = this.configurationService.getValue('window');
                const openInNewWindowConfig = isFile ? ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFilesInNewWindow) || 'off' /* default */) : ((windowConfig === null || windowConfig === void 0 ? void 0 : windowConfig.openFoldersInNewWindow) || 'default' /* default */);
                let openInNewWindow = (options.preferNewWindow || !!options.forceNewWindow) && !options.forceReuseWindow;
                if (!options.forceNewWindow && !options.forceReuseWindow && (openInNewWindowConfig === 'on' || openInNewWindowConfig === 'off')) {
                    openInNewWindow = (openInNewWindowConfig === 'on');
                }
                return !openInNewWindow;
            }
            async doOpenEmptyWindow(options) {
                this.workspaceProvider.open(undefined, { reuse: options === null || options === void 0 ? void 0 : options.forceReuseWindow });
            }
            async toggleFullScreen() {
                const target = this.layoutService.container;
                // Chromium
                if (document.fullscreen !== undefined) {
                    if (!document.fullscreen) {
                        try {
                            return await target.requestFullscreen();
                        }
                        catch (error) {
                            console.warn('Toggle Full Screen failed'); // https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
                        }
                    }
                    else {
                        try {
                            return await document.exitFullscreen();
                        }
                        catch (error) {
                            console.warn('Exit Full Screen failed');
                        }
                    }
                }
                // Safari and Edge 14 are all using webkit prefix
                if (document.webkitIsFullScreen !== undefined) {
                    try {
                        if (!document.webkitIsFullScreen) {
                            target.webkitRequestFullscreen(); // it's async, but doesn't return a real promise.
                        }
                        else {
                            document.webkitExitFullscreen(); // it's async, but doesn't return a real promise.
                        }
                    }
                    catch (_a) {
                        console.warn('Enter/Exit Full Screen failed');
                    }
                }
            }
            async restart() {
                this.reload();
            }
            async reload() {
                window.location.reload();
            }
        };
        BrowserHostService = __decorate([
            __param(0, layoutService_1.ILayoutService),
            __param(1, editorService_1.IEditorService),
            __param(2, configuration_1.IConfigurationService),
            __param(3, files_1.IFileService),
            __param(4, label_1.ILabelService),
            __param(5, environmentService_1.IWorkbenchEnvironmentService)
        ], BrowserHostService);
        return BrowserHostService;
    })();
    exports.BrowserHostService = BrowserHostService;
    extensions_1.registerSingleton(host_1.IHostService, BrowserHostService, true);
});
//# sourceMappingURL=browserHostService.js.map