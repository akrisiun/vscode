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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/objects", "vs/workbench/common/editor", "vs/base/parts/quickopen/browser/quickOpenModel", "vs/workbench/browser/quickopen", "vs/platform/quickOpen/common/quickOpen", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces"], function (require, exports, nls, actions_1, objects_1, editor_1, quickOpenModel_1, quickopen_1, quickOpen_1, layoutService_1, history_1, keybinding_1, commands_1, textfiles_1, editorCommands_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, workspaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExecuteCommandAction extends actions_1.Action {
        constructor(id, label, commandId, commandService, commandArgs) {
            super(id, label);
            this.commandId = commandId;
            this.commandService = commandService;
            this.commandArgs = commandArgs;
        }
        run() {
            return this.commandService.executeCommand(this.commandId, this.commandArgs);
        }
    }
    exports.ExecuteCommandAction = ExecuteCommandAction;
    class BaseSplitEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.direction = this.getDirection();
            this.registerListeners();
        }
        getDirection() {
            return editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
        }
        registerListeners() {
            this.toDispose.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
                }
            }));
        }
        run(context) {
            editorCommands_1.splitEditor(this.editorGroupService, this.direction, context);
            return Promise.resolve(true);
        }
    }
    exports.BaseSplitEditorAction = BaseSplitEditorAction;
    let SplitEditorAction = class SplitEditorAction extends BaseSplitEditorAction {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label, editorGroupService, configurationService);
        }
    };
    SplitEditorAction.ID = 'workbench.action.splitEditor';
    SplitEditorAction.LABEL = nls.localize('splitEditor', "Split Editor");
    SplitEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, configuration_1.IConfigurationService)
    ], SplitEditorAction);
    exports.SplitEditorAction = SplitEditorAction;
    let SplitEditorOrthogonalAction = class SplitEditorOrthogonalAction extends BaseSplitEditorAction {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label, editorGroupService, configurationService);
        }
        getDirection() {
            const direction = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            return direction === 3 /* RIGHT */ ? 1 /* DOWN */ : 3 /* RIGHT */;
        }
    };
    SplitEditorOrthogonalAction.ID = 'workbench.action.splitEditorOrthogonal';
    SplitEditorOrthogonalAction.LABEL = nls.localize('splitEditorOrthogonal', "Split Editor Orthogonal");
    SplitEditorOrthogonalAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, configuration_1.IConfigurationService)
    ], SplitEditorOrthogonalAction);
    exports.SplitEditorOrthogonalAction = SplitEditorOrthogonalAction;
    let SplitEditorLeftAction = class SplitEditorLeftAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_LEFT, commandService);
        }
    };
    SplitEditorLeftAction.ID = editorCommands_1.SPLIT_EDITOR_LEFT;
    SplitEditorLeftAction.LABEL = nls.localize('splitEditorGroupLeft', "Split Editor Left");
    SplitEditorLeftAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorLeftAction);
    exports.SplitEditorLeftAction = SplitEditorLeftAction;
    let SplitEditorRightAction = class SplitEditorRightAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_RIGHT, commandService);
        }
    };
    SplitEditorRightAction.ID = editorCommands_1.SPLIT_EDITOR_RIGHT;
    SplitEditorRightAction.LABEL = nls.localize('splitEditorGroupRight', "Split Editor Right");
    SplitEditorRightAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorRightAction);
    exports.SplitEditorRightAction = SplitEditorRightAction;
    let SplitEditorUpAction = class SplitEditorUpAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_UP, commandService);
        }
    };
    SplitEditorUpAction.ID = editorCommands_1.SPLIT_EDITOR_UP;
    SplitEditorUpAction.LABEL = nls.localize('splitEditorGroupUp', "Split Editor Up");
    SplitEditorUpAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorUpAction);
    exports.SplitEditorUpAction = SplitEditorUpAction;
    let SplitEditorDownAction = class SplitEditorDownAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_DOWN, commandService);
        }
    };
    SplitEditorDownAction.ID = editorCommands_1.SPLIT_EDITOR_DOWN;
    SplitEditorDownAction.LABEL = nls.localize('splitEditorGroupDown', "Split Editor Down");
    SplitEditorDownAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorDownAction);
    exports.SplitEditorDownAction = SplitEditorDownAction;
    let JoinTwoGroupsAction = class JoinTwoGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = this.editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = this.editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                const targetGroupDirections = [3 /* RIGHT */, 1 /* DOWN */, 2 /* LEFT */, 0 /* UP */];
                for (const targetGroupDirection of targetGroupDirections) {
                    const targetGroup = this.editorGroupService.findGroup({ direction: targetGroupDirection }, sourceGroup);
                    if (targetGroup && sourceGroup !== targetGroup) {
                        this.editorGroupService.mergeGroup(sourceGroup, targetGroup);
                        return Promise.resolve(true);
                    }
                }
            }
            return Promise.resolve(true);
        }
    };
    JoinTwoGroupsAction.ID = 'workbench.action.joinTwoGroups';
    JoinTwoGroupsAction.LABEL = nls.localize('joinTwoGroups', "Join Editor Group with Next Group");
    JoinTwoGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], JoinTwoGroupsAction);
    exports.JoinTwoGroupsAction = JoinTwoGroupsAction;
    let JoinAllGroupsAction = class JoinAllGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            editorCommands_1.mergeAllGroups(this.editorGroupService);
            return Promise.resolve(true);
        }
    };
    JoinAllGroupsAction.ID = 'workbench.action.joinAllGroups';
    JoinAllGroupsAction.LABEL = nls.localize('joinAllGroups', "Join All Editor Groups");
    JoinAllGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], JoinAllGroupsAction);
    exports.JoinAllGroupsAction = JoinAllGroupsAction;
    let NavigateBetweenGroupsAction = class NavigateBetweenGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run() {
            const nextGroup = this.editorGroupService.findGroup({ location: 2 /* NEXT */ }, this.editorGroupService.activeGroup, true);
            nextGroup.focus();
            return Promise.resolve(true);
        }
    };
    NavigateBetweenGroupsAction.ID = 'workbench.action.navigateEditorGroups';
    NavigateBetweenGroupsAction.LABEL = nls.localize('navigateEditorGroups', "Navigate Between Editor Groups");
    NavigateBetweenGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NavigateBetweenGroupsAction);
    exports.NavigateBetweenGroupsAction = NavigateBetweenGroupsAction;
    let FocusActiveGroupAction = class FocusActiveGroupAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run() {
            this.editorGroupService.activeGroup.focus();
            return Promise.resolve(true);
        }
    };
    FocusActiveGroupAction.ID = 'workbench.action.focusActiveEditorGroup';
    FocusActiveGroupAction.LABEL = nls.localize('focusActiveEditorGroup', "Focus Active Editor Group");
    FocusActiveGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusActiveGroupAction);
    exports.FocusActiveGroupAction = FocusActiveGroupAction;
    let BaseFocusGroupAction = class BaseFocusGroupAction extends actions_1.Action {
        constructor(id, label, scope, editorGroupService) {
            super(id, label);
            this.scope = scope;
            this.editorGroupService = editorGroupService;
        }
        run() {
            const group = this.editorGroupService.findGroup(this.scope, this.editorGroupService.activeGroup, true);
            if (group) {
                group.focus();
            }
            return Promise.resolve(true);
        }
    };
    BaseFocusGroupAction = __decorate([
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], BaseFocusGroupAction);
    exports.BaseFocusGroupAction = BaseFocusGroupAction;
    let FocusFirstGroupAction = class FocusFirstGroupAction extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 0 /* FIRST */ }, editorGroupService);
        }
    };
    FocusFirstGroupAction.ID = 'workbench.action.focusFirstEditorGroup';
    FocusFirstGroupAction.LABEL = nls.localize('focusFirstEditorGroup', "Focus First Editor Group");
    FocusFirstGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusFirstGroupAction);
    exports.FocusFirstGroupAction = FocusFirstGroupAction;
    let FocusLastGroupAction = class FocusLastGroupAction extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 1 /* LAST */ }, editorGroupService);
        }
    };
    FocusLastGroupAction.ID = 'workbench.action.focusLastEditorGroup';
    FocusLastGroupAction.LABEL = nls.localize('focusLastEditorGroup', "Focus Last Editor Group");
    FocusLastGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusLastGroupAction);
    exports.FocusLastGroupAction = FocusLastGroupAction;
    let FocusNextGroup = class FocusNextGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 2 /* NEXT */ }, editorGroupService);
        }
    };
    FocusNextGroup.ID = 'workbench.action.focusNextGroup';
    FocusNextGroup.LABEL = nls.localize('focusNextGroup', "Focus Next Editor Group");
    FocusNextGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusNextGroup);
    exports.FocusNextGroup = FocusNextGroup;
    let FocusPreviousGroup = class FocusPreviousGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 3 /* PREVIOUS */ }, editorGroupService);
        }
    };
    FocusPreviousGroup.ID = 'workbench.action.focusPreviousGroup';
    FocusPreviousGroup.LABEL = nls.localize('focusPreviousGroup', "Focus Previous Editor Group");
    FocusPreviousGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusPreviousGroup);
    exports.FocusPreviousGroup = FocusPreviousGroup;
    let FocusLeftGroup = class FocusLeftGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 2 /* LEFT */ }, editorGroupService);
        }
    };
    FocusLeftGroup.ID = 'workbench.action.focusLeftGroup';
    FocusLeftGroup.LABEL = nls.localize('focusLeftGroup', "Focus Left Editor Group");
    FocusLeftGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusLeftGroup);
    exports.FocusLeftGroup = FocusLeftGroup;
    let FocusRightGroup = class FocusRightGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 3 /* RIGHT */ }, editorGroupService);
        }
    };
    FocusRightGroup.ID = 'workbench.action.focusRightGroup';
    FocusRightGroup.LABEL = nls.localize('focusRightGroup', "Focus Right Editor Group");
    FocusRightGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusRightGroup);
    exports.FocusRightGroup = FocusRightGroup;
    let FocusAboveGroup = class FocusAboveGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 0 /* UP */ }, editorGroupService);
        }
    };
    FocusAboveGroup.ID = 'workbench.action.focusAboveGroup';
    FocusAboveGroup.LABEL = nls.localize('focusAboveGroup', "Focus Above Editor Group");
    FocusAboveGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusAboveGroup);
    exports.FocusAboveGroup = FocusAboveGroup;
    let FocusBelowGroup = class FocusBelowGroup extends BaseFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 1 /* DOWN */ }, editorGroupService);
        }
    };
    FocusBelowGroup.ID = 'workbench.action.focusBelowGroup';
    FocusBelowGroup.LABEL = nls.localize('focusBelowGroup', "Focus Below Editor Group");
    FocusBelowGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusBelowGroup);
    exports.FocusBelowGroup = FocusBelowGroup;
    let OpenToSideFromQuickOpenAction = class OpenToSideFromQuickOpenAction extends actions_1.Action {
        constructor(editorService, configurationService) {
            super(OpenToSideFromQuickOpenAction.OPEN_TO_SIDE_ID, OpenToSideFromQuickOpenAction.OPEN_TO_SIDE_LABEL);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.updateClass();
        }
        updateClass() {
            const preferredDirection = editorGroupsService_1.preferredSideBySideGroupDirection(this.configurationService);
            this.class = (preferredDirection === 3 /* RIGHT */) ? 'quick-open-sidebyside-vertical' : 'quick-open-sidebyside-horizontal';
        }
        run(context) {
            const entry = toEditorQuickOpenEntry(context);
            if (entry) {
                const input = entry.getInput();
                if (input) {
                    if (input instanceof editor_1.EditorInput) {
                        return this.editorService.openEditor(input, entry.getOptions(), editorService_1.SIDE_GROUP);
                    }
                    const resourceInput = input;
                    resourceInput.options = objects_1.mixin(resourceInput.options, entry.getOptions());
                    return this.editorService.openEditor(resourceInput, editorService_1.SIDE_GROUP);
                }
            }
            return Promise.resolve(false);
        }
    };
    OpenToSideFromQuickOpenAction.OPEN_TO_SIDE_ID = 'workbench.action.openToSide';
    OpenToSideFromQuickOpenAction.OPEN_TO_SIDE_LABEL = nls.localize('openToSide', "Open to the Side");
    OpenToSideFromQuickOpenAction = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService)
    ], OpenToSideFromQuickOpenAction);
    exports.OpenToSideFromQuickOpenAction = OpenToSideFromQuickOpenAction;
    function toEditorQuickOpenEntry(element) {
        // QuickOpenEntryGroup
        if (element instanceof quickOpenModel_1.QuickOpenEntryGroup) {
            const group = element;
            if (group.getEntry()) {
                element = group.getEntry();
            }
        }
        // EditorQuickOpenEntry or EditorQuickOpenEntryGroup both implement IEditorQuickOpenEntry
        if (element instanceof quickopen_1.EditorQuickOpenEntry || element instanceof quickopen_1.EditorQuickOpenEntryGroup) {
            return element;
        }
        return null;
    }
    exports.toEditorQuickOpenEntry = toEditorQuickOpenEntry;
    let CloseEditorAction = class CloseEditorAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'codicon-close');
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    CloseEditorAction.ID = 'workbench.action.closeActiveEditor';
    CloseEditorAction.LABEL = nls.localize('closeEditor', "Close Editor");
    CloseEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseEditorAction);
    exports.CloseEditorAction = CloseEditorAction;
    let CloseOneEditorAction = class CloseOneEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label, 'codicon-close');
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            let group;
            let editorIndex;
            if (context) {
                group = this.editorGroupService.getGroup(context.groupId);
                if (group) {
                    editorIndex = context.editorIndex; // only allow editor at index if group is valid
                }
            }
            if (!group) {
                group = this.editorGroupService.activeGroup;
            }
            // Close specific editor in group
            if (typeof editorIndex === 'number') {
                const editorAtIndex = group.getEditor(editorIndex);
                if (editorAtIndex) {
                    return group.closeEditor(editorAtIndex);
                }
            }
            // Otherwise close active editor in group
            if (group.activeEditor) {
                return group.closeEditor(group.activeEditor);
            }
            return Promise.resolve(false);
        }
    };
    CloseOneEditorAction.ID = 'workbench.action.closeActiveEditor';
    CloseOneEditorAction.LABEL = nls.localize('closeOneEditor', "Close");
    CloseOneEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseOneEditorAction);
    exports.CloseOneEditorAction = CloseOneEditorAction;
    let RevertAndCloseEditorAction = class RevertAndCloseEditorAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        async run() {
            const activeControl = this.editorService.activeControl;
            if (activeControl) {
                const editor = activeControl.input;
                const group = activeControl.group;
                // first try a normal revert where the contents of the editor are restored
                try {
                    await editor.revert();
                }
                catch (error) {
                    // if that fails, since we are about to close the editor, we accept that
                    // the editor cannot be reverted and instead do a soft revert that just
                    // enables us to close the editor. With this, a user can always close a
                    // dirty editor even when reverting fails.
                    await editor.revert({ soft: true });
                }
                group.closeEditor(editor);
            }
            return true;
        }
    };
    RevertAndCloseEditorAction.ID = 'workbench.action.revertAndCloseActiveEditor';
    RevertAndCloseEditorAction.LABEL = nls.localize('revertAndCloseActiveEditor', "Revert and Close Editor");
    RevertAndCloseEditorAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], RevertAndCloseEditorAction);
    exports.RevertAndCloseEditorAction = RevertAndCloseEditorAction;
    let CloseLeftEditorsInGroupAction = class CloseLeftEditorsInGroupAction extends actions_1.Action {
        constructor(id, label, editorService, editorGroupService) {
            super(id, label);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            const { group, editor } = getTarget(this.editorService, this.editorGroupService, context);
            if (group && editor) {
                return group.closeEditors({ direction: 0 /* LEFT */, except: editor });
            }
            return Promise.resolve(false);
        }
    };
    CloseLeftEditorsInGroupAction.ID = 'workbench.action.closeEditorsToTheLeft';
    CloseLeftEditorsInGroupAction.LABEL = nls.localize('closeEditorsToTheLeft', "Close Editors to the Left in Group");
    CloseLeftEditorsInGroupAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], CloseLeftEditorsInGroupAction);
    exports.CloseLeftEditorsInGroupAction = CloseLeftEditorsInGroupAction;
    function getTarget(editorService, editorGroupService, context) {
        if (context) {
            return { editor: context.editor, group: editorGroupService.getGroup(context.groupId) };
        }
        // Fallback to active group
        return { group: editorGroupService.activeGroup, editor: editorGroupService.activeGroup.activeEditor };
    }
    class BaseCloseAllAction extends actions_1.Action {
        constructor(id, label, clazz, textFileService, editorGroupService) {
            super(id, label, clazz);
            this.textFileService = textFileService;
            this.editorGroupService = editorGroupService;
        }
        get groupsToClose() {
            const groupsToClose = [];
            // Close editors in reverse order of their grid appearance so that the editor
            // group that is the first (top-left) remains. This helps to keep view state
            // for editors around that have been opened in this visually first group.
            const groups = this.editorGroupService.getGroups(2 /* GRID_APPEARANCE */);
            for (let i = groups.length - 1; i >= 0; i--) {
                groupsToClose.push(groups[i]);
            }
            return groupsToClose;
        }
        async run() {
            // Just close all if there are no dirty editors
            if (!this.textFileService.isDirty()) {
                return this.doCloseAll();
            }
            // Otherwise ask for combined confirmation and make sure
            // to bring each dirty editor to the front so that the user
            // can review if the files should be changed or not.
            await Promise.all(this.groupsToClose.map(async (groupToClose) => {
                for (const editor of groupToClose.getEditors(0 /* MOST_RECENTLY_ACTIVE */)) {
                    if (editor.isDirty()) {
                        return groupToClose.openEditor(editor);
                    }
                }
                return undefined;
            }));
            const confirm = await this.textFileService.confirmSave();
            if (confirm === 2 /* CANCEL */) {
                return;
            }
            let saveOrRevert;
            if (confirm === 1 /* DONT_SAVE */) {
                await this.textFileService.revertAll(undefined, { soft: true });
                saveOrRevert = true;
            }
            else {
                const res = await this.textFileService.saveAll(true);
                saveOrRevert = res.results.every(r => !!r.success);
            }
            if (saveOrRevert) {
                return this.doCloseAll();
            }
        }
    }
    exports.BaseCloseAllAction = BaseCloseAllAction;
    let CloseAllEditorsAction = class CloseAllEditorsAction extends BaseCloseAllAction {
        constructor(id, label, textFileService, editorGroupService) {
            super(id, label, 'codicon-close-all', textFileService, editorGroupService);
        }
        doCloseAll() {
            return Promise.all(this.groupsToClose.map(g => g.closeAllEditors()));
        }
    };
    CloseAllEditorsAction.ID = 'workbench.action.closeAllEditors';
    CloseAllEditorsAction.LABEL = nls.localize('closeAllEditors', "Close All Editors");
    CloseAllEditorsAction = __decorate([
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], CloseAllEditorsAction);
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    let CloseAllEditorGroupsAction = class CloseAllEditorGroupsAction extends BaseCloseAllAction {
        constructor(id, label, textFileService, editorGroupService) {
            super(id, label, undefined, textFileService, editorGroupService);
        }
        async doCloseAll() {
            await Promise.all(this.groupsToClose.map(group => group.closeAllEditors()));
            this.groupsToClose.forEach(group => this.editorGroupService.removeGroup(group));
        }
    };
    CloseAllEditorGroupsAction.ID = 'workbench.action.closeAllGroups';
    CloseAllEditorGroupsAction.LABEL = nls.localize('closeAllGroups', "Close All Editor Groups");
    CloseAllEditorGroupsAction = __decorate([
        __param(2, textfiles_1.ITextFileService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], CloseAllEditorGroupsAction);
    exports.CloseAllEditorGroupsAction = CloseAllEditorGroupsAction;
    let CloseEditorsInOtherGroupsAction = class CloseEditorsInOtherGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            const groupToSkip = context ? this.editorGroupService.getGroup(context.groupId) : this.editorGroupService.activeGroup;
            return Promise.all(this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */).map(g => {
                if (groupToSkip && g.id === groupToSkip.id) {
                    return Promise.resolve();
                }
                return g.closeAllEditors();
            }));
        }
    };
    CloseEditorsInOtherGroupsAction.ID = 'workbench.action.closeEditorsInOtherGroups';
    CloseEditorsInOtherGroupsAction.LABEL = nls.localize('closeEditorsInOtherGroups', "Close Editors in Other Groups");
    CloseEditorsInOtherGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseEditorsInOtherGroupsAction);
    exports.CloseEditorsInOtherGroupsAction = CloseEditorsInOtherGroupsAction;
    let CloseEditorInAllGroupsAction = class CloseEditorInAllGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
        }
        run() {
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                return Promise.all(this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */).map(g => g.closeEditor(activeEditor)));
            }
            return Promise.resolve();
        }
    };
    CloseEditorInAllGroupsAction.ID = 'workbench.action.closeEditorInAllGroups';
    CloseEditorInAllGroupsAction.LABEL = nls.localize('closeEditorInAllGroups', "Close Editor in All Groups");
    CloseEditorInAllGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], CloseEditorInAllGroupsAction);
    exports.CloseEditorInAllGroupsAction = CloseEditorInAllGroupsAction;
    class BaseMoveGroupAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
        }
        run(context) {
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = this.editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = this.editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                const targetGroup = this.findTargetGroup(sourceGroup);
                if (targetGroup) {
                    this.editorGroupService.moveGroup(sourceGroup, targetGroup, this.direction);
                }
            }
            return Promise.resolve(true);
        }
        findTargetGroup(sourceGroup) {
            const targetNeighbours = [this.direction];
            // Allow the target group to be in alternative locations to support more
            // scenarios of moving the group to the taret location.
            // Helps for https://github.com/Microsoft/vscode/issues/50741
            switch (this.direction) {
                case 2 /* LEFT */:
                case 3 /* RIGHT */:
                    targetNeighbours.push(0 /* UP */, 1 /* DOWN */);
                    break;
                case 0 /* UP */:
                case 1 /* DOWN */:
                    targetNeighbours.push(2 /* LEFT */, 3 /* RIGHT */);
                    break;
            }
            for (const targetNeighbour of targetNeighbours) {
                const targetNeighbourGroup = this.editorGroupService.findGroup({ direction: targetNeighbour }, sourceGroup);
                if (targetNeighbourGroup) {
                    return targetNeighbourGroup;
                }
            }
            return undefined;
        }
    }
    exports.BaseMoveGroupAction = BaseMoveGroupAction;
    let MoveGroupLeftAction = class MoveGroupLeftAction extends BaseMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 2 /* LEFT */, editorGroupService);
        }
    };
    MoveGroupLeftAction.ID = 'workbench.action.moveActiveEditorGroupLeft';
    MoveGroupLeftAction.LABEL = nls.localize('moveActiveGroupLeft', "Move Editor Group Left");
    MoveGroupLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupLeftAction);
    exports.MoveGroupLeftAction = MoveGroupLeftAction;
    let MoveGroupRightAction = class MoveGroupRightAction extends BaseMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 3 /* RIGHT */, editorGroupService);
        }
    };
    MoveGroupRightAction.ID = 'workbench.action.moveActiveEditorGroupRight';
    MoveGroupRightAction.LABEL = nls.localize('moveActiveGroupRight', "Move Editor Group Right");
    MoveGroupRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupRightAction);
    exports.MoveGroupRightAction = MoveGroupRightAction;
    let MoveGroupUpAction = class MoveGroupUpAction extends BaseMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 0 /* UP */, editorGroupService);
        }
    };
    MoveGroupUpAction.ID = 'workbench.action.moveActiveEditorGroupUp';
    MoveGroupUpAction.LABEL = nls.localize('moveActiveGroupUp', "Move Editor Group Up");
    MoveGroupUpAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupUpAction);
    exports.MoveGroupUpAction = MoveGroupUpAction;
    let MoveGroupDownAction = class MoveGroupDownAction extends BaseMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 1 /* DOWN */, editorGroupService);
        }
    };
    MoveGroupDownAction.ID = 'workbench.action.moveActiveEditorGroupDown';
    MoveGroupDownAction.LABEL = nls.localize('moveActiveGroupDown', "Move Editor Group Down");
    MoveGroupDownAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupDownAction);
    exports.MoveGroupDownAction = MoveGroupDownAction;
    let MinimizeOtherGroupsAction = class MinimizeOtherGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run() {
            this.editorGroupService.arrangeGroups(0 /* MINIMIZE_OTHERS */);
            return Promise.resolve(false);
        }
    };
    MinimizeOtherGroupsAction.ID = 'workbench.action.minimizeOtherEditors';
    MinimizeOtherGroupsAction.LABEL = nls.localize('minimizeOtherEditorGroups', "Maximize Editor Group");
    MinimizeOtherGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MinimizeOtherGroupsAction);
    exports.MinimizeOtherGroupsAction = MinimizeOtherGroupsAction;
    let ResetGroupSizesAction = class ResetGroupSizesAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run() {
            this.editorGroupService.arrangeGroups(1 /* EVEN */);
            return Promise.resolve(false);
        }
    };
    ResetGroupSizesAction.ID = 'workbench.action.evenEditorWidths';
    ResetGroupSizesAction.LABEL = nls.localize('evenEditorGroups', "Reset Editor Group Sizes");
    ResetGroupSizesAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ResetGroupSizesAction);
    exports.ResetGroupSizesAction = ResetGroupSizesAction;
    let ToggleGroupSizesAction = class ToggleGroupSizesAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        run() {
            this.editorGroupService.arrangeGroups(2 /* TOGGLE */);
            return Promise.resolve(false);
        }
    };
    ToggleGroupSizesAction.ID = 'workbench.action.toggleEditorWidths';
    ToggleGroupSizesAction.LABEL = nls.localize('toggleEditorWidths', "Toggle Editor Group Sizes");
    ToggleGroupSizesAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ToggleGroupSizesAction);
    exports.ToggleGroupSizesAction = ToggleGroupSizesAction;
    let MaximizeGroupAction = class MaximizeGroupAction extends actions_1.Action {
        constructor(id, label, editorService, editorGroupService, layoutService) {
            super(id, label);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
        }
        run() {
            if (this.editorService.activeEditor) {
                this.editorGroupService.arrangeGroups(0 /* MINIMIZE_OTHERS */);
                this.layoutService.setSideBarHidden(true);
            }
            return Promise.resolve(false);
        }
    };
    MaximizeGroupAction.ID = 'workbench.action.maximizeEditor';
    MaximizeGroupAction.LABEL = nls.localize('maximizeEditor', "Maximize Editor Group and Hide Side Bar");
    MaximizeGroupAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], MaximizeGroupAction);
    exports.MaximizeGroupAction = MaximizeGroupAction;
    class BaseNavigateEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
        }
        run() {
            const result = this.navigate();
            if (!result) {
                return Promise.resolve(false);
            }
            const { groupId, editor } = result;
            if (!editor) {
                return Promise.resolve(false);
            }
            const group = this.editorGroupService.getGroup(groupId);
            if (group) {
                return group.openEditor(editor);
            }
            return Promise.resolve();
        }
    }
    exports.BaseNavigateEditorAction = BaseNavigateEditorAction;
    let OpenNextEditor = class OpenNextEditor extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            // Navigate in active group if possible
            const activeGroup = this.editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex + 1 < activeGroupEditors.length) {
                return { editor: activeGroupEditors[activeEditorIndex + 1], groupId: activeGroup.id };
            }
            // Otherwise try in next group
            const nextGroup = this.editorGroupService.findGroup({ location: 2 /* NEXT */ }, this.editorGroupService.activeGroup, true);
            if (nextGroup) {
                const previousGroupEditors = nextGroup.getEditors(1 /* SEQUENTIAL */);
                return { editor: previousGroupEditors[0], groupId: nextGroup.id };
            }
            return undefined;
        }
    };
    OpenNextEditor.ID = 'workbench.action.nextEditor';
    OpenNextEditor.LABEL = nls.localize('openNextEditor', "Open Next Editor");
    OpenNextEditor = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenNextEditor);
    exports.OpenNextEditor = OpenNextEditor;
    let OpenPreviousEditor = class OpenPreviousEditor extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            // Navigate in active group if possible
            const activeGroup = this.editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex > 0) {
                return { editor: activeGroupEditors[activeEditorIndex - 1], groupId: activeGroup.id };
            }
            // Otherwise try in previous group
            const previousGroup = this.editorGroupService.findGroup({ location: 3 /* PREVIOUS */ }, this.editorGroupService.activeGroup, true);
            if (previousGroup) {
                const previousGroupEditors = previousGroup.getEditors(1 /* SEQUENTIAL */);
                return { editor: previousGroupEditors[previousGroupEditors.length - 1], groupId: previousGroup.id };
            }
            return undefined;
        }
    };
    OpenPreviousEditor.ID = 'workbench.action.previousEditor';
    OpenPreviousEditor.LABEL = nls.localize('openPreviousEditor', "Open Previous Editor");
    OpenPreviousEditor = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenPreviousEditor);
    exports.OpenPreviousEditor = OpenPreviousEditor;
    let OpenNextEditorInGroup = class OpenNextEditorInGroup extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index + 1 < editors.length ? editors[index + 1] : editors[0], groupId: group.id };
        }
    };
    OpenNextEditorInGroup.ID = 'workbench.action.nextEditorInGroup';
    OpenNextEditorInGroup.LABEL = nls.localize('nextEditorInGroup', "Open Next Editor in Group");
    OpenNextEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenNextEditorInGroup);
    exports.OpenNextEditorInGroup = OpenNextEditorInGroup;
    let OpenPreviousEditorInGroup = class OpenPreviousEditorInGroup extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index > 0 ? editors[index - 1] : editors[editors.length - 1], groupId: group.id };
        }
    };
    OpenPreviousEditorInGroup.ID = 'workbench.action.previousEditorInGroup';
    OpenPreviousEditorInGroup.LABEL = nls.localize('openPreviousEditorInGroup', "Open Previous Editor in Group");
    OpenPreviousEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenPreviousEditorInGroup);
    exports.OpenPreviousEditorInGroup = OpenPreviousEditorInGroup;
    let OpenFirstEditorInGroup = class OpenFirstEditorInGroup extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* SEQUENTIAL */);
            return { editor: editors[0], groupId: group.id };
        }
    };
    OpenFirstEditorInGroup.ID = 'workbench.action.firstEditorInGroup';
    OpenFirstEditorInGroup.LABEL = nls.localize('firstEditorInGroup', "Open First Editor in Group");
    OpenFirstEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenFirstEditorInGroup);
    exports.OpenFirstEditorInGroup = OpenFirstEditorInGroup;
    let OpenLastEditorInGroup = class OpenLastEditorInGroup extends BaseNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* SEQUENTIAL */);
            return { editor: editors[editors.length - 1], groupId: group.id };
        }
    };
    OpenLastEditorInGroup.ID = 'workbench.action.lastEditorInGroup';
    OpenLastEditorInGroup.LABEL = nls.localize('lastEditorInGroup', "Open Last Editor in Group");
    OpenLastEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenLastEditorInGroup);
    exports.OpenLastEditorInGroup = OpenLastEditorInGroup;
    let NavigateForwardAction = class NavigateForwardAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.forward();
            return Promise.resolve();
        }
    };
    NavigateForwardAction.ID = 'workbench.action.navigateForward';
    NavigateForwardAction.LABEL = nls.localize('navigateNext', "Go Forward");
    NavigateForwardAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateForwardAction);
    exports.NavigateForwardAction = NavigateForwardAction;
    let NavigateBackwardsAction = class NavigateBackwardsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.back();
            return Promise.resolve();
        }
    };
    NavigateBackwardsAction.ID = 'workbench.action.navigateBack';
    NavigateBackwardsAction.LABEL = nls.localize('navigatePrevious', "Go Back");
    NavigateBackwardsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateBackwardsAction);
    exports.NavigateBackwardsAction = NavigateBackwardsAction;
    let NavigateToLastEditLocationAction = class NavigateToLastEditLocationAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.openLastEditLocation();
            return Promise.resolve();
        }
    };
    NavigateToLastEditLocationAction.ID = 'workbench.action.navigateToLastEditLocation';
    NavigateToLastEditLocationAction.LABEL = nls.localize('navigateToLastEditLocation', "Go to Last Edit Location");
    NavigateToLastEditLocationAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateToLastEditLocationAction);
    exports.NavigateToLastEditLocationAction = NavigateToLastEditLocationAction;
    let NavigateLastAction = class NavigateLastAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.last();
            return Promise.resolve();
        }
    };
    NavigateLastAction.ID = 'workbench.action.navigateLast';
    NavigateLastAction.LABEL = nls.localize('navigateLast', "Go Last");
    NavigateLastAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateLastAction);
    exports.NavigateLastAction = NavigateLastAction;
    let ReopenClosedEditorAction = class ReopenClosedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.reopenLastClosedEditor();
            return Promise.resolve(false);
        }
    };
    ReopenClosedEditorAction.ID = 'workbench.action.reopenClosedEditor';
    ReopenClosedEditorAction.LABEL = nls.localize('reopenClosedEditor', "Reopen Closed Editor");
    ReopenClosedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], ReopenClosedEditorAction);
    exports.ReopenClosedEditorAction = ReopenClosedEditorAction;
    let ClearRecentFilesAction = class ClearRecentFilesAction extends actions_1.Action {
        constructor(id, label, workspacesService, historyService) {
            super(id, label);
            this.workspacesService = workspacesService;
            this.historyService = historyService;
        }
        run() {
            // Clear global recently opened
            this.workspacesService.clearRecentlyOpened();
            // Clear workspace specific recently opened
            this.historyService.clearRecentlyOpened();
            return Promise.resolve(false);
        }
    };
    ClearRecentFilesAction.ID = 'workbench.action.clearRecentFiles';
    ClearRecentFilesAction.LABEL = nls.localize('clearRecentFiles', "Clear Recently Opened");
    ClearRecentFilesAction = __decorate([
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, history_1.IHistoryService)
    ], ClearRecentFilesAction);
    exports.ClearRecentFilesAction = ClearRecentFilesAction;
    let ShowEditorsInActiveGroupAction = class ShowEditorsInActiveGroupAction extends quickopen_1.QuickOpenAction {
        constructor(actionId, actionLabel, quickOpenService) {
            super(actionId, actionLabel, editorCommands_1.NAVIGATE_IN_ACTIVE_GROUP_PREFIX, quickOpenService);
        }
    };
    ShowEditorsInActiveGroupAction.ID = 'workbench.action.showEditorsInActiveGroup';
    ShowEditorsInActiveGroupAction.LABEL = nls.localize('showEditorsInActiveGroup', "Show Editors in Active Group");
    ShowEditorsInActiveGroupAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService)
    ], ShowEditorsInActiveGroupAction);
    exports.ShowEditorsInActiveGroupAction = ShowEditorsInActiveGroupAction;
    let ShowAllEditorsAction = class ShowAllEditorsAction extends quickopen_1.QuickOpenAction {
        constructor(actionId, actionLabel, quickOpenService) {
            super(actionId, actionLabel, editorCommands_1.NAVIGATE_ALL_EDITORS_GROUP_PREFIX, quickOpenService);
        }
    };
    ShowAllEditorsAction.ID = 'workbench.action.showAllEditors';
    ShowAllEditorsAction.LABEL = nls.localize('showAllEditors', "Show All Editors");
    ShowAllEditorsAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService)
    ], ShowAllEditorsAction);
    exports.ShowAllEditorsAction = ShowAllEditorsAction;
    let BaseQuickOpenEditorInGroupAction = class BaseQuickOpenEditorInGroupAction extends actions_1.Action {
        constructor(id, label, quickOpenService, keybindingService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.keybindingService = keybindingService;
        }
        run() {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickOpenService.show(editorCommands_1.NAVIGATE_IN_ACTIVE_GROUP_PREFIX, { quickNavigateConfiguration: { keybindings: keys } });
            return Promise.resolve(true);
        }
    };
    BaseQuickOpenEditorInGroupAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, keybinding_1.IKeybindingService)
    ], BaseQuickOpenEditorInGroupAction);
    exports.BaseQuickOpenEditorInGroupAction = BaseQuickOpenEditorInGroupAction;
    let OpenPreviousRecentlyUsedEditorInGroupAction = class OpenPreviousRecentlyUsedEditorInGroupAction extends BaseQuickOpenEditorInGroupAction {
        constructor(id, label, quickOpenService, keybindingService) {
            super(id, label, quickOpenService, keybindingService);
        }
    };
    OpenPreviousRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openPreviousRecentlyUsedEditorInGroup';
    OpenPreviousRecentlyUsedEditorInGroupAction.LABEL = nls.localize('openPreviousRecentlyUsedEditorInGroup', "Open Previous Recently Used Editor in Group");
    OpenPreviousRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, keybinding_1.IKeybindingService)
    ], OpenPreviousRecentlyUsedEditorInGroupAction);
    exports.OpenPreviousRecentlyUsedEditorInGroupAction = OpenPreviousRecentlyUsedEditorInGroupAction;
    let OpenNextRecentlyUsedEditorInGroupAction = class OpenNextRecentlyUsedEditorInGroupAction extends BaseQuickOpenEditorInGroupAction {
        constructor(id, label, quickOpenService, keybindingService) {
            super(id, label, quickOpenService, keybindingService);
        }
    };
    OpenNextRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openNextRecentlyUsedEditorInGroup';
    OpenNextRecentlyUsedEditorInGroupAction.LABEL = nls.localize('openNextRecentlyUsedEditorInGroup', "Open Next Recently Used Editor in Group");
    OpenNextRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, keybinding_1.IKeybindingService)
    ], OpenNextRecentlyUsedEditorInGroupAction);
    exports.OpenNextRecentlyUsedEditorInGroupAction = OpenNextRecentlyUsedEditorInGroupAction;
    let OpenPreviousEditorFromHistoryAction = class OpenPreviousEditorFromHistoryAction extends actions_1.Action {
        constructor(id, label, quickOpenService, keybindingService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.keybindingService = keybindingService;
        }
        run() {
            const keys = this.keybindingService.lookupKeybindings(this.id);
            this.quickOpenService.show(undefined, { quickNavigateConfiguration: { keybindings: keys } });
            return Promise.resolve(true);
        }
    };
    OpenPreviousEditorFromHistoryAction.ID = 'workbench.action.openPreviousEditorFromHistory';
    OpenPreviousEditorFromHistoryAction.LABEL = nls.localize('navigateEditorHistoryByInput', "Open Previous Editor from History");
    OpenPreviousEditorFromHistoryAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, keybinding_1.IKeybindingService)
    ], OpenPreviousEditorFromHistoryAction);
    exports.OpenPreviousEditorFromHistoryAction = OpenPreviousEditorFromHistoryAction;
    let OpenNextRecentlyUsedEditorAction = class OpenNextRecentlyUsedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.forward(true);
            return Promise.resolve();
        }
    };
    OpenNextRecentlyUsedEditorAction.ID = 'workbench.action.openNextRecentlyUsedEditor';
    OpenNextRecentlyUsedEditorAction.LABEL = nls.localize('openNextRecentlyUsedEditor', "Open Next Recently Used Editor");
    OpenNextRecentlyUsedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], OpenNextRecentlyUsedEditorAction);
    exports.OpenNextRecentlyUsedEditorAction = OpenNextRecentlyUsedEditorAction;
    let OpenPreviousRecentlyUsedEditorAction = class OpenPreviousRecentlyUsedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            this.historyService.back(true);
            return Promise.resolve();
        }
    };
    OpenPreviousRecentlyUsedEditorAction.ID = 'workbench.action.openPreviousRecentlyUsedEditor';
    OpenPreviousRecentlyUsedEditorAction.LABEL = nls.localize('openPreviousRecentlyUsedEditor', "Open Previous Recently Used Editor");
    OpenPreviousRecentlyUsedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], OpenPreviousRecentlyUsedEditorAction);
    exports.OpenPreviousRecentlyUsedEditorAction = OpenPreviousRecentlyUsedEditorAction;
    let ClearEditorHistoryAction = class ClearEditorHistoryAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        run() {
            // Editor history
            this.historyService.clear();
            return Promise.resolve(true);
        }
    };
    ClearEditorHistoryAction.ID = 'workbench.action.clearEditorHistory';
    ClearEditorHistoryAction.LABEL = nls.localize('clearEditorHistory', "Clear Editor History");
    ClearEditorHistoryAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], ClearEditorHistoryAction);
    exports.ClearEditorHistoryAction = ClearEditorHistoryAction;
    let MoveEditorLeftInGroupAction = class MoveEditorLeftInGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'left' });
        }
    };
    MoveEditorLeftInGroupAction.ID = 'workbench.action.moveEditorLeftInGroup';
    MoveEditorLeftInGroupAction.LABEL = nls.localize('moveEditorLeft', "Move Editor Left");
    MoveEditorLeftInGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorLeftInGroupAction);
    exports.MoveEditorLeftInGroupAction = MoveEditorLeftInGroupAction;
    let MoveEditorRightInGroupAction = class MoveEditorRightInGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'right' });
        }
    };
    MoveEditorRightInGroupAction.ID = 'workbench.action.moveEditorRightInGroup';
    MoveEditorRightInGroupAction.LABEL = nls.localize('moveEditorRight', "Move Editor Right");
    MoveEditorRightInGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorRightInGroupAction);
    exports.MoveEditorRightInGroupAction = MoveEditorRightInGroupAction;
    let MoveEditorToPreviousGroupAction = class MoveEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'previous', by: 'group' });
        }
    };
    MoveEditorToPreviousGroupAction.ID = 'workbench.action.moveEditorToPreviousGroup';
    MoveEditorToPreviousGroupAction.LABEL = nls.localize('moveEditorToPreviousGroup', "Move Editor into Previous Group");
    MoveEditorToPreviousGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToPreviousGroupAction);
    exports.MoveEditorToPreviousGroupAction = MoveEditorToPreviousGroupAction;
    let MoveEditorToNextGroupAction = class MoveEditorToNextGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'next', by: 'group' });
        }
    };
    MoveEditorToNextGroupAction.ID = 'workbench.action.moveEditorToNextGroup';
    MoveEditorToNextGroupAction.LABEL = nls.localize('moveEditorToNextGroup', "Move Editor into Next Group");
    MoveEditorToNextGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToNextGroupAction);
    exports.MoveEditorToNextGroupAction = MoveEditorToNextGroupAction;
    let MoveEditorToAboveGroupAction = class MoveEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'up', by: 'group' });
        }
    };
    MoveEditorToAboveGroupAction.ID = 'workbench.action.moveEditorToAboveGroup';
    MoveEditorToAboveGroupAction.LABEL = nls.localize('moveEditorToAboveGroup', "Move Editor into Above Group");
    MoveEditorToAboveGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToAboveGroupAction);
    exports.MoveEditorToAboveGroupAction = MoveEditorToAboveGroupAction;
    let MoveEditorToBelowGroupAction = class MoveEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'down', by: 'group' });
        }
    };
    MoveEditorToBelowGroupAction.ID = 'workbench.action.moveEditorToBelowGroup';
    MoveEditorToBelowGroupAction.LABEL = nls.localize('moveEditorToBelowGroup', "Move Editor into Below Group");
    MoveEditorToBelowGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToBelowGroupAction);
    exports.MoveEditorToBelowGroupAction = MoveEditorToBelowGroupAction;
    let MoveEditorToLeftGroupAction = class MoveEditorToLeftGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'left', by: 'group' });
        }
    };
    MoveEditorToLeftGroupAction.ID = 'workbench.action.moveEditorToLeftGroup';
    MoveEditorToLeftGroupAction.LABEL = nls.localize('moveEditorToLeftGroup', "Move Editor into Left Group");
    MoveEditorToLeftGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToLeftGroupAction);
    exports.MoveEditorToLeftGroupAction = MoveEditorToLeftGroupAction;
    let MoveEditorToRightGroupAction = class MoveEditorToRightGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'right', by: 'group' });
        }
    };
    MoveEditorToRightGroupAction.ID = 'workbench.action.moveEditorToRightGroup';
    MoveEditorToRightGroupAction.LABEL = nls.localize('moveEditorToRightGroup', "Move Editor into Right Group");
    MoveEditorToRightGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToRightGroupAction);
    exports.MoveEditorToRightGroupAction = MoveEditorToRightGroupAction;
    let MoveEditorToFirstGroupAction = class MoveEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'first', by: 'group' });
        }
    };
    MoveEditorToFirstGroupAction.ID = 'workbench.action.moveEditorToFirstGroup';
    MoveEditorToFirstGroupAction.LABEL = nls.localize('moveEditorToFirstGroup', "Move Editor into First Group");
    MoveEditorToFirstGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToFirstGroupAction);
    exports.MoveEditorToFirstGroupAction = MoveEditorToFirstGroupAction;
    let MoveEditorToLastGroupAction = class MoveEditorToLastGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'last', by: 'group' });
        }
    };
    MoveEditorToLastGroupAction.ID = 'workbench.action.moveEditorToLastGroup';
    MoveEditorToLastGroupAction.LABEL = nls.localize('moveEditorToLastGroup', "Move Editor into Last Group");
    MoveEditorToLastGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToLastGroupAction);
    exports.MoveEditorToLastGroupAction = MoveEditorToLastGroupAction;
    let EditorLayoutSingleAction = class EditorLayoutSingleAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}] });
        }
    };
    EditorLayoutSingleAction.ID = 'workbench.action.editorLayoutSingle';
    EditorLayoutSingleAction.LABEL = nls.localize('editorLayoutSingle', "Single Column Editor Layout");
    EditorLayoutSingleAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutSingleAction);
    exports.EditorLayoutSingleAction = EditorLayoutSingleAction;
    let EditorLayoutTwoColumnsAction = class EditorLayoutTwoColumnsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}], orientation: 0 /* HORIZONTAL */ });
        }
    };
    EditorLayoutTwoColumnsAction.ID = 'workbench.action.editorLayoutTwoColumns';
    EditorLayoutTwoColumnsAction.LABEL = nls.localize('editorLayoutTwoColumns', "Two Columns Editor Layout");
    EditorLayoutTwoColumnsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoColumnsAction);
    exports.EditorLayoutTwoColumnsAction = EditorLayoutTwoColumnsAction;
    let EditorLayoutThreeColumnsAction = class EditorLayoutThreeColumnsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}, {}], orientation: 0 /* HORIZONTAL */ });
        }
    };
    EditorLayoutThreeColumnsAction.ID = 'workbench.action.editorLayoutThreeColumns';
    EditorLayoutThreeColumnsAction.LABEL = nls.localize('editorLayoutThreeColumns', "Three Columns Editor Layout");
    EditorLayoutThreeColumnsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutThreeColumnsAction);
    exports.EditorLayoutThreeColumnsAction = EditorLayoutThreeColumnsAction;
    let EditorLayoutTwoRowsAction = class EditorLayoutTwoRowsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}], orientation: 1 /* VERTICAL */ });
        }
    };
    EditorLayoutTwoRowsAction.ID = 'workbench.action.editorLayoutTwoRows';
    EditorLayoutTwoRowsAction.LABEL = nls.localize('editorLayoutTwoRows', "Two Rows Editor Layout");
    EditorLayoutTwoRowsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoRowsAction);
    exports.EditorLayoutTwoRowsAction = EditorLayoutTwoRowsAction;
    let EditorLayoutThreeRowsAction = class EditorLayoutThreeRowsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}, {}], orientation: 1 /* VERTICAL */ });
        }
    };
    EditorLayoutThreeRowsAction.ID = 'workbench.action.editorLayoutThreeRows';
    EditorLayoutThreeRowsAction.LABEL = nls.localize('editorLayoutThreeRows', "Three Rows Editor Layout");
    EditorLayoutThreeRowsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutThreeRowsAction);
    exports.EditorLayoutThreeRowsAction = EditorLayoutThreeRowsAction;
    let EditorLayoutTwoByTwoGridAction = class EditorLayoutTwoByTwoGridAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }] });
        }
    };
    EditorLayoutTwoByTwoGridAction.ID = 'workbench.action.editorLayoutTwoByTwoGrid';
    EditorLayoutTwoByTwoGridAction.LABEL = nls.localize('editorLayoutTwoByTwoGrid', "Grid Editor Layout (2x2)");
    EditorLayoutTwoByTwoGridAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoByTwoGridAction);
    exports.EditorLayoutTwoByTwoGridAction = EditorLayoutTwoByTwoGridAction;
    let EditorLayoutTwoColumnsBottomAction = class EditorLayoutTwoColumnsBottomAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, { groups: [{}, {}] }], orientation: 1 /* VERTICAL */ });
        }
    };
    EditorLayoutTwoColumnsBottomAction.ID = 'workbench.action.editorLayoutTwoColumnsBottom';
    EditorLayoutTwoColumnsBottomAction.LABEL = nls.localize('editorLayoutTwoColumnsBottom', "Two Columns Bottom Editor Layout");
    EditorLayoutTwoColumnsBottomAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoColumnsBottomAction);
    exports.EditorLayoutTwoColumnsBottomAction = EditorLayoutTwoColumnsBottomAction;
    let EditorLayoutTwoRowsRightAction = class EditorLayoutTwoRowsRightAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, { groups: [{}, {}] }], orientation: 0 /* HORIZONTAL */ });
        }
    };
    EditorLayoutTwoRowsRightAction.ID = 'workbench.action.editorLayoutTwoRowsRight';
    EditorLayoutTwoRowsRightAction.LABEL = nls.localize('editorLayoutTwoRowsRight', "Two Rows Right Editor Layout");
    EditorLayoutTwoRowsRightAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoRowsRightAction);
    exports.EditorLayoutTwoRowsRightAction = EditorLayoutTwoRowsRightAction;
    class BaseCreateEditorGroupAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
        }
        run() {
            this.editorGroupService.addGroup(this.editorGroupService.activeGroup, this.direction, { activate: true });
            return Promise.resolve(true);
        }
    }
    exports.BaseCreateEditorGroupAction = BaseCreateEditorGroupAction;
    let NewEditorGroupLeftAction = class NewEditorGroupLeftAction extends BaseCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 2 /* LEFT */, editorGroupService);
        }
    };
    NewEditorGroupLeftAction.ID = 'workbench.action.newGroupLeft';
    NewEditorGroupLeftAction.LABEL = nls.localize('newEditorLeft', "New Editor Group to the Left");
    NewEditorGroupLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupLeftAction);
    exports.NewEditorGroupLeftAction = NewEditorGroupLeftAction;
    let NewEditorGroupRightAction = class NewEditorGroupRightAction extends BaseCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 3 /* RIGHT */, editorGroupService);
        }
    };
    NewEditorGroupRightAction.ID = 'workbench.action.newGroupRight';
    NewEditorGroupRightAction.LABEL = nls.localize('newEditorRight', "New Editor Group to the Right");
    NewEditorGroupRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupRightAction);
    exports.NewEditorGroupRightAction = NewEditorGroupRightAction;
    let NewEditorGroupAboveAction = class NewEditorGroupAboveAction extends BaseCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 0 /* UP */, editorGroupService);
        }
    };
    NewEditorGroupAboveAction.ID = 'workbench.action.newGroupAbove';
    NewEditorGroupAboveAction.LABEL = nls.localize('newEditorAbove', "New Editor Group Above");
    NewEditorGroupAboveAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupAboveAction);
    exports.NewEditorGroupAboveAction = NewEditorGroupAboveAction;
    let NewEditorGroupBelowAction = class NewEditorGroupBelowAction extends BaseCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 1 /* DOWN */, editorGroupService);
        }
    };
    NewEditorGroupBelowAction.ID = 'workbench.action.newGroupBelow';
    NewEditorGroupBelowAction.LABEL = nls.localize('newEditorBelow', "New Editor Group Below");
    NewEditorGroupBelowAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupBelowAction);
    exports.NewEditorGroupBelowAction = NewEditorGroupBelowAction;
});
//# sourceMappingURL=editorActions.js.map