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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/quickOpen/common/quickOpen", "vs/platform/quickinput/common/quickInput", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands"], function (require, exports, nls, actions_1, quickOpen_1, quickInput_1, keybinding_1, contextkey_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const inQuickOpenKey = 'inQuickOpen';
    exports.InQuickOpenContextKey = new contextkey_1.RawContextKey(inQuickOpenKey, false);
    exports.inQuickOpenContext = contextkey_1.ContextKeyExpr.has(inQuickOpenKey);
    exports.defaultQuickOpenContextKey = 'inFilesPicker';
    exports.defaultQuickOpenContext = contextkey_1.ContextKeyExpr.and(exports.inQuickOpenContext, contextkey_1.ContextKeyExpr.has(exports.defaultQuickOpenContextKey));
    exports.QUICKOPEN_ACTION_ID = 'workbench.action.quickOpen';
    exports.QUICKOPEN_ACION_LABEL = nls.localize('quickOpen', "Go to File...");
    commands_1.CommandsRegistry.registerCommand({
        id: exports.QUICKOPEN_ACTION_ID,
        handler: async function (accessor, prefix = null) {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            await quickOpenService.show(typeof prefix === 'string' ? prefix : undefined);
        },
        description: {
            description: `Quick open`,
            args: [{
                    name: 'prefix',
                    schema: {
                        'type': 'string'
                    }
                }]
        }
    });
    exports.QUICKOPEN_FOCUS_SECONDARY_ACTION_ID = 'workbench.action.quickOpenPreviousEditor';
    commands_1.CommandsRegistry.registerCommand(exports.QUICKOPEN_FOCUS_SECONDARY_ACTION_ID, async function (accessor, prefix = null) {
        const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
        await quickOpenService.show(undefined, { autoFocus: { autoFocusSecondEntry: true } });
    });
    let BaseQuickOpenNavigateAction = class BaseQuickOpenNavigateAction extends actions_1.Action {
        constructor(id, label, next, quickNavigate, quickOpenService, quickInputService, keybindingService) {
            super(id, label);
            this.next = next;
            this.quickNavigate = quickNavigate;
            this.quickOpenService = quickOpenService;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
        }
        run(event) {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            const quickNavigate = this.quickNavigate ? { keybindings: keys } : undefined;
            this.quickOpenService.navigate(this.next, quickNavigate);
            this.quickInputService.navigate(this.next, quickNavigate);
            return Promise.resolve(true);
        }
    };
    BaseQuickOpenNavigateAction = __decorate([
        __param(4, quickOpen_1.IQuickOpenService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, keybinding_1.IKeybindingService)
    ], BaseQuickOpenNavigateAction);
    exports.BaseQuickOpenNavigateAction = BaseQuickOpenNavigateAction;
    function getQuickNavigateHandler(id, next) {
        return accessor => {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(id);
            const quickNavigate = { keybindings: keys };
            quickOpenService.navigate(!!next, quickNavigate);
            quickInputService.navigate(!!next, quickNavigate);
        };
    }
    exports.getQuickNavigateHandler = getQuickNavigateHandler;
    let QuickOpenNavigateNextAction = class QuickOpenNavigateNextAction extends BaseQuickOpenNavigateAction {
        constructor(id, label, quickOpenService, quickInputService, keybindingService) {
            super(id, label, true, true, quickOpenService, quickInputService, keybindingService);
        }
    };
    QuickOpenNavigateNextAction.ID = 'workbench.action.quickOpenNavigateNext';
    QuickOpenNavigateNextAction.LABEL = nls.localize('quickNavigateNext', "Navigate Next in Quick Open");
    QuickOpenNavigateNextAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, keybinding_1.IKeybindingService)
    ], QuickOpenNavigateNextAction);
    exports.QuickOpenNavigateNextAction = QuickOpenNavigateNextAction;
    let QuickOpenNavigatePreviousAction = class QuickOpenNavigatePreviousAction extends BaseQuickOpenNavigateAction {
        constructor(id, label, quickOpenService, quickInputService, keybindingService) {
            super(id, label, false, true, quickOpenService, quickInputService, keybindingService);
        }
    };
    QuickOpenNavigatePreviousAction.ID = 'workbench.action.quickOpenNavigatePrevious';
    QuickOpenNavigatePreviousAction.LABEL = nls.localize('quickNavigatePrevious', "Navigate Previous in Quick Open");
    QuickOpenNavigatePreviousAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, keybinding_1.IKeybindingService)
    ], QuickOpenNavigatePreviousAction);
    exports.QuickOpenNavigatePreviousAction = QuickOpenNavigatePreviousAction;
    let QuickOpenSelectNextAction = class QuickOpenSelectNextAction extends BaseQuickOpenNavigateAction {
        constructor(id, label, quickOpenService, quickInputService, keybindingService) {
            super(id, label, true, false, quickOpenService, quickInputService, keybindingService);
        }
    };
    QuickOpenSelectNextAction.ID = 'workbench.action.quickOpenSelectNext';
    QuickOpenSelectNextAction.LABEL = nls.localize('quickSelectNext', "Select Next in Quick Open");
    QuickOpenSelectNextAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, keybinding_1.IKeybindingService)
    ], QuickOpenSelectNextAction);
    exports.QuickOpenSelectNextAction = QuickOpenSelectNextAction;
    let QuickOpenSelectPreviousAction = class QuickOpenSelectPreviousAction extends BaseQuickOpenNavigateAction {
        constructor(id, label, quickOpenService, quickInputService, keybindingService) {
            super(id, label, false, false, quickOpenService, quickInputService, keybindingService);
        }
    };
    QuickOpenSelectPreviousAction.ID = 'workbench.action.quickOpenSelectPrevious';
    QuickOpenSelectPreviousAction.LABEL = nls.localize('quickSelectPrevious', "Select Previous in Quick Open");
    QuickOpenSelectPreviousAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, keybinding_1.IKeybindingService)
    ], QuickOpenSelectPreviousAction);
    exports.QuickOpenSelectPreviousAction = QuickOpenSelectPreviousAction;
});
//# sourceMappingURL=quickopen.js.map