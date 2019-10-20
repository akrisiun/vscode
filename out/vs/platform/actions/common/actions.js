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
define(["require", "exports", "vs/base/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/base/common/event"], function (require, exports, actions_1, descriptors_1, instantiation_1, keybindingsRegistry_1, contextkey_1, commands_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isIMenuItem(item) {
        return item.command !== undefined;
    }
    exports.isIMenuItem = isIMenuItem;
    function isISubmenuItem(item) {
        return item.submenu !== undefined;
    }
    exports.isISubmenuItem = isISubmenuItem;
    var MenuId;
    (function (MenuId) {
        MenuId[MenuId["CommandPalette"] = 0] = "CommandPalette";
        MenuId[MenuId["DebugBreakpointsContext"] = 1] = "DebugBreakpointsContext";
        MenuId[MenuId["DebugCallStackContext"] = 2] = "DebugCallStackContext";
        MenuId[MenuId["DebugConsoleContext"] = 3] = "DebugConsoleContext";
        MenuId[MenuId["DebugVariablesContext"] = 4] = "DebugVariablesContext";
        MenuId[MenuId["DebugWatchContext"] = 5] = "DebugWatchContext";
        MenuId[MenuId["DebugToolBar"] = 6] = "DebugToolBar";
        MenuId[MenuId["EditorContext"] = 7] = "EditorContext";
        MenuId[MenuId["EditorTitle"] = 8] = "EditorTitle";
        MenuId[MenuId["EditorTitleContext"] = 9] = "EditorTitleContext";
        MenuId[MenuId["EmptyEditorGroupContext"] = 10] = "EmptyEditorGroupContext";
        MenuId[MenuId["ExplorerContext"] = 11] = "ExplorerContext";
        MenuId[MenuId["MenubarAppearanceMenu"] = 12] = "MenubarAppearanceMenu";
        MenuId[MenuId["MenubarDebugMenu"] = 13] = "MenubarDebugMenu";
        MenuId[MenuId["MenubarEditMenu"] = 14] = "MenubarEditMenu";
        MenuId[MenuId["MenubarFileMenu"] = 15] = "MenubarFileMenu";
        MenuId[MenuId["MenubarGoMenu"] = 16] = "MenubarGoMenu";
        MenuId[MenuId["MenubarHelpMenu"] = 17] = "MenubarHelpMenu";
        MenuId[MenuId["MenubarLayoutMenu"] = 18] = "MenubarLayoutMenu";
        MenuId[MenuId["MenubarNewBreakpointMenu"] = 19] = "MenubarNewBreakpointMenu";
        MenuId[MenuId["MenubarPreferencesMenu"] = 20] = "MenubarPreferencesMenu";
        MenuId[MenuId["MenubarRecentMenu"] = 21] = "MenubarRecentMenu";
        MenuId[MenuId["MenubarSelectionMenu"] = 22] = "MenubarSelectionMenu";
        MenuId[MenuId["MenubarSwitchEditorMenu"] = 23] = "MenubarSwitchEditorMenu";
        MenuId[MenuId["MenubarSwitchGroupMenu"] = 24] = "MenubarSwitchGroupMenu";
        MenuId[MenuId["MenubarTerminalMenu"] = 25] = "MenubarTerminalMenu";
        MenuId[MenuId["MenubarViewMenu"] = 26] = "MenubarViewMenu";
        MenuId[MenuId["OpenEditorsContext"] = 27] = "OpenEditorsContext";
        MenuId[MenuId["ProblemsPanelContext"] = 28] = "ProblemsPanelContext";
        MenuId[MenuId["SCMChangeContext"] = 29] = "SCMChangeContext";
        MenuId[MenuId["SCMResourceContext"] = 30] = "SCMResourceContext";
        MenuId[MenuId["SCMResourceFolderContext"] = 31] = "SCMResourceFolderContext";
        MenuId[MenuId["SCMResourceGroupContext"] = 32] = "SCMResourceGroupContext";
        MenuId[MenuId["SCMSourceControl"] = 33] = "SCMSourceControl";
        MenuId[MenuId["SCMTitle"] = 34] = "SCMTitle";
        MenuId[MenuId["SearchContext"] = 35] = "SearchContext";
        MenuId[MenuId["StatusBarWindowIndicatorMenu"] = 36] = "StatusBarWindowIndicatorMenu";
        MenuId[MenuId["TouchBarContext"] = 37] = "TouchBarContext";
        MenuId[MenuId["TitleBarContext"] = 38] = "TitleBarContext";
        MenuId[MenuId["ViewItemContext"] = 39] = "ViewItemContext";
        MenuId[MenuId["ViewTitle"] = 40] = "ViewTitle";
        MenuId[MenuId["CommentThreadTitle"] = 41] = "CommentThreadTitle";
        MenuId[MenuId["CommentThreadActions"] = 42] = "CommentThreadActions";
        MenuId[MenuId["CommentTitle"] = 43] = "CommentTitle";
        MenuId[MenuId["CommentActions"] = 44] = "CommentActions";
        MenuId[MenuId["GlobalActivity"] = 45] = "GlobalActivity";
    })(MenuId = exports.MenuId || (exports.MenuId = {}));
    exports.IMenuService = instantiation_1.createDecorator('menuService');
    exports.MenuRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._menuItems = new Map();
            this._onDidChangeMenu = new event_1.Emitter();
            this.onDidChangeMenu = this._onDidChangeMenu.event;
        }
        addCommand(command) {
            this._commands.set(command.id, command);
            this._onDidChangeMenu.fire(0 /* CommandPalette */);
            return {
                dispose: () => {
                    if (this._commands.delete(command.id)) {
                        this._onDidChangeMenu.fire(0 /* CommandPalette */);
                    }
                }
            };
        }
        getCommand(id) {
            return this._commands.get(id);
        }
        getCommands() {
            const map = new Map();
            this._commands.forEach((value, key) => map.set(key, value));
            return map;
        }
        appendMenuItem(id, item) {
            let array = this._menuItems.get(id);
            if (!array) {
                array = [item];
                this._menuItems.set(id, array);
            }
            else {
                array.push(item);
            }
            this._onDidChangeMenu.fire(id);
            return {
                dispose: () => {
                    const idx = array.indexOf(item);
                    if (idx >= 0) {
                        array.splice(idx, 1);
                        this._onDidChangeMenu.fire(id);
                    }
                }
            };
        }
        getMenuItems(id) {
            const result = (this._menuItems.get(id) || []).slice(0);
            if (id === 0 /* CommandPalette */) {
                // CommandPalette is special because it shows
                // all commands by default
                this._appendImplicitItems(result);
            }
            return result;
        }
        _appendImplicitItems(result) {
            const set = new Set();
            const temp = result.filter(item => { return isIMenuItem(item); });
            for (const { command, alt } of temp) {
                set.add(command.id);
                if (alt) {
                    set.add(alt.id);
                }
            }
            this._commands.forEach((command, id) => {
                if (!set.has(id)) {
                    result.push({ command });
                }
            });
        }
    };
    let ExecuteCommandAction = class ExecuteCommandAction extends actions_1.Action {
        constructor(id, label, _commandService) {
            super(id, label);
            this._commandService = _commandService;
        }
        run(...args) {
            return this._commandService.executeCommand(this.id, ...args);
        }
    };
    ExecuteCommandAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ExecuteCommandAction);
    exports.ExecuteCommandAction = ExecuteCommandAction;
    class SubmenuItemAction extends actions_1.Action {
        constructor(item) {
            typeof item.title === 'string' ? super('', item.title, 'submenu') : super('', item.title.value, 'submenu');
            this.item = item;
        }
    }
    exports.SubmenuItemAction = SubmenuItemAction;
    let MenuItemAction = class MenuItemAction extends ExecuteCommandAction {
        constructor(item, alt, options, contextKeyService, commandService) {
            typeof item.title === 'string' ? super(item.id, item.title, commandService) : super(item.id, item.title.value, commandService);
            this._cssClass = undefined;
            this._enabled = !item.precondition || contextKeyService.contextMatchesRules(item.precondition);
            this._checked = Boolean(item.toggled && contextKeyService.contextMatchesRules(item.toggled));
            this._options = options || {};
            this.item = item;
            this.alt = alt ? new MenuItemAction(alt, undefined, this._options, contextKeyService, commandService) : undefined;
        }
        dispose() {
            if (this.alt) {
                this.alt.dispose();
            }
            super.dispose();
        }
        run(...args) {
            let runArgs = [];
            if (this._options.arg) {
                runArgs = [...runArgs, this._options.arg];
            }
            if (this._options.shouldForwardArgs) {
                runArgs = [...runArgs, ...args];
            }
            return super.run(...runArgs);
        }
    };
    MenuItemAction = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, commands_1.ICommandService)
    ], MenuItemAction);
    exports.MenuItemAction = MenuItemAction;
    class SyncActionDescriptor {
        constructor(ctor, id, label, keybindings, keybindingContext, keybindingWeight) {
            this._id = id;
            this._label = label;
            this._keybindings = keybindings;
            this._keybindingContext = keybindingContext;
            this._keybindingWeight = keybindingWeight;
            this._descriptor = descriptors_1.createSyncDescriptor(ctor, this._id, this._label);
        }
        get syncDescriptor() {
            return this._descriptor;
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get keybindings() {
            return this._keybindings;
        }
        get keybindingContext() {
            return this._keybindingContext;
        }
        get keybindingWeight() {
            return this._keybindingWeight;
        }
    }
    exports.SyncActionDescriptor = SyncActionDescriptor;
    function registerAction(desc) {
        const { id, handler, title, category, menu, keybinding } = desc;
        // 1) register as command
        commands_1.CommandsRegistry.registerCommand(id, handler);
        // 2) menus
        if (menu && title) {
            let command = { id, title, category };
            let { menuId, when, group } = menu;
            exports.MenuRegistry.appendMenuItem(menuId, {
                command,
                when,
                group
            });
        }
        // 3) keybindings
        if (keybinding) {
            let { when, weight, keys } = keybinding;
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id,
                when,
                weight: weight || 0,
                primary: keys.primary,
                secondary: keys.secondary,
                linux: keys.linux,
                mac: keys.mac,
                win: keys.win
            });
        }
    }
    exports.registerAction = registerAction;
});
//# sourceMappingURL=actions.js.map