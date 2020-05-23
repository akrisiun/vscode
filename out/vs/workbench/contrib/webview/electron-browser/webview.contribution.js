/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewEditor", "vs/workbench/contrib/webview/electron-browser/webviewCommands", "vs/workbench/contrib/webview/electron-browser/webviewService"], function (require, exports, platform_1, actions_1, contextkey_1, extensions_1, platform_2, actions_2, webview_1, webviewEditor_1, webviewCommands, webviewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(webview_1.IWebviewService, webviewService_1.ElectronWebviewService, true);
    const actionRegistry = platform_2.Registry.as(actions_2.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(webviewCommands.OpenWebviewDeveloperToolsAction), webviewCommands.OpenWebviewDeveloperToolsAction.ALIAS, webview_1.webviewDeveloperCategory);
    function registerWebViewCommands(editorId) {
        const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', editorId), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
        // These commands are only needed on MacOS where we have to disable the menu bar commands
        if (platform_1.isMacintosh) {
            actions_1.registerAction2(class extends webviewCommands.CopyWebviewEditorCommand {
                constructor() { super(contextKeyExpr); }
            });
            actions_1.registerAction2(class extends webviewCommands.PasteWebviewEditorCommand {
                constructor() { super(contextKeyExpr); }
            });
            actions_1.registerAction2(class extends webviewCommands.CutWebviewEditorCommand {
                constructor() { super(contextKeyExpr); }
            });
            actions_1.registerAction2(class extends webviewCommands.UndoWebviewEditorCommand {
                constructor() { super(contextKeyExpr); }
            });
            actions_1.registerAction2(class extends webviewCommands.RedoWebviewEditorCommand {
                constructor() { super(contextKeyExpr); }
            });
        }
    }
    registerWebViewCommands(webviewEditor_1.WebviewEditor.ID);
});
//# sourceMappingURL=webview.contribution.js.map