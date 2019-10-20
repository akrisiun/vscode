/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/workspace/common/workspace", "vs/base/common/platform", "vs/base/common/network", "vs/platform/notification/common/notification", "vs/platform/electron/node/electron", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/common/editorContextKeys", "vs/base/common/keyCodes", "vs/workbench/contrib/files/browser/files", "vs/platform/list/browser/listService", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/files/electron-browser/fileCommands", "vs/platform/actions/common/actions", "vs/workbench/common/resources", "vs/workbench/contrib/files/browser/fileActions.contribution", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/contrib/files/browser/fileActions"], function (require, exports, nls, workspace_1, platform_1, network_1, notification_1, electron_1, keybindingsRegistry_1, editorContextKeys_1, keyCodes_1, files_1, listService_1, editorService_1, fileCommands_1, actions_1, resources_1, fileActions_contribution_1, platform_2, actions_2, fileActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const REVEAL_IN_OS_COMMAND_ID = 'revealFileInOS';
    const REVEAL_IN_OS_LABEL = platform_1.isWindows ? nls.localize('revealInWindows', "Reveal in Explorer") : platform_1.isMacintosh ? nls.localize('revealInMac', "Reveal in Finder") : nls.localize('openContainer', "Open Containing Folder");
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: REVEAL_IN_OS_COMMAND_ID,
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 48 /* KEY_R */,
        win: {
            primary: 1024 /* Shift */ | 512 /* Alt */ | 48 /* KEY_R */
        },
        handler: (accessor, resource) => {
            const resources = files_1.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), accessor.get(editorService_1.IEditorService));
            fileCommands_1.revealResourcesInOS(resources, accessor.get(electron_1.IElectronService), accessor.get(notification_1.INotificationService), accessor.get(workspace_1.IWorkspaceContextService));
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 48 /* KEY_R */),
        id: 'workbench.action.files.revealActiveFileInWindows',
        handler: (accessor) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeInput = editorService.activeEditor;
            const resource = activeInput ? activeInput.getResource() : null;
            const resources = resource ? [resource] : [];
            fileCommands_1.revealResourcesInOS(resources, accessor.get(electron_1.IElectronService), accessor.get(notification_1.INotificationService), accessor.get(workspace_1.IWorkspaceContextService));
        }
    });
    fileActions_contribution_1.appendEditorTitleContextMenuItem(REVEAL_IN_OS_COMMAND_ID, REVEAL_IN_OS_LABEL, resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file));
    // Menu registration - open editors
    const revealInOsCommand = {
        id: REVEAL_IN_OS_COMMAND_ID,
        title: platform_1.isWindows ? nls.localize('revealInWindows', "Reveal in Explorer") : platform_1.isMacintosh ? nls.localize('revealInMac', "Reveal in Finder") : nls.localize('openContainer', "Open Containing Folder")
    };
    actions_1.MenuRegistry.appendMenuItem(27 /* OpenEditorsContext */, {
        group: 'navigation',
        order: 20,
        command: revealInOsCommand,
        when: resources_1.ResourceContextKey.IsFileSystemResource
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(11 /* ExplorerContext */, {
        group: 'navigation',
        order: 20,
        command: revealInOsCommand,
        when: resources_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file)
    });
    // Command Palette
    const category = { value: nls.localize('filesCategory', "File"), original: 'File' };
    fileActions_contribution_1.appendToCommandPalette(REVEAL_IN_OS_COMMAND_ID, { value: REVEAL_IN_OS_LABEL, original: platform_1.isWindows ? 'Reveal in Explorer' : platform_1.isMacintosh ? 'Reveal in Finder' : 'Open Containing Folder' }, category);
    const registry = platform_2.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(fileActions_1.ShowOpenedFileInNewWindow, fileActions_1.ShowOpenedFileInNewWindow.ID, fileActions_1.ShowOpenedFileInNewWindow.LABEL, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 45 /* KEY_O */) }), 'File: Open Active File in New Window', category.value);
});
//# sourceMappingURL=fileActions.contribution.js.map