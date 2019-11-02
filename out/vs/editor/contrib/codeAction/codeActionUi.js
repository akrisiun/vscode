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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/contrib/message/messageController", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "./codeActionWidget", "./lightBulbWidget", "vs/base/common/lazy"], function (require, exports, errors_1, lifecycle_1, messageController_1, contextView_1, keybinding_1, codeActionWidget_1, lightBulbWidget_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CodeActionUi = class CodeActionUi extends lifecycle_1.Disposable {
        constructor(_editor, quickFixActionId, preferredFixActionId, delegate, contextMenuService, keybindingService) {
            super();
            this._editor = _editor;
            this.delegate = delegate;
            this._activeCodeActions = this._register(new lifecycle_1.MutableDisposable());
            this._codeActionWidget = new lazy_1.Lazy(() => {
                return this._register(new codeActionWidget_1.CodeActionWidget(this._editor, contextMenuService, {
                    onSelectCodeAction: async (action) => {
                        this.delegate.applyCodeAction(action, /* retrigger */ true);
                    }
                }));
            });
            this._lightBulbWidget = new lazy_1.Lazy(() => {
                const widget = this._register(new lightBulbWidget_1.LightBulbWidget(this._editor, quickFixActionId, preferredFixActionId, keybindingService));
                this._register(widget.onClick(this._handleLightBulbSelect, this));
                return widget;
            });
        }
        async update(newState) {
            if (newState.type !== 1 /* Triggered */) {
                if (this._lightBulbWidget.hasValue()) {
                    this._lightBulbWidget.getValue().hide();
                }
                return;
            }
            let actions;
            try {
                actions = await newState.actions;
            }
            catch (e) {
                errors_1.onUnexpectedError(e);
                return;
            }
            this._lightBulbWidget.getValue().update(actions, newState.position);
            if (!actions.actions.length && newState.trigger.context) {
                messageController_1.MessageController.get(this._editor).showMessage(newState.trigger.context.notAvailableMessage, newState.trigger.context.position);
                this._activeCodeActions.value = actions;
                return;
            }
            if (newState.trigger.type === 'manual') {
                if (newState.trigger.filter && newState.trigger.filter.kind) {
                    // Triggered for specific scope
                    if (actions.actions.length > 0) {
                        // Apply if we only have one action or requested autoApply
                        if (newState.trigger.autoApply === 1 /* First */ || (newState.trigger.autoApply === 0 /* IfSingle */ && actions.actions.length === 1)) {
                            try {
                                await this.delegate.applyCodeAction(actions.actions[0], false);
                            }
                            finally {
                                actions.dispose();
                            }
                            return;
                        }
                    }
                }
                this._activeCodeActions.value = actions;
                this._codeActionWidget.getValue().show(actions, newState.position);
            }
            else {
                // auto magically triggered
                if (this._codeActionWidget.getValue().isVisible) {
                    // TODO: Figure out if we should update the showing menu?
                    actions.dispose();
                }
                else {
                    this._activeCodeActions.value = actions;
                }
            }
        }
        async showCodeActionList(actions, at) {
            this._codeActionWidget.getValue().show(actions, at);
        }
        _handleLightBulbSelect(e) {
            this._codeActionWidget.getValue().show(e.actions, e);
        }
    };
    CodeActionUi = __decorate([
        __param(4, contextView_1.IContextMenuService),
        __param(5, keybinding_1.IKeybindingService)
    ], CodeActionUi);
    exports.CodeActionUi = CodeActionUi;
});
//# sourceMappingURL=codeActionUi.js.map