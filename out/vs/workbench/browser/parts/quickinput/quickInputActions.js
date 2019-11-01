/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/parts/quickinput/quickInput", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/quickopen/quickopen"], function (require, exports, quickInput_1, keybindingsRegistry_1, platform_1, actions_1, actions_2, quickopen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(quickInput_1.QuickPickManyToggle);
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_2.SyncActionDescriptor(quickInput_1.BackAction, quickInput_1.BackAction.ID, quickInput_1.BackAction.LABEL, { primary: 0, win: { primary: 512 /* Alt */ | 15 /* LeftArrow */ }, mac: { primary: 256 /* WinCtrl */ | 83 /* US_MINUS */ }, linux: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 83 /* US_MINUS */ } }, quickopen_1.inQuickOpenContext, 200 /* WorkbenchContrib */ + 50), 'Back');
});
//# sourceMappingURL=quickInputActions.js.map