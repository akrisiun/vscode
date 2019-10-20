/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/quickOpen/common/quickOpen", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/browser/parts/quickopen/quickOpenController", "vs/workbench/browser/parts/quickopen/quickopen", "vs/platform/quickinput/common/quickInput"], function (require, exports, platform_1, quickOpen_1, actions_1, actions_2, keybindingsRegistry_1, quickOpenController_1, quickopen_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.closeQuickOpen',
        weight: 200 /* WorkbenchContrib */,
        when: quickopen_1.inQuickOpenContext,
        primary: 9 /* Escape */, secondary: [1024 /* Shift */ | 9 /* Escape */],
        handler: accessor => {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            quickOpenService.close();
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.cancel();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.acceptSelectedQuickOpenItem',
        weight: 200 /* WorkbenchContrib */,
        when: quickopen_1.inQuickOpenContext,
        primary: 0,
        handler: accessor => {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            quickOpenService.accept();
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.accept();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.focusQuickOpen',
        weight: 200 /* WorkbenchContrib */,
        when: quickopen_1.inQuickOpenContext,
        primary: 0,
        handler: accessor => {
            const quickOpenService = accessor.get(quickOpen_1.IQuickOpenService);
            quickOpenService.focus();
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.focus();
        }
    });
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    const globalQuickOpenKeybinding = { primary: 2048 /* CtrlCmd */ | 46 /* KEY_P */, secondary: [2048 /* CtrlCmd */ | 35 /* KEY_E */], mac: { primary: 2048 /* CtrlCmd */ | 46 /* KEY_P */, secondary: undefined } };
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: quickopen_1.QUICKOPEN_ACTION_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: globalQuickOpenKeybinding.primary,
        secondary: globalQuickOpenKeybinding.secondary,
        mac: globalQuickOpenKeybinding.mac
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: { id: quickopen_1.QUICKOPEN_ACTION_ID, title: { value: quickopen_1.QUICKOPEN_ACION_LABEL, original: 'Go to File...' } }
    });
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(quickopen_1.QuickOpenSelectNextAction, quickopen_1.QuickOpenSelectNextAction.ID, quickopen_1.QuickOpenSelectNextAction.LABEL, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 44 /* KEY_N */ } }, quickopen_1.inQuickOpenContext, 200 /* WorkbenchContrib */ + 50), 'Select Next in Quick Open');
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(quickopen_1.QuickOpenSelectPreviousAction, quickopen_1.QuickOpenSelectPreviousAction.ID, quickopen_1.QuickOpenSelectPreviousAction.LABEL, { primary: 0, mac: { primary: 256 /* WinCtrl */ | 46 /* KEY_P */ } }, quickopen_1.inQuickOpenContext, 200 /* WorkbenchContrib */ + 50), 'Select Previous in Quick Open');
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(quickopen_1.QuickOpenNavigateNextAction, quickopen_1.QuickOpenNavigateNextAction.ID, quickopen_1.QuickOpenNavigateNextAction.LABEL), 'Navigate Next in Quick Open');
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(quickopen_1.QuickOpenNavigatePreviousAction, quickopen_1.QuickOpenNavigatePreviousAction.ID, quickopen_1.QuickOpenNavigatePreviousAction.LABEL), 'Navigate Previous in Quick Open');
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(quickOpenController_1.RemoveFromEditorHistoryAction, quickOpenController_1.RemoveFromEditorHistoryAction.ID, quickOpenController_1.RemoveFromEditorHistoryAction.LABEL), 'Remove From History');
    const quickOpenNavigateNextInFilePickerId = 'workbench.action.quickOpenNavigateNextInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigateNextInFilePickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigateNextInFilePickerId, true),
        when: quickopen_1.defaultQuickOpenContext,
        primary: globalQuickOpenKeybinding.primary,
        secondary: globalQuickOpenKeybinding.secondary,
        mac: globalQuickOpenKeybinding.mac
    });
    const quickOpenNavigatePreviousInFilePickerId = 'workbench.action.quickOpenNavigatePreviousInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickOpenNavigatePreviousInFilePickerId,
        weight: 200 /* WorkbenchContrib */ + 50,
        handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigatePreviousInFilePickerId, false),
        when: quickopen_1.defaultQuickOpenContext,
        primary: globalQuickOpenKeybinding.primary | 1024 /* Shift */,
        secondary: [globalQuickOpenKeybinding.secondary[0] | 1024 /* Shift */],
        mac: {
            primary: globalQuickOpenKeybinding.mac.primary | 1024 /* Shift */,
            secondary: undefined
        }
    });
});
//# sourceMappingURL=quickOpenActions.js.map