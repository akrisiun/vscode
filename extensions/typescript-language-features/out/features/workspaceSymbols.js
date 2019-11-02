"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fileSchemes = require("../utils/fileSchemes");
const languageDescription_1 = require("../utils/languageDescription");
const typeConverters = require("../utils/typeConverters");
function getSymbolKind(item) {
    switch (item.kind) {
        case 'method': return vscode.SymbolKind.Method;
        case 'enum': return vscode.SymbolKind.Enum;
        case 'function': return vscode.SymbolKind.Function;
        case 'class': return vscode.SymbolKind.Class;
        case 'interface': return vscode.SymbolKind.Interface;
        case 'var': return vscode.SymbolKind.Variable;
        default: return vscode.SymbolKind.Variable;
    }
}
class TypeScriptWorkspaceSymbolProvider {
    constructor(client, modeIds) {
        this.client = client;
        this.modeIds = modeIds;
    }
    async provideWorkspaceSymbols(search, token) {
        const document = this.getDocument();
        if (!document) {
            return [];
        }
        const filepath = await this.toOpenedFiledPath(document);
        if (!filepath) {
            return [];
        }
        const args = {
            file: filepath,
            searchValue: search
        };
        const response = await this.client.execute('navto', args, token);
        if (response.type !== 'response' || !response.body) {
            return [];
        }
        const result = [];
        for (const item of response.body) {
            if (!item.containerName && item.kind === 'alias') {
                continue;
            }
            const label = TypeScriptWorkspaceSymbolProvider.getLabel(item);
            result.push(new vscode.SymbolInformation(label, getSymbolKind(item), item.containerName || '', typeConverters.Location.fromTextSpan(this.client.toResource(item.file), item)));
        }
        return result;
    }
    async toOpenedFiledPath(document) {
        var _a;
        if (document.uri.scheme === fileSchemes.git) {
            try {
                const path = vscode.Uri.file((_a = JSON.parse(document.uri.query)) === null || _a === void 0 ? void 0 : _a.path);
                if (languageDescription_1.doesResourceLookLikeATypeScriptFile(path) || languageDescription_1.doesResourceLookLikeAJavaScriptFile(path)) {
                    const document = await vscode.workspace.openTextDocument(path);
                    return this.client.toOpenedFilePath(document);
                }
            }
            catch (_b) {
                // noop
            }
        }
        return this.client.toOpenedFilePath(document);
    }
    static getLabel(item) {
        const label = item.name;
        if (item.kind === 'method' || item.kind === 'function') {
            return label + '()';
        }
        return label;
    }
    getDocument() {
        // typescript wants to have a resource even when asking
        // general questions so we check the active editor. If this
        // doesn't match we take the first TS document.
        var _a;
        const activeDocument = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
        if (activeDocument) {
            if (this.modeIds.includes(activeDocument.languageId)) {
                return activeDocument;
            }
        }
        const documents = vscode.workspace.textDocuments;
        for (const document of documents) {
            if (this.modeIds.includes(document.languageId)) {
                return document;
            }
        }
        return undefined;
    }
}
function register(client, modeIds) {
    return vscode.languages.registerWorkspaceSymbolProvider(new TypeScriptWorkspaceSymbolProvider(client, modeIds));
}
exports.register = register;
//# sourceMappingURL=workspaceSymbols.js.map