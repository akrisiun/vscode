/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/contrib/webview/browser/webviewEditor", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/electron-browser/webviewCommands", "vs/workbench/contrib/webview/electron-browser/webviewService"], function (require, exports, platform_1, actions_1, contextkey_1, contextkeys_1, extensions_1, platform_2, actions_2, webviewEditor_1, webview_1, webviewCommands, webviewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(webview_1.IWebviewService, webviewService_1.ElectronWebviewService, true);
    const actionRegistry = platform_2.Registry.as(actions_2.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(webviewCommands.OpenWebviewDeveloperToolsAction, webviewCommands.OpenWebviewDeveloperToolsAction.ID, webviewCommands.OpenWebviewDeveloperToolsAction.LABEL), webviewCommands.OpenWebviewDeveloperToolsAction.ALIAS, webview_1.webviewDeveloperCategory);
    function registerWebViewCommands(editorId) {
        const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', editorId), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
        (new webviewCommands.SelectAllWebviewEditorCommand({
            id: webviewCommands.SelectAllWebviewEditorCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
            kbOpts: {
                primary: 2048 /* CtrlCmd */ | 31 /* KEY_A */,
                weight: 100 /* EditorContrib */
            }
        })).register();
        // These commands are only needed on MacOS where we have to disable the menu bar commands
        if (platform_1.isMacintosh) {
            (new webviewCommands.CopyWebviewEditorCommand({
                id: webviewCommands.CopyWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands.PasteWebviewEditorCommand({
                id: webviewCommands.PasteWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands.CutWebviewEditorCommand({
                id: webviewCommands.CutWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands.UndoWebviewEditorCommand({
                id: webviewCommands.UndoWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 56 /* KEY_Z */,
                    weight: 100 /* EditorContrib */
                }
            })).register();
            (new webviewCommands.RedoWebviewEditorCommand({
                id: webviewCommands.RedoWebviewEditorCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                kbOpts: {
                    primary: 2048 /* CtrlCmd */ | 55 /* KEY_Y */,
                    secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */],
                    mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 56 /* KEY_Z */ },
                    weight: 100 /* EditorContrib */
                }
            })).register();
        }
    }
    registerWebViewCommands(webviewEditor_1.WebviewEditor.ID);
});
//# sourceMappingURL=webview.contribution.js.map