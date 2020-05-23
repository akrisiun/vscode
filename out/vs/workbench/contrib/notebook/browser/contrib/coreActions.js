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
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/browser/notebookService", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/editor/common/services/getIconClasses", "vs/platform/quickinput/common/quickInput", "vs/base/common/uri"], function (require, exports, editorContextKeys_1, nls_1, actions_1, commands_1, contextkey_1, contextkeys_1, notebookBrowser_1, notebookCommon_1, editorService_1, clipboardService_1, notebookService_1, modeService_1, modelService_1, getIconClasses_1, quickInput_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ChangeCellLanguageAction = exports.InsertMarkdownCellAction = exports.InsertCodeCellAction = exports.changeCellToKind = exports.getActiveNotebookEditor = exports.CancelCellAction = exports.ExecuteCellAction = exports.NOTEBOOK_ACTIONS_CATEGORY = void 0;
    // Notebook Commands
    const EXECUTE_NOTEBOOK_COMMAND_ID = 'notebook.execute';
    const CANCEL_NOTEBOOK_COMMAND_ID = 'notebook.cancelExecution';
    const NOTEBOOK_FOCUS_TOP = 'notebook.focusTop';
    const NOTEBOOK_FOCUS_BOTTOM = 'notebook.focusBottom';
    const NOTEBOOK_REDO = 'notebook.redo';
    const NOTEBOOK_UNDO = 'notebook.undo';
    const NOTEBOOK_CURSOR_UP = 'notebook.cursorUp';
    const NOTEBOOK_CURSOR_DOWN = 'notebook.cursorDown';
    const CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID = 'notebook.clearAllCellsOutputs';
    // Cell Commands
    const INSERT_CODE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertCodeCellAbove';
    const INSERT_CODE_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertCodeCellBelow';
    const INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID = 'notebook.cell.insertMarkdownCellAbove';
    const INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID = 'notebook.cell.insertMarkdownCellBelow';
    const CHANGE_CELL_TO_CODE_COMMAND_ID = 'notebook.cell.changeToCode';
    const CHANGE_CELL_TO_MARKDOWN_COMMAND_ID = 'notebook.cell.changeToMarkdown';
    const EDIT_CELL_COMMAND_ID = 'notebook.cell.edit';
    const QUIT_EDIT_CELL_COMMAND_ID = 'notebook.cell.quitEdit';
    const SAVE_CELL_COMMAND_ID = 'notebook.cell.save';
    const DELETE_CELL_COMMAND_ID = 'notebook.cell.delete';
    const MOVE_CELL_UP_COMMAND_ID = 'notebook.cell.moveUp';
    const MOVE_CELL_DOWN_COMMAND_ID = 'notebook.cell.moveDown';
    const COPY_CELL_COMMAND_ID = 'notebook.cell.copy';
    const CUT_CELL_COMMAND_ID = 'notebook.cell.cut';
    const PASTE_CELL_COMMAND_ID = 'notebook.cell.paste';
    const PASTE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.pasteAbove';
    const COPY_CELL_UP_COMMAND_ID = 'notebook.cell.copyUp';
    const COPY_CELL_DOWN_COMMAND_ID = 'notebook.cell.copyDown';
    const EXECUTE_CELL_COMMAND_ID = 'notebook.cell.execute';
    const CANCEL_CELL_COMMAND_ID = 'notebook.cell.cancelExecution';
    const EXECUTE_CELL_SELECT_BELOW = 'notebook.cell.executeAndSelectBelow';
    const EXECUTE_CELL_INSERT_BELOW = 'notebook.cell.executeAndInsertBelow';
    const CLEAR_CELL_OUTPUTS_COMMAND_ID = 'notebook.cell.clearOutputs';
    const CHANGE_CELL_LANGUAGE = 'notebook.cell.changeLanguage';
    exports.NOTEBOOK_ACTIONS_CATEGORY = nls_1.localize('notebookActions.category', "Notebook");
    const EDITOR_WIDGET_ACTION_WEIGHT = 100 /* EditorContrib */; // smaller than Suggest Widget, etc
    var CellToolbarOrder;
    (function (CellToolbarOrder) {
        CellToolbarOrder[CellToolbarOrder["MoveCellUp"] = 0] = "MoveCellUp";
        CellToolbarOrder[CellToolbarOrder["MoveCellDown"] = 1] = "MoveCellDown";
        CellToolbarOrder[CellToolbarOrder["EditCell"] = 2] = "EditCell";
        CellToolbarOrder[CellToolbarOrder["SaveCell"] = 3] = "SaveCell";
        CellToolbarOrder[CellToolbarOrder["ClearCellOutput"] = 4] = "ClearCellOutput";
        CellToolbarOrder[CellToolbarOrder["InsertCell"] = 5] = "InsertCell";
        CellToolbarOrder[CellToolbarOrder["DeleteCell"] = 6] = "DeleteCell";
    })(CellToolbarOrder || (CellToolbarOrder = {}));
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: EXECUTE_CELL_COMMAND_ID,
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                title: nls_1.localize('notebookActions.execute', "Execute Cell"),
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 256 /* WinCtrl */ | 3 /* Enter */,
                    win: {
                        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 3 /* Enter */
                    },
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
                icon: { id: 'codicon/play' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return runCell(context);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CANCEL_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.cancel', "Stop Cell Execution"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                icon: { id: 'codicon/primitive-square' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return context.notebookEditor.cancelNotebookCellExecution(context.cell);
        }
    });
    let ExecuteCellAction = /** @class */ (() => {
        let ExecuteCellAction = class ExecuteCellAction extends actions_1.MenuItemAction {
            constructor(contextKeyService, commandService) {
                super({
                    id: EXECUTE_CELL_COMMAND_ID,
                    title: nls_1.localize('notebookActions.executeCell', "Execute Cell"),
                    icon: { id: 'codicon/play' }
                }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
            }
        };
        ExecuteCellAction = __decorate([
            __param(0, contextkey_1.IContextKeyService),
            __param(1, commands_1.ICommandService)
        ], ExecuteCellAction);
        return ExecuteCellAction;
    })();
    exports.ExecuteCellAction = ExecuteCellAction;
    let CancelCellAction = /** @class */ (() => {
        let CancelCellAction = class CancelCellAction extends actions_1.MenuItemAction {
            constructor(contextKeyService, commandService) {
                super({
                    id: CANCEL_CELL_COMMAND_ID,
                    title: nls_1.localize('notebookActions.CancelCell', "Cancel Execution"),
                    icon: { id: 'codicon/primitive-square' }
                }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
            }
        };
        CancelCellAction = __decorate([
            __param(0, contextkey_1.IContextKeyService),
            __param(1, commands_1.ICommandService)
        ], CancelCellAction);
        return CancelCellAction;
    })();
    exports.CancelCellAction = CancelCellAction;
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: EXECUTE_CELL_SELECT_BELOW,
                title: nls_1.localize('notebookActions.executeAndSelectBelow', "Execute Notebook Cell and Select Below"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 1024 /* Shift */ | 3 /* Enter */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                }
            });
        }
        async run(accessor) {
            var _a, _b;
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeCell = await runActiveCell(accessor);
            if (!activeCell) {
                return;
            }
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const idx = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            // Try to select below, fall back on inserting
            const nextCell = (_b = editor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
            if (nextCell) {
                editor.focusNotebookCell(nextCell, activeCell.editState === notebookBrowser_1.CellEditState.Editing);
            }
            else {
                const newCell = editor.insertNotebookCell(activeCell, notebookCommon_1.CellKind.Code, 'below');
                if (newCell) {
                    editor.focusNotebookCell(newCell, true);
                }
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: EXECUTE_CELL_INSERT_BELOW,
                title: nls_1.localize('notebookActions.executeAndInsertBelow', "Execute Notebook Cell and Insert Below"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    primary: 512 /* Alt */ | 3 /* Enter */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeCell = await runActiveCell(accessor);
            if (!activeCell) {
                return;
            }
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const newCell = editor.insertNotebookCell(activeCell, notebookCommon_1.CellKind.Code, 'below');
            if (newCell) {
                editor.focusNotebookCell(newCell, true);
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: EXECUTE_NOTEBOOK_COMMAND_ID,
                title: nls_1.localize('notebookActions.executeNotebook', "Execute Notebook"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            return editor.executeNotebook();
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CANCEL_NOTEBOOK_COMMAND_ID,
                title: nls_1.localize('notebookActions.cancelNotebook', "Cancel Notebook Execution"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            return editor.cancelNotebookExecution();
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: QUIT_EDIT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.quitEditing', "Quit Notebook Cell Editing"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkeys_1.InputFocusedContext),
                    primary: 9 /* Escape */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT - 5
                }
            });
        }
        async run(accessor) {
            let editorService = accessor.get(editorService_1.IEditorService);
            let editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            let activeCell = editor.getActiveCell();
            if (activeCell) {
                if (activeCell.cellKind === notebookCommon_1.CellKind.Markdown) {
                    activeCell.editState = notebookBrowser_1.CellEditState.Preview;
                }
                editor.focusNotebookCell(activeCell, false);
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: EXECUTE_NOTEBOOK_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.executeNotebook', "Execute Notebook (Run all cells)"),
            category: exports.NOTEBOOK_ACTIONS_CATEGORY,
            icon: { id: 'codicon/run-all' }
        },
        order: -1,
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK.toNegated(), notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: CANCEL_NOTEBOOK_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.cancelNotebook', "Stop Notebook Execution"),
            category: exports.NOTEBOOK_ACTIONS_CATEGORY,
            icon: { id: 'codicon/primitive-square' }
        },
        order: -1,
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_EDITOR_EXECUTING_NOTEBOOK)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
        command: {
            id: EXECUTE_CELL_COMMAND_ID,
            title: nls_1.localize('notebookActions.menu.execute', "Execute Notebook Cell"),
            category: exports.NOTEBOOK_ACTIONS_CATEGORY,
            icon: { id: 'codicon/run' }
        },
        order: 0,
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_CELL_RUNNABLE)
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CHANGE_CELL_TO_CODE_COMMAND_ID,
                title: nls_1.localize('notebookActions.changeCellToCode', "Change Cell to Code"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 55 /* KEY_Y */,
                    weight: 200 /* WorkbenchContrib */
                },
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor) {
            return changeActiveCellToKind(notebookCommon_1.CellKind.Code, accessor);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CHANGE_CELL_TO_MARKDOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.changeCellToMarkdown', "Change Cell to Markdown"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 43 /* KEY_M */,
                    weight: 200 /* WorkbenchContrib */
                },
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor, context) {
            return changeActiveCellToKind(notebookCommon_1.CellKind.Markdown, accessor);
        }
    });
    function getActiveNotebookEditor(editorService) {
        // TODO can `isNotebookEditor` be on INotebookEditor to avoid a circular dependency?
        const activeEditorPane = editorService.activeEditorPane;
        return (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor) ? activeEditorPane : undefined;
    }
    exports.getActiveNotebookEditor = getActiveNotebookEditor;
    async function runActiveCell(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = getActiveNotebookEditor(editorService);
        if (!editor) {
            return;
        }
        const activeCell = editor.getActiveCell();
        if (!activeCell) {
            return;
        }
        editor.executeNotebookCell(activeCell);
        return activeCell;
    }
    async function runCell(context) {
        if (context.cell.runState === notebookBrowser_1.CellRunState.Running) {
            return;
        }
        return context.notebookEditor.executeNotebookCell(context.cell);
    }
    async function changeActiveCellToKind(kind, accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = getActiveNotebookEditor(editorService);
        if (!editor) {
            return;
        }
        const activeCell = editor.getActiveCell();
        if (!activeCell) {
            return;
        }
        changeCellToKind(kind, { cell: activeCell, notebookEditor: editor });
    }
    async function changeCellToKind(kind, context, language) {
        var _a, _b;
        const { cell, notebookEditor } = context;
        if (cell.cellKind === kind) {
            return null;
        }
        const text = cell.getText();
        if (!notebookEditor.insertNotebookCell(cell, kind, 'below', text)) {
            return null;
        }
        const idx = (_a = notebookEditor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(cell);
        if (typeof idx !== 'number') {
            return null;
        }
        const newCell = (_b = notebookEditor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
        if (!newCell) {
            return null;
        }
        if (language) {
            newCell.model.language = language;
        }
        notebookEditor.focusNotebookCell(newCell, cell.editState === notebookBrowser_1.CellEditState.Editing);
        notebookEditor.deleteNotebookCell(cell);
        return newCell;
    }
    exports.changeCellToKind = changeCellToKind;
    function isCellActionContext(context) {
        return context && !!context.cell && !!context.notebookEditor;
    }
    function getActiveCellContext(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = getActiveNotebookEditor(editorService);
        if (!editor) {
            return;
        }
        const activeCell = editor.getActiveCell();
        if (!activeCell) {
            return;
        }
        return {
            cell: activeCell,
            notebookEditor: editor
        };
    }
    class InsertCellCommand extends actions_1.Action2 {
        constructor(desc, kind, direction) {
            super(desc);
            this.kind = kind;
            this.direction = direction;
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const newCell = context.notebookEditor.insertNotebookCell(context.cell, this.kind, this.direction, undefined, context.ui);
            if (newCell) {
                context.notebookEditor.focusNotebookCell(newCell, true);
            }
        }
    }
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertCodeCellAbove', "Insert Code Cell Above"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            }, notebookCommon_1.CellKind.Code, 'above');
        }
    });
    let InsertCodeCellAction = /** @class */ (() => {
        let InsertCodeCellAction = class InsertCodeCellAction extends actions_1.MenuItemAction {
            constructor(contextKeyService, commandService) {
                super({
                    id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                    title: nls_1.localize('notebookActions.insertCodeCellBelow', "Insert Code Cell Below")
                }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
            }
        };
        InsertCodeCellAction = __decorate([
            __param(0, contextkey_1.IContextKeyService),
            __param(1, commands_1.ICommandService)
        ], InsertCodeCellAction);
        return InsertCodeCellAction;
    })();
    exports.InsertCodeCellAction = InsertCodeCellAction;
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_CODE_CELL_BELOW_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertCodeCellBelow', "Insert Code Cell Below"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                icon: { id: 'codicon/add' },
                f1: true
            }, notebookCommon_1.CellKind.Code, 'below');
        }
    });
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertMarkdownCellAbove', "Insert Markdown Cell Above"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            }, notebookCommon_1.CellKind.Markdown, 'above');
        }
    });
    let InsertMarkdownCellAction = /** @class */ (() => {
        let InsertMarkdownCellAction = class InsertMarkdownCellAction extends actions_1.MenuItemAction {
            constructor(contextKeyService, commandService) {
                super({
                    id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                    title: nls_1.localize('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below")
                }, undefined, { shouldForwardArgs: true }, contextKeyService, commandService);
            }
        };
        InsertMarkdownCellAction = __decorate([
            __param(0, contextkey_1.IContextKeyService),
            __param(1, commands_1.ICommandService)
        ], InsertMarkdownCellAction);
        return InsertMarkdownCellAction;
    })();
    exports.InsertMarkdownCellAction = InsertMarkdownCellAction;
    actions_1.registerAction2(class extends InsertCellCommand {
        constructor() {
            super({
                id: INSERT_MARKDOWN_CELL_BELOW_COMMAND_ID,
                title: nls_1.localize('notebookActions.insertMarkdownCellBelow', "Insert Markdown Cell Below"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            }, notebookCommon_1.CellKind.Markdown, 'below');
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: EDIT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.editCell', "Edit Cell"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 3 /* Enter */,
                    weight: 200 /* WorkbenchContrib */
                },
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('markdown'), notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.toNegated(), notebookBrowser_1.NOTEBOOK_CELL_EDITABLE),
                    order: 2 /* EditCell */
                },
                icon: { id: 'codicon/pencil' }
            });
        }
        run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return context.notebookEditor.editNotebookCell(context.cell);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SAVE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.saveCell', "Save Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('markdown'), notebookBrowser_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE, notebookBrowser_1.NOTEBOOK_CELL_EDITABLE),
                    order: 3 /* SaveCell */
                },
                icon: { id: 'codicon/check' }
            });
        }
        run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return context.notebookEditor.saveNotebookCell(context.cell);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: DELETE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.deleteCell', "Delete Cell"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    order: 6 /* DeleteCell */,
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_EDITABLE
                },
                keybinding: {
                    primary: 20 /* Delete */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 1 /* Backspace */
                    },
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* WorkbenchContrib */
                },
                icon: { id: 'codicon/trash' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const index = context.notebookEditor.viewModel.getCellIndex(context.cell);
            const result = await context.notebookEditor.deleteNotebookCell(context.cell);
            if (result) {
                // deletion succeeds, move focus to the next cell
                const nextCellIdx = index < context.notebookEditor.viewModel.length ? index : context.notebookEditor.viewModel.length - 1;
                if (nextCellIdx >= 0) {
                    context.notebookEditor.focusNotebookCell(context.notebookEditor.viewModel.viewCells[nextCellIdx], false);
                }
                else {
                    // No cells left, insert a new empty one
                    const newCell = context.notebookEditor.insertNotebookCell(undefined, context.cell.cellKind);
                    if (newCell) {
                        context.notebookEditor.focusNotebookCell(newCell, true);
                    }
                }
            }
        }
    });
    async function moveCell(context, direction) {
        const result = direction === 'up' ?
            await context.notebookEditor.moveCellUp(context.cell) :
            await context.notebookEditor.moveCellDown(context.cell);
        if (result) {
            // move cell command only works when the cell container has focus
            context.notebookEditor.focusNotebookCell(context.cell, false);
        }
    }
    async function copyCell(context, direction) {
        const text = context.cell.getText();
        const newCellDirection = direction === 'up' ? 'above' : 'below';
        const newCell = context.notebookEditor.insertNotebookCell(context.cell, context.cell.cellKind, newCellDirection, text);
        if (newCell) {
            context.notebookEditor.focusNotebookCell(newCell, false);
        }
    }
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: MOVE_CELL_UP_COMMAND_ID,
                title: nls_1.localize('notebookActions.moveCellUp', "Move Cell Up"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                icon: { id: 'codicon/arrow-up' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return moveCell(context, 'up');
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: MOVE_CELL_DOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.moveCellDown', "Move Cell Down"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                icon: { id: 'codicon/arrow-down' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return moveCell(context, 'down');
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: COPY_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.copy', "Copy Cell"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            clipboardService.writeText(context.cell.getText());
            notebookService.setToCopy([context.cell.model]);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CUT_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.cut', "Cut Cell"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            clipboardService.writeText(context.cell.getText());
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            viewModel.deleteCell(viewModel.getCellIndex(context.cell), true);
            notebookService.setToCopy([context.cell.model]);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: PASTE_CELL_ABOVE_COMMAND_ID,
                title: nls_1.localize('notebookActions.pasteAbove', "Paste Cell Above"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 52 /* KEY_V */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy() || [];
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            const currCellIndex = viewModel.getCellIndex(context.cell);
            pasteCells.reverse().forEach(pasteCell => {
                viewModel.insertCell(currCellIndex, pasteCell, true);
                return;
            });
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: PASTE_CELL_COMMAND_ID,
                title: nls_1.localize('notebookActions.paste', "Paste Cell"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy() || [];
            const viewModel = context.notebookEditor.viewModel;
            if (!viewModel) {
                return;
            }
            const currCellIndex = viewModel.getCellIndex(context.cell);
            pasteCells.reverse().forEach(pasteCell => {
                viewModel.insertCell(currCellIndex + 1, pasteCell, true);
                return;
            });
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: COPY_CELL_UP_COMMAND_ID,
                title: nls_1.localize('notebookActions.copyCellUp', "Copy Cell Up"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return copyCell(context, 'up');
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: COPY_CELL_DOWN_COMMAND_ID,
                title: nls_1.localize('notebookActions.copyCellDown', "Copy Cell Down"),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            return copyCell(context, 'down');
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_DOWN,
                title: nls_1.localize('cursorMoveDown', 'Cursor Move Down'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('top'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')),
                    primary: 18 /* DownArrow */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                }
            });
        }
        async run(accessor, context) {
            var _a, _b;
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            const newCell = (_b = editor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx + 1];
            if (!newCell) {
                return;
            }
            editor.focusNotebookCell(newCell, true);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_CURSOR_UP,
                title: nls_1.localize('cursorMoveUp', 'Cursor Move Up'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.has(contextkeys_1.InputFocusedContextKey), editorContextKeys_1.EditorContextKeys.editorTextFocus, notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('bottom'), notebookCommon_1.NOTEBOOK_EDITOR_CURSOR_BOUNDARY.notEqualsTo('none')),
                    primary: 16 /* UpArrow */,
                    weight: EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async run(accessor, context) {
            var _a, _b;
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            const activeCell = context.cell;
            const idx = (_a = editor.viewModel) === null || _a === void 0 ? void 0 : _a.getCellIndex(activeCell);
            if (typeof idx !== 'number') {
                return;
            }
            if (idx < 1) {
                // we don't do loop
                return;
            }
            const newCell = (_b = editor.viewModel) === null || _b === void 0 ? void 0 : _b.viewCells[idx - 1];
            if (!newCell) {
                return;
            }
            editor.focusNotebookCell(newCell, true);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_UNDO,
                title: nls_1.localize('undo', 'Undo'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const viewModel = editor.viewModel;
            if (!viewModel) {
                return;
            }
            viewModel.undo();
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_REDO,
                title: nls_1.localize('redo', 'Redo'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */,
                    weight: 200 /* WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = getActiveNotebookEditor(editorService);
            if (!editor) {
                return;
            }
            const viewModel = editor.viewModel;
            if (!viewModel) {
                return;
            }
            viewModel.redo();
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_TOP,
                title: nls_1.localize('focusFirstCell', 'Focus First Cell'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 14 /* Home */,
                    mac: { primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */ },
                    weight: 200 /* WorkbenchContrib */
                },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            const firstCell = editor.viewModel.viewCells[0];
            editor.focusNotebookCell(firstCell, false);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: NOTEBOOK_FOCUS_BOTTOM,
                title: nls_1.localize('focusLastCell', 'Focus Last Cell'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* CtrlCmd */ | 13 /* End */,
                    mac: { primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */ },
                    weight: 200 /* WorkbenchContrib */
                },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            const firstCell = editor.viewModel.viewCells[editor.viewModel.length - 1];
            editor.focusNotebookCell(firstCell, false);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CLEAR_CELL_OUTPUTS_COMMAND_ID,
                title: nls_1.localize('clearActiveCellOutputs', 'Clear Active Cell Outputs'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_CELL_TYPE.isEqualTo('code'), notebookBrowser_1.NOTEBOOK_EDITOR_RUNNABLE),
                    order: 4 /* ClearCellOutput */
                },
                icon: { id: 'codicon/clear-all' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            editor.viewModel.notebookDocument.clearCellOutput(context.cell.handle);
        }
    });
    class ChangeCellLanguageAction extends actions_1.Action2 {
        constructor() {
            super({
                id: CHANGE_CELL_LANGUAGE,
                title: nls_1.localize('changeLanguage', 'Change Cell Language'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            this.showLanguagePicker(accessor, context);
        }
        async showLanguagePicker(accessor, context) {
            var _a, _b;
            const topItems = [];
            const mainItems = [];
            const modeService = accessor.get(modeService_1.IModeService);
            const modelService = accessor.get(modelService_1.IModelService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const providerLanguages = [...context.notebookEditor.viewModel.notebookDocument.languages, 'markdown'];
            providerLanguages.forEach(languageId => {
                let description;
                if (languageId === context.cell.language) {
                    description = nls_1.localize('languageDescription', "({0}) - Current Language", languageId);
                }
                else {
                    description = nls_1.localize('languageDescriptionConfigured', "({0})", languageId);
                }
                const languageName = modeService.getLanguageName(languageId);
                if (!languageName) {
                    // Notebook has unrecognized language
                    return;
                }
                const item = {
                    label: languageName,
                    iconClasses: getIconClasses_1.getIconClasses(modelService, modeService, this.getFakeResource(languageName, modeService)),
                    description,
                    languageId
                };
                if (languageId === 'markdown' || languageId === context.cell.language) {
                    topItems.push(item);
                }
                else {
                    mainItems.push(item);
                }
            });
            mainItems.sort((a, b) => {
                return a.description.localeCompare(b.description);
            });
            const picks = [
                ...topItems,
                { type: 'separator' },
                ...mainItems
            ];
            const selection = await quickInputService.pick(picks, { placeHolder: nls_1.localize('pickLanguageToConfigure', "Select Language Mode") });
            if (selection && selection.languageId) {
                if (selection.languageId === 'markdown' && ((_a = context.cell) === null || _a === void 0 ? void 0 : _a.language) !== 'markdown') {
                    const newCell = await changeCellToKind(notebookCommon_1.CellKind.Markdown, { cell: context.cell, notebookEditor: context.notebookEditor });
                    if (newCell) {
                        context.notebookEditor.focusNotebookCell(newCell, true);
                    }
                }
                else if (selection.languageId !== 'markdown' && ((_b = context.cell) === null || _b === void 0 ? void 0 : _b.language) === 'markdown') {
                    await changeCellToKind(notebookCommon_1.CellKind.Code, { cell: context.cell, notebookEditor: context.notebookEditor }, selection.languageId);
                }
                else {
                    context.notebookEditor.viewModel.notebookDocument.changeCellLanguage(context.cell.handle, selection.languageId);
                }
            }
        }
        /**
         * Copied from editorStatus.ts
         */
        getFakeResource(lang, modeService) {
            let fakeResource;
            const extensions = modeService.getExtensions(lang);
            if (extensions === null || extensions === void 0 ? void 0 : extensions.length) {
                fakeResource = uri_1.URI.file(extensions[0]);
            }
            else {
                const filenames = modeService.getFilenames(lang);
                if (filenames === null || filenames === void 0 ? void 0 : filenames.length) {
                    fakeResource = uri_1.URI.file(filenames[0]);
                }
            }
            return fakeResource;
        }
    }
    exports.ChangeCellLanguageAction = ChangeCellLanguageAction;
    actions_1.registerAction2(ChangeCellLanguageAction);
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: CLEAR_ALL_CELLS_OUTPUTS_COMMAND_ID,
                title: nls_1.localize('clearAllCellsOutputs', 'Clear All Cells Outputs'),
                category: exports.NOTEBOOK_ACTIONS_CATEGORY,
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    when: notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED,
                    group: 'navigation',
                    order: 0
                },
                icon: { id: 'codicon/clear-all' },
                f1: true
            });
        }
        async run(accessor, context) {
            if (!isCellActionContext(context)) {
                context = getActiveCellContext(accessor);
                if (!context) {
                    return;
                }
            }
            const editor = context.notebookEditor;
            if (!editor.viewModel || !editor.viewModel.length) {
                return;
            }
            editor.viewModel.notebookDocument.clearAllCellOutputs();
        }
    });
});
//# sourceMappingURL=coreActions.js.map