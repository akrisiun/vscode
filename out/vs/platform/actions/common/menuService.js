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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey"], function (require, exports, event_1, lifecycle_1, actions_1, commands_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MenuService = class MenuService {
        constructor(_commandService) {
            this._commandService = _commandService;
            //
        }
        createMenu(id, contextKeyService) {
            return new Menu(id, this._commandService, contextKeyService);
        }
    };
    MenuService = __decorate([
        __param(0, commands_1.ICommandService)
    ], MenuService);
    exports.MenuService = MenuService;
    let Menu = class Menu extends lifecycle_1.Disposable {
        constructor(_id, _commandService, _contextKeyService) {
            super();
            this._id = _id;
            this._commandService = _commandService;
            this._contextKeyService = _contextKeyService;
            this._onDidChange = this._register(new event_1.Emitter());
            this._build();
            // rebuild this menu whenever the menu registry reports an
            // event for this MenuId
            this._register(event_1.Event.debounce(event_1.Event.filter(actions_1.MenuRegistry.onDidChangeMenu, menuId => menuId === this._id), () => { }, 50)(this._build, this));
            // when context keys change we need to check if the menu also
            // has changed
            this._register(event_1.Event.debounce(this._contextKeyService.onDidChangeContext, (last, event) => last || event.affectsSome(this._contextKeys), 50)(e => e && this._onDidChange.fire(undefined), this));
        }
        _build() {
            // reset
            this._menuGroups = [];
            this._contextKeys = new Set();
            const menuItems = actions_1.MenuRegistry.getMenuItems(this._id);
            let group;
            menuItems.sort(Menu._compareMenuItems);
            for (let item of menuItems) {
                // group by groupId
                const groupName = item.group || '';
                if (!group || group[0] !== groupName) {
                    group = [groupName, []];
                    this._menuGroups.push(group);
                }
                group[1].push(item);
                // keep keys for eventing
                Menu._fillInKbExprKeys(item.when, this._contextKeys);
                // keep precondition keys for event if applicable
                if (actions_1.isIMenuItem(item) && item.command.precondition) {
                    Menu._fillInKbExprKeys(item.command.precondition, this._contextKeys);
                }
                // keep toggled keys for event if applicable
                if (actions_1.isIMenuItem(item) && item.command.toggled) {
                    Menu._fillInKbExprKeys(item.command.toggled, this._contextKeys);
                }
            }
            this._onDidChange.fire(this);
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        getActions(options) {
            const result = [];
            for (let group of this._menuGroups) {
                const [id, items] = group;
                const activeActions = [];
                for (const item of items) {
                    if (this._contextKeyService.contextMatchesRules(item.when)) {
                        const action = actions_1.isIMenuItem(item) ? new actions_1.MenuItemAction(item.command, item.alt, options, this._contextKeyService, this._commandService) : new actions_1.SubmenuItemAction(item);
                        activeActions.push(action);
                    }
                }
                if (activeActions.length > 0) {
                    result.push([id, activeActions]);
                }
            }
            return result;
        }
        static _fillInKbExprKeys(exp, set) {
            if (exp) {
                for (let key of exp.keys()) {
                    set.add(key);
                }
            }
        }
        static _compareMenuItems(a, b) {
            let aGroup = a.group;
            let bGroup = b.group;
            if (aGroup !== bGroup) {
                // Falsy groups come last
                if (!aGroup) {
                    return 1;
                }
                else if (!bGroup) {
                    return -1;
                }
                // 'navigation' group comes first
                if (aGroup === 'navigation') {
                    return -1;
                }
                else if (bGroup === 'navigation') {
                    return 1;
                }
                // lexical sort for groups
                let value = aGroup.localeCompare(bGroup);
                if (value !== 0) {
                    return value;
                }
            }
            // sort on priority - default is 0
            let aPrio = a.order || 0;
            let bPrio = b.order || 0;
            if (aPrio < bPrio) {
                return -1;
            }
            else if (aPrio > bPrio) {
                return 1;
            }
            // sort on titles
            const aTitle = typeof a.command.title === 'string' ? a.command.title : a.command.title.value;
            const bTitle = typeof b.command.title === 'string' ? b.command.title : b.command.title.value;
            return aTitle.localeCompare(bTitle);
        }
    };
    Menu = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, contextkey_1.IContextKeyService)
    ], Menu);
});
//# sourceMappingURL=menuService.js.map