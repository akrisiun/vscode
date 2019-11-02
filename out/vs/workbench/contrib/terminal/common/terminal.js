/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TERMINAL_PANEL_ID = 'workbench.panel.terminal';
    /** A context key that is set when there is at least one opened integrated terminal. */
    exports.KEYBINDING_CONTEXT_TERMINAL_IS_OPEN = new contextkey_1.RawContextKey('terminalIsOpen', false);
    /** A context key that is set when the integrated terminal has focus. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FOCUS = new contextkey_1.RawContextKey('terminalFocus', false);
    /** A context key that is set when the integrated terminal does not have focus. */
    exports.KEYBINDING_CONTEXT_TERMINAL_NOT_FOCUSED = exports.KEYBINDING_CONTEXT_TERMINAL_FOCUS.toNegated();
    /** A context key that is set when the user is navigating the accessibility tree */
    exports.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS = new contextkey_1.RawContextKey('terminalA11yTreeFocus', false);
    /** A keybinding context key that is set when the integrated terminal has text selected. */
    exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED = new contextkey_1.RawContextKey('terminalTextSelected', false);
    /** A keybinding context key that is set when the integrated terminal does not have text selected. */
    exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_NOT_SELECTED = exports.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED.toNegated();
    /**  A context key that is set when the find widget in integrated terminal is visible. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('terminalFindWidgetVisible', false);
    /**  A context key that is set when the find widget in integrated terminal is not visible. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_NOT_VISIBLE = exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE.toNegated();
    /**  A context key that is set when the find widget find input in integrated terminal is focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED = new contextkey_1.RawContextKey('terminalFindWidgetInputFocused', false);
    /**  A context key that is set when the find widget in integrated terminal is focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('terminalFindWidgetFocused', false);
    /**  A context key that is set when the find widget find input in integrated terminal is not focused. */
    exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_NOT_FOCUSED = exports.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_INPUT_FOCUSED.toNegated();
    exports.IS_WORKSPACE_SHELL_ALLOWED_STORAGE_KEY = 'terminal.integrated.isWorkspaceShellAllowed';
    exports.NEVER_MEASURE_RENDER_TIME_STORAGE_KEY = 'terminal.integrated.neverMeasureRenderTime';
    // The creation of extension host terminals is delayed by this value (milliseconds). The purpose of
    // this delay is to allow the terminal instance to initialize correctly and have its ID set before
    // trying to create the corressponding object on the ext host.
    exports.EXT_HOST_CREATION_DELAY = 100;
    exports.ITerminalNativeService = instantiation_1.createDecorator('terminalNativeService');
    exports.TerminalCursorStyle = {
        BLOCK: 'block',
        LINE: 'line',
        UNDERLINE: 'underline'
    };
    exports.TERMINAL_CONFIG_SECTION = 'terminal.integrated';
    exports.TERMINAL_ACTION_CATEGORY = nls.localize('terminalCategory', "Terminal");
    exports.DEFAULT_LETTER_SPACING = 0;
    exports.MINIMUM_LETTER_SPACING = -5;
    exports.DEFAULT_LINE_HEIGHT = 1;
    exports.SHELL_PATH_INVALID_EXIT_CODE = -1;
    exports.SHELL_PATH_DIRECTORY_EXIT_CODE = -2;
    exports.SHELL_CWD_INVALID_EXIT_CODE = -3;
    exports.LEGACY_CONSOLE_MODE_EXIT_CODE = 3221225786; // microsoft/vscode#73790
    var ProcessState;
    (function (ProcessState) {
        // The process has not been initialized yet.
        ProcessState[ProcessState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
        // The process is currently launching, the process is marked as launching
        // for a short duration after being created and is helpful to indicate
        // whether the process died as a result of bad shell and args.
        ProcessState[ProcessState["LAUNCHING"] = 1] = "LAUNCHING";
        // The process is running normally.
        ProcessState[ProcessState["RUNNING"] = 2] = "RUNNING";
        // The process was killed during launch, likely as a result of bad shell and
        // args.
        ProcessState[ProcessState["KILLED_DURING_LAUNCH"] = 3] = "KILLED_DURING_LAUNCH";
        // The process was killed by the user (the event originated from VS Code).
        ProcessState[ProcessState["KILLED_BY_USER"] = 4] = "KILLED_BY_USER";
        // The process was killed by itself, for example the shell crashed or `exit`
        // was run.
        ProcessState[ProcessState["KILLED_BY_PROCESS"] = 5] = "KILLED_BY_PROCESS";
    })(ProcessState = exports.ProcessState || (exports.ProcessState = {}));
    var LinuxDistro;
    (function (LinuxDistro) {
        LinuxDistro[LinuxDistro["Fedora"] = 0] = "Fedora";
        LinuxDistro[LinuxDistro["Ubuntu"] = 1] = "Ubuntu";
        LinuxDistro[LinuxDistro["Unknown"] = 2] = "Unknown";
    })(LinuxDistro = exports.LinuxDistro || (exports.LinuxDistro = {}));
    var TitleEventSource;
    (function (TitleEventSource) {
        /** From the API or the rename command that overrides any other type */
        TitleEventSource[TitleEventSource["Api"] = 0] = "Api";
        /** From the process name property*/
        TitleEventSource[TitleEventSource["Process"] = 1] = "Process";
        /** From the VT sequence */
        TitleEventSource[TitleEventSource["Sequence"] = 2] = "Sequence";
    })(TitleEventSource = exports.TitleEventSource || (exports.TitleEventSource = {}));
    var TERMINAL_COMMAND_ID;
    (function (TERMINAL_COMMAND_ID) {
        TERMINAL_COMMAND_ID["FIND_NEXT"] = "workbench.action.terminal.findNext";
        TERMINAL_COMMAND_ID["FIND_PREVIOUS"] = "workbench.action.terminal.findPrevious";
        TERMINAL_COMMAND_ID["TOGGLE"] = "workbench.action.terminal.toggleTerminal";
        TERMINAL_COMMAND_ID["KILL"] = "workbench.action.terminal.kill";
        TERMINAL_COMMAND_ID["QUICK_KILL"] = "workbench.action.terminal.quickKill";
        TERMINAL_COMMAND_ID["COPY_SELECTION"] = "workbench.action.terminal.copySelection";
        TERMINAL_COMMAND_ID["SELECT_ALL"] = "workbench.action.terminal.selectAll";
        TERMINAL_COMMAND_ID["DELETE_WORD_LEFT"] = "workbench.action.terminal.deleteWordLeft";
        TERMINAL_COMMAND_ID["DELETE_WORD_RIGHT"] = "workbench.action.terminal.deleteWordRight";
        TERMINAL_COMMAND_ID["DELETE_TO_LINE_START"] = "workbench.action.terminal.deleteToLineStart";
        TERMINAL_COMMAND_ID["MOVE_TO_LINE_START"] = "workbench.action.terminal.moveToLineStart";
        TERMINAL_COMMAND_ID["MOVE_TO_LINE_END"] = "workbench.action.terminal.moveToLineEnd";
        TERMINAL_COMMAND_ID["NEW"] = "workbench.action.terminal.new";
        TERMINAL_COMMAND_ID["NEW_WITH_CWD"] = "workbench.action.terminal.newWithCwd";
        TERMINAL_COMMAND_ID["NEW_LOCAL"] = "workbench.action.terminal.newLocal";
        TERMINAL_COMMAND_ID["NEW_IN_ACTIVE_WORKSPACE"] = "workbench.action.terminal.newInActiveWorkspace";
        TERMINAL_COMMAND_ID["SPLIT"] = "workbench.action.terminal.split";
        TERMINAL_COMMAND_ID["SPLIT_IN_ACTIVE_WORKSPACE"] = "workbench.action.terminal.splitInActiveWorkspace";
        TERMINAL_COMMAND_ID["FOCUS_PREVIOUS_PANE"] = "workbench.action.terminal.focusPreviousPane";
        TERMINAL_COMMAND_ID["FOCUS_NEXT_PANE"] = "workbench.action.terminal.focusNextPane";
        TERMINAL_COMMAND_ID["RESIZE_PANE_LEFT"] = "workbench.action.terminal.resizePaneLeft";
        TERMINAL_COMMAND_ID["RESIZE_PANE_RIGHT"] = "workbench.action.terminal.resizePaneRight";
        TERMINAL_COMMAND_ID["RESIZE_PANE_UP"] = "workbench.action.terminal.resizePaneUp";
        TERMINAL_COMMAND_ID["RESIZE_PANE_DOWN"] = "workbench.action.terminal.resizePaneDown";
        TERMINAL_COMMAND_ID["FOCUS"] = "workbench.action.terminal.focus";
        TERMINAL_COMMAND_ID["FOCUS_NEXT"] = "workbench.action.terminal.focusNext";
        TERMINAL_COMMAND_ID["FOCUS_PREVIOUS"] = "workbench.action.terminal.focusPrevious";
        TERMINAL_COMMAND_ID["PASTE"] = "workbench.action.terminal.paste";
        TERMINAL_COMMAND_ID["SELECT_DEFAULT_SHELL"] = "workbench.action.terminal.selectDefaultShell";
        TERMINAL_COMMAND_ID["RUN_SELECTED_TEXT"] = "workbench.action.terminal.runSelectedText";
        TERMINAL_COMMAND_ID["RUN_ACTIVE_FILE"] = "workbench.action.terminal.runActiveFile";
        TERMINAL_COMMAND_ID["SWITCH_TERMINAL"] = "workbench.action.terminal.switchTerminal";
        TERMINAL_COMMAND_ID["SCROLL_DOWN_LINE"] = "workbench.action.terminal.scrollDown";
        TERMINAL_COMMAND_ID["SCROLL_DOWN_PAGE"] = "workbench.action.terminal.scrollDownPage";
        TERMINAL_COMMAND_ID["SCROLL_TO_BOTTOM"] = "workbench.action.terminal.scrollToBottom";
        TERMINAL_COMMAND_ID["SCROLL_UP_LINE"] = "workbench.action.terminal.scrollUp";
        TERMINAL_COMMAND_ID["SCROLL_UP_PAGE"] = "workbench.action.terminal.scrollUpPage";
        TERMINAL_COMMAND_ID["SCROLL_TO_TOP"] = "workbench.action.terminal.scrollToTop";
        TERMINAL_COMMAND_ID["CLEAR"] = "workbench.action.terminal.clear";
        TERMINAL_COMMAND_ID["CLEAR_SELECTION"] = "workbench.action.terminal.clearSelection";
        TERMINAL_COMMAND_ID["MANAGE_WORKSPACE_SHELL_PERMISSIONS"] = "workbench.action.terminal.manageWorkspaceShellPermissions";
        TERMINAL_COMMAND_ID["RENAME"] = "workbench.action.terminal.rename";
        TERMINAL_COMMAND_ID["FIND_WIDGET_FOCUS"] = "workbench.action.terminal.focusFindWidget";
        TERMINAL_COMMAND_ID["FIND_WIDGET_HIDE"] = "workbench.action.terminal.hideFindWidget";
        TERMINAL_COMMAND_ID["QUICK_OPEN_TERM"] = "workbench.action.quickOpenTerm";
        TERMINAL_COMMAND_ID["SCROLL_TO_PREVIOUS_COMMAND"] = "workbench.action.terminal.scrollToPreviousCommand";
        TERMINAL_COMMAND_ID["SCROLL_TO_NEXT_COMMAND"] = "workbench.action.terminal.scrollToNextCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_PREVIOUS_COMMAND"] = "workbench.action.terminal.selectToPreviousCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_NEXT_COMMAND"] = "workbench.action.terminal.selectToNextCommand";
        TERMINAL_COMMAND_ID["SELECT_TO_PREVIOUS_LINE"] = "workbench.action.terminal.selectToPreviousLine";
        TERMINAL_COMMAND_ID["SELECT_TO_NEXT_LINE"] = "workbench.action.terminal.selectToNextLine";
        TERMINAL_COMMAND_ID["TOGGLE_ESCAPE_SEQUENCE_LOGGING"] = "toggleEscapeSequenceLogging";
        TERMINAL_COMMAND_ID["SEND_SEQUENCE"] = "workbench.action.terminal.sendSequence";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_REGEX"] = "workbench.action.terminal.toggleFindRegex";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_WHOLE_WORD"] = "workbench.action.terminal.toggleFindWholeWord";
        TERMINAL_COMMAND_ID["TOGGLE_FIND_CASE_SENSITIVE"] = "workbench.action.terminal.toggleFindCaseSensitive";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_EXIT"] = "workbench.action.terminal.navigationModeExit";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_FOCUS_NEXT"] = "workbench.action.terminal.navigationModeFocusNext";
        TERMINAL_COMMAND_ID["NAVIGATION_MODE_FOCUS_PREVIOUS"] = "workbench.action.terminal.navigationModeFocusPrevious";
    })(TERMINAL_COMMAND_ID = exports.TERMINAL_COMMAND_ID || (exports.TERMINAL_COMMAND_ID = {}));
});
//# sourceMappingURL=terminal.js.map