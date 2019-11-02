"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const vscode = require("vscode");
const testUtils_1 = require("./testUtils");
async function acceptFirstSuggestion(uri, _disposables, options) {
    const didChangeDocument = onChangedDocument(uri, _disposables);
    const didSuggest = onDidSuggest(_disposables, options);
    await vscode.commands.executeCommand('editor.action.triggerSuggest');
    await didSuggest;
    // TODO: depends on reverting fix for https://github.com/Microsoft/vscode/issues/64257
    // Make sure we have time to resolve the suggestion because `acceptSelectedSuggestion` doesn't
    await testUtils_1.wait(40);
    await vscode.commands.executeCommand('acceptSelectedSuggestion');
    return await didChangeDocument;
}
exports.acceptFirstSuggestion = acceptFirstSuggestion;
async function typeCommitCharacter(uri, character, _disposables) {
    const didChangeDocument = onChangedDocument(uri, _disposables);
    const didSuggest = onDidSuggest(_disposables);
    await vscode.commands.executeCommand('editor.action.triggerSuggest');
    await didSuggest;
    await vscode.commands.executeCommand('type', { text: character });
    return await didChangeDocument;
}
exports.typeCommitCharacter = typeCommitCharacter;
function onChangedDocument(documentUri, disposables) {
    return new Promise(resolve => vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === documentUri.toString()) {
            resolve(e.document);
        }
    }, undefined, disposables));
}
exports.onChangedDocument = onChangedDocument;
function onDidSuggest(disposables, options) {
    return new Promise(resolve => disposables.push(vscode.languages.registerCompletionItemProvider('typescript', new class {
        provideCompletionItems(doc, position) {
            // Return a fake item that will come first
            const range = options && options.useLineRange
                ? new vscode.Range(new vscode.Position(position.line, 0), position)
                : doc.getWordRangeAtPosition(position.translate({ characterDelta: -1 }));
            return [{
                    label: '🦄',
                    insertText: doc.getText(range),
                    filterText: doc.getText(range),
                    preselect: true,
                    sortText: 'a',
                    range: range
                }];
        }
        async resolveCompletionItem(item) {
            await vscode.commands.executeCommand('selectNextSuggestion');
            resolve();
            return item;
        }
    })));
}
//# sourceMappingURL=suggestTestHelpers.js.map