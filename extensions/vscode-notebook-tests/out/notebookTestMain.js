"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.notebook.registerNotebookProvider('notebookCoreTest', {
        resolveNotebook: async (editor) => {
            await editor.edit(eb => {
                eb.insert(0, 'test', 'typescript', vscode.CellKind.Code, [], {});
            });
            return;
        },
        executeCell: async (_document, _cell, _token) => {
            if (!_cell) {
                _cell = _document.cells[0];
            }
            _cell.outputs = [{
                    outputKind: vscode.CellOutputKind.Rich,
                    data: {
                        'text/plain': ['my output']
                    }
                }];
            return;
        },
        save: async (_document) => {
            return true;
        }
    }));
}
exports.activate = activate;
//# sourceMappingURL=notebookTestMain.js.map