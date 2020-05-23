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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/actions", "vs/nls", "vs/base/browser/browser", "vs/platform/keybinding/common/keybinding", "electron", "vs/platform/files/common/files", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/platform/configuration/common/configuration", "vs/platform/electron/node/electron", "vs/workbench/services/environment/common/environmentService", "vs/base/common/codicons", "vs/css!./media/actions"], function (require, exports, uri_1, actions_1, nls, browser, keybinding_1, electron_1, files_1, modelService_1, modeService_1, quickInput_1, getIconClasses_1, configuration_1, electron_2, environmentService_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleWindowTabsBarHandler = exports.MergeWindowTabsHandlerHandler = exports.MoveWindowTabToNewWindowHandler = exports.ShowNextWindowTabHandler = exports.ShowPreviousWindowTabHandler = exports.NewWindowTabHandler = exports.QuickSwitchWindow = exports.SwitchWindow = exports.BaseSwitchWindow = exports.ReloadWindowWithExtensionsDisabledAction = exports.ZoomResetAction = exports.ZoomOutAction = exports.ZoomInAction = exports.BaseZoomAction = exports.CloseCurrentWindowAction = void 0;
    let CloseCurrentWindowAction = /** @class */ (() => {
        let CloseCurrentWindowAction = class CloseCurrentWindowAction extends actions_1.Action {
            constructor(id, label, electronService) {
                super(id, label);
                this.electronService = electronService;
            }
            async run() {
                this.electronService.closeWindow();
            }
        };
        CloseCurrentWindowAction.ID = 'workbench.action.closeWindow';
        CloseCurrentWindowAction.LABEL = nls.localize('closeWindow', "Close Window");
        CloseCurrentWindowAction = __decorate([
            __param(2, electron_2.IElectronService)
        ], CloseCurrentWindowAction);
        return CloseCurrentWindowAction;
    })();
    exports.CloseCurrentWindowAction = CloseCurrentWindowAction;
    let BaseZoomAction = /** @class */ (() => {
        let BaseZoomAction = class BaseZoomAction extends actions_1.Action {
            constructor(id, label, configurationService) {
                super(id, label);
                this.configurationService = configurationService;
            }
            async setConfiguredZoomLevel(level) {
                level = Math.round(level); // when reaching smallest zoom, prevent fractional zoom levels
                if (level > BaseZoomAction.MAX_ZOOM_LEVEL || level < BaseZoomAction.MIN_ZOOM_LEVEL) {
                    return; // https://github.com/microsoft/vscode/issues/48357
                }
                const applyZoom = () => {
                    electron_1.webFrame.setZoomLevel(level);
                    browser.setZoomFactor(electron_1.webFrame.getZoomFactor());
                    // See https://github.com/Microsoft/vscode/issues/26151
                    // Cannot be trusted because the webFrame might take some time
                    // until it really applies the new zoom level
                    browser.setZoomLevel(electron_1.webFrame.getZoomLevel(), /*isTrusted*/ false);
                };
                await this.configurationService.updateValue(BaseZoomAction.SETTING_KEY, level);
                applyZoom();
            }
        };
        BaseZoomAction.SETTING_KEY = 'window.zoomLevel';
        BaseZoomAction.MAX_ZOOM_LEVEL = 9;
        BaseZoomAction.MIN_ZOOM_LEVEL = -8;
        BaseZoomAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], BaseZoomAction);
        return BaseZoomAction;
    })();
    exports.BaseZoomAction = BaseZoomAction;
    let ZoomInAction = /** @class */ (() => {
        let ZoomInAction = class ZoomInAction extends BaseZoomAction {
            constructor(id, label, configurationService) {
                super(id, label, configurationService);
            }
            async run() {
                this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() + 1);
            }
        };
        ZoomInAction.ID = 'workbench.action.zoomIn';
        ZoomInAction.LABEL = nls.localize('zoomIn', "Zoom In");
        ZoomInAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], ZoomInAction);
        return ZoomInAction;
    })();
    exports.ZoomInAction = ZoomInAction;
    let ZoomOutAction = /** @class */ (() => {
        let ZoomOutAction = class ZoomOutAction extends BaseZoomAction {
            constructor(id, label, configurationService) {
                super(id, label, configurationService);
            }
            async run() {
                this.setConfiguredZoomLevel(electron_1.webFrame.getZoomLevel() - 1);
            }
        };
        ZoomOutAction.ID = 'workbench.action.zoomOut';
        ZoomOutAction.LABEL = nls.localize('zoomOut', "Zoom Out");
        ZoomOutAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], ZoomOutAction);
        return ZoomOutAction;
    })();
    exports.ZoomOutAction = ZoomOutAction;
    let ZoomResetAction = /** @class */ (() => {
        let ZoomResetAction = class ZoomResetAction extends BaseZoomAction {
            constructor(id, label, configurationService) {
                super(id, label, configurationService);
            }
            async run() {
                this.setConfiguredZoomLevel(0);
            }
        };
        ZoomResetAction.ID = 'workbench.action.zoomReset';
        ZoomResetAction.LABEL = nls.localize('zoomReset', "Reset Zoom");
        ZoomResetAction = __decorate([
            __param(2, configuration_1.IConfigurationService)
        ], ZoomResetAction);
        return ZoomResetAction;
    })();
    exports.ZoomResetAction = ZoomResetAction;
    let ReloadWindowWithExtensionsDisabledAction = /** @class */ (() => {
        let ReloadWindowWithExtensionsDisabledAction = class ReloadWindowWithExtensionsDisabledAction extends actions_1.Action {
            constructor(id, label, electronService) {
                super(id, label);
                this.electronService = electronService;
            }
            async run() {
                await this.electronService.reload({ disableExtensions: true });
                return true;
            }
        };
        ReloadWindowWithExtensionsDisabledAction.ID = 'workbench.action.reloadWindowWithExtensionsDisabled';
        ReloadWindowWithExtensionsDisabledAction.LABEL = nls.localize('reloadWindowWithExtensionsDisabled', "Reload With Extensions Disabled");
        ReloadWindowWithExtensionsDisabledAction = __decorate([
            __param(2, electron_2.IElectronService)
        ], ReloadWindowWithExtensionsDisabledAction);
        return ReloadWindowWithExtensionsDisabledAction;
    })();
    exports.ReloadWindowWithExtensionsDisabledAction = ReloadWindowWithExtensionsDisabledAction;
    class BaseSwitchWindow extends actions_1.Action {
        constructor(id, label, environmentService, quickInputService, keybindingService, modelService, modeService, electronService) {
            super(id, label);
            this.environmentService = environmentService;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.electronService = electronService;
            this.closeWindowAction = {
                iconClass: codicons_1.Codicon.removeClose.classNames,
                tooltip: nls.localize('close', "Close Window")
            };
            this.closeDirtyWindowAction = {
                iconClass: 'dirty-window ' + codicons_1.Codicon.closeDirty,
                tooltip: nls.localize('close', "Close Window"),
                alwaysVisible: true
            };
        }
        async run() {
            const currentWindowId = this.environmentService.configuration.windowId;
            const windows = await this.electronService.getWindows();
            const placeHolder = nls.localize('switchWindowPlaceHolder', "Select a window to switch to");
            const picks = windows.map(win => {
                const resource = win.filename ? uri_1.URI.file(win.filename) : win.folderUri ? win.folderUri : win.workspace ? win.workspace.configPath : undefined;
                const fileKind = win.filename ? files_1.FileKind.FILE : win.workspace ? files_1.FileKind.ROOT_FOLDER : win.folderUri ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
                return {
                    payload: win.id,
                    label: win.title,
                    ariaLabel: win.dirty ? nls.localize('windowDirtyAriaLabel', "{0}, dirty window", win.title) : win.title,
                    iconClasses: getIconClasses_1.getIconClasses(this.modelService, this.modeService, resource, fileKind),
                    description: (currentWindowId === win.id) ? nls.localize('current', "Current Window") : undefined,
                    buttons: currentWindowId !== win.id ? win.dirty ? [this.closeDirtyWindowAction] : [this.closeWindowAction] : undefined
                };
            });
            const autoFocusIndex = (picks.indexOf(picks.filter(pick => pick.payload === currentWindowId)[0]) + 1) % picks.length;
            const pick = await this.quickInputService.pick(picks, {
                contextKey: 'inWindowsPicker',
                activeItem: picks[autoFocusIndex],
                placeHolder,
                quickNavigate: this.isQuickNavigate() ? { keybindings: this.keybindingService.lookupKeybindings(this.id) } : undefined,
                onDidTriggerItemButton: async (context) => {
                    await this.electronService.closeWindowById(context.item.payload);
                    context.removeItem();
                }
            });
            if (pick) {
                this.electronService.focusWindow({ windowId: pick.payload });
            }
        }
    }
    exports.BaseSwitchWindow = BaseSwitchWindow;
    let SwitchWindow = /** @class */ (() => {
        let SwitchWindow = class SwitchWindow extends BaseSwitchWindow {
            constructor(id, label, environmentService, quickInputService, keybindingService, modelService, modeService, electronService) {
                super(id, label, environmentService, quickInputService, keybindingService, modelService, modeService, electronService);
            }
            isQuickNavigate() {
                return false;
            }
        };
        SwitchWindow.ID = 'workbench.action.switchWindow';
        SwitchWindow.LABEL = nls.localize('switchWindow', "Switch Window...");
        SwitchWindow = __decorate([
            __param(2, environmentService_1.IWorkbenchEnvironmentService),
            __param(3, quickInput_1.IQuickInputService),
            __param(4, keybinding_1.IKeybindingService),
            __param(5, modelService_1.IModelService),
            __param(6, modeService_1.IModeService),
            __param(7, electron_2.IElectronService)
        ], SwitchWindow);
        return SwitchWindow;
    })();
    exports.SwitchWindow = SwitchWindow;
    let QuickSwitchWindow = /** @class */ (() => {
        let QuickSwitchWindow = class QuickSwitchWindow extends BaseSwitchWindow {
            constructor(id, label, environmentService, quickInputService, keybindingService, modelService, modeService, electronService) {
                super(id, label, environmentService, quickInputService, keybindingService, modelService, modeService, electronService);
            }
            isQuickNavigate() {
                return true;
            }
        };
        QuickSwitchWindow.ID = 'workbench.action.quickSwitchWindow';
        QuickSwitchWindow.LABEL = nls.localize('quickSwitchWindow', "Quick Switch Window...");
        QuickSwitchWindow = __decorate([
            __param(2, environmentService_1.IWorkbenchEnvironmentService),
            __param(3, quickInput_1.IQuickInputService),
            __param(4, keybinding_1.IKeybindingService),
            __param(5, modelService_1.IModelService),
            __param(6, modeService_1.IModeService),
            __param(7, electron_2.IElectronService)
        ], QuickSwitchWindow);
        return QuickSwitchWindow;
    })();
    exports.QuickSwitchWindow = QuickSwitchWindow;
    exports.NewWindowTabHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).newWindowTab();
    };
    exports.ShowPreviousWindowTabHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).showPreviousWindowTab();
    };
    exports.ShowNextWindowTabHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).showNextWindowTab();
    };
    exports.MoveWindowTabToNewWindowHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).moveWindowTabToNewWindow();
    };
    exports.MergeWindowTabsHandlerHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).mergeAllWindowTabs();
    };
    exports.ToggleWindowTabsBarHandler = function (accessor) {
        return accessor.get(electron_2.IElectronService).toggleWindowTabsBar();
    };
});
//# sourceMappingURL=windowActions.js.map