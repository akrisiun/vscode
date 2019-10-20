/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/config/editorOptions", "vs/editor/common/standalone/standaloneBase", "vs/editor/standalone/browser/standaloneEditor", "vs/editor/standalone/browser/standaloneLanguages"], function (require, exports, editorOptions_1, standaloneBase_1, standaloneEditor_1, standaloneLanguages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const global = self;
    // Set defaults for standalone editor
    editorOptions_1.EditorOptions.wrappingIndent.defaultValue = 0 /* None */;
    editorOptions_1.EditorOptions.glyphMargin.defaultValue = false;
    editorOptions_1.EditorOptions.autoIndent.defaultValue = false;
    editorOptions_1.EditorOptions.overviewRulerLanes.defaultValue = 2;
    const api = standaloneBase_1.createMonacoBaseAPI();
    api.editor = standaloneEditor_1.createMonacoEditorAPI();
    api.languages = standaloneLanguages_1.createMonacoLanguagesAPI();
    exports.CancellationTokenSource = api.CancellationTokenSource;
    exports.Emitter = api.Emitter;
    exports.KeyCode = api.KeyCode;
    exports.KeyMod = api.KeyMod;
    exports.Position = api.Position;
    exports.Range = api.Range;
    exports.Selection = api.Selection;
    exports.SelectionDirection = api.SelectionDirection;
    exports.MarkerSeverity = api.MarkerSeverity;
    exports.MarkerTag = api.MarkerTag;
    exports.Uri = api.Uri;
    exports.Token = api.Token;
    exports.editor = api.editor;
    exports.languages = api.languages;
    global.monaco = api;
    if (typeof global.require !== 'undefined' && typeof global.require.config === 'function') {
        global.require.config({
            ignoreDuplicateModules: [
                'vscode-languageserver-types',
                'vscode-languageserver-types/main',
                'vscode-nls',
                'vscode-nls/vscode-nls',
                'jsonc-parser',
                'jsonc-parser/main',
                'vscode-uri',
                'vscode-uri/index',
                'vs/basic-languages/typescript/typescript'
            ]
        });
    }
});
//# sourceMappingURL=editor.api.js.map