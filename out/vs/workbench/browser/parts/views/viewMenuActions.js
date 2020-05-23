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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, lifecycle_1, event_1, actions_1, contextkey_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewMenuActions = void 0;
    let ViewMenuActions = /** @class */ (() => {
        let ViewMenuActions = class ViewMenuActions extends lifecycle_1.Disposable {
            constructor(viewId, menuId, contextMenuId, contextKeyService, menuService) {
                super();
                this.contextKeyService = contextKeyService;
                this.menuService = menuService;
                this.primaryActions = [];
                this.titleActionsDisposable = this._register(new lifecycle_1.MutableDisposable());
                this.secondaryActions = [];
                this.contextMenuActions = [];
                this._onDidChangeTitle = this._register(new event_1.Emitter());
                this.onDidChangeTitle = this._onDidChangeTitle.event;
                const scopedContextKeyService = this._register(this.contextKeyService.createScoped());
                scopedContextKeyService.createKey('view', viewId);
                const menu = this._register(this.menuService.createMenu(menuId, scopedContextKeyService));
                const updateActions = () => {
                    this.primaryActions = [];
                    this.secondaryActions = [];
                    this.titleActionsDisposable.value = menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, { shouldForwardArgs: true }, { primary: this.primaryActions, secondary: this.secondaryActions });
                    this._onDidChangeTitle.fire();
                };
                this._register(menu.onDidChange(updateActions));
                updateActions();
                const contextMenu = this._register(this.menuService.createMenu(contextMenuId, scopedContextKeyService));
                const updateContextMenuActions = () => {
                    this.contextMenuActions = [];
                    this.titleActionsDisposable.value = menuEntryActionViewItem_1.createAndFillInActionBarActions(contextMenu, { shouldForwardArgs: true }, { primary: [], secondary: this.contextMenuActions });
                };
                this._register(contextMenu.onDidChange(updateContextMenuActions));
                updateContextMenuActions();
                this._register(lifecycle_1.toDisposable(() => {
                    this.primaryActions = [];
                    this.secondaryActions = [];
                    this.contextMenuActions = [];
                }));
            }
            getPrimaryActions() {
                return this.primaryActions;
            }
            getSecondaryActions() {
                return this.secondaryActions;
            }
            getContextMenuActions() {
                return this.contextMenuActions;
            }
        };
        ViewMenuActions = __decorate([
            __param(3, contextkey_1.IContextKeyService),
            __param(4, actions_1.IMenuService)
        ], ViewMenuActions);
        return ViewMenuActions;
    })();
    exports.ViewMenuActions = ViewMenuActions;
});
//# sourceMappingURL=viewMenuActions.js.map