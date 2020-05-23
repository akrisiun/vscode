/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, gotoSymbolQuickAccess_1, notebookEditor_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    gotoSymbolQuickAccess_1.TableOfContentsProviderRegistry.register(notebookEditor_1.NotebookEditor.ID, new class {
        async provideTableOfContents(editor) {
            if (!editor.viewModel) {
                return undefined;
            }
            // return an entry per markdown header
            const result = [];
            for (let cell of editor.viewModel.viewCells) {
                if (cell.cellKind === notebookCommon_1.CellKind.Code) {
                    continue;
                }
                const content = cell.getText();
                const matches = content.match(/^[ \t]*(\#+)(.+)$/gm);
                if (matches && matches.length) {
                    for (let j = 0; j < matches.length; j++) {
                        result.push({
                            label: matches[j].replace(/^[ \t]*(\#+)/, ''),
                            reveal: () => editor.revealInCenterIfOutsideViewport(cell)
                        });
                    }
                }
            }
            return result;
        }
    });
});
//# sourceMappingURL=tocProvider.js.map