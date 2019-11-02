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
define(["require", "exports", "vs/base/common/actions", "vs/editor/browser/editorExtensions", "vs/nls", "vs/workbench/services/editor/common/editorService"], function (require, exports, actions_1, editorExtensions_1, nls, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ShowWebViewEditorFindWidgetCommand extends editorExtensions_1.Command {
        runCommand(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.showFind();
        }
    }
    exports.ShowWebViewEditorFindWidgetCommand = ShowWebViewEditorFindWidgetCommand;
    ShowWebViewEditorFindWidgetCommand.ID = 'editor.action.webvieweditor.showFind';
    class HideWebViewEditorFindCommand extends editorExtensions_1.Command {
        runCommand(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.hideFind();
        }
    }
    exports.HideWebViewEditorFindCommand = HideWebViewEditorFindCommand;
    HideWebViewEditorFindCommand.ID = 'editor.action.webvieweditor.hideFind';
    class WebViewEditorFindNextCommand extends editorExtensions_1.Command {
        runCommand(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.find(false);
        }
    }
    exports.WebViewEditorFindNextCommand = WebViewEditorFindNextCommand;
    WebViewEditorFindNextCommand.ID = 'editor.action.webvieweditor.findNext';
    class WebViewEditorFindPreviousCommand extends editorExtensions_1.Command {
        runCommand(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.find(true);
        }
    }
    exports.WebViewEditorFindPreviousCommand = WebViewEditorFindPreviousCommand;
    WebViewEditorFindPreviousCommand.ID = 'editor.action.webvieweditor.findPrevious';
    let ReloadWebviewAction = class ReloadWebviewAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        run() {
            for (const webview of this.getVisibleWebviews()) {
                webview.reload();
            }
            return Promise.resolve(true);
        }
        getVisibleWebviews() {
            return this.editorService.visibleControls
                .filter(control => control && control.isWebviewEditor)
                .map(control => control);
        }
    };
    ReloadWebviewAction.ID = 'workbench.action.webview.reloadWebviewAction';
    ReloadWebviewAction.LABEL = nls.localize('refreshWebviewLabel', "Reload Webviews");
    ReloadWebviewAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], ReloadWebviewAction);
    exports.ReloadWebviewAction = ReloadWebviewAction;
    function getActiveWebviewEditor(accessor) {
        var _a;
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeControl = editorService.activeControl;
        return ((_a = activeControl) === null || _a === void 0 ? void 0 : _a.isWebviewEditor) ? activeControl : undefined;
    }
    exports.getActiveWebviewEditor = getActiveWebviewEditor;
});
//# sourceMappingURL=webviewCommands.js.map