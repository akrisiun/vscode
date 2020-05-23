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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/workbench/common/editor", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/codicons", "vs/workbench/services/filesConfiguration/common/filesConfigurationService"], function (require, exports, nls, actions_1, editor_1, layoutService_1, history_1, keybinding_1, commands_1, editorCommands_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, workspaces_1, dialogs_1, workingCopyService_1, quickInput_1, editorQuickAccess_1, codicons_1, filesConfigurationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NewEditorGroupBelowAction = exports.NewEditorGroupAboveAction = exports.NewEditorGroupRightAction = exports.NewEditorGroupLeftAction = exports.BaseCreateEditorGroupAction = exports.EditorLayoutTwoRowsRightAction = exports.EditorLayoutTwoColumnsBottomAction = exports.EditorLayoutTwoByTwoGridAction = exports.EditorLayoutThreeRowsAction = exports.EditorLayoutTwoRowsAction = exports.EditorLayoutThreeColumnsAction = exports.EditorLayoutTwoColumnsAction = exports.EditorLayoutSingleAction = exports.MoveEditorToLastGroupAction = exports.MoveEditorToFirstGroupAction = exports.MoveEditorToRightGroupAction = exports.MoveEditorToLeftGroupAction = exports.MoveEditorToBelowGroupAction = exports.MoveEditorToAboveGroupAction = exports.MoveEditorToNextGroupAction = exports.MoveEditorToPreviousGroupAction = exports.MoveEditorRightInGroupAction = exports.MoveEditorLeftInGroupAction = exports.ClearEditorHistoryAction = exports.OpenPreviousRecentlyUsedEditorInGroupAction = exports.OpenNextRecentlyUsedEditorInGroupAction = exports.OpenPreviousRecentlyUsedEditorAction = exports.OpenNextRecentlyUsedEditorAction = exports.QuickAccessPreviousEditorFromHistoryAction = exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = exports.QuickAccessLeastRecentlyUsedEditorAction = exports.QuickAccessPreviousRecentlyUsedEditorAction = exports.BaseQuickAccessEditorAction = exports.ShowAllEditorsByMostRecentlyUsedAction = exports.ShowAllEditorsByAppearanceAction = exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = exports.ClearRecentFilesAction = exports.ReopenClosedEditorAction = exports.NavigateLastAction = exports.NavigateToLastEditLocationAction = exports.NavigateBackwardsAction = exports.NavigateForwardAction = exports.OpenLastEditorInGroup = exports.OpenFirstEditorInGroup = exports.OpenPreviousEditorInGroup = exports.OpenNextEditorInGroup = exports.OpenPreviousEditor = exports.OpenNextEditor = exports.BaseNavigateEditorAction = exports.MaximizeGroupAction = exports.ToggleGroupSizesAction = exports.ResetGroupSizesAction = exports.MinimizeOtherGroupsAction = exports.MoveGroupDownAction = exports.MoveGroupUpAction = exports.MoveGroupRightAction = exports.MoveGroupLeftAction = exports.BaseMoveGroupAction = exports.CloseEditorInAllGroupsAction = exports.CloseEditorsInOtherGroupsAction = exports.CloseAllEditorGroupsAction = exports.CloseAllEditorsAction = exports.BaseCloseAllAction = exports.CloseLeftEditorsInGroupAction = exports.RevertAndCloseEditorAction = exports.CloseOneEditorAction = exports.CloseEditorAction = exports.FocusBelowGroup = exports.FocusAboveGroup = exports.FocusRightGroup = exports.FocusLeftGroup = exports.FocusPreviousGroup = exports.FocusNextGroup = exports.FocusLastGroupAction = exports.FocusFirstGroupAction = exports.BaseFocusGroupAction = exports.FocusActiveGroupAction = exports.NavigateBetweenGroupsAction = exports.JoinAllGroupsAction = exports.JoinTwoGroupsAction = exports.SplitEditorDownAction = exports.SplitEditorUpAction = exports.SplitEditorRightAction = exports.SplitEditorLeftAction = exports.SplitEditorOrthogonalAction = exports.SplitEditorAction = exports.BaseSplitEditorAction = exports.ExecuteCommandAction = void 0;
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
        async run(context) {
            editorCommands_1.splitEditor(this.editorGroupService, this.direction, context);
        }
    }
    exports.BaseSplitEditorAction = BaseSplitEditorAction;
    let SplitEditorAction = /** @class */ (() => {
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
        return SplitEditorAction;
    })();
    exports.SplitEditorAction = SplitEditorAction;
    let SplitEditorOrthogonalAction = /** @class */ (() => {
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
        return SplitEditorOrthogonalAction;
    })();
    exports.SplitEditorOrthogonalAction = SplitEditorOrthogonalAction;
    let SplitEditorLeftAction = /** @class */ (() => {
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
        return SplitEditorLeftAction;
    })();
    exports.SplitEditorLeftAction = SplitEditorLeftAction;
    let SplitEditorRightAction = /** @class */ (() => {
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
        return SplitEditorRightAction;
    })();
    exports.SplitEditorRightAction = SplitEditorRightAction;
    let SplitEditorUpAction = /** @class */ (() => {
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
        return SplitEditorUpAction;
    })();
    exports.SplitEditorUpAction = SplitEditorUpAction;
    let SplitEditorDownAction = /** @class */ (() => {
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
        return SplitEditorDownAction;
    })();
    exports.SplitEditorDownAction = SplitEditorDownAction;
    let JoinTwoGroupsAction = /** @class */ (() => {
        let JoinTwoGroupsAction = class JoinTwoGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run(context) {
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
                            break;
                        }
                    }
                }
            }
        };
        JoinTwoGroupsAction.ID = 'workbench.action.joinTwoGroups';
        JoinTwoGroupsAction.LABEL = nls.localize('joinTwoGroups', "Join Editor Group with Next Group");
        JoinTwoGroupsAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], JoinTwoGroupsAction);
        return JoinTwoGroupsAction;
    })();
    exports.JoinTwoGroupsAction = JoinTwoGroupsAction;
    let JoinAllGroupsAction = /** @class */ (() => {
        let JoinAllGroupsAction = class JoinAllGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                editorCommands_1.mergeAllGroups(this.editorGroupService);
            }
        };
        JoinAllGroupsAction.ID = 'workbench.action.joinAllGroups';
        JoinAllGroupsAction.LABEL = nls.localize('joinAllGroups', "Join All Editor Groups");
        JoinAllGroupsAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], JoinAllGroupsAction);
        return JoinAllGroupsAction;
    })();
    exports.JoinAllGroupsAction = JoinAllGroupsAction;
    let NavigateBetweenGroupsAction = /** @class */ (() => {
        let NavigateBetweenGroupsAction = class NavigateBetweenGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                const nextGroup = this.editorGroupService.findGroup({ location: 2 /* NEXT */ }, this.editorGroupService.activeGroup, true);
                nextGroup.focus();
            }
        };
        NavigateBetweenGroupsAction.ID = 'workbench.action.navigateEditorGroups';
        NavigateBetweenGroupsAction.LABEL = nls.localize('navigateEditorGroups', "Navigate Between Editor Groups");
        NavigateBetweenGroupsAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], NavigateBetweenGroupsAction);
        return NavigateBetweenGroupsAction;
    })();
    exports.NavigateBetweenGroupsAction = NavigateBetweenGroupsAction;
    let FocusActiveGroupAction = /** @class */ (() => {
        let FocusActiveGroupAction = class FocusActiveGroupAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                this.editorGroupService.activeGroup.focus();
            }
        };
        FocusActiveGroupAction.ID = 'workbench.action.focusActiveEditorGroup';
        FocusActiveGroupAction.LABEL = nls.localize('focusActiveEditorGroup', "Focus Active Editor Group");
        FocusActiveGroupAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], FocusActiveGroupAction);
        return FocusActiveGroupAction;
    })();
    exports.FocusActiveGroupAction = FocusActiveGroupAction;
    let BaseFocusGroupAction = /** @class */ (() => {
        let BaseFocusGroupAction = class BaseFocusGroupAction extends actions_1.Action {
            constructor(id, label, scope, editorGroupService) {
                super(id, label);
                this.scope = scope;
                this.editorGroupService = editorGroupService;
            }
            async run() {
                const group = this.editorGroupService.findGroup(this.scope, this.editorGroupService.activeGroup, true);
                if (group) {
                    group.focus();
                }
            }
        };
        BaseFocusGroupAction = __decorate([
            __param(3, editorGroupsService_1.IEditorGroupsService)
        ], BaseFocusGroupAction);
        return BaseFocusGroupAction;
    })();
    exports.BaseFocusGroupAction = BaseFocusGroupAction;
    let FocusFirstGroupAction = /** @class */ (() => {
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
        return FocusFirstGroupAction;
    })();
    exports.FocusFirstGroupAction = FocusFirstGroupAction;
    let FocusLastGroupAction = /** @class */ (() => {
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
        return FocusLastGroupAction;
    })();
    exports.FocusLastGroupAction = FocusLastGroupAction;
    let FocusNextGroup = /** @class */ (() => {
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
        return FocusNextGroup;
    })();
    exports.FocusNextGroup = FocusNextGroup;
    let FocusPreviousGroup = /** @class */ (() => {
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
        return FocusPreviousGroup;
    })();
    exports.FocusPreviousGroup = FocusPreviousGroup;
    let FocusLeftGroup = /** @class */ (() => {
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
        return FocusLeftGroup;
    })();
    exports.FocusLeftGroup = FocusLeftGroup;
    let FocusRightGroup = /** @class */ (() => {
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
        return FocusRightGroup;
    })();
    exports.FocusRightGroup = FocusRightGroup;
    let FocusAboveGroup = /** @class */ (() => {
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
        return FocusAboveGroup;
    })();
    exports.FocusAboveGroup = FocusAboveGroup;
    let FocusBelowGroup = /** @class */ (() => {
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
        return FocusBelowGroup;
    })();
    exports.FocusBelowGroup = FocusBelowGroup;
    let CloseEditorAction = /** @class */ (() => {
        let CloseEditorAction = class CloseEditorAction extends actions_1.Action {
            constructor(id, label, commandService) {
                super(id, label, codicons_1.Codicon.close.classNames);
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
        return CloseEditorAction;
    })();
    exports.CloseEditorAction = CloseEditorAction;
    let CloseOneEditorAction = /** @class */ (() => {
        let CloseOneEditorAction = class CloseOneEditorAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label, codicons_1.Codicon.close.classNames);
                this.editorGroupService = editorGroupService;
            }
            async run(context) {
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
                    const editorAtIndex = group.getEditorByIndex(editorIndex);
                    if (editorAtIndex) {
                        return group.closeEditor(editorAtIndex);
                    }
                }
                // Otherwise close active editor in group
                if (group.activeEditor) {
                    return group.closeEditor(group.activeEditor);
                }
            }
        };
        CloseOneEditorAction.ID = 'workbench.action.closeActiveEditor';
        CloseOneEditorAction.LABEL = nls.localize('closeOneEditor', "Close");
        CloseOneEditorAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], CloseOneEditorAction);
        return CloseOneEditorAction;
    })();
    exports.CloseOneEditorAction = CloseOneEditorAction;
    let RevertAndCloseEditorAction = /** @class */ (() => {
        let RevertAndCloseEditorAction = class RevertAndCloseEditorAction extends actions_1.Action {
            constructor(id, label, editorService) {
                super(id, label);
                this.editorService = editorService;
            }
            async run() {
                const activeEditorPane = this.editorService.activeEditorPane;
                if (activeEditorPane) {
                    const editor = activeEditorPane.input;
                    const group = activeEditorPane.group;
                    // first try a normal revert where the contents of the editor are restored
                    try {
                        await this.editorService.revert({ editor, groupId: group.id });
                    }
                    catch (error) {
                        // if that fails, since we are about to close the editor, we accept that
                        // the editor cannot be reverted and instead do a soft revert that just
                        // enables us to close the editor. With this, a user can always close a
                        // dirty editor even when reverting fails.
                        await this.editorService.revert({ editor, groupId: group.id }, { soft: true });
                    }
                    group.closeEditor(editor);
                }
            }
        };
        RevertAndCloseEditorAction.ID = 'workbench.action.revertAndCloseActiveEditor';
        RevertAndCloseEditorAction.LABEL = nls.localize('revertAndCloseActiveEditor', "Revert and Close Editor");
        RevertAndCloseEditorAction = __decorate([
            __param(2, editorService_1.IEditorService)
        ], RevertAndCloseEditorAction);
        return RevertAndCloseEditorAction;
    })();
    exports.RevertAndCloseEditorAction = RevertAndCloseEditorAction;
    let CloseLeftEditorsInGroupAction = /** @class */ (() => {
        let CloseLeftEditorsInGroupAction = class CloseLeftEditorsInGroupAction extends actions_1.Action {
            constructor(id, label, editorService, editorGroupService) {
                super(id, label);
                this.editorService = editorService;
                this.editorGroupService = editorGroupService;
            }
            async run(context) {
                const { group, editor } = getTarget(this.editorService, this.editorGroupService, context);
                if (group && editor) {
                    return group.closeEditors({ direction: 0 /* LEFT */, except: editor });
                }
            }
        };
        CloseLeftEditorsInGroupAction.ID = 'workbench.action.closeEditorsToTheLeft';
        CloseLeftEditorsInGroupAction.LABEL = nls.localize('closeEditorsToTheLeft', "Close Editors to the Left in Group");
        CloseLeftEditorsInGroupAction = __decorate([
            __param(2, editorService_1.IEditorService),
            __param(3, editorGroupsService_1.IEditorGroupsService)
        ], CloseLeftEditorsInGroupAction);
        return CloseLeftEditorsInGroupAction;
    })();
    exports.CloseLeftEditorsInGroupAction = CloseLeftEditorsInGroupAction;
    function getTarget(editorService, editorGroupService, context) {
        if (context) {
            return { editor: context.editor, group: editorGroupService.getGroup(context.groupId) };
        }
        // Fallback to active group
        return { group: editorGroupService.activeGroup, editor: editorGroupService.activeGroup.activeEditor };
    }
    class BaseCloseAllAction extends actions_1.Action {
        constructor(id, label, clazz, workingCopyService, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
            super(id, label, clazz);
            this.workingCopyService = workingCopyService;
            this.fileDialogService = fileDialogService;
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.filesConfigurationService = filesConfigurationService;
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
            if (!this.workingCopyService.hasDirty) {
                return this.doCloseAll();
            }
            // Otherwise ask for combined confirmation and make sure
            // to bring each dirty editor to the front so that the user
            // can review if the files should be changed or not.
            await Promise.all(this.groupsToClose.map(async (groupToClose) => {
                for (const editor of groupToClose.getEditors(0 /* MOST_RECENTLY_ACTIVE */)) {
                    if (editor.isDirty() && !editor.isSaving() /* ignore editors that are being saved */) {
                        return groupToClose.openEditor(editor);
                    }
                }
                return undefined;
            }));
            const dirtyEditorsToConfirm = new Set();
            const dirtyEditorsToAutoSave = new Set();
            for (const editor of this.editorService.editors) {
                if (!editor.isDirty() || editor.isSaving()) {
                    continue; // only interested in dirty editors (unless in the process of saving)
                }
                // Auto-save on focus change: assume to Save unless the editor is untitled
                // because bringing up a dialog would save in this case anyway.
                if (this.filesConfigurationService.getAutoSaveMode() === 3 /* ON_FOCUS_CHANGE */ && !editor.isUntitled()) {
                    dirtyEditorsToAutoSave.add(editor);
                }
                // No auto-save on focus change: ask user
                else {
                    let name;
                    if (editor instanceof editor_1.SideBySideEditorInput) {
                        name = editor.master.getName(); // prefer shorter names by using master's name in this case
                    }
                    else {
                        name = editor.getName();
                    }
                    dirtyEditorsToConfirm.add(name);
                }
            }
            let confirmation;
            let saveReason = 1 /* EXPLICIT */;
            if (dirtyEditorsToConfirm.size > 0) {
                confirmation = await this.fileDialogService.showSaveConfirm(Array.from(dirtyEditorsToConfirm.values()));
            }
            else if (dirtyEditorsToAutoSave.size > 0) {
                confirmation = 0 /* SAVE */;
                saveReason = 3 /* FOCUS_CHANGE */;
            }
            else {
                confirmation = 1 /* DONT_SAVE */;
            }
            if (confirmation === 2 /* CANCEL */) {
                return;
            }
            if (confirmation === 1 /* DONT_SAVE */) {
                await this.editorService.revertAll({ soft: true, includeUntitled: true });
            }
            else {
                await this.editorService.saveAll({ reason: saveReason, includeUntitled: true });
            }
            if (!this.workingCopyService.hasDirty) {
                return this.doCloseAll();
            }
        }
    }
    exports.BaseCloseAllAction = BaseCloseAllAction;
    let CloseAllEditorsAction = /** @class */ (() => {
        let CloseAllEditorsAction = class CloseAllEditorsAction extends BaseCloseAllAction {
            constructor(id, label, workingCopyService, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
                super(id, label, codicons_1.Codicon.closeAll.classNames, workingCopyService, fileDialogService, editorGroupService, editorService, filesConfigurationService);
            }
            async doCloseAll() {
                await Promise.all(this.groupsToClose.map(g => g.closeAllEditors()));
            }
        };
        CloseAllEditorsAction.ID = 'workbench.action.closeAllEditors';
        CloseAllEditorsAction.LABEL = nls.localize('closeAllEditors', "Close All Editors");
        CloseAllEditorsAction = __decorate([
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, dialogs_1.IFileDialogService),
            __param(4, editorGroupsService_1.IEditorGroupsService),
            __param(5, editorService_1.IEditorService),
            __param(6, filesConfigurationService_1.IFilesConfigurationService)
        ], CloseAllEditorsAction);
        return CloseAllEditorsAction;
    })();
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    let CloseAllEditorGroupsAction = /** @class */ (() => {
        let CloseAllEditorGroupsAction = class CloseAllEditorGroupsAction extends BaseCloseAllAction {
            constructor(id, label, workingCopyService, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
                super(id, label, undefined, workingCopyService, fileDialogService, editorGroupService, editorService, filesConfigurationService);
            }
            async doCloseAll() {
                await Promise.all(this.groupsToClose.map(group => group.closeAllEditors()));
                this.groupsToClose.forEach(group => this.editorGroupService.removeGroup(group));
            }
        };
        CloseAllEditorGroupsAction.ID = 'workbench.action.closeAllGroups';
        CloseAllEditorGroupsAction.LABEL = nls.localize('closeAllGroups', "Close All Editor Groups");
        CloseAllEditorGroupsAction = __decorate([
            __param(2, workingCopyService_1.IWorkingCopyService),
            __param(3, dialogs_1.IFileDialogService),
            __param(4, editorGroupsService_1.IEditorGroupsService),
            __param(5, editorService_1.IEditorService),
            __param(6, filesConfigurationService_1.IFilesConfigurationService)
        ], CloseAllEditorGroupsAction);
        return CloseAllEditorGroupsAction;
    })();
    exports.CloseAllEditorGroupsAction = CloseAllEditorGroupsAction;
    let CloseEditorsInOtherGroupsAction = /** @class */ (() => {
        let CloseEditorsInOtherGroupsAction = class CloseEditorsInOtherGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run(context) {
                const groupToSkip = context ? this.editorGroupService.getGroup(context.groupId) : this.editorGroupService.activeGroup;
                await Promise.all(this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */).map(async (g) => {
                    if (groupToSkip && g.id === groupToSkip.id) {
                        return;
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
        return CloseEditorsInOtherGroupsAction;
    })();
    exports.CloseEditorsInOtherGroupsAction = CloseEditorsInOtherGroupsAction;
    let CloseEditorInAllGroupsAction = /** @class */ (() => {
        let CloseEditorInAllGroupsAction = class CloseEditorInAllGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService, editorService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
                this.editorService = editorService;
            }
            async run() {
                const activeEditor = this.editorService.activeEditor;
                if (activeEditor) {
                    await Promise.all(this.editorGroupService.getGroups(1 /* MOST_RECENTLY_ACTIVE */).map(g => g.closeEditor(activeEditor)));
                }
            }
        };
        CloseEditorInAllGroupsAction.ID = 'workbench.action.closeEditorInAllGroups';
        CloseEditorInAllGroupsAction.LABEL = nls.localize('closeEditorInAllGroups', "Close Editor in All Groups");
        CloseEditorInAllGroupsAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService),
            __param(3, editorService_1.IEditorService)
        ], CloseEditorInAllGroupsAction);
        return CloseEditorInAllGroupsAction;
    })();
    exports.CloseEditorInAllGroupsAction = CloseEditorInAllGroupsAction;
    class BaseMoveGroupAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
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
    let MoveGroupLeftAction = /** @class */ (() => {
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
        return MoveGroupLeftAction;
    })();
    exports.MoveGroupLeftAction = MoveGroupLeftAction;
    let MoveGroupRightAction = /** @class */ (() => {
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
        return MoveGroupRightAction;
    })();
    exports.MoveGroupRightAction = MoveGroupRightAction;
    let MoveGroupUpAction = /** @class */ (() => {
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
        return MoveGroupUpAction;
    })();
    exports.MoveGroupUpAction = MoveGroupUpAction;
    let MoveGroupDownAction = /** @class */ (() => {
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
        return MoveGroupDownAction;
    })();
    exports.MoveGroupDownAction = MoveGroupDownAction;
    let MinimizeOtherGroupsAction = /** @class */ (() => {
        let MinimizeOtherGroupsAction = class MinimizeOtherGroupsAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                this.editorGroupService.arrangeGroups(0 /* MINIMIZE_OTHERS */);
            }
        };
        MinimizeOtherGroupsAction.ID = 'workbench.action.minimizeOtherEditors';
        MinimizeOtherGroupsAction.LABEL = nls.localize('minimizeOtherEditorGroups', "Maximize Editor Group");
        MinimizeOtherGroupsAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], MinimizeOtherGroupsAction);
        return MinimizeOtherGroupsAction;
    })();
    exports.MinimizeOtherGroupsAction = MinimizeOtherGroupsAction;
    let ResetGroupSizesAction = /** @class */ (() => {
        let ResetGroupSizesAction = class ResetGroupSizesAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                this.editorGroupService.arrangeGroups(1 /* EVEN */);
            }
        };
        ResetGroupSizesAction.ID = 'workbench.action.evenEditorWidths';
        ResetGroupSizesAction.LABEL = nls.localize('evenEditorGroups', "Reset Editor Group Sizes");
        ResetGroupSizesAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], ResetGroupSizesAction);
        return ResetGroupSizesAction;
    })();
    exports.ResetGroupSizesAction = ResetGroupSizesAction;
    let ToggleGroupSizesAction = /** @class */ (() => {
        let ToggleGroupSizesAction = class ToggleGroupSizesAction extends actions_1.Action {
            constructor(id, label, editorGroupService) {
                super(id, label);
                this.editorGroupService = editorGroupService;
            }
            async run() {
                this.editorGroupService.arrangeGroups(2 /* TOGGLE */);
            }
        };
        ToggleGroupSizesAction.ID = 'workbench.action.toggleEditorWidths';
        ToggleGroupSizesAction.LABEL = nls.localize('toggleEditorWidths', "Toggle Editor Group Sizes");
        ToggleGroupSizesAction = __decorate([
            __param(2, editorGroupsService_1.IEditorGroupsService)
        ], ToggleGroupSizesAction);
        return ToggleGroupSizesAction;
    })();
    exports.ToggleGroupSizesAction = ToggleGroupSizesAction;
    let MaximizeGroupAction = /** @class */ (() => {
        let MaximizeGroupAction = class MaximizeGroupAction extends actions_1.Action {
            constructor(id, label, editorService, editorGroupService, layoutService) {
                super(id, label);
                this.editorService = editorService;
                this.editorGroupService = editorGroupService;
                this.layoutService = layoutService;
            }
            async run() {
                if (this.editorService.activeEditor) {
                    this.editorGroupService.arrangeGroups(0 /* MINIMIZE_OTHERS */);
                    this.layoutService.setSideBarHidden(true);
                }
            }
        };
        MaximizeGroupAction.ID = 'workbench.action.maximizeEditor';
        MaximizeGroupAction.LABEL = nls.localize('maximizeEditor', "Maximize Editor Group and Hide Side Bar");
        MaximizeGroupAction = __decorate([
            __param(2, editorService_1.IEditorService),
            __param(3, editorGroupsService_1.IEditorGroupsService),
            __param(4, layoutService_1.IWorkbenchLayoutService)
        ], MaximizeGroupAction);
        return MaximizeGroupAction;
    })();
    exports.MaximizeGroupAction = MaximizeGroupAction;
    class BaseNavigateEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
        }
        async run() {
            const result = this.navigate();
            if (!result) {
                return;
            }
            const { groupId, editor } = result;
            if (!editor) {
                return;
            }
            const group = this.editorGroupService.getGroup(groupId);
            if (group) {
                await group.openEditor(editor);
            }
        }
    }
    exports.BaseNavigateEditorAction = BaseNavigateEditorAction;
    let OpenNextEditor = /** @class */ (() => {
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
        return OpenNextEditor;
    })();
    exports.OpenNextEditor = OpenNextEditor;
    let OpenPreviousEditor = /** @class */ (() => {
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
        return OpenPreviousEditor;
    })();
    exports.OpenPreviousEditor = OpenPreviousEditor;
    let OpenNextEditorInGroup = /** @class */ (() => {
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
        return OpenNextEditorInGroup;
    })();
    exports.OpenNextEditorInGroup = OpenNextEditorInGroup;
    let OpenPreviousEditorInGroup = /** @class */ (() => {
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
        return OpenPreviousEditorInGroup;
    })();
    exports.OpenPreviousEditorInGroup = OpenPreviousEditorInGroup;
    let OpenFirstEditorInGroup = /** @class */ (() => {
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
        return OpenFirstEditorInGroup;
    })();
    exports.OpenFirstEditorInGroup = OpenFirstEditorInGroup;
    let OpenLastEditorInGroup = /** @class */ (() => {
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
        return OpenLastEditorInGroup;
    })();
    exports.OpenLastEditorInGroup = OpenLastEditorInGroup;
    let NavigateForwardAction = /** @class */ (() => {
        let NavigateForwardAction = class NavigateForwardAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.forward();
            }
        };
        NavigateForwardAction.ID = 'workbench.action.navigateForward';
        NavigateForwardAction.LABEL = nls.localize('navigateNext', "Go Forward");
        NavigateForwardAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], NavigateForwardAction);
        return NavigateForwardAction;
    })();
    exports.NavigateForwardAction = NavigateForwardAction;
    let NavigateBackwardsAction = /** @class */ (() => {
        let NavigateBackwardsAction = class NavigateBackwardsAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.back();
            }
        };
        NavigateBackwardsAction.ID = 'workbench.action.navigateBack';
        NavigateBackwardsAction.LABEL = nls.localize('navigatePrevious', "Go Back");
        NavigateBackwardsAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], NavigateBackwardsAction);
        return NavigateBackwardsAction;
    })();
    exports.NavigateBackwardsAction = NavigateBackwardsAction;
    let NavigateToLastEditLocationAction = /** @class */ (() => {
        let NavigateToLastEditLocationAction = class NavigateToLastEditLocationAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.openLastEditLocation();
            }
        };
        NavigateToLastEditLocationAction.ID = 'workbench.action.navigateToLastEditLocation';
        NavigateToLastEditLocationAction.LABEL = nls.localize('navigateToLastEditLocation', "Go to Last Edit Location");
        NavigateToLastEditLocationAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], NavigateToLastEditLocationAction);
        return NavigateToLastEditLocationAction;
    })();
    exports.NavigateToLastEditLocationAction = NavigateToLastEditLocationAction;
    let NavigateLastAction = /** @class */ (() => {
        let NavigateLastAction = class NavigateLastAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.last();
            }
        };
        NavigateLastAction.ID = 'workbench.action.navigateLast';
        NavigateLastAction.LABEL = nls.localize('navigateLast', "Go Last");
        NavigateLastAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], NavigateLastAction);
        return NavigateLastAction;
    })();
    exports.NavigateLastAction = NavigateLastAction;
    let ReopenClosedEditorAction = /** @class */ (() => {
        let ReopenClosedEditorAction = class ReopenClosedEditorAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.reopenLastClosedEditor();
            }
        };
        ReopenClosedEditorAction.ID = 'workbench.action.reopenClosedEditor';
        ReopenClosedEditorAction.LABEL = nls.localize('reopenClosedEditor', "Reopen Closed Editor");
        ReopenClosedEditorAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], ReopenClosedEditorAction);
        return ReopenClosedEditorAction;
    })();
    exports.ReopenClosedEditorAction = ReopenClosedEditorAction;
    let ClearRecentFilesAction = /** @class */ (() => {
        let ClearRecentFilesAction = class ClearRecentFilesAction extends actions_1.Action {
            constructor(id, label, workspacesService, historyService) {
                super(id, label);
                this.workspacesService = workspacesService;
                this.historyService = historyService;
            }
            async run() {
                // Clear global recently opened
                this.workspacesService.clearRecentlyOpened();
                // Clear workspace specific recently opened
                this.historyService.clearRecentlyOpened();
            }
        };
        ClearRecentFilesAction.ID = 'workbench.action.clearRecentFiles';
        ClearRecentFilesAction.LABEL = nls.localize('clearRecentFiles', "Clear Recently Opened");
        ClearRecentFilesAction = __decorate([
            __param(2, workspaces_1.IWorkspacesService),
            __param(3, history_1.IHistoryService)
        ], ClearRecentFilesAction);
        return ClearRecentFilesAction;
    })();
    exports.ClearRecentFilesAction = ClearRecentFilesAction;
    let ShowEditorsInActiveGroupByMostRecentlyUsedAction = /** @class */ (() => {
        let ShowEditorsInActiveGroupByMostRecentlyUsedAction = class ShowEditorsInActiveGroupByMostRecentlyUsedAction extends actions_1.Action {
            constructor(id, label, quickInputService) {
                super(id, label);
                this.quickInputService = quickInputService;
            }
            async run() {
                this.quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        };
        ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID = 'workbench.action.showEditorsInActiveGroup';
        ShowEditorsInActiveGroupByMostRecentlyUsedAction.LABEL = nls.localize('showEditorsInActiveGroup', "Show Editors in Active Group By Most Recently Used");
        ShowEditorsInActiveGroupByMostRecentlyUsedAction = __decorate([
            __param(2, quickInput_1.IQuickInputService)
        ], ShowEditorsInActiveGroupByMostRecentlyUsedAction);
        return ShowEditorsInActiveGroupByMostRecentlyUsedAction;
    })();
    exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = ShowEditorsInActiveGroupByMostRecentlyUsedAction;
    let ShowAllEditorsByAppearanceAction = /** @class */ (() => {
        let ShowAllEditorsByAppearanceAction = class ShowAllEditorsByAppearanceAction extends actions_1.Action {
            constructor(id, label, quickInputService) {
                super(id, label);
                this.quickInputService = quickInputService;
            }
            async run() {
                this.quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX);
            }
        };
        ShowAllEditorsByAppearanceAction.ID = 'workbench.action.showAllEditors';
        ShowAllEditorsByAppearanceAction.LABEL = nls.localize('showAllEditors', "Show All Editors By Appearance");
        ShowAllEditorsByAppearanceAction = __decorate([
            __param(2, quickInput_1.IQuickInputService)
        ], ShowAllEditorsByAppearanceAction);
        return ShowAllEditorsByAppearanceAction;
    })();
    exports.ShowAllEditorsByAppearanceAction = ShowAllEditorsByAppearanceAction;
    let ShowAllEditorsByMostRecentlyUsedAction = /** @class */ (() => {
        let ShowAllEditorsByMostRecentlyUsedAction = class ShowAllEditorsByMostRecentlyUsedAction extends actions_1.Action {
            constructor(id, label, quickInputService) {
                super(id, label);
                this.quickInputService = quickInputService;
            }
            async run() {
                this.quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        };
        ShowAllEditorsByMostRecentlyUsedAction.ID = 'workbench.action.showAllEditorsByMostRecentlyUsed';
        ShowAllEditorsByMostRecentlyUsedAction.LABEL = nls.localize('showAllEditorsByMostRecentlyUsed', "Show All Editors By Most Recently Used");
        ShowAllEditorsByMostRecentlyUsedAction = __decorate([
            __param(2, quickInput_1.IQuickInputService)
        ], ShowAllEditorsByMostRecentlyUsedAction);
        return ShowAllEditorsByMostRecentlyUsedAction;
    })();
    exports.ShowAllEditorsByMostRecentlyUsedAction = ShowAllEditorsByMostRecentlyUsedAction;
    let BaseQuickAccessEditorAction = /** @class */ (() => {
        let BaseQuickAccessEditorAction = class BaseQuickAccessEditorAction extends actions_1.Action {
            constructor(id, label, prefix, itemActivation, quickInputService, keybindingService) {
                super(id, label);
                this.prefix = prefix;
                this.itemActivation = itemActivation;
                this.quickInputService = quickInputService;
                this.keybindingService = keybindingService;
            }
            async run() {
                const keybindings = this.keybindingService.lookupKeybindings(this.id);
                this.quickInputService.quickAccess.show(this.prefix, {
                    quickNavigateConfiguration: { keybindings },
                    itemActivation: this.itemActivation
                });
            }
        };
        BaseQuickAccessEditorAction = __decorate([
            __param(4, quickInput_1.IQuickInputService),
            __param(5, keybinding_1.IKeybindingService)
        ], BaseQuickAccessEditorAction);
        return BaseQuickAccessEditorAction;
    })();
    exports.BaseQuickAccessEditorAction = BaseQuickAccessEditorAction;
    let QuickAccessPreviousRecentlyUsedEditorAction = /** @class */ (() => {
        let QuickAccessPreviousRecentlyUsedEditorAction = class QuickAccessPreviousRecentlyUsedEditorAction extends BaseQuickAccessEditorAction {
            constructor(id, label, quickInputService, keybindingService) {
                super(id, label, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
            }
        };
        QuickAccessPreviousRecentlyUsedEditorAction.ID = 'workbench.action.quickOpenPreviousRecentlyUsedEditor';
        QuickAccessPreviousRecentlyUsedEditorAction.LABEL = nls.localize('quickOpenPreviousRecentlyUsedEditor', "Quick Open Previous Recently Used Editor");
        QuickAccessPreviousRecentlyUsedEditorAction = __decorate([
            __param(2, quickInput_1.IQuickInputService),
            __param(3, keybinding_1.IKeybindingService)
        ], QuickAccessPreviousRecentlyUsedEditorAction);
        return QuickAccessPreviousRecentlyUsedEditorAction;
    })();
    exports.QuickAccessPreviousRecentlyUsedEditorAction = QuickAccessPreviousRecentlyUsedEditorAction;
    let QuickAccessLeastRecentlyUsedEditorAction = /** @class */ (() => {
        let QuickAccessLeastRecentlyUsedEditorAction = class QuickAccessLeastRecentlyUsedEditorAction extends BaseQuickAccessEditorAction {
            constructor(id, label, quickInputService, keybindingService) {
                super(id, label, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
            }
        };
        QuickAccessLeastRecentlyUsedEditorAction.ID = 'workbench.action.quickOpenLeastRecentlyUsedEditor';
        QuickAccessLeastRecentlyUsedEditorAction.LABEL = nls.localize('quickOpenLeastRecentlyUsedEditor', "Quick Open Least Recently Used Editor");
        QuickAccessLeastRecentlyUsedEditorAction = __decorate([
            __param(2, quickInput_1.IQuickInputService),
            __param(3, keybinding_1.IKeybindingService)
        ], QuickAccessLeastRecentlyUsedEditorAction);
        return QuickAccessLeastRecentlyUsedEditorAction;
    })();
    exports.QuickAccessLeastRecentlyUsedEditorAction = QuickAccessLeastRecentlyUsedEditorAction;
    let QuickAccessPreviousRecentlyUsedEditorInGroupAction = /** @class */ (() => {
        let QuickAccessPreviousRecentlyUsedEditorInGroupAction = class QuickAccessPreviousRecentlyUsedEditorInGroupAction extends BaseQuickAccessEditorAction {
            constructor(id, label, quickInputService, keybindingService) {
                super(id, label, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
            }
        };
        QuickAccessPreviousRecentlyUsedEditorInGroupAction.ID = 'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup';
        QuickAccessPreviousRecentlyUsedEditorInGroupAction.LABEL = nls.localize('quickOpenPreviousRecentlyUsedEditorInGroup', "Quick Open Previous Recently Used Editor in Group");
        QuickAccessPreviousRecentlyUsedEditorInGroupAction = __decorate([
            __param(2, quickInput_1.IQuickInputService),
            __param(3, keybinding_1.IKeybindingService)
        ], QuickAccessPreviousRecentlyUsedEditorInGroupAction);
        return QuickAccessPreviousRecentlyUsedEditorInGroupAction;
    })();
    exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = QuickAccessPreviousRecentlyUsedEditorInGroupAction;
    let QuickAccessLeastRecentlyUsedEditorInGroupAction = /** @class */ (() => {
        let QuickAccessLeastRecentlyUsedEditorInGroupAction = class QuickAccessLeastRecentlyUsedEditorInGroupAction extends BaseQuickAccessEditorAction {
            constructor(id, label, quickInputService, keybindingService) {
                super(id, label, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, quickInput_1.ItemActivation.LAST, quickInputService, keybindingService);
            }
        };
        QuickAccessLeastRecentlyUsedEditorInGroupAction.ID = 'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup';
        QuickAccessLeastRecentlyUsedEditorInGroupAction.LABEL = nls.localize('quickOpenLeastRecentlyUsedEditorInGroup', "Quick Open Least Recently Used Editor in Group");
        QuickAccessLeastRecentlyUsedEditorInGroupAction = __decorate([
            __param(2, quickInput_1.IQuickInputService),
            __param(3, keybinding_1.IKeybindingService)
        ], QuickAccessLeastRecentlyUsedEditorInGroupAction);
        return QuickAccessLeastRecentlyUsedEditorInGroupAction;
    })();
    exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = QuickAccessLeastRecentlyUsedEditorInGroupAction;
    let QuickAccessPreviousEditorFromHistoryAction = /** @class */ (() => {
        let QuickAccessPreviousEditorFromHistoryAction = class QuickAccessPreviousEditorFromHistoryAction extends actions_1.Action {
            constructor(id, label, quickInputService, keybindingService) {
                super(id, label);
                this.quickInputService = quickInputService;
                this.keybindingService = keybindingService;
            }
            async run() {
                const keybindings = this.keybindingService.lookupKeybindings(this.id);
                this.quickInputService.quickAccess.show('', { quickNavigateConfiguration: { keybindings } });
            }
        };
        QuickAccessPreviousEditorFromHistoryAction.ID = 'workbench.action.openPreviousEditorFromHistory';
        QuickAccessPreviousEditorFromHistoryAction.LABEL = nls.localize('navigateEditorHistoryByInput', "Quick Open Previous Editor from History");
        QuickAccessPreviousEditorFromHistoryAction = __decorate([
            __param(2, quickInput_1.IQuickInputService),
            __param(3, keybinding_1.IKeybindingService)
        ], QuickAccessPreviousEditorFromHistoryAction);
        return QuickAccessPreviousEditorFromHistoryAction;
    })();
    exports.QuickAccessPreviousEditorFromHistoryAction = QuickAccessPreviousEditorFromHistoryAction;
    let OpenNextRecentlyUsedEditorAction = /** @class */ (() => {
        let OpenNextRecentlyUsedEditorAction = class OpenNextRecentlyUsedEditorAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.openNextRecentlyUsedEditor();
            }
        };
        OpenNextRecentlyUsedEditorAction.ID = 'workbench.action.openNextRecentlyUsedEditor';
        OpenNextRecentlyUsedEditorAction.LABEL = nls.localize('openNextRecentlyUsedEditor', "Open Next Recently Used Editor");
        OpenNextRecentlyUsedEditorAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], OpenNextRecentlyUsedEditorAction);
        return OpenNextRecentlyUsedEditorAction;
    })();
    exports.OpenNextRecentlyUsedEditorAction = OpenNextRecentlyUsedEditorAction;
    let OpenPreviousRecentlyUsedEditorAction = /** @class */ (() => {
        let OpenPreviousRecentlyUsedEditorAction = class OpenPreviousRecentlyUsedEditorAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                this.historyService.openPreviouslyUsedEditor();
            }
        };
        OpenPreviousRecentlyUsedEditorAction.ID = 'workbench.action.openPreviousRecentlyUsedEditor';
        OpenPreviousRecentlyUsedEditorAction.LABEL = nls.localize('openPreviousRecentlyUsedEditor', "Open Previous Recently Used Editor");
        OpenPreviousRecentlyUsedEditorAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], OpenPreviousRecentlyUsedEditorAction);
        return OpenPreviousRecentlyUsedEditorAction;
    })();
    exports.OpenPreviousRecentlyUsedEditorAction = OpenPreviousRecentlyUsedEditorAction;
    let OpenNextRecentlyUsedEditorInGroupAction = /** @class */ (() => {
        let OpenNextRecentlyUsedEditorInGroupAction = class OpenNextRecentlyUsedEditorInGroupAction extends actions_1.Action {
            constructor(id, label, historyService, editorGroupsService) {
                super(id, label);
                this.historyService = historyService;
                this.editorGroupsService = editorGroupsService;
            }
            async run() {
                this.historyService.openNextRecentlyUsedEditor(this.editorGroupsService.activeGroup.id);
            }
        };
        OpenNextRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openNextRecentlyUsedEditorInGroup';
        OpenNextRecentlyUsedEditorInGroupAction.LABEL = nls.localize('openNextRecentlyUsedEditorInGroup', "Open Next Recently Used Editor In Group");
        OpenNextRecentlyUsedEditorInGroupAction = __decorate([
            __param(2, history_1.IHistoryService),
            __param(3, editorGroupsService_1.IEditorGroupsService)
        ], OpenNextRecentlyUsedEditorInGroupAction);
        return OpenNextRecentlyUsedEditorInGroupAction;
    })();
    exports.OpenNextRecentlyUsedEditorInGroupAction = OpenNextRecentlyUsedEditorInGroupAction;
    let OpenPreviousRecentlyUsedEditorInGroupAction = /** @class */ (() => {
        let OpenPreviousRecentlyUsedEditorInGroupAction = class OpenPreviousRecentlyUsedEditorInGroupAction extends actions_1.Action {
            constructor(id, label, historyService, editorGroupsService) {
                super(id, label);
                this.historyService = historyService;
                this.editorGroupsService = editorGroupsService;
            }
            async run() {
                this.historyService.openPreviouslyUsedEditor(this.editorGroupsService.activeGroup.id);
            }
        };
        OpenPreviousRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openPreviousRecentlyUsedEditorInGroup';
        OpenPreviousRecentlyUsedEditorInGroupAction.LABEL = nls.localize('openPreviousRecentlyUsedEditorInGroup', "Open Previous Recently Used Editor In Group");
        OpenPreviousRecentlyUsedEditorInGroupAction = __decorate([
            __param(2, history_1.IHistoryService),
            __param(3, editorGroupsService_1.IEditorGroupsService)
        ], OpenPreviousRecentlyUsedEditorInGroupAction);
        return OpenPreviousRecentlyUsedEditorInGroupAction;
    })();
    exports.OpenPreviousRecentlyUsedEditorInGroupAction = OpenPreviousRecentlyUsedEditorInGroupAction;
    let ClearEditorHistoryAction = /** @class */ (() => {
        let ClearEditorHistoryAction = class ClearEditorHistoryAction extends actions_1.Action {
            constructor(id, label, historyService) {
                super(id, label);
                this.historyService = historyService;
            }
            async run() {
                // Editor history
                this.historyService.clear();
            }
        };
        ClearEditorHistoryAction.ID = 'workbench.action.clearEditorHistory';
        ClearEditorHistoryAction.LABEL = nls.localize('clearEditorHistory', "Clear Editor History");
        ClearEditorHistoryAction = __decorate([
            __param(2, history_1.IHistoryService)
        ], ClearEditorHistoryAction);
        return ClearEditorHistoryAction;
    })();
    exports.ClearEditorHistoryAction = ClearEditorHistoryAction;
    let MoveEditorLeftInGroupAction = /** @class */ (() => {
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
        return MoveEditorLeftInGroupAction;
    })();
    exports.MoveEditorLeftInGroupAction = MoveEditorLeftInGroupAction;
    let MoveEditorRightInGroupAction = /** @class */ (() => {
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
        return MoveEditorRightInGroupAction;
    })();
    exports.MoveEditorRightInGroupAction = MoveEditorRightInGroupAction;
    let MoveEditorToPreviousGroupAction = /** @class */ (() => {
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
        return MoveEditorToPreviousGroupAction;
    })();
    exports.MoveEditorToPreviousGroupAction = MoveEditorToPreviousGroupAction;
    let MoveEditorToNextGroupAction = /** @class */ (() => {
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
        return MoveEditorToNextGroupAction;
    })();
    exports.MoveEditorToNextGroupAction = MoveEditorToNextGroupAction;
    let MoveEditorToAboveGroupAction = /** @class */ (() => {
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
        return MoveEditorToAboveGroupAction;
    })();
    exports.MoveEditorToAboveGroupAction = MoveEditorToAboveGroupAction;
    let MoveEditorToBelowGroupAction = /** @class */ (() => {
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
        return MoveEditorToBelowGroupAction;
    })();
    exports.MoveEditorToBelowGroupAction = MoveEditorToBelowGroupAction;
    let MoveEditorToLeftGroupAction = /** @class */ (() => {
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
        return MoveEditorToLeftGroupAction;
    })();
    exports.MoveEditorToLeftGroupAction = MoveEditorToLeftGroupAction;
    let MoveEditorToRightGroupAction = /** @class */ (() => {
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
        return MoveEditorToRightGroupAction;
    })();
    exports.MoveEditorToRightGroupAction = MoveEditorToRightGroupAction;
    let MoveEditorToFirstGroupAction = /** @class */ (() => {
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
        return MoveEditorToFirstGroupAction;
    })();
    exports.MoveEditorToFirstGroupAction = MoveEditorToFirstGroupAction;
    let MoveEditorToLastGroupAction = /** @class */ (() => {
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
        return MoveEditorToLastGroupAction;
    })();
    exports.MoveEditorToLastGroupAction = MoveEditorToLastGroupAction;
    let EditorLayoutSingleAction = /** @class */ (() => {
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
        return EditorLayoutSingleAction;
    })();
    exports.EditorLayoutSingleAction = EditorLayoutSingleAction;
    let EditorLayoutTwoColumnsAction = /** @class */ (() => {
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
        return EditorLayoutTwoColumnsAction;
    })();
    exports.EditorLayoutTwoColumnsAction = EditorLayoutTwoColumnsAction;
    let EditorLayoutThreeColumnsAction = /** @class */ (() => {
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
        return EditorLayoutThreeColumnsAction;
    })();
    exports.EditorLayoutThreeColumnsAction = EditorLayoutThreeColumnsAction;
    let EditorLayoutTwoRowsAction = /** @class */ (() => {
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
        return EditorLayoutTwoRowsAction;
    })();
    exports.EditorLayoutTwoRowsAction = EditorLayoutTwoRowsAction;
    let EditorLayoutThreeRowsAction = /** @class */ (() => {
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
        return EditorLayoutThreeRowsAction;
    })();
    exports.EditorLayoutThreeRowsAction = EditorLayoutThreeRowsAction;
    let EditorLayoutTwoByTwoGridAction = /** @class */ (() => {
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
        return EditorLayoutTwoByTwoGridAction;
    })();
    exports.EditorLayoutTwoByTwoGridAction = EditorLayoutTwoByTwoGridAction;
    let EditorLayoutTwoColumnsBottomAction = /** @class */ (() => {
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
        return EditorLayoutTwoColumnsBottomAction;
    })();
    exports.EditorLayoutTwoColumnsBottomAction = EditorLayoutTwoColumnsBottomAction;
    let EditorLayoutTwoRowsRightAction = /** @class */ (() => {
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
        return EditorLayoutTwoRowsRightAction;
    })();
    exports.EditorLayoutTwoRowsRightAction = EditorLayoutTwoRowsRightAction;
    class BaseCreateEditorGroupAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.addGroup(this.editorGroupService.activeGroup, this.direction, { activate: true });
        }
    }
    exports.BaseCreateEditorGroupAction = BaseCreateEditorGroupAction;
    let NewEditorGroupLeftAction = /** @class */ (() => {
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
        return NewEditorGroupLeftAction;
    })();
    exports.NewEditorGroupLeftAction = NewEditorGroupLeftAction;
    let NewEditorGroupRightAction = /** @class */ (() => {
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
        return NewEditorGroupRightAction;
    })();
    exports.NewEditorGroupRightAction = NewEditorGroupRightAction;
    let NewEditorGroupAboveAction = /** @class */ (() => {
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
        return NewEditorGroupAboveAction;
    })();
    exports.NewEditorGroupAboveAction = NewEditorGroupAboveAction;
    let NewEditorGroupBelowAction = /** @class */ (() => {
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
        return NewEditorGroupBelowAction;
    })();
    exports.NewEditorGroupBelowAction = NewEditorGroupBelowAction;
});
//# sourceMappingURL=editorActions.js.map