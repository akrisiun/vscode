"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideInstalledExtensionProposals = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
function provideInstalledExtensionProposals(existing, range, includeBuiltinExtensions) {
    if (Array.isArray(existing)) {
        const extensions = includeBuiltinExtensions ? vscode.extensions.all : vscode.extensions.all.filter(e => !(e.id.startsWith('vscode.') || e.id === 'Microsoft.vscode-markdown'));
        const knownExtensionProposals = extensions.filter(e => existing.indexOf(e.id) === -1);
        if (knownExtensionProposals.length) {
            return knownExtensionProposals.map(e => {
                const item = new vscode.CompletionItem(e.id);
                const insertText = `"${e.id}"`;
                item.kind = vscode.CompletionItemKind.Value;
                item.insertText = insertText;
                item.range = range;
                item.filterText = insertText;
                return item;
            });
        }
        else {
            const example = new vscode.CompletionItem(localize('exampleExtension', "Example"));
            example.insertText = '"vscode.csharp"';
            example.kind = vscode.CompletionItemKind.Value;
            example.range = range;
            return [example];
        }
    }
    return undefined;
}
exports.provideInstalledExtensionProposals = provideInstalledExtensionProposals;
//# sourceMappingURL=extensionsProposals.js.map