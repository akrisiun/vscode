"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const packageDocumentHelper_1 = require("./packageDocumentHelper");
const extensionLinter_1 = require("./extensionLinter");
function activate(context) {
    const registration = vscode.languages.registerDocumentLinkProvider({ language: 'typescript', pattern: '**/vscode.d.ts' }, _linkProvider);
    context.subscriptions.push(registration);
    //package.json suggestions
    context.subscriptions.push(registerPackageDocumentCompletions());
    context.subscriptions.push(new extensionLinter_1.ExtensionLinter());
}
exports.activate = activate;
const _linkProvider = new class {
    constructor() {
        this._linkPattern = /[^!]\[.*?\]\(#(.*?)\)/g;
    }
    async provideDocumentLinks(document, _token) {
        const key = `${document.uri.toString()}@${document.version}`;
        if (!this._cachedResult || this._cachedResult.key !== key) {
            const links = await this._computeDocumentLinks(document);
            this._cachedResult = { key, links };
        }
        return this._cachedResult.links;
    }
    async _computeDocumentLinks(document) {
        const results = [];
        const text = document.getText();
        const lookUp = await ast.createNamedNodeLookUp(text);
        this._linkPattern.lastIndex = 0;
        let match = null;
        while ((match = this._linkPattern.exec(text))) {
            const offset = lookUp(match[1]);
            if (offset === -1) {
                console.warn(`Could not find symbol for link ${match[1]}`);
                continue;
            }
            const targetPos = document.positionAt(offset);
            const linkEnd = document.positionAt(this._linkPattern.lastIndex - 1);
            const linkStart = linkEnd.translate({ characterDelta: -(1 + match[1].length) });
            results.push(new vscode.DocumentLink(new vscode.Range(linkStart, linkEnd), document.uri.with({ fragment: `${1 + targetPos.line}` })));
        }
        return results;
    }
};
var ast;
(function (ast) {
    async function createNamedNodeLookUp(str) {
        const ts = await Promise.resolve().then(() => require('typescript'));
        const sourceFile = ts.createSourceFile('fake.d.ts', str, ts.ScriptTarget.Latest);
        const identifiers = [];
        const spans = [];
        ts.forEachChild(sourceFile, function visit(node) {
            const declIdent = node.name;
            if (declIdent && declIdent.kind === ts.SyntaxKind.Identifier) {
                identifiers.push(declIdent.text);
                spans.push(node.pos, node.end);
            }
            ts.forEachChild(node, visit);
        });
        return function (dottedName) {
            let start = -1;
            let end = Number.MAX_VALUE;
            for (let name of dottedName.split('.')) {
                let idx = -1;
                while ((idx = identifiers.indexOf(name, idx + 1)) >= 0) {
                    let myStart = spans[2 * idx];
                    let myEnd = spans[2 * idx + 1];
                    if (myStart >= start && myEnd <= end) {
                        start = myStart;
                        end = myEnd;
                        break;
                    }
                }
                if (idx < 0) {
                    return -1;
                }
            }
            return start;
        };
    }
    ast.createNamedNodeLookUp = createNamedNodeLookUp;
})(ast || (ast = {}));
function registerPackageDocumentCompletions() {
    return vscode.languages.registerCompletionItemProvider({ language: 'json', pattern: '**/package.json' }, {
        provideCompletionItems(document, position, token) {
            return new packageDocumentHelper_1.PackageDocument(document).provideCompletionItems(position, token);
        }
    });
}
//# sourceMappingURL=extension.js.map