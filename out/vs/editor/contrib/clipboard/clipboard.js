/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/platform", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/css!./clipboard"], function (require, exports, nls, browser, platform, textAreaInput_1, editorExtensions_1, codeEditorService_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CLIPBOARD_CONTEXT_MENU_GROUP = '9_cutcopypaste';
    const supportsCut = (platform.isNative || document.queryCommandSupported('cut'));
    const supportsCopy = (platform.isNative || document.queryCommandSupported('copy'));
    // IE and Edge have trouble with setting html content in clipboard
    const supportsCopyWithSyntaxHighlighting = (supportsCopy && !browser.isEdgeOrIE);
    // Chrome incorrectly returns true for document.queryCommandSupported('paste')
    // when the paste feature is available but the calling script has insufficient
    // privileges to actually perform the action
    const supportsPaste = (platform.isNative || (!browser.isChrome && document.queryCommandSupported('paste')));
    class ExecCommandAction extends editorExtensions_1.EditorAction {
        constructor(browserCommand, opts) {
            super(opts);
            this.browserCommand = browserCommand;
        }
        runCommand(accessor, args) {
            let focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            // Only if editor text focus (i.e. not if editor has widget focus).
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                focusedEditor.trigger('keyboard', this.id, args);
                return;
            }
            document.execCommand(this.browserCommand);
        }
        run(accessor, editor) {
            editor.focus();
            document.execCommand(this.browserCommand);
        }
    }
    class ExecCommandCutAction extends ExecCommandAction {
        constructor() {
            let kbOpts = {
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                win: { primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */, secondary: [1024 /* Shift */ | 20 /* Delete */] },
                weight: 100 /* EditorContrib */
            };
            // Do not bind cut keybindings in the browser,
            // since browsers do that for us and it avoids security prompts
            if (!platform.isNative) {
                kbOpts = undefined;
            }
            super('cut', {
                id: 'editor.action.clipboardCutAction',
                label: nls.localize('actions.clipboard.cutLabel', "Cut"),
                alias: 'Cut',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: kbOpts,
                menuOpts: {
                    group: CLIPBOARD_CONTEXT_MENU_GROUP,
                    order: 1
                },
                menubarOpts: {
                    menuId: 14 /* MenubarEditMenu */,
                    group: '2_ccp',
                    title: nls.localize({ key: 'miCut', comment: ['&& denotes a mnemonic'] }, "Cu&&t"),
                    order: 1
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(23 /* emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            super.run(accessor, editor);
        }
    }
    class ExecCommandCopyAction extends ExecCommandAction {
        constructor() {
            let kbOpts = {
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                win: { primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */, secondary: [2048 /* CtrlCmd */ | 19 /* Insert */] },
                weight: 100 /* EditorContrib */
            };
            // Do not bind copy keybindings in the browser,
            // since browsers do that for us and it avoids security prompts
            if (!platform.isNative) {
                kbOpts = undefined;
            }
            super('copy', {
                id: 'editor.action.clipboardCopyAction',
                label: nls.localize('actions.clipboard.copyLabel', "Copy"),
                alias: 'Copy',
                precondition: undefined,
                kbOpts: kbOpts,
                menuOpts: {
                    group: CLIPBOARD_CONTEXT_MENU_GROUP,
                    order: 2
                },
                menubarOpts: {
                    menuId: 14 /* MenubarEditMenu */,
                    group: '2_ccp',
                    title: nls.localize({ key: 'miCopy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                    order: 2
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(23 /* emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            super.run(accessor, editor);
        }
    }
    class ExecCommandPasteAction extends ExecCommandAction {
        constructor() {
            let kbOpts = {
                kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                win: { primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */, secondary: [1024 /* Shift */ | 19 /* Insert */] },
                weight: 100 /* EditorContrib */
            };
            // Do not bind paste keybindings in the browser,
            // since browsers do that for us and it avoids security prompts
            if (!platform.isNative) {
                kbOpts = undefined;
            }
            super('paste', {
                id: 'editor.action.clipboardPasteAction',
                label: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                alias: 'Paste',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                kbOpts: kbOpts,
                menuOpts: {
                    group: CLIPBOARD_CONTEXT_MENU_GROUP,
                    order: 3
                },
                menubarOpts: {
                    menuId: 14 /* MenubarEditMenu */,
                    group: '2_ccp',
                    title: nls.localize({ key: 'miPaste', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                    order: 3
                }
            });
        }
    }
    class ExecCommandCopyWithSyntaxHighlightingAction extends ExecCommandAction {
        constructor() {
            super('copy', {
                id: 'editor.action.clipboardCopyWithSyntaxHighlightingAction',
                label: nls.localize('actions.clipboard.copyWithSyntaxHighlightingLabel', "Copy With Syntax Highlighting"),
                alias: 'Copy With Syntax Highlighting',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(23 /* emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = true;
            super.run(accessor, editor);
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = false;
        }
    }
    if (supportsCut) {
        editorExtensions_1.registerEditorAction(ExecCommandCutAction);
    }
    if (supportsCopy) {
        editorExtensions_1.registerEditorAction(ExecCommandCopyAction);
    }
    if (supportsPaste) {
        editorExtensions_1.registerEditorAction(ExecCommandPasteAction);
    }
    if (supportsCopyWithSyntaxHighlighting) {
        editorExtensions_1.registerEditorAction(ExecCommandCopyWithSyntaxHighlightingAction);
    }
});
//# sourceMappingURL=clipboard.js.map