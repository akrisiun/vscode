/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewCommands", "vs/workbench/contrib/webview/electron-browser/webviewElement"], function (require, exports, actions_1, nls, actions_2, contextkey_1, contextkeys_1, webview_1, webviewCommands_1, webviewElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RedoWebviewEditorCommand = exports.UndoWebviewEditorCommand = exports.CutWebviewEditorCommand = exports.PasteWebviewEditorCommand = exports.CopyWebviewEditorCommand = exports.OpenWebviewDeveloperToolsAction = void 0;
    let OpenWebviewDeveloperToolsAction = /** @class */ (() => {
        class OpenWebviewDeveloperToolsAction extends actions_1.Action {
            constructor(id, label) {
                super(id, label);
            }
            async run() {
                const elements = document.querySelectorAll('webview.ready');
                for (let i = 0; i < elements.length; i++) {
                    try {
                        elements.item(i).openDevTools();
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
                return true;
            }
        }
        OpenWebviewDeveloperToolsAction.ID = 'workbench.action.webview.openDeveloperTools';
        OpenWebviewDeveloperToolsAction.ALIAS = 'Open Webview Developer Tools';
        OpenWebviewDeveloperToolsAction.LABEL = nls.localize('openToolsLabel', "Open Webview Developer Tools");
        return OpenWebviewDeveloperToolsAction;
    })();
    exports.OpenWebviewDeveloperToolsAction = OpenWebviewDeveloperToolsAction;
    let CopyWebviewEditorCommand = /** @class */ (() => {
        class CopyWebviewEditorCommand extends actions_2.Action2 {
            constructor(contextKeyExpr, getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebview) {
                super({
                    id: CopyWebviewEditorCommand.ID,
                    title: CopyWebviewEditorCommand.LABEL,
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                        weight: 100 /* EditorContrib */
                    }
                });
                this.getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebviewDelegate;
            }
            run(accessor) {
                var _a;
                (_a = this.getActiveElectronBasedWebviewDelegate(accessor)) === null || _a === void 0 ? void 0 : _a.copy();
            }
        }
        CopyWebviewEditorCommand.ID = 'editor.action.webvieweditor.copy';
        CopyWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.copy', "Copy2");
        return CopyWebviewEditorCommand;
    })();
    exports.CopyWebviewEditorCommand = CopyWebviewEditorCommand;
    let PasteWebviewEditorCommand = /** @class */ (() => {
        class PasteWebviewEditorCommand extends actions_2.Action2 {
            constructor(contextKeyExpr, getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebview) {
                super({
                    id: PasteWebviewEditorCommand.ID,
                    title: PasteWebviewEditorCommand.LABEL,
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                        primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                        weight: 100 /* EditorContrib */
                    }
                });
                this.getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebviewDelegate;
            }
            run(accessor) {
                var _a;
                (_a = this.getActiveElectronBasedWebviewDelegate(accessor)) === null || _a === void 0 ? void 0 : _a.paste();
            }
        }
        PasteWebviewEditorCommand.ID = 'editor.action.webvieweditor.paste';
        PasteWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.paste', 'Paste');
        return PasteWebviewEditorCommand;
    })();
    exports.PasteWebviewEditorCommand = PasteWebviewEditorCommand;
    let CutWebviewEditorCommand = /** @class */ (() => {
        class CutWebviewEditorCommand extends actions_2.Action2 {
            constructor(contextKeyExpr, getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebview) {
                super({
                    id: CutWebviewEditorCommand.ID,
                    title: CutWebviewEditorCommand.LABEL,
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                        primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                        weight: 100 /* EditorContrib */
                    }
                });
                this.getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebviewDelegate;
            }
            run(accessor) {
                var _a;
                (_a = this.getActiveElectronBasedWebviewDelegate(accessor)) === null || _a === void 0 ? void 0 : _a.cut();
            }
        }
        CutWebviewEditorCommand.ID = 'editor.action.webvieweditor.cut';
        CutWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.cut', 'Cut');
        return CutWebviewEditorCommand;
    })();
    exports.CutWebviewEditorCommand = CutWebviewEditorCommand;
    let UndoWebviewEditorCommand = /** @class */ (() => {
        class UndoWebviewEditorCommand extends actions_2.Action2 {
            constructor(contextKeyExpr, getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebview) {
                super({
                    id: UndoWebviewEditorCommand.ID,
                    title: UndoWebviewEditorCommand.LABEL,
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), contextkey_1.ContextKeyExpr.not(webview_1.webviewHasOwnEditFunctionsContextKey)),
                        primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                        weight: 100 /* EditorContrib */
                    }
                });
                this.getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebviewDelegate;
            }
            run(accessor) {
                var _a;
                (_a = this.getActiveElectronBasedWebviewDelegate(accessor)) === null || _a === void 0 ? void 0 : _a.undo();
            }
        }
        UndoWebviewEditorCommand.ID = 'editor.action.webvieweditor.undo';
        UndoWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.undo', "Undo");
        return UndoWebviewEditorCommand;
    })();
    exports.UndoWebviewEditorCommand = UndoWebviewEditorCommand;
    let RedoWebviewEditorCommand = /** @class */ (() => {
        class RedoWebviewEditorCommand extends actions_2.Action2 {
            constructor(contextKeyExpr, getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebview) {
                super({
                    id: RedoWebviewEditorCommand.ID,
                    title: RedoWebviewEditorCommand.LABEL,
                    keybinding: {
                        when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey), contextkey_1.ContextKeyExpr.not(webview_1.webviewHasOwnEditFunctionsContextKey)),
                        primary: 2048 /* CtrlCmd */ | 55 /* KEY_Y */,
                        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */],
                        mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */ },
                        weight: 100 /* EditorContrib */
                    }
                });
                this.getActiveElectronBasedWebviewDelegate = getActiveElectronBasedWebviewDelegate;
            }
            run(accessor) {
                var _a;
                (_a = this.getActiveElectronBasedWebviewDelegate(accessor)) === null || _a === void 0 ? void 0 : _a.redo();
            }
        }
        RedoWebviewEditorCommand.ID = 'editor.action.webvieweditor.redo';
        RedoWebviewEditorCommand.LABEL = nls.localize('editor.action.webvieweditor.redo', "Redo");
        return RedoWebviewEditorCommand;
    })();
    exports.RedoWebviewEditorCommand = RedoWebviewEditorCommand;
    function getActiveElectronBasedWebview(accessor) {
        const webview = webviewCommands_1.getActiveWebviewEditor(accessor);
        if (!webview) {
            return undefined;
        }
        if (webview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
            return webview;
        }
        else if ('getInnerWebview' in webview) {
            const innerWebview = webview.getInnerWebview();
            if (innerWebview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
                return innerWebview;
            }
        }
        return undefined;
    }
});
//# sourceMappingURL=webviewCommands.js.map