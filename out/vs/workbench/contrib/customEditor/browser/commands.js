/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/workbench/contrib/customEditor/common/customEditor", "vs/workbench/contrib/files/browser/files", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, arrays_1, editorContextKeys_1, nls, actions_1, keybindingsRegistry_1, listService_1, customEditor_1, files_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const viewCategory = nls.localize('viewCategory', "View");
    // #region Open With
    const OPEN_WITH_COMMAND_ID = 'openWith';
    // const OPEN_WITH_TITLE = { value: nls.localize('openWith.title', 'Open With'), original: 'Open With' };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: OPEN_WITH_COMMAND_ID,
        weight: 200 /* WorkbenchContrib */,
        when: editorContextKeys_1.EditorContextKeys.focus.toNegated(),
        handler: async (accessor, resource) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const resources = files_1.getMultiSelectedResources(resource, accessor.get(listService_1.IListService), editorService);
            const targetResource = arrays_1.firstOrDefault(resources);
            if (!targetResource) {
                return;
            }
            return accessor.get(customEditor_1.ICustomEditorService).promptOpenWith(targetResource, undefined, undefined);
        }
    });
    // MenuRegistry.appendMenuItem(MenuId.ExplorerContext, {
    // 	group: 'navigation',
    // 	order: 20,
    // 	command: {
    // 		id: OPEN_WITH_COMMAND_ID,
    // 		title: OPEN_WITH_TITLE,
    // 	},
    // 	when: ResourceContextKey.Scheme.isEqualTo(Schemas.file)
    // });
    // #endregion
    // #region Reopen With
    const REOPEN_WITH_COMMAND_ID = 'reOpenWith';
    const REOPEN_WITH_TITLE = { value: nls.localize('reopenWith.title', 'Reopen With'), original: 'Reopen With' };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: REOPEN_WITH_COMMAND_ID,
        weight: 200 /* WorkbenchContrib */,
        when: undefined,
        handler: async (accessor, resource, editorContext) => {
            const customEditorService = accessor.get(customEditor_1.ICustomEditorService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            let group;
            if (editorContext) {
                group = editorGroupService.getGroup(editorContext.groupId);
            }
            else if (!resource) {
                if (editorService.activeEditor) {
                    resource = editorService.activeEditor.getResource();
                    group = editorGroupService.activeGroup;
                }
            }
            if (!resource) {
                return;
            }
            // Make sure the context menu has been dismissed before we prompt.
            // Otherwise with webviews, we will sometimes close the prompt instantly when the webview is
            // refocused by the workbench
            setTimeout(() => {
                customEditorService.promptOpenWith(resource, undefined, group);
            }, 10);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, {
        command: {
            id: REOPEN_WITH_COMMAND_ID,
            title: REOPEN_WITH_TITLE,
            category: viewCategory,
        },
        when: customEditor_1.CONTEXT_HAS_CUSTOM_EDITORS,
    });
});
// #endregion
//# sourceMappingURL=commands.js.map