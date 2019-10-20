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
define(["require", "exports", "vs/platform/driver/node/driver", "vs/platform/windows/electron-main/windows", "vs/base/parts/ipc/node/ipc.net", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/base/common/keyCodes", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/scanCode", "vs/base/common/keybindingParser", "vs/base/common/async", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/electron/electron-main/electronMainService"], function (require, exports, driver_1, windows_1, ipc_net_1, lifecycle_1, ipc_1, keyCodes_1, usLayoutResolvedKeybinding_1, platform_1, event_1, scanCode_1, keybindingParser_1, async_1, lifecycleMainService_1, electronMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isSilentKeyCode(keyCode) {
        return keyCode < 21 /* KEY_0 */;
    }
    let Driver = class Driver {
        constructor(windowServer, options, windowsMainService, lifecycleMainService, electronMainService) {
            this.windowServer = windowServer;
            this.options = options;
            this.windowsMainService = windowsMainService;
            this.lifecycleMainService = lifecycleMainService;
            this.electronMainService = electronMainService;
            this.registeredWindowIds = new Set();
            this.reloadingWindowIds = new Set();
            this.onDidReloadingChange = new event_1.Emitter();
        }
        async registerWindowDriver(windowId) {
            this.registeredWindowIds.add(windowId);
            this.reloadingWindowIds.delete(windowId);
            this.onDidReloadingChange.fire();
            return this.options;
        }
        async reloadWindowDriver(windowId) {
            this.reloadingWindowIds.add(windowId);
        }
        async getWindowIds() {
            return this.windowsMainService.getWindows()
                .map(w => w.id)
                .filter(id => this.registeredWindowIds.has(id) && !this.reloadingWindowIds.has(id));
        }
        async capturePage(windowId) {
            await this.whenUnfrozen(windowId);
            const window = this.windowsMainService.getWindowById(windowId);
            if (!window) {
                throw new Error('Invalid window');
            }
            const webContents = window.win.webContents;
            const image = await new Promise(c => webContents.capturePage(c));
            return image.toPNG().toString('base64');
        }
        async reloadWindow(windowId) {
            await this.whenUnfrozen(windowId);
            const window = this.windowsMainService.getWindowById(windowId);
            if (!window) {
                throw new Error('Invalid window');
            }
            this.reloadingWindowIds.add(windowId);
            this.lifecycleMainService.reload(window);
        }
        async exitApplication() {
            return this.electronMainService.quit(undefined);
        }
        async dispatchKeybinding(windowId, keybinding) {
            await this.whenUnfrozen(windowId);
            const parts = keybindingParser_1.KeybindingParser.parseUserBinding(keybinding);
            for (let part of parts) {
                await this._dispatchKeybinding(windowId, part);
            }
        }
        async _dispatchKeybinding(windowId, keybinding) {
            if (keybinding instanceof scanCode_1.ScanCodeBinding) {
                throw new Error('ScanCodeBindings not supported');
            }
            const window = this.windowsMainService.getWindowById(windowId);
            if (!window) {
                throw new Error('Invalid window');
            }
            const webContents = window.win.webContents;
            const noModifiedKeybinding = new keyCodes_1.SimpleKeybinding(false, false, false, false, keybinding.keyCode);
            const resolvedKeybinding = new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(noModifiedKeybinding.toChord(), platform_1.OS);
            const keyCode = resolvedKeybinding.getElectronAccelerator();
            const modifiers = [];
            if (keybinding.ctrlKey) {
                modifiers.push('ctrl');
            }
            if (keybinding.metaKey) {
                modifiers.push('meta');
            }
            if (keybinding.shiftKey) {
                modifiers.push('shift');
            }
            if (keybinding.altKey) {
                modifiers.push('alt');
            }
            webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
            if (!isSilentKeyCode(keybinding.keyCode)) {
                webContents.sendInputEvent({ type: 'char', keyCode, modifiers });
            }
            webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers });
            await async_1.timeout(100);
        }
        async click(windowId, selector, xoffset, yoffset) {
            const windowDriver = await this.getWindowDriver(windowId);
            await windowDriver.click(selector, xoffset, yoffset);
        }
        async doubleClick(windowId, selector) {
            const windowDriver = await this.getWindowDriver(windowId);
            await windowDriver.doubleClick(selector);
        }
        async setValue(windowId, selector, text) {
            const windowDriver = await this.getWindowDriver(windowId);
            await windowDriver.setValue(selector, text);
        }
        async getTitle(windowId) {
            const windowDriver = await this.getWindowDriver(windowId);
            return await windowDriver.getTitle();
        }
        async isActiveElement(windowId, selector) {
            const windowDriver = await this.getWindowDriver(windowId);
            return await windowDriver.isActiveElement(selector);
        }
        async getElements(windowId, selector, recursive) {
            const windowDriver = await this.getWindowDriver(windowId);
            return await windowDriver.getElements(selector, recursive);
        }
        async getElementXY(windowId, selector, xoffset, yoffset) {
            const windowDriver = await this.getWindowDriver(windowId);
            return await windowDriver.getElementXY(selector, xoffset, yoffset);
        }
        async typeInEditor(windowId, selector, text) {
            const windowDriver = await this.getWindowDriver(windowId);
            await windowDriver.typeInEditor(selector, text);
        }
        async getTerminalBuffer(windowId, selector) {
            const windowDriver = await this.getWindowDriver(windowId);
            return await windowDriver.getTerminalBuffer(selector);
        }
        async writeInTerminal(windowId, selector, text) {
            const windowDriver = await this.getWindowDriver(windowId);
            await windowDriver.writeInTerminal(selector, text);
        }
        async getWindowDriver(windowId) {
            await this.whenUnfrozen(windowId);
            const id = `window:${windowId}`;
            const router = new ipc_1.StaticRouter(ctx => ctx === id);
            const windowDriverChannel = this.windowServer.getChannel('windowDriver', router);
            return new driver_1.WindowDriverChannelClient(windowDriverChannel);
        }
        async whenUnfrozen(windowId) {
            while (this.reloadingWindowIds.has(windowId)) {
                await event_1.Event.toPromise(this.onDidReloadingChange.event);
            }
        }
    };
    Driver = __decorate([
        __param(2, windows_1.IWindowsMainService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, electronMainService_1.IElectronMainService)
    ], Driver);
    exports.Driver = Driver;
    async function serve(windowServer, handle, environmentService, instantiationService) {
        const verbose = environmentService.driverVerbose;
        const driver = instantiationService.createInstance(Driver, windowServer, { verbose });
        const windowDriverRegistryChannel = new driver_1.WindowDriverRegistryChannel(driver);
        windowServer.registerChannel('windowDriverRegistry', windowDriverRegistryChannel);
        const server = await ipc_net_1.serve(handle);
        const channel = new driver_1.DriverChannel(driver);
        server.registerChannel('driver', channel);
        return lifecycle_1.combinedDisposable(server, windowServer);
    }
    exports.serve = serve;
});
//# sourceMappingURL=driver.js.map