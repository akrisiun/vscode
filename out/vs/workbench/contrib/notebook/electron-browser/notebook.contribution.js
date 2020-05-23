/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/webview/electron-browser/webviewCommands", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/webview/electron-browser/webviewElement", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/contrib/coreActions"], function (require, exports, platform_1, actions_1, contextkey_1, webviewCommands, notebookEditor_1, webviewElement_1, editorService_1, coreActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getActiveElectronBasedWebviewDelegate(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = coreActions_1.getActiveNotebookEditor(editorService);
        const webview = editor === null || editor === void 0 ? void 0 : editor.getInnerWebview();
        if (webview && webview instanceof webviewElement_1.ElectronWebviewBasedWebview) {
            return webview;
        }
        return;
    }
    function registerNotebookCommands(editorId) {
        const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', editorId), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
        // These commands are only needed on MacOS where we have to disable the menu bar commands
        if (platform_1.isMacintosh) {
            actions_1.registerAction2(class extends webviewCommands.CopyWebviewEditorCommand {
                constructor() { super(contextKeyExpr, getActiveElectronBasedWebviewDelegate); }
            });
            actions_1.registerAction2(class extends webviewCommands.PasteWebviewEditorCommand {
                constructor() { super(contextKeyExpr, getActiveElectronBasedWebviewDelegate); }
            });
            actions_1.registerAction2(class extends webviewCommands.CutWebviewEditorCommand {
                constructor() { super(contextKeyExpr, getActiveElectronBasedWebviewDelegate); }
            });
            actions_1.registerAction2(class extends webviewCommands.UndoWebviewEditorCommand {
                constructor() { super(contextKeyExpr, getActiveElectronBasedWebviewDelegate); }
            });
            actions_1.registerAction2(class extends webviewCommands.RedoWebviewEditorCommand {
                constructor() { super(contextKeyExpr, getActiveElectronBasedWebviewDelegate); }
            });
        }
    }
    registerNotebookCommands(notebookEditor_1.NotebookEditor.ID);
});
//# sourceMappingURL=notebook.contribution.js.map