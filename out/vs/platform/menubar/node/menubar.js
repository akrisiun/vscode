/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMenubarService = instantiation_1.createDecorator('menubarService');
    function isMenubarMenuItemSubmenu(menuItem) {
        return menuItem.submenu !== undefined;
    }
    exports.isMenubarMenuItemSubmenu = isMenubarMenuItemSubmenu;
    function isMenubarMenuItemSeparator(menuItem) {
        return menuItem.id === 'vscode.menubar.separator';
    }
    exports.isMenubarMenuItemSeparator = isMenubarMenuItemSeparator;
    function isMenubarMenuItemUriAction(menuItem) {
        return menuItem.uri !== undefined;
    }
    exports.isMenubarMenuItemUriAction = isMenubarMenuItemUriAction;
    function isMenubarMenuItemAction(menuItem) {
        return !isMenubarMenuItemSubmenu(menuItem) && !isMenubarMenuItemSeparator(menuItem) && !isMenubarMenuItemUriAction(menuItem);
    }
    exports.isMenubarMenuItemAction = isMenubarMenuItemAction;
});
//# sourceMappingURL=menubar.js.map