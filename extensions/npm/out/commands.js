"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const tasks_1 = require("./tasks");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function runSelectedScript() {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    let document = editor.document;
    let contents = document.getText();
    let selection = editor.selection;
    let offset = document.offsetAt(selection.anchor);
    let script = tasks_1.findScriptAtPosition(contents, offset);
    if (script) {
        tasks_1.runScript(script, document);
    }
    else {
        let message = localize('noScriptFound', 'Could not find a valid npm script at the selection.');
        vscode.window.showErrorMessage(message);
    }
}
exports.runSelectedScript = runSelectedScript;
//# sourceMappingURL=commands.js.map