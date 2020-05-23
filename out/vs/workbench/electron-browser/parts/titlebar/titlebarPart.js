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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/titlebar/titlebarPart", "vs/platform/contextview/browser/contextView", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/themeService", "vs/workbench/services/layout/browser/layoutService", "vs/platform/product/common/productService", "vs/platform/electron/node/electron", "vs/platform/windows/common/windows", "vs/platform/instantiation/common/instantiation", "vs/base/common/codicons"], function (require, exports, browser, DOM, contextkey_1, configuration_1, label_1, storage_1, environmentService_1, host_1, platform_1, actions_1, titlebarPart_1, contextView_1, editorService_1, workspace_1, themeService_1, layoutService_1, productService_1, electron_1, windows_1, instantiation_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitlebarPart = void 0;
    let TitlebarPart = /** @class */ (() => {
        let TitlebarPart = class TitlebarPart extends titlebarPart_1.TitlebarPart {
            constructor(contextMenuService, configurationService, editorService, environmentService, contextService, instantiationService, themeService, labelService, storageService, layoutService, menuService, contextKeyService, hostService, productService, electronService) {
                super(contextMenuService, configurationService, editorService, environmentService, contextService, instantiationService, themeService, labelService, storageService, layoutService, menuService, contextKeyService, hostService, productService);
                this.configurationService = configurationService;
                this.environmentService = environmentService;
                this.electronService = electronService;
            }
            onUpdateAppIconDragBehavior() {
                const setting = this.configurationService.getValue('window.doubleClickIconToClose');
                if (setting && this.appIcon) {
                    this.appIcon.style['-webkit-app-region'] = 'no-drag';
                }
                else if (this.appIcon) {
                    this.appIcon.style['-webkit-app-region'] = 'drag';
                }
            }
            onDidChangeMaximized(maximized) {
                if (this.maxRestoreControl) {
                    if (maximized) {
                        DOM.removeClasses(this.maxRestoreControl, codicons_1.Codicon.chromeMaximize.classNames);
                        DOM.addClasses(this.maxRestoreControl, codicons_1.Codicon.chromeRestore.classNames);
                    }
                    else {
                        DOM.removeClasses(this.maxRestoreControl, codicons_1.Codicon.chromeRestore.classNames);
                        DOM.addClasses(this.maxRestoreControl, codicons_1.Codicon.chromeMaximize.classNames);
                    }
                }
                if (this.resizer) {
                    if (maximized) {
                        DOM.hide(this.resizer);
                    }
                    else {
                        DOM.show(this.resizer);
                    }
                }
                this.adjustTitleMarginToCenter();
            }
            onMenubarFocusChanged(focused) {
                if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility !== 'compact' && this.dragRegion) {
                    if (focused) {
                        DOM.hide(this.dragRegion);
                    }
                    else {
                        DOM.show(this.dragRegion);
                    }
                }
            }
            onMenubarVisibilityChanged(visible) {
                // Hide title when toggling menu bar
                if ((platform_1.isWindows || platform_1.isLinux) && this.currentMenubarVisibility === 'toggle' && visible) {
                    // Hack to fix issue #52522 with layered webkit-app-region elements appearing under cursor
                    if (this.dragRegion) {
                        DOM.hide(this.dragRegion);
                        setTimeout(() => DOM.show(this.dragRegion), 50);
                    }
                }
                super.onMenubarVisibilityChanged(visible);
            }
            onConfigurationChanged(event) {
                super.onConfigurationChanged(event);
                if (event.affectsConfiguration('window.doubleClickIconToClose')) {
                    if (this.appIcon) {
                        this.onUpdateAppIconDragBehavior();
                    }
                }
            }
            adjustTitleMarginToCenter() {
                if (this.customMenubar && this.menubar) {
                    const leftMarker = (this.appIcon ? this.appIcon.clientWidth : 0) + this.menubar.clientWidth + 10;
                    const rightMarker = this.element.clientWidth - (this.windowControls ? this.windowControls.clientWidth : 0) - 10;
                    // Not enough space to center the titlebar within window,
                    // Center between menu and window controls
                    if (leftMarker > (this.element.clientWidth - this.title.clientWidth) / 2 ||
                        rightMarker < (this.element.clientWidth + this.title.clientWidth) / 2) {
                        this.title.style.position = '';
                        this.title.style.left = '';
                        this.title.style.transform = '';
                        return;
                    }
                }
                this.title.style.position = 'absolute';
                this.title.style.left = '50%';
                this.title.style.transform = 'translate(-50%, 0)';
            }
            installMenubar() {
                super.installMenubar();
                if (this.menubar) {
                    return;
                }
                if (this.customMenubar) {
                    this._register(this.customMenubar.onFocusStateChange(e => this.onMenubarFocusChanged(e)));
                }
            }
            createContentArea(parent) {
                const ret = super.createContentArea(parent);
                // App Icon (Native Windows/Linux)
                if (!platform_1.isMacintosh) {
                    this.appIcon = DOM.prepend(this.element, DOM.$('div.window-appicon'));
                    this.onUpdateAppIconDragBehavior();
                    this._register(DOM.addDisposableListener(this.appIcon, DOM.EventType.DBLCLICK, (e => {
                        this.electronService.closeWindow();
                    })));
                }
                // Draggable region that we can manipulate for #52522
                this.dragRegion = DOM.prepend(this.element, DOM.$('div.titlebar-drag-region'));
                // Window Controls (Native Windows/Linux)
                if (!platform_1.isMacintosh) {
                    this.windowControls = DOM.append(this.element, DOM.$('div.window-controls-container'));
                    // Minimize
                    const minimizeIcon = DOM.append(this.windowControls, DOM.$('div.window-icon.window-minimize' + codicons_1.Codicon.chromeMinimize.cssSelector));
                    this._register(DOM.addDisposableListener(minimizeIcon, DOM.EventType.CLICK, e => {
                        this.electronService.minimizeWindow();
                    }));
                    // Restore
                    this.maxRestoreControl = DOM.append(this.windowControls, DOM.$('div.window-icon.window-max-restore'));
                    this._register(DOM.addDisposableListener(this.maxRestoreControl, DOM.EventType.CLICK, async (e) => {
                        const maximized = await this.electronService.isMaximized();
                        if (maximized) {
                            return this.electronService.unmaximizeWindow();
                        }
                        return this.electronService.maximizeWindow();
                    }));
                    // Close
                    const closeIcon = DOM.append(this.windowControls, DOM.$('div.window-icon.window-close' + codicons_1.Codicon.chromeClose.cssSelector));
                    this._register(DOM.addDisposableListener(closeIcon, DOM.EventType.CLICK, e => {
                        this.electronService.closeWindow();
                    }));
                    // Resizer
                    this.resizer = DOM.append(this.element, DOM.$('div.resizer'));
                    this._register(this.layoutService.onMaximizeChange(maximized => this.onDidChangeMaximized(maximized)));
                    this.onDidChangeMaximized(this.layoutService.isWindowMaximized());
                }
                return ret;
            }
            updateLayout(dimension) {
                this.lastLayoutDimensions = dimension;
                if (windows_1.getTitleBarStyle(this.configurationService, this.environmentService) === 'custom') {
                    // Only prevent zooming behavior on macOS or when the menubar is not visible
                    if (platform_1.isMacintosh || this.currentMenubarVisibility === 'hidden') {
                        this.title.style.zoom = `${1 / browser.getZoomFactor()}`;
                        if (platform_1.isWindows || platform_1.isLinux) {
                            if (this.appIcon) {
                                this.appIcon.style.zoom = `${1 / browser.getZoomFactor()}`;
                            }
                            if (this.windowControls) {
                                this.windowControls.style.zoom = `${1 / browser.getZoomFactor()}`;
                            }
                        }
                    }
                    else {
                        this.title.style.zoom = '';
                        if (platform_1.isWindows || platform_1.isLinux) {
                            if (this.appIcon) {
                                this.appIcon.style.zoom = '';
                            }
                            if (this.windowControls) {
                                this.windowControls.style.zoom = '';
                            }
                        }
                    }
                    DOM.runAtThisOrScheduleAtNextAnimationFrame(() => this.adjustTitleMarginToCenter());
                    if (this.customMenubar) {
                        const menubarDimension = new DOM.Dimension(0, dimension.height);
                        this.customMenubar.layout(menubarDimension);
                    }
                }
            }
        };
        TitlebarPart = __decorate([
            __param(0, contextView_1.IContextMenuService),
            __param(1, configuration_1.IConfigurationService),
            __param(2, editorService_1.IEditorService),
            __param(3, environmentService_1.IWorkbenchEnvironmentService),
            __param(4, workspace_1.IWorkspaceContextService),
            __param(5, instantiation_1.IInstantiationService),
            __param(6, themeService_1.IThemeService),
            __param(7, label_1.ILabelService),
            __param(8, storage_1.IStorageService),
            __param(9, layoutService_1.IWorkbenchLayoutService),
            __param(10, actions_1.IMenuService),
            __param(11, contextkey_1.IContextKeyService),
            __param(12, host_1.IHostService),
            __param(13, productService_1.IProductService),
            __param(14, electron_1.IElectronService)
        ], TitlebarPart);
        return TitlebarPart;
    })();
    exports.TitlebarPart = TitlebarPart;
});
//# sourceMappingURL=titlebarPart.js.map