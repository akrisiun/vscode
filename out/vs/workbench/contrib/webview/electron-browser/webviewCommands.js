/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/webview/electron-browser/webviewElement", "vs/workbench/contrib/webview/browser/webviewCommands"], function (require, exports, actions_1, nls, editorExtensions_1, webviewElement_1, webviewCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OpenWebviewDeveloperToolsAction extends actions_1.Action {
        constructor(id, label) {
            super(id, label);
        }
        run() {
            const elements = document.querySelectorAll('webview.ready');
            for (let i = 0; i < elements.length; i++) {
                try {
                    elements.item(i).openDevTools();
                }
                catch (e) {
                    console.error(e);
                }
            }
            return Promise.resolve(true);
        }
    }
    exports.OpenWebviewDeveloperToolsAction = OpenWebviewDeveloperToolsAction;
    OpenWebviewDeveloperToolsAction.ID = 'workbench.action.webview.openDeveloperTools';
    OpenWebviewDeveloperToolsAction.ALIAS = 'Open Webview Developer Tools';
    OpenWebviewDeveloperToolsAction.LABEL = nls.localize('openToolsLabel', "Open Webview Developer Tools");
    class SelectAllWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.selectAll());
        }
    }
    exports.SelectAllWebviewEditorCommand = SelectAllWebviewEditorCommand;
    SelectAllWebviewEditorCommand.ID = 'editor.action.webvieweditor.selectAll';
    class CopyWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.copy());
        }
    }
    exports.CopyWebviewEditorCommand = CopyWebviewEditorCommand;
    CopyWebviewEditorCommand.ID = 'editor.action.webvieweditor.copy';
    class PasteWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.paste());
        }
    }
    exports.PasteWebviewEditorCommand = PasteWebviewEditorCommand;
    PasteWebviewEditorCommand.ID = 'editor.action.webvieweditor.paste';
    class CutWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, _args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.cut());
        }
    }
    exports.CutWebviewEditorCommand = CutWebviewEditorCommand;
    CutWebviewEditorCommand.ID = 'editor.action.webvieweditor.cut';
    class UndoWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.undo());
        }
    }
    exports.UndoWebviewEditorCommand = UndoWebviewEditorCommand;
    UndoWebviewEditorCommand.ID = 'editor.action.webvieweditor.undo';
    class RedoWebviewEditorCommand extends editorExtensions_1.Command {
        runCommand(accessor, args) {
            withActiveWebviewBasedWebview(accessor, webview => webview.redo());
        }
    }
    exports.RedoWebviewEditorCommand = RedoWebviewEditorCommand;
    RedoWebviewEditorCommand.ID = 'editor.action.webvieweditor.redo';
    function withActiveWebviewBasedWebview(accessor, f) {
        const webViewEditor = webviewCommands_1.getActiveWebviewEditor(accessor);
        if (webViewEditor) {
            webViewEditor.withWebview(webview => {
                if (webview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
                    f(webview);
                }
                else if (webview.getInnerWebview) {
                    const innerWebview = webview.getInnerWebview();
                    if (innerWebview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
                        f(innerWebview);
                    }
                }
            });
        }
    }
});
//# sourceMappingURL=webviewCommands.js.map