/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/actions", "vs/workbench/common/editor", "vs/workbench/contrib/webview/browser/webviewEditorInputFactory", "vs/workbench/contrib/webview/browser/webview", "../browser/webviewCommands", "../browser/webviewEditor", "../browser/webviewEditorInput", "./webviewWorkbenchService"], function (require, exports, nls_1, actions_1, contextkey_1, descriptors_1, extensions_1, platform_1, editor_1, actions_2, editor_2, webviewEditorInputFactory_1, webview_1, webviewCommands_1, webviewEditor_1, webviewEditorInput_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (platform_1.Registry.as(editor_1.Extensions.Editors)).registerEditor(new editor_1.EditorDescriptor(webviewEditor_1.WebviewEditor, webviewEditor_1.WebviewEditor.ID, nls_1.localize('webview.editor.label', "webview editor")), [new descriptors_1.SyncDescriptor(webviewEditorInput_1.WebviewInput)]);
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(webviewEditorInputFactory_1.WebviewEditorInputFactory.ID, webviewEditorInputFactory_1.WebviewEditorInputFactory);
    extensions_1.registerSingleton(webviewWorkbenchService_1.IWebviewWorkbenchService, webviewWorkbenchService_1.WebviewEditorService, true);
    const actionRegistry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    function registerWebViewCommands(editorId) {
        const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', editorId), contextkey_1.ContextKeyExpr.not('editorFocus') /* https://github.com/Microsoft/vscode/issues/58668 */);
        const showNextFindWidgetCommand = new webviewCommands_1.ShowWebViewEditorFindWidgetCommand({
            id: webviewCommands_1.ShowWebViewEditorFindWidgetCommand.ID,
            precondition: contextKeyExpr,
            kbOpts: {
                primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                weight: 100 /* EditorContrib */
            }
        });
        showNextFindWidgetCommand.register();
        (new webviewCommands_1.HideWebViewEditorFindCommand({
            id: webviewCommands_1.HideWebViewEditorFindCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
            kbOpts: {
                primary: 9 /* Escape */,
                weight: 100 /* EditorContrib */
            }
        })).register();
        (new webviewCommands_1.WebViewEditorFindNextCommand({
            id: webviewCommands_1.WebViewEditorFindNextCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
            kbOpts: {
                primary: 3 /* Enter */,
                weight: 100 /* EditorContrib */
            }
        })).register();
        (new webviewCommands_1.WebViewEditorFindPreviousCommand({
            id: webviewCommands_1.WebViewEditorFindPreviousCommand.ID,
            precondition: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
            kbOpts: {
                primary: 1024 /* Shift */ | 3 /* Enter */,
                weight: 100 /* EditorContrib */
            }
        })).register();
    }
    registerWebViewCommands(webviewEditor_1.WebviewEditor.ID);
    actionRegistry.registerWorkbenchAction(new actions_1.SyncActionDescriptor(webviewCommands_1.ReloadWebviewAction, webviewCommands_1.ReloadWebviewAction.ID, webviewCommands_1.ReloadWebviewAction.LABEL), 'Reload Webviews', webview_1.webviewDeveloperCategory);
});
//# sourceMappingURL=webview.contribution.js.map