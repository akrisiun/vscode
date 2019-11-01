/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/node/ipc.net"], function (require, exports, ipc_net_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DriverChannel {
        constructor(driver) {
            this.driver = driver;
        }
        listen(_, event) {
            throw new Error('No event found');
        }
        call(_, command, arg) {
            switch (command) {
                case 'getWindowIds': return this.driver.getWindowIds();
                case 'capturePage': return this.driver.capturePage(arg);
                case 'reloadWindow': return this.driver.reloadWindow(arg);
                case 'exitApplication': return this.driver.exitApplication();
                case 'dispatchKeybinding': return this.driver.dispatchKeybinding(arg[0], arg[1]);
                case 'click': return this.driver.click(arg[0], arg[1], arg[2], arg[3]);
                case 'doubleClick': return this.driver.doubleClick(arg[0], arg[1]);
                case 'setValue': return this.driver.setValue(arg[0], arg[1], arg[2]);
                case 'getTitle': return this.driver.getTitle(arg[0]);
                case 'isActiveElement': return this.driver.isActiveElement(arg[0], arg[1]);
                case 'getElements': return this.driver.getElements(arg[0], arg[1], arg[2]);
                case 'getElementXY': return this.driver.getElementXY(arg[0], arg[1], arg[2]);
                case 'typeInEditor': return this.driver.typeInEditor(arg[0], arg[1], arg[2]);
                case 'getTerminalBuffer': return this.driver.getTerminalBuffer(arg[0], arg[1]);
                case 'writeInTerminal': return this.driver.writeInTerminal(arg[0], arg[1], arg[2]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.DriverChannel = DriverChannel;
    class DriverChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        getWindowIds() {
            return this.channel.call('getWindowIds');
        }
        capturePage(windowId) {
            return this.channel.call('capturePage', windowId);
        }
        reloadWindow(windowId) {
            return this.channel.call('reloadWindow', windowId);
        }
        exitApplication() {
            return this.channel.call('exitApplication');
        }
        dispatchKeybinding(windowId, keybinding) {
            return this.channel.call('dispatchKeybinding', [windowId, keybinding]);
        }
        click(windowId, selector, xoffset, yoffset) {
            return this.channel.call('click', [windowId, selector, xoffset, yoffset]);
        }
        doubleClick(windowId, selector) {
            return this.channel.call('doubleClick', [windowId, selector]);
        }
        setValue(windowId, selector, text) {
            return this.channel.call('setValue', [windowId, selector, text]);
        }
        getTitle(windowId) {
            return this.channel.call('getTitle', [windowId]);
        }
        isActiveElement(windowId, selector) {
            return this.channel.call('isActiveElement', [windowId, selector]);
        }
        getElements(windowId, selector, recursive) {
            return this.channel.call('getElements', [windowId, selector, recursive]);
        }
        getElementXY(windowId, selector, xoffset, yoffset) {
            return this.channel.call('getElementXY', [windowId, selector, xoffset, yoffset]);
        }
        typeInEditor(windowId, selector, text) {
            return this.channel.call('typeInEditor', [windowId, selector, text]);
        }
        getTerminalBuffer(windowId, selector) {
            return this.channel.call('getTerminalBuffer', [windowId, selector]);
        }
        writeInTerminal(windowId, selector, text) {
            return this.channel.call('writeInTerminal', [windowId, selector, text]);
        }
    }
    exports.DriverChannelClient = DriverChannelClient;
    class WindowDriverRegistryChannel {
        constructor(registry) {
            this.registry = registry;
        }
        listen(_, event) {
            throw new Error(`Event not found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'registerWindowDriver': return this.registry.registerWindowDriver(arg);
                case 'reloadWindowDriver': return this.registry.reloadWindowDriver(arg);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.WindowDriverRegistryChannel = WindowDriverRegistryChannel;
    class WindowDriverRegistryChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        registerWindowDriver(windowId) {
            return this.channel.call('registerWindowDriver', windowId);
        }
        reloadWindowDriver(windowId) {
            return this.channel.call('reloadWindowDriver', windowId);
        }
    }
    exports.WindowDriverRegistryChannelClient = WindowDriverRegistryChannelClient;
    class WindowDriverChannel {
        constructor(driver) {
            this.driver = driver;
        }
        listen(_, event) {
            throw new Error(`No event found: ${event}`);
        }
        call(_, command, arg) {
            switch (command) {
                case 'click': return this.driver.click(arg[0], arg[1], arg[2]);
                case 'doubleClick': return this.driver.doubleClick(arg);
                case 'setValue': return this.driver.setValue(arg[0], arg[1]);
                case 'getTitle': return this.driver.getTitle();
                case 'isActiveElement': return this.driver.isActiveElement(arg);
                case 'getElements': return this.driver.getElements(arg[0], arg[1]);
                case 'getElementXY': return this.driver.getElementXY(arg[0], arg[1], arg[2]);
                case 'typeInEditor': return this.driver.typeInEditor(arg[0], arg[1]);
                case 'getTerminalBuffer': return this.driver.getTerminalBuffer(arg);
                case 'writeInTerminal': return this.driver.writeInTerminal(arg[0], arg[1]);
            }
            throw new Error(`Call not found: ${command}`);
        }
    }
    exports.WindowDriverChannel = WindowDriverChannel;
    class WindowDriverChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        click(selector, xoffset, yoffset) {
            return this.channel.call('click', [selector, xoffset, yoffset]);
        }
        doubleClick(selector) {
            return this.channel.call('doubleClick', selector);
        }
        setValue(selector, text) {
            return this.channel.call('setValue', [selector, text]);
        }
        getTitle() {
            return this.channel.call('getTitle');
        }
        isActiveElement(selector) {
            return this.channel.call('isActiveElement', selector);
        }
        getElements(selector, recursive) {
            return this.channel.call('getElements', [selector, recursive]);
        }
        getElementXY(selector, xoffset, yoffset) {
            return this.channel.call('getElementXY', [selector, xoffset, yoffset]);
        }
        typeInEditor(selector, text) {
            return this.channel.call('typeInEditor', [selector, text]);
        }
        getTerminalBuffer(selector) {
            return this.channel.call('getTerminalBuffer', selector);
        }
        writeInTerminal(selector, text) {
            return this.channel.call('writeInTerminal', [selector, text]);
        }
    }
    exports.WindowDriverChannelClient = WindowDriverChannelClient;
    async function connect(handle) {
        const client = await ipc_net_1.connect(handle, 'driverClient');
        const channel = client.getChannel('driver');
        const driver = new DriverChannelClient(channel);
        return { client, driver };
    }
    exports.connect = connect;
});
//# sourceMappingURL=driver.js.map