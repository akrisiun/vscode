/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/parts/contextmenu/common/contextmenu"], function (require, exports, electron_1, contextmenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let contextMenuIdPool = 0;
    function popup(items, options) {
        const processedItems = [];
        const contextMenuId = contextMenuIdPool++;
        const onClickChannel = `vscode:onContextMenu${contextMenuId}`;
        const onClickChannelHandler = (_event, itemId, context) => {
            const item = processedItems[itemId];
            if (item.click) {
                item.click(context);
            }
        };
        electron_1.ipcRenderer.once(onClickChannel, onClickChannelHandler);
        electron_1.ipcRenderer.once(contextmenu_1.CONTEXT_MENU_CLOSE_CHANNEL, (_event, closedContextMenuId) => {
            if (closedContextMenuId !== contextMenuId) {
                return;
            }
            electron_1.ipcRenderer.removeListener(onClickChannel, onClickChannelHandler);
            if (options && options.onHide) {
                options.onHide();
            }
        });
        electron_1.ipcRenderer.send(contextmenu_1.CONTEXT_MENU_CHANNEL, contextMenuId, items.map(item => createItem(item, processedItems)), onClickChannel, options);
    }
    exports.popup = popup;
    function createItem(item, processedItems) {
        const serializableItem = {
            id: processedItems.length,
            label: item.label,
            type: item.type,
            accelerator: item.accelerator,
            checked: item.checked,
            enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
            visible: typeof item.visible === 'boolean' ? item.visible : true
        };
        processedItems.push(item);
        // Submenu
        if (Array.isArray(item.submenu)) {
            serializableItem.submenu = item.submenu.map(submenuItem => createItem(submenuItem, processedItems));
        }
        return serializableItem;
    }
});
//# sourceMappingURL=contextmenu.js.map