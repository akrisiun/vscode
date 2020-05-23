/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchEditorID = exports.SearchEditorFindMatchClass = exports.SearchEditorBodyScheme = exports.SearchEditorScheme = exports.InSearchEditor = exports.SelectAllSearchEditorMatchesCommandId = exports.CleanSearchEditorStateCommandId = exports.RerunSearchEditorSearchCommandId = exports.DecreaseSearchEditorContextLinesCommandId = exports.IncreaseSearchEditorContextLinesCommandId = exports.ToggleSearchEditorContextLinesCommandId = exports.ToggleSearchEditorRegexCommandId = exports.ToggleSearchEditorWholeWordCommandId = exports.ToggleSearchEditorCaseSensitiveCommandId = exports.FocusQueryEditorWidgetCommandId = exports.OpenNewEditorToSideCommandId = exports.OpenNewEditorCommandId = exports.OpenInEditorCommandId = void 0;
    exports.OpenInEditorCommandId = 'search.action.openInEditor';
    exports.OpenNewEditorCommandId = 'search.action.openNewEditor';
    exports.OpenNewEditorToSideCommandId = 'search.action.openNewEditorToSide';
    exports.FocusQueryEditorWidgetCommandId = 'search.action.focusQueryEditorWidget';
    exports.ToggleSearchEditorCaseSensitiveCommandId = 'toggleSearchEditorCaseSensitive';
    exports.ToggleSearchEditorWholeWordCommandId = 'toggleSearchEditorWholeWord';
    exports.ToggleSearchEditorRegexCommandId = 'toggleSearchEditorRegex';
    exports.ToggleSearchEditorContextLinesCommandId = 'toggleSearchEditorContextLines';
    exports.IncreaseSearchEditorContextLinesCommandId = 'increaseSearchEditorContextLines';
    exports.DecreaseSearchEditorContextLinesCommandId = 'decreaseSearchEditorContextLines';
    exports.RerunSearchEditorSearchCommandId = 'rerunSearchEditorSearch';
    exports.CleanSearchEditorStateCommandId = 'cleanSearchEditorState';
    exports.SelectAllSearchEditorMatchesCommandId = 'selectAllSearchEditorMatches';
    exports.InSearchEditor = new contextkey_1.RawContextKey('inSearchEditor', false);
    exports.SearchEditorScheme = 'search-editor';
    exports.SearchEditorBodyScheme = 'search-editor-body';
    exports.SearchEditorFindMatchClass = 'seaarchEditorFindMatch';
    exports.SearchEditorID = 'workbench.editor.searchEditor';
});
//# sourceMappingURL=constants.js.map