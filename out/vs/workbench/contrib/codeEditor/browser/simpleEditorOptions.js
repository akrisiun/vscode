/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/contrib/contextmenu/contextmenu", "vs/editor/contrib/snippet/snippetController2", "vs/editor/contrib/suggest/suggestController", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/workbench/contrib/snippets/browser/tabCompletion"], function (require, exports, contextmenu_1, snippetController2_1, suggestController_1, menuPreventer_1, selectionClipboard_1, tabCompletion_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getSimpleEditorOptions() {
        return {
            wordWrap: 'on',
            overviewRulerLanes: 0,
            glyphMargin: false,
            lineNumbers: 'off',
            folding: false,
            selectOnLineNumbers: false,
            hideCursorInOverviewRuler: true,
            selectionHighlight: false,
            scrollbar: {
                horizontal: 'hidden'
            },
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            scrollBeyondLastLine: false,
            renderLineHighlight: 'none',
            fixedOverflowWidgets: true,
            acceptSuggestionOnEnter: 'smart',
            minimap: {
                enabled: false
            }
        };
    }
    exports.getSimpleEditorOptions = getSimpleEditorOptions;
    function getSimpleCodeEditorWidgetOptions() {
        return {
            isSimpleWidget: true,
            contributions: [
                menuPreventer_1.MenuPreventer,
                selectionClipboard_1.SelectionClipboard,
                contextmenu_1.ContextMenuController,
                suggestController_1.SuggestController,
                snippetController2_1.SnippetController2,
                tabCompletion_1.TabCompletionController,
            ]
        };
    }
    exports.getSimpleCodeEditorWidgetOptions = getSimpleCodeEditorWidgetOptions;
});
//# sourceMappingURL=simpleEditorOptions.js.map