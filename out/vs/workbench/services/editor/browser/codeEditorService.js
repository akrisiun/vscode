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
define(["require", "exports", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorServiceImpl", "vs/platform/theme/common/themeService", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/services/codeEditorService", "vs/platform/instantiation/common/extensions"], function (require, exports, editorBrowser_1, codeEditorServiceImpl_1, themeService_1, editor_1, editorService_1, codeEditorService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CodeEditorService = class CodeEditorService extends codeEditorServiceImpl_1.CodeEditorServiceImpl {
        constructor(editorService, themeService) {
            super(themeService);
            this.editorService = editorService;
        }
        getActiveCodeEditor() {
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (editorBrowser_1.isCodeEditor(activeTextEditorWidget)) {
                return activeTextEditorWidget;
            }
            if (editorBrowser_1.isDiffEditor(activeTextEditorWidget)) {
                return activeTextEditorWidget.getModifiedEditor();
            }
            return null;
        }
        openCodeEditor(input, source, sideBySide) {
            // Special case: If the active editor is a diff editor and the request to open originates and
            // targets the modified side of it, we just apply the request there to prevent opening the modified
            // side as separate editor.
            const activeTextEditorWidget = this.editorService.activeTextEditorWidget;
            if (!sideBySide && // we need the current active group to be the taret
                editorBrowser_1.isDiffEditor(activeTextEditorWidget) && // we only support this for active text diff editors
                input.options && // we need options to apply
                input.resource && // we need a request resource to compare with
                activeTextEditorWidget.getModel() && // we need a target model to compare with
                source === activeTextEditorWidget.getModifiedEditor() && // we need the source of this request to be the modified side of the diff editor
                input.resource.toString() === activeTextEditorWidget.getModel().modified.uri.toString() // we need the input resources to match with modified side
            ) {
                const targetEditor = activeTextEditorWidget.getModifiedEditor();
                const textOptions = editor_1.TextEditorOptions.create(input.options);
                textOptions.apply(targetEditor, 0 /* Smooth */);
                return Promise.resolve(targetEditor);
            }
            // Open using our normal editor service
            return this.doOpenCodeEditor(input, source, sideBySide);
        }
        async doOpenCodeEditor(input, source, sideBySide) {
            const control = await this.editorService.openEditor(input, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
            if (control) {
                const widget = control.getControl();
                if (editorBrowser_1.isCodeEditor(widget)) {
                    return widget;
                }
            }
            return null;
        }
    };
    CodeEditorService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, themeService_1.IThemeService)
    ], CodeEditorService);
    exports.CodeEditorService = CodeEditorService;
    extensions_1.registerSingleton(codeEditorService_1.ICodeEditorService, CodeEditorService, true);
});
//# sourceMappingURL=codeEditorService.js.map