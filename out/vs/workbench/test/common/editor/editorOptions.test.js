/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor"], function (require, exports, assert, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench editor options', () => {
        test('EditorOptions', () => {
            let options = new editor_1.EditorOptions();
            assert(!options.preserveFocus);
            options.preserveFocus = true;
            assert(options.preserveFocus);
            assert(!options.forceReload);
            options.forceReload = true;
            assert(options.forceReload);
            options = new editor_1.EditorOptions();
            options.forceReload = true;
        });
        test('TextEditorOptions', () => {
            let options = new editor_1.TextEditorOptions();
            let otherOptions = new editor_1.TextEditorOptions();
            assert(!options.hasOptionsDefined());
            options.selection(1, 1, 2, 2);
            assert(options.hasOptionsDefined());
            otherOptions.selection(1, 1, 2, 2);
            options = new editor_1.TextEditorOptions();
            options.forceReload = true;
            options.selection(1, 1, 2, 2);
        });
    });
});
//# sourceMappingURL=editorOptions.test.js.map