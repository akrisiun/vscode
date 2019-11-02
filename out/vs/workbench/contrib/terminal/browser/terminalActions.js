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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/terminal/common/terminal", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/panel", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panel/common/panelService", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/quickOpen/common/quickOpen", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/actions", "vs/workbench/contrib/terminal/browser/terminalQuickOpen", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/platform/notification/common/notification", "vs/editor/browser/editorExtensions", "vs/base/common/async", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, nls, actions_1, codeEditorService_1, terminal_1, actionbar_1, panel_1, layoutService_1, panelService_1, styler_1, themeService_1, quickOpen_1, quickInput_1, actions_2, terminalQuickOpen_1, instantiation_1, contextView_1, commands_1, workspace_1, workspaceCommands_1, notification_1, editorExtensions_1, async_1, configurationResolver_1, history_1, network_1, platform_1, types_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TERMINAL_PICKER_PREFIX = 'term ';
    function getCwdForSplit(configHelper, instance, folders, commandService) {
        switch (configHelper.config.splitCwd) {
            case 'workspaceRoot':
                let pathPromise = Promise.resolve('');
                if (folders !== undefined && commandService !== undefined) {
                    if (folders.length === 1) {
                        pathPromise = Promise.resolve(folders[0].uri);
                    }
                    else if (folders.length > 1) {
                        // Only choose a path when there's more than 1 folder
                        const options = {
                            placeHolder: nls.localize('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        pathPromise = commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]).then(workspace => {
                            if (!workspace) {
                                // Don't split the instance if the workspace picker was canceled
                                return undefined;
                            }
                            return Promise.resolve(workspace.uri);
                        });
                    }
                }
                return pathPromise;
            case 'initial':
                return instance.getInitialCwd();
            case 'inherited':
                return instance.getCwd();
        }
    }
    let ToggleTerminalAction = class ToggleTerminalAction extends panel_1.TogglePanelAction {
        constructor(id, label, panelService, layoutService, terminalService) {
            super(id, label, terminal_1.TERMINAL_PANEL_ID, panelService, layoutService);
            this.terminalService = terminalService;
        }
        run(event) {
            if (this.terminalService.terminalInstances.length === 0) {
                // If there is not yet an instance attempt to create it here so that we can suggest a
                // new shell on Windows (and not do so when the panel is restored on reload).
                const newTerminalInstance = this.terminalService.createTerminal(undefined);
                const toDispose = newTerminalInstance.onProcessIdReady(() => {
                    newTerminalInstance.focus();
                    toDispose.dispose();
                });
            }
            return super.run();
        }
    };
    ToggleTerminalAction.ID = "workbench.action.terminal.toggleTerminal" /* TOGGLE */;
    ToggleTerminalAction.LABEL = nls.localize('workbench.action.terminal.toggleTerminal', "Toggle Integrated Terminal");
    ToggleTerminalAction = __decorate([
        __param(2, panelService_1.IPanelService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, terminal_2.ITerminalService)
    ], ToggleTerminalAction);
    exports.ToggleTerminalAction = ToggleTerminalAction;
    let KillTerminalAction = class KillTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label, 'terminal-action codicon-trash');
            this.terminalService = terminalService;
        }
        run(event) {
            const instance = this.terminalService.getActiveInstance();
            if (instance) {
                instance.dispose(true);
                if (this.terminalService.terminalInstances.length > 0) {
                    this.terminalService.showPanel(true);
                }
            }
            return Promise.resolve(undefined);
        }
    };
    KillTerminalAction.ID = "workbench.action.terminal.kill" /* KILL */;
    KillTerminalAction.LABEL = nls.localize('workbench.action.terminal.kill', "Kill the Active Terminal Instance");
    KillTerminalAction.PANEL_LABEL = nls.localize('workbench.action.terminal.kill.short', "Kill Terminal");
    KillTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], KillTerminalAction);
    exports.KillTerminalAction = KillTerminalAction;
    let QuickKillTerminalAction = class QuickKillTerminalAction extends actions_1.Action {
        constructor(id, label, terminalEntry, quickOpenService) {
            super(id, label, 'terminal-action kill');
            this.terminalEntry = terminalEntry;
            this.quickOpenService = quickOpenService;
        }
        run(event) {
            const instance = this.terminalEntry.instance;
            if (instance) {
                instance.dispose(true);
            }
            return Promise.resolve(async_1.timeout(50)).then(result => this.quickOpenService.show(exports.TERMINAL_PICKER_PREFIX, undefined));
        }
    };
    QuickKillTerminalAction.ID = "workbench.action.terminal.quickKill" /* QUICK_KILL */;
    QuickKillTerminalAction.LABEL = nls.localize('workbench.action.terminal.quickKill', "Kill Terminal Instance");
    QuickKillTerminalAction = __decorate([
        __param(3, quickOpen_1.IQuickOpenService)
    ], QuickKillTerminalAction);
    exports.QuickKillTerminalAction = QuickKillTerminalAction;
    /**
     * Copies the terminal selection. Note that since the command palette takes focus from the terminal,
     * this cannot be triggered through the command palette.
     */
    let CopyTerminalSelectionAction = class CopyTerminalSelectionAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        async run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                await terminalInstance.copySelection();
            }
            return Promise.resolve(undefined);
        }
    };
    CopyTerminalSelectionAction.ID = "workbench.action.terminal.copySelection" /* COPY_SELECTION */;
    CopyTerminalSelectionAction.LABEL = nls.localize('workbench.action.terminal.copySelection', "Copy Selection");
    CopyTerminalSelectionAction.SHORT_LABEL = nls.localize('workbench.action.terminal.copySelection.short', "Copy");
    CopyTerminalSelectionAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], CopyTerminalSelectionAction);
    exports.CopyTerminalSelectionAction = CopyTerminalSelectionAction;
    let SelectAllTerminalAction = class SelectAllTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.selectAll();
            }
            return Promise.resolve(undefined);
        }
    };
    SelectAllTerminalAction.ID = "workbench.action.terminal.selectAll" /* SELECT_ALL */;
    SelectAllTerminalAction.LABEL = nls.localize('workbench.action.terminal.selectAll', "Select All");
    SelectAllTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectAllTerminalAction);
    exports.SelectAllTerminalAction = SelectAllTerminalAction;
    let BaseSendTextTerminalAction = class BaseSendTextTerminalAction extends actions_1.Action {
        constructor(id, label, _text, _terminalService) {
            super(id, label);
            this._text = _text;
            this._terminalService = _terminalService;
        }
        run(event) {
            const terminalInstance = this._terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.sendText(this._text, false);
            }
            return Promise.resolve(undefined);
        }
    };
    BaseSendTextTerminalAction = __decorate([
        __param(3, terminal_2.ITerminalService)
    ], BaseSendTextTerminalAction);
    exports.BaseSendTextTerminalAction = BaseSendTextTerminalAction;
    let DeleteWordLeftTerminalAction = class DeleteWordLeftTerminalAction extends BaseSendTextTerminalAction {
        constructor(id, label, terminalService) {
            // Send ctrl+W
            super(id, label, String.fromCharCode('W'.charCodeAt(0) - 64), terminalService);
        }
    };
    DeleteWordLeftTerminalAction.ID = "workbench.action.terminal.deleteWordLeft" /* DELETE_WORD_LEFT */;
    DeleteWordLeftTerminalAction.LABEL = nls.localize('workbench.action.terminal.deleteWordLeft', "Delete Word Left");
    DeleteWordLeftTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], DeleteWordLeftTerminalAction);
    exports.DeleteWordLeftTerminalAction = DeleteWordLeftTerminalAction;
    let DeleteWordRightTerminalAction = class DeleteWordRightTerminalAction extends BaseSendTextTerminalAction {
        constructor(id, label, terminalService) {
            // Send alt+d
            super(id, label, '\x1bd', terminalService);
        }
    };
    DeleteWordRightTerminalAction.ID = "workbench.action.terminal.deleteWordRight" /* DELETE_WORD_RIGHT */;
    DeleteWordRightTerminalAction.LABEL = nls.localize('workbench.action.terminal.deleteWordRight', "Delete Word Right");
    DeleteWordRightTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], DeleteWordRightTerminalAction);
    exports.DeleteWordRightTerminalAction = DeleteWordRightTerminalAction;
    let DeleteToLineStartTerminalAction = class DeleteToLineStartTerminalAction extends BaseSendTextTerminalAction {
        constructor(id, label, terminalService) {
            // Send ctrl+u
            super(id, label, '\u0015', terminalService);
        }
    };
    DeleteToLineStartTerminalAction.ID = "workbench.action.terminal.deleteToLineStart" /* DELETE_TO_LINE_START */;
    DeleteToLineStartTerminalAction.LABEL = nls.localize('workbench.action.terminal.deleteToLineStart', "Delete To Line Start");
    DeleteToLineStartTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], DeleteToLineStartTerminalAction);
    exports.DeleteToLineStartTerminalAction = DeleteToLineStartTerminalAction;
    let MoveToLineStartTerminalAction = class MoveToLineStartTerminalAction extends BaseSendTextTerminalAction {
        constructor(id, label, terminalService) {
            // Send ctrl+A
            super(id, label, String.fromCharCode('A'.charCodeAt(0) - 64), terminalService);
        }
    };
    MoveToLineStartTerminalAction.ID = "workbench.action.terminal.moveToLineStart" /* MOVE_TO_LINE_START */;
    MoveToLineStartTerminalAction.LABEL = nls.localize('workbench.action.terminal.moveToLineStart', "Move To Line Start");
    MoveToLineStartTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], MoveToLineStartTerminalAction);
    exports.MoveToLineStartTerminalAction = MoveToLineStartTerminalAction;
    let MoveToLineEndTerminalAction = class MoveToLineEndTerminalAction extends BaseSendTextTerminalAction {
        constructor(id, label, terminalService) {
            // Send ctrl+E
            super(id, label, String.fromCharCode('E'.charCodeAt(0) - 64), terminalService);
        }
    };
    MoveToLineEndTerminalAction.ID = "workbench.action.terminal.moveToLineEnd" /* MOVE_TO_LINE_END */;
    MoveToLineEndTerminalAction.LABEL = nls.localize('workbench.action.terminal.moveToLineEnd', "Move To Line End");
    MoveToLineEndTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], MoveToLineEndTerminalAction);
    exports.MoveToLineEndTerminalAction = MoveToLineEndTerminalAction;
    class SendSequenceTerminalCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const terminalInstance = accessor.get(terminal_2.ITerminalService).getActiveInstance();
            if (!terminalInstance) {
                return;
            }
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? types_1.withNullAsUndefined(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            const resolvedText = configurationResolverService.resolve(lastActiveWorkspaceRoot, args.text);
            terminalInstance.sendText(resolvedText, false);
        }
    }
    exports.SendSequenceTerminalCommand = SendSequenceTerminalCommand;
    SendSequenceTerminalCommand.ID = "workbench.action.terminal.sendSequence" /* SEND_SEQUENCE */;
    SendSequenceTerminalCommand.LABEL = nls.localize('workbench.action.terminal.sendSequence', "Send Custom Sequence To Terminal");
    class CreateNewWithCwdTerminalCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            const terminalService = accessor.get(terminal_2.ITerminalService);
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? types_1.withNullAsUndefined(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            let cwd;
            if (args && args.cwd) {
                cwd = configurationResolverService.resolve(lastActiveWorkspaceRoot, args.cwd);
            }
            const instance = terminalService.createTerminal({ cwd });
            if (!instance) {
                return Promise.resolve(undefined);
            }
            terminalService.setActiveInstance(instance);
            return terminalService.showPanel(true);
        }
    }
    exports.CreateNewWithCwdTerminalCommand = CreateNewWithCwdTerminalCommand;
    CreateNewWithCwdTerminalCommand.ID = "workbench.action.terminal.newWithCwd" /* NEW_WITH_CWD */;
    CreateNewWithCwdTerminalCommand.LABEL = nls.localize('workbench.action.terminal.newWithCwd', "Create New Integrated Terminal Starting in a Custom Working Directory");
    CreateNewWithCwdTerminalCommand.CWD_ARG_LABEL = nls.localize('workbench.action.terminal.newWithCwd.cwd', "The directory to start the terminal at");
    let CreateNewTerminalAction = class CreateNewTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService, commandService, workspaceContextService) {
            super(id, label, 'terminal-action codicon-add');
            this.terminalService = terminalService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
        }
        run(event) {
            const folders = this.workspaceContextService.getWorkspace().folders;
            if (event instanceof MouseEvent && (event.altKey || event.ctrlKey)) {
                const activeInstance = this.terminalService.getActiveInstance();
                if (activeInstance) {
                    return getCwdForSplit(this.terminalService.configHelper, activeInstance).then(cwd => {
                        this.terminalService.splitInstance(activeInstance, { cwd });
                        return Promise.resolve(null);
                    });
                }
            }
            let instancePromise;
            if (folders.length <= 1) {
                // Allow terminal service to handle the path when there is only a
                // single root
                instancePromise = Promise.resolve(this.terminalService.createTerminal(undefined));
            }
            else {
                const options = {
                    placeHolder: nls.localize('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                };
                instancePromise = this.commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]).then(workspace => {
                    if (!workspace) {
                        // Don't create the instance if the workspace picker was canceled
                        return null;
                    }
                    return this.terminalService.createTerminal({ cwd: workspace.uri });
                });
            }
            return instancePromise.then(instance => {
                if (!instance) {
                    return Promise.resolve(undefined);
                }
                this.terminalService.setActiveInstance(instance);
                return this.terminalService.showPanel(true);
            });
        }
    };
    CreateNewTerminalAction.ID = "workbench.action.terminal.new" /* NEW */;
    CreateNewTerminalAction.LABEL = nls.localize('workbench.action.terminal.new', "Create New Integrated Terminal");
    CreateNewTerminalAction.SHORT_LABEL = nls.localize('workbench.action.terminal.new.short', "New Terminal");
    CreateNewTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], CreateNewTerminalAction);
    exports.CreateNewTerminalAction = CreateNewTerminalAction;
    let CreateNewInActiveWorkspaceTerminalAction = class CreateNewInActiveWorkspaceTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const instance = this.terminalService.createTerminal(undefined);
            if (!instance) {
                return Promise.resolve(undefined);
            }
            this.terminalService.setActiveInstance(instance);
            return this.terminalService.showPanel(true);
        }
    };
    CreateNewInActiveWorkspaceTerminalAction.ID = "workbench.action.terminal.newInActiveWorkspace" /* NEW_IN_ACTIVE_WORKSPACE */;
    CreateNewInActiveWorkspaceTerminalAction.LABEL = nls.localize('workbench.action.terminal.newInActiveWorkspace', "Create New Integrated Terminal (In Active Workspace)");
    CreateNewInActiveWorkspaceTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], CreateNewInActiveWorkspaceTerminalAction);
    exports.CreateNewInActiveWorkspaceTerminalAction = CreateNewInActiveWorkspaceTerminalAction;
    let SplitTerminalAction = class SplitTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService, commandService, workspaceContextService) {
            super(id, label, 'terminal-action codicon-split-horizontal');
            this._terminalService = _terminalService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
        }
        run(event) {
            const instance = this._terminalService.getActiveInstance();
            if (!instance) {
                return Promise.resolve(undefined);
            }
            return getCwdForSplit(this._terminalService.configHelper, instance, this.workspaceContextService.getWorkspace().folders, this.commandService).then(cwd => {
                if (cwd || (cwd === '')) {
                    this._terminalService.splitInstance(instance, { cwd });
                    return this._terminalService.showPanel(true);
                }
                else {
                    return undefined;
                }
            });
        }
    };
    SplitTerminalAction.ID = "workbench.action.terminal.split" /* SPLIT */;
    SplitTerminalAction.LABEL = nls.localize('workbench.action.terminal.split', "Split Terminal");
    SplitTerminalAction.SHORT_LABEL = nls.localize('workbench.action.terminal.split.short', "Split");
    SplitTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], SplitTerminalAction);
    exports.SplitTerminalAction = SplitTerminalAction;
    let SplitInActiveWorkspaceTerminalAction = class SplitInActiveWorkspaceTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        run(event) {
            const instance = this._terminalService.getActiveInstance();
            if (!instance) {
                return Promise.resolve(undefined);
            }
            return getCwdForSplit(this._terminalService.configHelper, instance).then(cwd => {
                this._terminalService.splitInstance(instance, { cwd });
                return this._terminalService.showPanel(true);
            });
        }
    };
    SplitInActiveWorkspaceTerminalAction.ID = "workbench.action.terminal.splitInActiveWorkspace" /* SPLIT_IN_ACTIVE_WORKSPACE */;
    SplitInActiveWorkspaceTerminalAction.LABEL = nls.localize('workbench.action.terminal.splitInActiveWorkspace', "Split Terminal (In Active Workspace)");
    SplitInActiveWorkspaceTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SplitInActiveWorkspaceTerminalAction);
    exports.SplitInActiveWorkspaceTerminalAction = SplitInActiveWorkspaceTerminalAction;
    let FocusPreviousPaneTerminalAction = class FocusPreviousPaneTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        run(event) {
            const tab = this._terminalService.getActiveTab();
            if (!tab) {
                return Promise.resolve(undefined);
            }
            tab.focusPreviousPane();
            return this._terminalService.showPanel(true);
        }
    };
    FocusPreviousPaneTerminalAction.ID = "workbench.action.terminal.focusPreviousPane" /* FOCUS_PREVIOUS_PANE */;
    FocusPreviousPaneTerminalAction.LABEL = nls.localize('workbench.action.terminal.focusPreviousPane', "Focus Previous Pane");
    FocusPreviousPaneTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusPreviousPaneTerminalAction);
    exports.FocusPreviousPaneTerminalAction = FocusPreviousPaneTerminalAction;
    let FocusNextPaneTerminalAction = class FocusNextPaneTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        run(event) {
            const tab = this._terminalService.getActiveTab();
            if (!tab) {
                return Promise.resolve(undefined);
            }
            tab.focusNextPane();
            return this._terminalService.showPanel(true);
        }
    };
    FocusNextPaneTerminalAction.ID = "workbench.action.terminal.focusNextPane" /* FOCUS_NEXT_PANE */;
    FocusNextPaneTerminalAction.LABEL = nls.localize('workbench.action.terminal.focusNextPane', "Focus Next Pane");
    FocusNextPaneTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusNextPaneTerminalAction);
    exports.FocusNextPaneTerminalAction = FocusNextPaneTerminalAction;
    let BaseFocusDirectionTerminalAction = class BaseFocusDirectionTerminalAction extends actions_1.Action {
        constructor(id, label, _direction, _terminalService) {
            super(id, label);
            this._direction = _direction;
            this._terminalService = _terminalService;
        }
        run(event) {
            const tab = this._terminalService.getActiveTab();
            if (tab) {
                tab.resizePane(this._direction);
            }
            return Promise.resolve(undefined);
        }
    };
    BaseFocusDirectionTerminalAction = __decorate([
        __param(3, terminal_2.ITerminalService)
    ], BaseFocusDirectionTerminalAction);
    exports.BaseFocusDirectionTerminalAction = BaseFocusDirectionTerminalAction;
    let ResizePaneLeftTerminalAction = class ResizePaneLeftTerminalAction extends BaseFocusDirectionTerminalAction {
        constructor(id, label, terminalService) {
            super(id, label, 0 /* Left */, terminalService);
            this.terminalService = terminalService;
        }
    };
    ResizePaneLeftTerminalAction.ID = "workbench.action.terminal.resizePaneLeft" /* RESIZE_PANE_LEFT */;
    ResizePaneLeftTerminalAction.LABEL = nls.localize('workbench.action.terminal.resizePaneLeft', "Resize Pane Left");
    ResizePaneLeftTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ResizePaneLeftTerminalAction);
    exports.ResizePaneLeftTerminalAction = ResizePaneLeftTerminalAction;
    let ResizePaneRightTerminalAction = class ResizePaneRightTerminalAction extends BaseFocusDirectionTerminalAction {
        constructor(id, label, terminalService) {
            super(id, label, 1 /* Right */, terminalService);
            this.terminalService = terminalService;
        }
    };
    ResizePaneRightTerminalAction.ID = "workbench.action.terminal.resizePaneRight" /* RESIZE_PANE_RIGHT */;
    ResizePaneRightTerminalAction.LABEL = nls.localize('workbench.action.terminal.resizePaneRight', "Resize Pane Right");
    ResizePaneRightTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ResizePaneRightTerminalAction);
    exports.ResizePaneRightTerminalAction = ResizePaneRightTerminalAction;
    let ResizePaneUpTerminalAction = class ResizePaneUpTerminalAction extends BaseFocusDirectionTerminalAction {
        constructor(id, label, terminalService) {
            super(id, label, 2 /* Up */, terminalService);
            this.terminalService = terminalService;
        }
    };
    ResizePaneUpTerminalAction.ID = "workbench.action.terminal.resizePaneUp" /* RESIZE_PANE_UP */;
    ResizePaneUpTerminalAction.LABEL = nls.localize('workbench.action.terminal.resizePaneUp', "Resize Pane Up");
    ResizePaneUpTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ResizePaneUpTerminalAction);
    exports.ResizePaneUpTerminalAction = ResizePaneUpTerminalAction;
    let ResizePaneDownTerminalAction = class ResizePaneDownTerminalAction extends BaseFocusDirectionTerminalAction {
        constructor(id, label, terminalService) {
            super(id, label, 3 /* Down */, terminalService);
            this.terminalService = terminalService;
        }
    };
    ResizePaneDownTerminalAction.ID = "workbench.action.terminal.resizePaneDown" /* RESIZE_PANE_DOWN */;
    ResizePaneDownTerminalAction.LABEL = nls.localize('workbench.action.terminal.resizePaneDown', "Resize Pane Down");
    ResizePaneDownTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ResizePaneDownTerminalAction);
    exports.ResizePaneDownTerminalAction = ResizePaneDownTerminalAction;
    let FocusActiveTerminalAction = class FocusActiveTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const instance = this.terminalService.getActiveOrCreateInstance();
            if (!instance) {
                return Promise.resolve(undefined);
            }
            this.terminalService.setActiveInstance(instance);
            return this.terminalService.showPanel(true);
        }
    };
    FocusActiveTerminalAction.ID = "workbench.action.terminal.focus" /* FOCUS */;
    FocusActiveTerminalAction.LABEL = nls.localize('workbench.action.terminal.focus', "Focus Terminal");
    FocusActiveTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusActiveTerminalAction);
    exports.FocusActiveTerminalAction = FocusActiveTerminalAction;
    let FocusNextTerminalAction = class FocusNextTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            this.terminalService.setActiveTabToNext();
            return this.terminalService.showPanel(true);
        }
    };
    FocusNextTerminalAction.ID = "workbench.action.terminal.focusNext" /* FOCUS_NEXT */;
    FocusNextTerminalAction.LABEL = nls.localize('workbench.action.terminal.focusNext', "Focus Next Terminal");
    FocusNextTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusNextTerminalAction);
    exports.FocusNextTerminalAction = FocusNextTerminalAction;
    let FocusPreviousTerminalAction = class FocusPreviousTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            this.terminalService.setActiveTabToPrevious();
            return this.terminalService.showPanel(true);
        }
    };
    FocusPreviousTerminalAction.ID = "workbench.action.terminal.focusPrevious" /* FOCUS_PREVIOUS */;
    FocusPreviousTerminalAction.LABEL = nls.localize('workbench.action.terminal.focusPrevious', "Focus Previous Terminal");
    FocusPreviousTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusPreviousTerminalAction);
    exports.FocusPreviousTerminalAction = FocusPreviousTerminalAction;
    let TerminalPasteAction = class TerminalPasteAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        async run(event) {
            const instance = this.terminalService.getActiveOrCreateInstance();
            if (instance) {
                await instance.paste();
            }
        }
    };
    TerminalPasteAction.ID = "workbench.action.terminal.paste" /* PASTE */;
    TerminalPasteAction.LABEL = nls.localize('workbench.action.terminal.paste', "Paste into Active Terminal");
    TerminalPasteAction.SHORT_LABEL = nls.localize('workbench.action.terminal.paste.short', "Paste");
    TerminalPasteAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], TerminalPasteAction);
    exports.TerminalPasteAction = TerminalPasteAction;
    let SelectDefaultShellWindowsTerminalAction = class SelectDefaultShellWindowsTerminalAction extends actions_1.Action {
        constructor(id, label, _terminalService) {
            super(id, label);
            this._terminalService = _terminalService;
        }
        run(event) {
            return this._terminalService.selectDefaultWindowsShell();
        }
    };
    SelectDefaultShellWindowsTerminalAction.ID = "workbench.action.terminal.selectDefaultShell" /* SELECT_DEFAULT_SHELL */;
    SelectDefaultShellWindowsTerminalAction.LABEL = nls.localize('workbench.action.terminal.selectDefaultShell', "Select Default Shell");
    SelectDefaultShellWindowsTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectDefaultShellWindowsTerminalAction);
    exports.SelectDefaultShellWindowsTerminalAction = SelectDefaultShellWindowsTerminalAction;
    let RunSelectedTextInTerminalAction = class RunSelectedTextInTerminalAction extends actions_1.Action {
        constructor(id, label, codeEditorService, terminalService) {
            super(id, label);
            this.codeEditorService = codeEditorService;
            this.terminalService = terminalService;
        }
        run(event) {
            const instance = this.terminalService.getActiveOrCreateInstance();
            if (!instance) {
                return Promise.resolve(undefined);
            }
            let editor = this.codeEditorService.getFocusedCodeEditor();
            if (!editor || !editor.hasModel()) {
                return Promise.resolve(undefined);
            }
            let selection = editor.getSelection();
            let text;
            if (selection.isEmpty()) {
                text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
            }
            else {
                const endOfLinePreference = platform_1.isWindows ? 1 /* LF */ : 2 /* CRLF */;
                text = editor.getModel().getValueInRange(selection, endOfLinePreference);
            }
            instance.sendText(text, true);
            return this.terminalService.showPanel();
        }
    };
    RunSelectedTextInTerminalAction.ID = "workbench.action.terminal.runSelectedText" /* RUN_SELECTED_TEXT */;
    RunSelectedTextInTerminalAction.LABEL = nls.localize('workbench.action.terminal.runSelectedText', "Run Selected Text In Active Terminal");
    RunSelectedTextInTerminalAction = __decorate([
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, terminal_2.ITerminalService)
    ], RunSelectedTextInTerminalAction);
    exports.RunSelectedTextInTerminalAction = RunSelectedTextInTerminalAction;
    let RunActiveFileInTerminalAction = class RunActiveFileInTerminalAction extends actions_1.Action {
        constructor(id, label, codeEditorService, terminalService, notificationService) {
            super(id, label);
            this.codeEditorService = codeEditorService;
            this.terminalService = terminalService;
            this.notificationService = notificationService;
        }
        run(event) {
            const instance = this.terminalService.getActiveOrCreateInstance();
            if (!instance) {
                return Promise.resolve(undefined);
            }
            const editor = this.codeEditorService.getActiveCodeEditor();
            if (!editor || !editor.hasModel()) {
                return Promise.resolve(undefined);
            }
            const uri = editor.getModel().uri;
            if (uri.scheme !== 'file') {
                this.notificationService.warn(nls.localize('workbench.action.terminal.runActiveFile.noFile', 'Only files on disk can be run in the terminal'));
                return Promise.resolve(undefined);
            }
            return this.terminalService.preparePathForTerminalAsync(uri.fsPath, instance.shellLaunchConfig.executable, instance.title, instance.shellType).then(path => {
                instance.sendText(path, true);
                return this.terminalService.showPanel();
            });
        }
    };
    RunActiveFileInTerminalAction.ID = "workbench.action.terminal.runActiveFile" /* RUN_ACTIVE_FILE */;
    RunActiveFileInTerminalAction.LABEL = nls.localize('workbench.action.terminal.runActiveFile', "Run Active File In Active Terminal");
    RunActiveFileInTerminalAction = __decorate([
        __param(2, codeEditorService_1.ICodeEditorService),
        __param(3, terminal_2.ITerminalService),
        __param(4, notification_1.INotificationService)
    ], RunActiveFileInTerminalAction);
    exports.RunActiveFileInTerminalAction = RunActiveFileInTerminalAction;
    let SwitchTerminalAction = class SwitchTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label, 'terminal-action switch-terminal');
            this.terminalService = terminalService;
        }
        run(item) {
            if (!item || !item.split) {
                return Promise.resolve(null);
            }
            if (item === SwitchTerminalActionViewItem.SEPARATOR) {
                this.terminalService.refreshActiveTab();
                return Promise.resolve(null);
            }
            if (item === SelectDefaultShellWindowsTerminalAction.LABEL) {
                this.terminalService.refreshActiveTab();
                return this.terminalService.selectDefaultWindowsShell();
            }
            const selectedTabIndex = parseInt(item.split(':')[0], 10) - 1;
            this.terminalService.setActiveTabByIndex(selectedTabIndex);
            return this.terminalService.showPanel(true);
        }
    };
    SwitchTerminalAction.ID = "workbench.action.terminal.switchTerminal" /* SWITCH_TERMINAL */;
    SwitchTerminalAction.LABEL = nls.localize('workbench.action.terminal.switchTerminal', "Switch Terminal");
    SwitchTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SwitchTerminalAction);
    exports.SwitchTerminalAction = SwitchTerminalAction;
    let SwitchTerminalActionViewItem = class SwitchTerminalActionViewItem extends actionbar_1.SelectActionViewItem {
        constructor(action, terminalService, themeService, contextViewService) {
            super(null, action, terminalService.getTabLabels().map(label => ({ text: label })), terminalService.activeTabIndex, contextViewService, { ariaLabel: nls.localize('terminals', 'Open Terminals.') });
            this.terminalService = terminalService;
            this._register(terminalService.onInstancesChanged(this._updateItems, this));
            this._register(terminalService.onActiveTabChanged(this._updateItems, this));
            this._register(terminalService.onInstanceTitleChanged(this._updateItems, this));
            this._register(terminalService.onTabDisposed(this._updateItems, this));
            this._register(styler_1.attachSelectBoxStyler(this.selectBox, themeService));
        }
        _updateItems() {
            const items = this.terminalService.getTabLabels().map(label => ({ text: label }));
            items.push({ text: SwitchTerminalActionViewItem.SEPARATOR, isDisabled: true });
            items.push({ text: SelectDefaultShellWindowsTerminalAction.LABEL });
            this.setOptions(items, this.terminalService.activeTabIndex);
        }
    };
    SwitchTerminalActionViewItem.SEPARATOR = '─────────';
    SwitchTerminalActionViewItem = __decorate([
        __param(1, terminal_2.ITerminalService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService)
    ], SwitchTerminalActionViewItem);
    exports.SwitchTerminalActionViewItem = SwitchTerminalActionViewItem;
    let ScrollDownTerminalAction = class ScrollDownTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollDownLine();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollDownTerminalAction.ID = "workbench.action.terminal.scrollDown" /* SCROLL_DOWN_LINE */;
    ScrollDownTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollDown', "Scroll Down (Line)");
    ScrollDownTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollDownTerminalAction);
    exports.ScrollDownTerminalAction = ScrollDownTerminalAction;
    let ScrollDownPageTerminalAction = class ScrollDownPageTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollDownPage();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollDownPageTerminalAction.ID = "workbench.action.terminal.scrollDownPage" /* SCROLL_DOWN_PAGE */;
    ScrollDownPageTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollDownPage', "Scroll Down (Page)");
    ScrollDownPageTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollDownPageTerminalAction);
    exports.ScrollDownPageTerminalAction = ScrollDownPageTerminalAction;
    let ScrollToBottomTerminalAction = class ScrollToBottomTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollToBottom();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollToBottomTerminalAction.ID = "workbench.action.terminal.scrollToBottom" /* SCROLL_TO_BOTTOM */;
    ScrollToBottomTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollToBottom', "Scroll to Bottom");
    ScrollToBottomTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollToBottomTerminalAction);
    exports.ScrollToBottomTerminalAction = ScrollToBottomTerminalAction;
    let ScrollUpTerminalAction = class ScrollUpTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollUpLine();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollUpTerminalAction.ID = "workbench.action.terminal.scrollUp" /* SCROLL_UP_LINE */;
    ScrollUpTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollUp', "Scroll Up (Line)");
    ScrollUpTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollUpTerminalAction);
    exports.ScrollUpTerminalAction = ScrollUpTerminalAction;
    let ScrollUpPageTerminalAction = class ScrollUpPageTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollUpPage();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollUpPageTerminalAction.ID = "workbench.action.terminal.scrollUpPage" /* SCROLL_UP_PAGE */;
    ScrollUpPageTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollUpPage', "Scroll Up (Page)");
    ScrollUpPageTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollUpPageTerminalAction);
    exports.ScrollUpPageTerminalAction = ScrollUpPageTerminalAction;
    let ScrollToTopTerminalAction = class ScrollToTopTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.scrollToTop();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollToTopTerminalAction.ID = "workbench.action.terminal.scrollToTop" /* SCROLL_TO_TOP */;
    ScrollToTopTerminalAction.LABEL = nls.localize('workbench.action.terminal.scrollToTop', "Scroll to Top");
    ScrollToTopTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollToTopTerminalAction);
    exports.ScrollToTopTerminalAction = ScrollToTopTerminalAction;
    let NavigationModeExitTerminalAction = class NavigationModeExitTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance && terminalInstance.navigationMode) {
                terminalInstance.navigationMode.exitNavigationMode();
            }
            return Promise.resolve(undefined);
        }
    };
    NavigationModeExitTerminalAction.ID = "workbench.action.terminal.navigationModeExit" /* NAVIGATION_MODE_EXIT */;
    NavigationModeExitTerminalAction.LABEL = nls.localize('workbench.action.terminal.navigationModeExit', "Exit Navigation Mode");
    NavigationModeExitTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], NavigationModeExitTerminalAction);
    exports.NavigationModeExitTerminalAction = NavigationModeExitTerminalAction;
    let NavigationModeFocusPreviousTerminalAction = class NavigationModeFocusPreviousTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance && terminalInstance.navigationMode) {
                terminalInstance.navigationMode.focusPreviousLine();
            }
            return Promise.resolve(undefined);
        }
    };
    NavigationModeFocusPreviousTerminalAction.ID = "workbench.action.terminal.navigationModeFocusPrevious" /* NAVIGATION_MODE_FOCUS_PREVIOUS */;
    NavigationModeFocusPreviousTerminalAction.LABEL = nls.localize('workbench.action.terminal.navigationModeFocusPrevious', "Focus Previous Line (Navigation Mode)");
    NavigationModeFocusPreviousTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], NavigationModeFocusPreviousTerminalAction);
    exports.NavigationModeFocusPreviousTerminalAction = NavigationModeFocusPreviousTerminalAction;
    let NavigationModeFocusNextTerminalAction = class NavigationModeFocusNextTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance && terminalInstance.navigationMode) {
                terminalInstance.navigationMode.focusNextLine();
            }
            return Promise.resolve(undefined);
        }
    };
    NavigationModeFocusNextTerminalAction.ID = "workbench.action.terminal.navigationModeFocusNext" /* NAVIGATION_MODE_FOCUS_NEXT */;
    NavigationModeFocusNextTerminalAction.LABEL = nls.localize('workbench.action.terminal.navigationModeFocusNext', "Focus Next Line (Navigation Mode)");
    NavigationModeFocusNextTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], NavigationModeFocusNextTerminalAction);
    exports.NavigationModeFocusNextTerminalAction = NavigationModeFocusNextTerminalAction;
    let ClearTerminalAction = class ClearTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance) {
                terminalInstance.clear();
            }
            return Promise.resolve(undefined);
        }
    };
    ClearTerminalAction.ID = "workbench.action.terminal.clear" /* CLEAR */;
    ClearTerminalAction.LABEL = nls.localize('workbench.action.terminal.clear', "Clear");
    ClearTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ClearTerminalAction);
    exports.ClearTerminalAction = ClearTerminalAction;
    let ClearSelectionTerminalAction = class ClearSelectionTerminalAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run(event) {
            const terminalInstance = this.terminalService.getActiveInstance();
            if (terminalInstance && terminalInstance.hasSelection()) {
                terminalInstance.clearSelection();
            }
            return Promise.resolve(undefined);
        }
    };
    ClearSelectionTerminalAction.ID = "workbench.action.terminal.clearSelection" /* CLEAR_SELECTION */;
    ClearSelectionTerminalAction.LABEL = nls.localize('workbench.action.terminal.clearSelection', "Clear Selection");
    ClearSelectionTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ClearSelectionTerminalAction);
    exports.ClearSelectionTerminalAction = ClearSelectionTerminalAction;
    let ManageWorkspaceShellPermissionsTerminalCommand = class ManageWorkspaceShellPermissionsTerminalCommand extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        async run(event) {
            await this.terminalService.manageWorkspaceShellPermissions();
        }
    };
    ManageWorkspaceShellPermissionsTerminalCommand.ID = "workbench.action.terminal.manageWorkspaceShellPermissions" /* MANAGE_WORKSPACE_SHELL_PERMISSIONS */;
    ManageWorkspaceShellPermissionsTerminalCommand.LABEL = nls.localize('workbench.action.terminal.manageWorkspaceShellPermissions', "Manage Workspace Shell Permissions");
    ManageWorkspaceShellPermissionsTerminalCommand = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ManageWorkspaceShellPermissionsTerminalCommand);
    exports.ManageWorkspaceShellPermissionsTerminalCommand = ManageWorkspaceShellPermissionsTerminalCommand;
    let RenameTerminalAction = class RenameTerminalAction extends actions_1.Action {
        constructor(id, label, quickOpenService, quickInputService, terminalService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
            this.quickInputService = quickInputService;
            this.terminalService = terminalService;
        }
        run(entry) {
            const terminalInstance = entry ? entry.instance : this.terminalService.getActiveInstance();
            if (!terminalInstance) {
                return Promise.resolve(undefined);
            }
            return this.quickInputService.input({
                value: terminalInstance.title,
                prompt: nls.localize('workbench.action.terminal.rename.prompt', "Enter terminal name"),
            }).then(name => {
                if (name) {
                    terminalInstance.setTitle(name, terminal_1.TitleEventSource.Api);
                }
            });
        }
    };
    RenameTerminalAction.ID = "workbench.action.terminal.rename" /* RENAME */;
    RenameTerminalAction.LABEL = nls.localize('workbench.action.terminal.rename', "Rename");
    RenameTerminalAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, terminal_2.ITerminalService)
    ], RenameTerminalAction);
    exports.RenameTerminalAction = RenameTerminalAction;
    let FocusTerminalFindWidgetAction = class FocusTerminalFindWidgetAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            return this.terminalService.focusFindWidget();
        }
    };
    FocusTerminalFindWidgetAction.ID = "workbench.action.terminal.focusFindWidget" /* FIND_WIDGET_FOCUS */;
    FocusTerminalFindWidgetAction.LABEL = nls.localize('workbench.action.terminal.focusFindWidget', "Focus Find Widget");
    FocusTerminalFindWidgetAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FocusTerminalFindWidgetAction);
    exports.FocusTerminalFindWidgetAction = FocusTerminalFindWidgetAction;
    let HideTerminalFindWidgetAction = class HideTerminalFindWidgetAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            return Promise.resolve(this.terminalService.hideFindWidget());
        }
    };
    HideTerminalFindWidgetAction.ID = "workbench.action.terminal.hideFindWidget" /* FIND_WIDGET_HIDE */;
    HideTerminalFindWidgetAction.LABEL = nls.localize('workbench.action.terminal.hideFindWidget', "Hide Find Widget");
    HideTerminalFindWidgetAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], HideTerminalFindWidgetAction);
    exports.HideTerminalFindWidgetAction = HideTerminalFindWidgetAction;
    let QuickOpenActionTermContributor = class QuickOpenActionTermContributor extends actions_2.ActionBarContributor {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
        }
        getActions(context) {
            const actions = [];
            if (context.element instanceof terminalQuickOpen_1.TerminalEntry) {
                actions.push(this.instantiationService.createInstance(RenameTerminalQuickOpenAction, RenameTerminalQuickOpenAction.ID, RenameTerminalQuickOpenAction.LABEL, context.element));
                actions.push(this.instantiationService.createInstance(QuickKillTerminalAction, QuickKillTerminalAction.ID, QuickKillTerminalAction.LABEL, context.element));
            }
            return actions;
        }
        hasActions(context) {
            return true;
        }
    };
    QuickOpenActionTermContributor = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], QuickOpenActionTermContributor);
    exports.QuickOpenActionTermContributor = QuickOpenActionTermContributor;
    let QuickOpenTermAction = class QuickOpenTermAction extends actions_1.Action {
        constructor(id, label, quickOpenService) {
            super(id, label);
            this.quickOpenService = quickOpenService;
        }
        run() {
            return this.quickOpenService.show(exports.TERMINAL_PICKER_PREFIX, undefined);
        }
    };
    QuickOpenTermAction.ID = "workbench.action.quickOpenTerm" /* QUICK_OPEN_TERM */;
    QuickOpenTermAction.LABEL = nls.localize('quickOpenTerm', "Switch Active Terminal");
    QuickOpenTermAction = __decorate([
        __param(2, quickOpen_1.IQuickOpenService)
    ], QuickOpenTermAction);
    exports.QuickOpenTermAction = QuickOpenTermAction;
    let RenameTerminalQuickOpenAction = class RenameTerminalQuickOpenAction extends RenameTerminalAction {
        constructor(id, label, terminal, quickOpenService, quickInputService, terminalService) {
            super(id, label, quickOpenService, quickInputService, terminalService);
            this.terminal = terminal;
            this.class = 'quick-open-terminal-configure';
        }
        run() {
            super.run(this.terminal)
                // This timeout is needed to make sure the previous quickOpen has time to close before we show the next one
                .then(() => async_1.timeout(50))
                .then(result => this.quickOpenService.show(exports.TERMINAL_PICKER_PREFIX, undefined));
            return Promise.resolve(null);
        }
    };
    RenameTerminalQuickOpenAction = __decorate([
        __param(3, quickOpen_1.IQuickOpenService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, terminal_2.ITerminalService)
    ], RenameTerminalQuickOpenAction);
    exports.RenameTerminalQuickOpenAction = RenameTerminalQuickOpenAction;
    let ScrollToPreviousCommandAction = class ScrollToPreviousCommandAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.scrollToPreviousCommand();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollToPreviousCommandAction.ID = "workbench.action.terminal.scrollToPreviousCommand" /* SCROLL_TO_PREVIOUS_COMMAND */;
    ScrollToPreviousCommandAction.LABEL = nls.localize('workbench.action.terminal.scrollToPreviousCommand', "Scroll To Previous Command");
    ScrollToPreviousCommandAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollToPreviousCommandAction);
    exports.ScrollToPreviousCommandAction = ScrollToPreviousCommandAction;
    let ScrollToNextCommandAction = class ScrollToNextCommandAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.scrollToNextCommand();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    ScrollToNextCommandAction.ID = "workbench.action.terminal.scrollToNextCommand" /* SCROLL_TO_NEXT_COMMAND */;
    ScrollToNextCommandAction.LABEL = nls.localize('workbench.action.terminal.scrollToNextCommand', "Scroll To Next Command");
    ScrollToNextCommandAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ScrollToNextCommandAction);
    exports.ScrollToNextCommandAction = ScrollToNextCommandAction;
    let SelectToPreviousCommandAction = class SelectToPreviousCommandAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.selectToPreviousCommand();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    SelectToPreviousCommandAction.ID = "workbench.action.terminal.selectToPreviousCommand" /* SELECT_TO_PREVIOUS_COMMAND */;
    SelectToPreviousCommandAction.LABEL = nls.localize('workbench.action.terminal.selectToPreviousCommand', "Select To Previous Command");
    SelectToPreviousCommandAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectToPreviousCommandAction);
    exports.SelectToPreviousCommandAction = SelectToPreviousCommandAction;
    let SelectToNextCommandAction = class SelectToNextCommandAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.selectToNextCommand();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    SelectToNextCommandAction.ID = "workbench.action.terminal.selectToNextCommand" /* SELECT_TO_NEXT_COMMAND */;
    SelectToNextCommandAction.LABEL = nls.localize('workbench.action.terminal.selectToNextCommand', "Select To Next Command");
    SelectToNextCommandAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectToNextCommandAction);
    exports.SelectToNextCommandAction = SelectToNextCommandAction;
    let SelectToPreviousLineAction = class SelectToPreviousLineAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.selectToPreviousLine();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    SelectToPreviousLineAction.ID = "workbench.action.terminal.selectToPreviousLine" /* SELECT_TO_PREVIOUS_LINE */;
    SelectToPreviousLineAction.LABEL = nls.localize('workbench.action.terminal.selectToPreviousLine', "Select To Previous Line");
    SelectToPreviousLineAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectToPreviousLineAction);
    exports.SelectToPreviousLineAction = SelectToPreviousLineAction;
    let SelectToNextLineAction = class SelectToNextLineAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance && instance.commandTracker) {
                instance.commandTracker.selectToNextLine();
                instance.focus();
            }
            return Promise.resolve(undefined);
        }
    };
    SelectToNextLineAction.ID = "workbench.action.terminal.selectToNextLine" /* SELECT_TO_NEXT_LINE */;
    SelectToNextLineAction.LABEL = nls.localize('workbench.action.terminal.selectToNextLine', "Select To Next Line");
    SelectToNextLineAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], SelectToNextLineAction);
    exports.SelectToNextLineAction = SelectToNextLineAction;
    let ToggleEscapeSequenceLoggingAction = class ToggleEscapeSequenceLoggingAction extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const instance = this.terminalService.getActiveInstance();
            if (instance) {
                instance.toggleEscapeSequenceLogging();
            }
            return Promise.resolve(undefined);
        }
    };
    ToggleEscapeSequenceLoggingAction.ID = "toggleEscapeSequenceLogging" /* TOGGLE_ESCAPE_SEQUENCE_LOGGING */;
    ToggleEscapeSequenceLoggingAction.LABEL = nls.localize('workbench.action.terminal.toggleEscapeSequenceLogging', "Toggle Escape Sequence Logging");
    ToggleEscapeSequenceLoggingAction = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ToggleEscapeSequenceLoggingAction);
    exports.ToggleEscapeSequenceLoggingAction = ToggleEscapeSequenceLoggingAction;
    let ToggleFindOptionCommand = class ToggleFindOptionCommand extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            const state = this.terminalService.getFindState();
            this.runInner(state);
            return Promise.resolve(undefined);
        }
    };
    ToggleFindOptionCommand = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], ToggleFindOptionCommand);
    class ToggleRegexCommand extends ToggleFindOptionCommand {
        runInner(state) {
            state.change({ isRegex: !state.isRegex }, false);
        }
    }
    exports.ToggleRegexCommand = ToggleRegexCommand;
    ToggleRegexCommand.ID = "workbench.action.terminal.toggleFindRegex" /* TOGGLE_FIND_REGEX */;
    ToggleRegexCommand.LABEL = nls.localize('workbench.action.terminal.toggleFindRegex', "Toggle find using regex");
    class ToggleWholeWordCommand extends ToggleFindOptionCommand {
        runInner(state) {
            state.change({ wholeWord: !state.wholeWord }, false);
        }
    }
    exports.ToggleWholeWordCommand = ToggleWholeWordCommand;
    ToggleWholeWordCommand.ID = "workbench.action.terminal.toggleFindWholeWord" /* TOGGLE_FIND_WHOLE_WORD */;
    ToggleWholeWordCommand.LABEL = nls.localize('workbench.action.terminal.toggleFindWholeWord', "Toggle find using whole word");
    class ToggleCaseSensitiveCommand extends ToggleFindOptionCommand {
        runInner(state) {
            state.change({ matchCase: !state.matchCase }, false);
        }
    }
    exports.ToggleCaseSensitiveCommand = ToggleCaseSensitiveCommand;
    ToggleCaseSensitiveCommand.ID = "workbench.action.terminal.toggleFindCaseSensitive" /* TOGGLE_FIND_CASE_SENSITIVE */;
    ToggleCaseSensitiveCommand.LABEL = nls.localize('workbench.action.terminal.toggleFindCaseSensitive', "Toggle find using case sensitive");
    let FindNext = class FindNext extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            this.terminalService.findNext();
            return Promise.resolve(undefined);
        }
    };
    FindNext.ID = "workbench.action.terminal.findNext" /* FIND_NEXT */;
    FindNext.LABEL = nls.localize('workbench.action.terminal.findNext', "Find next");
    FindNext = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FindNext);
    exports.FindNext = FindNext;
    let FindPrevious = class FindPrevious extends actions_1.Action {
        constructor(id, label, terminalService) {
            super(id, label);
            this.terminalService = terminalService;
        }
        run() {
            this.terminalService.findPrevious();
            return Promise.resolve(undefined);
        }
    };
    FindPrevious.ID = "workbench.action.terminal.findPrevious" /* FIND_PREVIOUS */;
    FindPrevious.LABEL = nls.localize('workbench.action.terminal.findPrevious', "Find previous");
    FindPrevious = __decorate([
        __param(2, terminal_2.ITerminalService)
    ], FindPrevious);
    exports.FindPrevious = FindPrevious;
});
//# sourceMappingURL=terminalActions.js.map