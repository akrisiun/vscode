/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol"], function (require, exports, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isMessageItem(item) {
        return item && item.title;
    }
    class ExtHostMessageService {
        constructor(mainContext) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadMessageService);
        }
        showMessage(extension, severity, message, optionsOrFirstItem, rest) {
            const options = { extension };
            let items;
            if (typeof optionsOrFirstItem === 'string' || isMessageItem(optionsOrFirstItem)) {
                items = [optionsOrFirstItem, ...rest];
            }
            else {
                options.modal = optionsOrFirstItem && optionsOrFirstItem.modal;
                items = rest;
            }
            const commands = [];
            for (let handle = 0; handle < items.length; handle++) {
                const command = items[handle];
                if (typeof command === 'string') {
                    commands.push({ title: command, handle, isCloseAffordance: false });
                }
                else if (typeof command === 'object') {
                    let { title, isCloseAffordance } = command;
                    commands.push({ title, isCloseAffordance: !!isCloseAffordance, handle });
                }
                else {
                    console.warn('Invalid message item:', command);
                }
            }
            return this._proxy.$showMessage(severity, message, options, commands).then(handle => {
                if (typeof handle === 'number') {
                    return items[handle];
                }
                return undefined;
            });
        }
    }
    exports.ExtHostMessageService = ExtHostMessageService;
});
//# sourceMappingURL=extHostMessageService.js.map