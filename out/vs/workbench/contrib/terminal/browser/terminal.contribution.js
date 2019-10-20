/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/workbench/browser/actions", "vs/workbench/browser/panel", "vs/workbench/browser/parts/quickopen/quickopen", "vs/workbench/browser/quickopen", "vs/workbench/common/actions", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalPanel", "vs/workbench/contrib/terminal/browser/terminalQuickOpen", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/browser/terminalCommands", "vs/workbench/contrib/terminal/common/terminalMenu", "vs/platform/configuration/common/configurationRegistry", "vs/editor/common/config/editorOptions", "vs/workbench/contrib/terminal/browser/terminalInstance", "vs/workbench/contrib/terminal/browser/terminalService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/common/terminalShellConfig", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/terminal/browser/terminal", "vs/css!./media/scrollbar", "vs/css!./media/terminal", "vs/css!./media/widgets", "vs/css!./media/xterm"], function (require, exports, platform, nls, actions_1, commands_1, contextkey_1, platform_1, actions_2, panel, quickopen_1, quickopen_2, actions_3, terminalActions_1, terminalPanel_1, terminalQuickOpen_1, terminal_1, terminalColorRegistry_1, terminalCommands_1, terminalMenu_1, configurationRegistry_1, editorOptions_1, terminalInstance_1, terminalService_1, extensions_1, terminalShellConfig_1, accessibility_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(terminal_2.ITerminalService, terminalService_1.TerminalService, true);
    if (platform.isWeb) {
        terminalShellConfig_1.registerShellConfiguration();
    }
    const quickOpenRegistry = (platform_1.Registry.as(quickopen_2.Extensions.Quickopen));
    const inTerminalsPicker = 'inTerminalPicker';
    quickOpenRegistry.registerQuickOpenHandler(new quickopen_2.QuickOpenHandlerDescriptor(terminalQuickOpen_1.TerminalPickerHandler, terminalQuickOpen_1.TerminalPickerHandler.ID, terminalActions_1.TERMINAL_PICKER_PREFIX, inTerminalsPicker, nls.localize('quickOpen.terminal', "Show All Opened Terminals")));
    const quickOpenNavigateNextInTerminalPickerId = 'workbench.action.quickOpenNavigateNextInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickOpenNavigateNextInTerminalPickerId, handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigateNextInTerminalPickerId, true) });
    const quickOpenNavigatePreviousInTerminalPickerId = 'workbench.action.quickOpenNavigatePreviousInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickOpenNavigatePreviousInTerminalPickerId, handler: quickopen_1.getQuickNavigateHandler(quickOpenNavigatePreviousInTerminalPickerId, false) });
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'terminal',
        order: 100,
        title: nls.localize('terminalIntegratedConfigurationTitle', "Integrated Terminal"),
        type: 'object',
        properties: {
            'terminal.integrated.automationShell.linux': {
                markdownDescription: nls.localize('terminal.integrated.automationShell.linux', "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.linux`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.automationShell.osx': {
                markdownDescription: nls.localize('terminal.integrated.automationShell.osx', "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.osx`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.automationShell.windows': {
                markdownDescription: nls.localize('terminal.integrated.automationShell.windows', "A path that when set will override {0} and ignore {1} values for automation-related terminal usage like tasks and debug.", '`terminal.integrated.shell.windows`', '`shellArgs`'),
                type: ['string', 'null'],
                default: null
            },
            'terminal.integrated.shellArgs.linux': {
                markdownDescription: nls.localize('terminal.integrated.shellArgs.linux', "The command line arguments to use when on the Linux terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            'terminal.integrated.shellArgs.osx': {
                markdownDescription: nls.localize('terminal.integrated.shellArgs.osx', "The command line arguments to use when on the macOS terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                type: 'array',
                items: {
                    type: 'string'
                },
                // Unlike on Linux, ~/.profile is not sourced when logging into a macOS session. This
                // is the reason terminals on macOS typically run login shells by default which set up
                // the environment. See http://unix.stackexchange.com/a/119675/115410
                default: ['-l']
            },
            'terminal.integrated.shellArgs.windows': {
                markdownDescription: nls.localize('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration)."),
                'anyOf': [
                    {
                        type: 'array',
                        items: {
                            type: 'string',
                            markdownDescription: nls.localize('terminal.integrated.shellArgs.windows', "The command line arguments to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).")
                        },
                    },
                    {
                        type: 'string',
                        markdownDescription: nls.localize('terminal.integrated.shellArgs.windows.string', "The command line arguments in [command-line format](https://msdn.microsoft.com/en-au/08dfcab2-eb6e-49a4-80eb-87d4076c98c6) to use when on the Windows terminal. [Read more about configuring the shell](https://code.visualstudio.com/docs/editor/integrated-terminal#_configuration).")
                    }
                ],
                default: []
            },
            'terminal.integrated.macOptionIsMeta': {
                description: nls.localize('terminal.integrated.macOptionIsMeta', "Controls whether to treat the option key as the meta key in the terminal on macOS."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.macOptionClickForcesSelection': {
                description: nls.localize('terminal.integrated.macOptionClickForcesSelection', "Controls whether to force selection when using Option+click on macOS. This will force a regular (line) selection and disallow the use of column selection mode. This enables copying and pasting using the regular terminal selection, for example, when mouse mode is enabled in tmux."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.copyOnSelection': {
                description: nls.localize('terminal.integrated.copyOnSelection', "Controls whether text selected in the terminal will be copied to the clipboard."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.drawBoldTextInBrightColors': {
                description: nls.localize('terminal.integrated.drawBoldTextInBrightColors', "Controls whether bold text in the terminal will always use the \"bright\" ANSI color variant."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.fontFamily': {
                markdownDescription: nls.localize('terminal.integrated.fontFamily', "Controls the font family of the terminal, this defaults to `#editor.fontFamily#`'s value."),
                type: 'string'
            },
            // TODO: Support font ligatures
            // 'terminal.integrated.fontLigatures': {
            // 	'description': nls.localize('terminal.integrated.fontLigatures', "Controls whether font ligatures are enabled in the terminal."),
            // 	'type': 'boolean',
            // 	'default': false
            // },
            'terminal.integrated.fontSize': {
                description: nls.localize('terminal.integrated.fontSize', "Controls the font size in pixels of the terminal."),
                type: 'number',
                default: editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize
            },
            'terminal.integrated.letterSpacing': {
                description: nls.localize('terminal.integrated.letterSpacing', "Controls the letter spacing of the terminal, this is an integer value which represents the amount of additional pixels to add between characters."),
                type: 'number',
                default: terminal_1.DEFAULT_LETTER_SPACING
            },
            'terminal.integrated.lineHeight': {
                description: nls.localize('terminal.integrated.lineHeight', "Controls the line height of the terminal, this number is multiplied by the terminal font size to get the actual line-height in pixels."),
                type: 'number',
                default: terminal_1.DEFAULT_LINE_HEIGHT
            },
            'terminal.integrated.fontWeight': {
                type: 'string',
                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                description: nls.localize('terminal.integrated.fontWeight', "The font weight to use within the terminal for non-bold text."),
                default: 'normal'
            },
            'terminal.integrated.fontWeightBold': {
                type: 'string',
                enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
                description: nls.localize('terminal.integrated.fontWeightBold', "The font weight to use within the terminal for bold text."),
                default: 'bold'
            },
            'terminal.integrated.cursorBlinking': {
                description: nls.localize('terminal.integrated.cursorBlinking', "Controls whether the terminal cursor blinks."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.cursorStyle': {
                description: nls.localize('terminal.integrated.cursorStyle', "Controls the style of terminal cursor."),
                enum: [terminal_1.TerminalCursorStyle.BLOCK, terminal_1.TerminalCursorStyle.LINE, terminal_1.TerminalCursorStyle.UNDERLINE],
                default: terminal_1.TerminalCursorStyle.BLOCK
            },
            'terminal.integrated.scrollback': {
                description: nls.localize('terminal.integrated.scrollback', "Controls the maximum amount of lines the terminal keeps in its buffer."),
                type: 'number',
                default: 1000
            },
            'terminal.integrated.detectLocale': {
                markdownDescription: nls.localize('terminal.integrated.detectLocale', "Controls whether to detect and set the `$LANG` environment variable to a UTF-8 compliant option since VS Code's terminal only supports UTF-8 encoded data coming from the shell."),
                type: 'string',
                enum: ['auto', 'off', 'on'],
                enumDescriptions: [
                    nls.localize('terminal.integrated.detectLocale.auto', "Set the `$LANG` environment variable if the existing variable does not exist or it does not end in `'.UTF-8'`."),
                    nls.localize('terminal.integrated.detectLocale.off', "Do not set the `$LANG` environment variable."),
                    nls.localize('terminal.integrated.detectLocale.on', "Always set the `$LANG` environment variable.")
                ],
                default: 'auto'
            },
            'terminal.integrated.rendererType': {
                type: 'string',
                enum: ['auto', 'canvas', 'dom'],
                enumDescriptions: [
                    nls.localize('terminal.integrated.rendererType.auto', "Let VS Code guess which renderer to use."),
                    nls.localize('terminal.integrated.rendererType.canvas', "Use the standard GPU/canvas-based renderer"),
                    nls.localize('terminal.integrated.rendererType.dom', "Use the fallback DOM-based renderer.")
                ],
                default: 'auto',
                description: nls.localize('terminal.integrated.rendererType', "Controls how the terminal is rendered.")
            },
            'terminal.integrated.rightClickBehavior': {
                type: 'string',
                enum: ['default', 'copyPaste', 'selectWord'],
                enumDescriptions: [
                    nls.localize('terminal.integrated.rightClickBehavior.default', "Show the context menu."),
                    nls.localize('terminal.integrated.rightClickBehavior.copyPaste', "Copy when there is a selection, otherwise paste."),
                    nls.localize('terminal.integrated.rightClickBehavior.selectWord', "Select the word under the cursor and show the context menu.")
                ],
                default: platform.isMacintosh ? 'selectWord' : platform.isWindows ? 'copyPaste' : 'default',
                description: nls.localize('terminal.integrated.rightClickBehavior', "Controls how terminal reacts to right click.")
            },
            'terminal.integrated.cwd': {
                description: nls.localize('terminal.integrated.cwd', "An explicit start path where the terminal will be launched, this is used as the current working directory (cwd) for the shell process. This may be particularly useful in workspace settings if the root directory is not a convenient cwd."),
                type: 'string',
                default: undefined
            },
            'terminal.integrated.confirmOnExit': {
                description: nls.localize('terminal.integrated.confirmOnExit', "Controls whether to confirm on exit if there are active terminal sessions."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.enableBell': {
                description: nls.localize('terminal.integrated.enableBell', "Controls whether the terminal bell is enabled."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.commandsToSkipShell': {
                description: nls.localize('terminal.integrated.commandsToSkipShell', "A set of command IDs whose keybindings will not be sent to the shell and instead always be handled by Code. This allows the use of keybindings that would normally be consumed by the shell to act the same as when the terminal is not focused, for example ctrl+p to launch Quick Open.\nDefault Skipped Commands:\n\n{0}", terminalInstance_1.DEFAULT_COMMANDS_TO_SKIP_SHELL.sort().map(command => `- ${command}`).join('\n')),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            'terminal.integrated.allowChords': {
                markdownDescription: nls.localize('terminal.integrated.allowChords', "Whether or not to allow chord keybindings in the terminal. Note that when this is true and the keystroke results in a chord it will bypass `terminal.integrated.commandsToSkipShell`, setting this to false is particularly useful when you want ctrl+k to go to your shell (not VS Code)."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.inheritEnv': {
                markdownDescription: nls.localize('terminal.integrated.inheritEnv', "Whether new shells should inherit their environment from VS Code. This is not supported on Windows."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.env.osx': {
                markdownDescription: nls.localize('terminal.integrated.env.osx', "Object with environment variables that will be added to the VS Code process to be used by the terminal on macOS. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.env.linux': {
                markdownDescription: nls.localize('terminal.integrated.env.linux', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Linux. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.env.windows': {
                markdownDescription: nls.localize('terminal.integrated.env.windows', "Object with environment variables that will be added to the VS Code process to be used by the terminal on Windows. Set to `null` to delete the environment variable."),
                type: 'object',
                additionalProperties: {
                    type: ['string', 'null']
                },
                default: {}
            },
            'terminal.integrated.showExitAlert': {
                description: nls.localize('terminal.integrated.showExitAlert', "Controls whether to show the alert \"The terminal process terminated with exit code\" when exit code is non-zero."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.splitCwd': {
                description: nls.localize('terminal.integrated.splitCwd', "Controls the working directory a split terminal starts with."),
                type: 'string',
                enum: ['workspaceRoot', 'initial', 'inherited'],
                enumDescriptions: [
                    nls.localize('terminal.integrated.splitCwd.workspaceRoot', "A new split terminal will use the workspace root as the working directory. In a multi-root workspace a choice for which root folder to use is offered."),
                    nls.localize('terminal.integrated.splitCwd.initial', "A new split terminal will use the working directory that the parent terminal started with."),
                    nls.localize('terminal.integrated.splitCwd.inherited', "On macOS and Linux, a new split terminal will use the working directory of the parent terminal. On Windows, this behaves the same as initial."),
                ],
                default: 'inherited'
            },
            'terminal.integrated.windowsEnableConpty': {
                description: nls.localize('terminal.integrated.windowsEnableConpty', "Whether to use ConPTY for Windows terminal process communication (requires Windows 10 build number 18309+). Winpty will be used if this is false."),
                type: 'boolean',
                default: true
            },
            'terminal.integrated.experimentalRefreshOnResume': {
                description: nls.localize('terminal.integrated.experimentalRefreshOnResume', "An experimental setting that will refresh the terminal renderer when the system is resumed."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.experimentalUseTitleEvent': {
                description: nls.localize('terminal.integrated.experimentalUseTitleEvent', "An experimental setting that will use the terminal title event for the dropdown title. This setting will only apply to new terminals."),
                type: 'boolean',
                default: false
            },
            'terminal.integrated.enableFileLinks': {
                description: nls.localize('terminal.integrated.enableFileLinks', "Whether to enable file links in the terminal. Links can be slow when working on a network drive in particular because each file link is verified against the file system."),
                type: 'boolean',
                default: true
            }
        }
    });
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.QuickOpenTermAction, terminalActions_1.QuickOpenTermAction.ID, terminalActions_1.QuickOpenTermAction.LABEL), 'Terminal: Switch Active Terminal', nls.localize('terminal', "Terminal"));
    const actionBarRegistry = platform_1.Registry.as(actions_2.Extensions.Actionbar);
    actionBarRegistry.registerActionBarContributor(actions_2.Scope.VIEWER, terminalActions_1.QuickOpenActionTermContributor);
    platform_1.Registry.as(panel.Extensions.Panels).registerPanel(new panel.PanelDescriptor(terminalPanel_1.TerminalPanel, terminal_1.TERMINAL_PANEL_ID, nls.localize('terminal', "Terminal"), 'terminal', 40, "workbench.action.terminal.toggleTerminal" /* TOGGLE */));
    platform_1.Registry.as(panel.Extensions.Panels).setDefaultPanelId(terminal_1.TERMINAL_PANEL_ID);
    // On mac cmd+` is reserved to cycle between windows, that's why the keybindings use WinCtrl
    const category = terminal_1.TERMINAL_ACTION_CATEGORY;
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.KillTerminalAction, terminalActions_1.KillTerminalAction.ID, terminalActions_1.KillTerminalAction.LABEL), 'Terminal: Kill the Active Terminal Instance', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.CopyTerminalSelectionAction, terminalActions_1.CopyTerminalSelectionAction.ID, terminalActions_1.CopyTerminalSelectionAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 33 /* KEY_C */ }
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS)), 'Terminal: Copy Selection', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.CreateNewTerminalAction, terminalActions_1.CreateNewTerminalAction.ID, terminalActions_1.CreateNewTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 86 /* US_BACKTICK */,
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 86 /* US_BACKTICK */ }
    }), 'Terminal: Create New Integrated Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ClearSelectionTerminalAction, terminalActions_1.ClearSelectionTerminalAction.ID, terminalActions_1.ClearSelectionTerminalAction.LABEL, {
        primary: 9 /* Escape */,
        linux: { primary: 9 /* Escape */ }
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_TEXT_SELECTED, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_NOT_VISIBLE)), 'Terminal: Clear Selection', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.CreateNewInActiveWorkspaceTerminalAction, terminalActions_1.CreateNewInActiveWorkspaceTerminalAction.ID, terminalActions_1.CreateNewInActiveWorkspaceTerminalAction.LABEL), 'Terminal: Create New Integrated Terminal (In Active Workspace)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusActiveTerminalAction, terminalActions_1.FocusActiveTerminalAction.ID, terminalActions_1.FocusActiveTerminalAction.LABEL), 'Terminal: Focus Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusNextTerminalAction, terminalActions_1.FocusNextTerminalAction.ID, terminalActions_1.FocusNextTerminalAction.LABEL), 'Terminal: Focus Next Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusPreviousTerminalAction, terminalActions_1.FocusPreviousTerminalAction.ID, terminalActions_1.FocusPreviousTerminalAction.LABEL), 'Terminal: Focus Previous Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.TerminalPasteAction, terminalActions_1.TerminalPasteAction.ID, terminalActions_1.TerminalPasteAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 52 /* KEY_V */ },
        // Don't apply to Mac since cmd+v works
        mac: { primary: 0 }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Paste into Active Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectAllTerminalAction, terminalActions_1.SelectAllTerminalAction.ID, terminalActions_1.SelectAllTerminalAction.LABEL, {
        // Don't use ctrl+a by default as that would override the common go to start
        // of prompt shell binding
        primary: 0,
        // Technically this doesn't need to be here as it will fall back to this
        // behavior anyway when handed to xterm.js, having this handled by VS Code
        // makes it easier for users to see how it works though.
        mac: { primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Select All', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.RunSelectedTextInTerminalAction, terminalActions_1.RunSelectedTextInTerminalAction.ID, terminalActions_1.RunSelectedTextInTerminalAction.LABEL), 'Terminal: Run Selected Text In Active Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.RunActiveFileInTerminalAction, terminalActions_1.RunActiveFileInTerminalAction.ID, terminalActions_1.RunActiveFileInTerminalAction.LABEL), 'Terminal: Run Active File In Active Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleTerminalAction, terminalActions_1.ToggleTerminalAction.ID, terminalActions_1.ToggleTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 86 /* US_BACKTICK */,
        mac: { primary: 256 /* WinCtrl */ | 86 /* US_BACKTICK */ }
    }), 'View: Toggle Integrated Terminal', nls.localize('viewCategory', "View"));
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollDownTerminalAction, terminalActions_1.ScrollDownTerminalAction.ID, terminalActions_1.ScrollDownTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 12 /* PageDown */,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 18 /* DownArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll Down (Line)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollDownPageTerminalAction, terminalActions_1.ScrollDownPageTerminalAction.ID, terminalActions_1.ScrollDownPageTerminalAction.LABEL, {
        primary: 1024 /* Shift */ | 12 /* PageDown */,
        mac: { primary: 12 /* PageDown */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll Down (Page)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollToBottomTerminalAction, terminalActions_1.ScrollToBottomTerminalAction.ID, terminalActions_1.ScrollToBottomTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 13 /* End */,
        linux: { primary: 1024 /* Shift */ | 13 /* End */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll to Bottom', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollUpTerminalAction, terminalActions_1.ScrollUpTerminalAction.ID, terminalActions_1.ScrollUpTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 11 /* PageUp */,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 16 /* UpArrow */ },
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll Up (Line)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollUpPageTerminalAction, terminalActions_1.ScrollUpPageTerminalAction.ID, terminalActions_1.ScrollUpPageTerminalAction.LABEL, {
        primary: 1024 /* Shift */ | 11 /* PageUp */,
        mac: { primary: 11 /* PageUp */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll Up (Page)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollToTopTerminalAction, terminalActions_1.ScrollToTopTerminalAction.ID, terminalActions_1.ScrollToTopTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 14 /* Home */,
        linux: { primary: 1024 /* Shift */ | 14 /* Home */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Scroll to Top', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ClearTerminalAction, terminalActions_1.ClearTerminalAction.ID, terminalActions_1.ClearTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 41 /* KEY_K */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, 200 /* WorkbenchContrib */ + 1), 'Terminal: Clear', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectDefaultShellWindowsTerminalAction, terminalActions_1.SelectDefaultShellWindowsTerminalAction.ID, terminalActions_1.SelectDefaultShellWindowsTerminalAction.LABEL), 'Terminal: Select Default Shell', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ManageWorkspaceShellPermissionsTerminalCommand, terminalActions_1.ManageWorkspaceShellPermissionsTerminalCommand.ID, terminalActions_1.ManageWorkspaceShellPermissionsTerminalCommand.LABEL), 'Terminal: Manage Workspace Shell Permissions', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.RenameTerminalAction, terminalActions_1.RenameTerminalAction.ID, terminalActions_1.RenameTerminalAction.LABEL), 'Terminal: Rename', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusTerminalFindWidgetAction, terminalActions_1.FocusTerminalFindWidgetAction.ID, terminalActions_1.FocusTerminalFindWidgetAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Focus Find Widget', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusTerminalFindWidgetAction, terminalActions_1.FocusTerminalFindWidgetAction.ID, terminalActions_1.FocusTerminalFindWidgetAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Focus Find Widget', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.HideTerminalFindWidgetAction, terminalActions_1.HideTerminalFindWidgetAction.ID, terminalActions_1.HideTerminalFindWidgetAction.LABEL, {
        primary: 9 /* Escape */,
        secondary: [1024 /* Shift */ | 9 /* Escape */]
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_VISIBLE)), 'Terminal: Hide Find Widget', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.DeleteWordLeftTerminalAction, terminalActions_1.DeleteWordLeftTerminalAction.ID, terminalActions_1.DeleteWordLeftTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 1 /* Backspace */,
        mac: { primary: 512 /* Alt */ | 1 /* Backspace */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Delete Word Left', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.DeleteWordRightTerminalAction, terminalActions_1.DeleteWordRightTerminalAction.ID, terminalActions_1.DeleteWordRightTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 20 /* Delete */,
        mac: { primary: 512 /* Alt */ | 20 /* Delete */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Delete Word Right', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.DeleteToLineStartTerminalAction, terminalActions_1.DeleteToLineStartTerminalAction.ID, terminalActions_1.DeleteToLineStartTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 1 /* Backspace */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Delete To Line Start', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.MoveToLineStartTerminalAction, terminalActions_1.MoveToLineStartTerminalAction.ID, terminalActions_1.MoveToLineStartTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 15 /* LeftArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Move To Line Start', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.MoveToLineEndTerminalAction, terminalActions_1.MoveToLineEndTerminalAction.ID, terminalActions_1.MoveToLineEndTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 17 /* RightArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Move To Line End', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SplitTerminalAction, terminalActions_1.SplitTerminalAction.ID, terminalActions_1.SplitTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 26 /* KEY_5 */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 88 /* US_BACKSLASH */,
            secondary: [256 /* WinCtrl */ | 1024 /* Shift */ | 26 /* KEY_5 */]
        }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Split Terminal', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SplitInActiveWorkspaceTerminalAction, terminalActions_1.SplitInActiveWorkspaceTerminalAction.ID, terminalActions_1.SplitInActiveWorkspaceTerminalAction.LABEL), 'Terminal: Split Terminal (In Active Workspace)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusPreviousPaneTerminalAction, terminalActions_1.FocusPreviousPaneTerminalAction.ID, terminalActions_1.FocusPreviousPaneTerminalAction.LABEL, {
        primary: 512 /* Alt */ | 15 /* LeftArrow */,
        secondary: [512 /* Alt */ | 16 /* UpArrow */],
        mac: {
            primary: 512 /* Alt */ | 2048 /* CtrlCmd */ | 15 /* LeftArrow */,
            secondary: [512 /* Alt */ | 2048 /* CtrlCmd */ | 16 /* UpArrow */]
        }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Focus Previous Pane', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FocusNextPaneTerminalAction, terminalActions_1.FocusNextPaneTerminalAction.ID, terminalActions_1.FocusNextPaneTerminalAction.LABEL, {
        primary: 512 /* Alt */ | 17 /* RightArrow */,
        secondary: [512 /* Alt */ | 18 /* DownArrow */],
        mac: {
            primary: 512 /* Alt */ | 2048 /* CtrlCmd */ | 17 /* RightArrow */,
            secondary: [512 /* Alt */ | 2048 /* CtrlCmd */ | 18 /* DownArrow */]
        }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Focus Next Pane', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ResizePaneLeftTerminalAction, terminalActions_1.ResizePaneLeftTerminalAction.ID, terminalActions_1.ResizePaneLeftTerminalAction.LABEL, {
        primary: 0,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 15 /* LeftArrow */ },
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 15 /* LeftArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Resize Pane Left', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ResizePaneRightTerminalAction, terminalActions_1.ResizePaneRightTerminalAction.ID, terminalActions_1.ResizePaneRightTerminalAction.LABEL, {
        primary: 0,
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 17 /* RightArrow */ },
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 17 /* RightArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Resize Pane Right', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ResizePaneUpTerminalAction, terminalActions_1.ResizePaneUpTerminalAction.ID, terminalActions_1.ResizePaneUpTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 16 /* UpArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Resize Pane Up', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ResizePaneDownTerminalAction, terminalActions_1.ResizePaneDownTerminalAction.ID, terminalActions_1.ResizePaneDownTerminalAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 256 /* WinCtrl */ | 18 /* DownArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Resize Pane Down', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollToPreviousCommandAction, terminalActions_1.ScrollToPreviousCommandAction.ID, terminalActions_1.ScrollToPreviousCommandAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */ }
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate())), 'Terminal: Scroll To Previous Command', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ScrollToNextCommandAction, terminalActions_1.ScrollToNextCommandAction.ID, terminalActions_1.ScrollToNextCommandAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */ }
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate())), 'Terminal: Scroll To Next Command', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectToPreviousCommandAction, terminalActions_1.SelectToPreviousCommandAction.ID, terminalActions_1.SelectToPreviousCommandAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 16 /* UpArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Select To Previous Command', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectToNextCommandAction, terminalActions_1.SelectToNextCommandAction.ID, terminalActions_1.SelectToNextCommandAction.LABEL, {
        primary: 0,
        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 18 /* DownArrow */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Select To Next Command', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.NavigationModeExitTerminalAction, terminalActions_1.NavigationModeExitTerminalAction.ID, terminalActions_1.NavigationModeExitTerminalAction.LABEL, {
        primary: 9 /* Escape */
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)), 'Terminal: Exit Navigation Mode', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.NavigationModeFocusPreviousTerminalAction, terminalActions_1.NavigationModeFocusPreviousTerminalAction.ID, terminalActions_1.NavigationModeFocusPreviousTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)), 'Terminal: Focus Previous Line (Navigation Mode)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.NavigationModeFocusPreviousTerminalAction, terminalActions_1.NavigationModeFocusPreviousTerminalAction.ID, terminalActions_1.NavigationModeFocusPreviousTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)), 'Terminal: Focus Previous Line (Navigation Mode)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.NavigationModeFocusNextTerminalAction, terminalActions_1.NavigationModeFocusNextTerminalAction.ID, terminalActions_1.NavigationModeFocusNextTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)), 'Terminal: Focus Next Line (Navigation Mode)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.NavigationModeFocusNextTerminalAction, terminalActions_1.NavigationModeFocusNextTerminalAction.ID, terminalActions_1.NavigationModeFocusNextTerminalAction.LABEL, {
        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */
    }, contextkey_1.ContextKeyExpr.and(terminal_1.KEYBINDING_CONTEXT_TERMINAL_A11Y_TREE_FOCUS, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)), 'Terminal: Focus Next Line (Navigation Mode)', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectToPreviousLineAction, terminalActions_1.SelectToPreviousLineAction.ID, terminalActions_1.SelectToPreviousLineAction.LABEL), 'Terminal: Select To Previous Line', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.SelectToNextLineAction, terminalActions_1.SelectToNextLineAction.ID, terminalActions_1.SelectToNextLineAction.LABEL), 'Terminal: Select To Next Line', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleEscapeSequenceLoggingAction, terminalActions_1.ToggleEscapeSequenceLoggingAction.ID, terminalActions_1.ToggleEscapeSequenceLoggingAction.LABEL), 'Terminal: Toggle Escape Sequence Logging', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleRegexCommand, terminalActions_1.ToggleRegexCommand.ID, terminalActions_1.ToggleRegexCommand.LABEL, {
        primary: 512 /* Alt */ | 48 /* KEY_R */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 48 /* KEY_R */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Toggle find using regex');
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleRegexCommand, terminalActions_1.ToggleRegexCommand.ID_TERMINAL_FOCUS, terminalActions_1.ToggleRegexCommand.LABEL, {
        primary: 512 /* Alt */ | 48 /* KEY_R */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 48 /* KEY_R */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Toggle find using regex', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleWholeWordCommand, terminalActions_1.ToggleWholeWordCommand.ID, terminalActions_1.ToggleWholeWordCommand.LABEL, {
        primary: 512 /* Alt */ | 53 /* KEY_W */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 53 /* KEY_W */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Toggle find using whole word');
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleWholeWordCommand, terminalActions_1.ToggleWholeWordCommand.ID_TERMINAL_FOCUS, terminalActions_1.ToggleWholeWordCommand.LABEL, {
        primary: 512 /* Alt */ | 53 /* KEY_W */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 53 /* KEY_W */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Toggle find using whole word', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleCaseSensitiveCommand, terminalActions_1.ToggleCaseSensitiveCommand.ID, terminalActions_1.ToggleCaseSensitiveCommand.LABEL, {
        primary: 512 /* Alt */ | 33 /* KEY_C */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Toggle find using case sensitive');
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.ToggleCaseSensitiveCommand, terminalActions_1.ToggleCaseSensitiveCommand.ID_TERMINAL_FOCUS, terminalActions_1.ToggleCaseSensitiveCommand.LABEL, {
        primary: 512 /* Alt */ | 33 /* KEY_C */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */ }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Toggle find using case sensitive', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FindNext, terminalActions_1.FindNext.ID_TERMINAL_FOCUS, terminalActions_1.FindNext.LABEL, {
        primary: 61 /* F3 */,
        mac: { primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */, secondary: [61 /* F3 */] }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Find next', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FindNext, terminalActions_1.FindNext.ID, terminalActions_1.FindNext.LABEL, {
        primary: 61 /* F3 */,
        secondary: [1024 /* Shift */ | 3 /* Enter */],
        mac: { primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */, secondary: [61 /* F3 */, 1024 /* Shift */ | 3 /* Enter */] }
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Find next');
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FindPrevious, terminalActions_1.FindPrevious.ID_TERMINAL_FOCUS, terminalActions_1.FindPrevious.LABEL, {
        primary: 1024 /* Shift */ | 61 /* F3 */,
        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */, secondary: [1024 /* Shift */ | 61 /* F3 */] },
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FOCUS), 'Terminal: Find previous', category);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(terminalActions_1.FindPrevious, terminalActions_1.FindPrevious.ID, terminalActions_1.FindPrevious.LABEL, {
        primary: 1024 /* Shift */ | 61 /* F3 */,
        secondary: [3 /* Enter */],
        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */, secondary: [1024 /* Shift */ | 61 /* F3 */, 3 /* Enter */] },
    }, terminal_1.KEYBINDING_CONTEXT_TERMINAL_FIND_WIDGET_FOCUSED), 'Terminal: Find previous');
    (new terminalActions_1.SendSequenceTerminalCommand({
        id: terminalActions_1.SendSequenceTerminalCommand.ID,
        precondition: undefined,
        description: {
            description: terminalActions_1.SendSequenceTerminalCommand.LABEL,
            args: [{
                    name: 'args',
                    schema: {
                        type: 'object',
                        required: ['text'],
                        properties: {
                            text: { type: 'string' }
                        },
                    }
                }]
        }
    })).register();
    (new terminalActions_1.CreateNewWithCwdTerminalCommand({
        id: terminalActions_1.CreateNewWithCwdTerminalCommand.ID,
        precondition: undefined,
        description: {
            description: terminalActions_1.CreateNewWithCwdTerminalCommand.LABEL,
            args: [{
                    name: 'args',
                    schema: {
                        type: 'object',
                        required: ['cwd'],
                        properties: {
                            cwd: {
                                description: terminalActions_1.CreateNewWithCwdTerminalCommand.CWD_ARG_LABEL,
                                type: 'string'
                            }
                        },
                    }
                }]
        }
    })).register();
    terminalCommands_1.setupTerminalCommands();
    terminalMenu_1.setupTerminalMenu();
    terminalColorRegistry_1.registerColors();
});
//# sourceMappingURL=terminal.contribution.js.map