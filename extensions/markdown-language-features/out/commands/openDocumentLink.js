"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path_1 = require("path");
const tableOfContentsProvider_1 = require("../tableOfContentsProvider");
const file_1 = require("../util/file");
var OpenMarkdownLinks;
(function (OpenMarkdownLinks) {
    OpenMarkdownLinks["beside"] = "beside";
    OpenMarkdownLinks["currentGroup"] = "currentGroup";
})(OpenMarkdownLinks || (OpenMarkdownLinks = {}));
class OpenDocumentLinkCommand {
    constructor(engine) {
        this.engine = engine;
        this.id = OpenDocumentLinkCommand.id;
    }
    static createCommandUri(fromResource, path, fragment) {
        return vscode.Uri.parse(`command:${OpenDocumentLinkCommand.id}?${encodeURIComponent(JSON.stringify({
            path: encodeURIComponent(path),
            fragment,
            fromResource: encodeURIComponent(fromResource.toString(true)),
        }))}`);
    }
    execute(args) {
        const fromResource = vscode.Uri.parse(decodeURIComponent(args.fromResource));
        const targetPath = decodeURIComponent(args.path);
        const column = this.getViewColumn(fromResource);
        return this.tryOpen(targetPath, args, column).catch(() => {
            if (targetPath && path_1.extname(targetPath) === '') {
                return this.tryOpen(targetPath + '.md', args, column);
            }
            const targetResource = vscode.Uri.file(targetPath);
            return Promise.resolve(undefined)
                .then(() => vscode.commands.executeCommand('vscode.open', targetResource, column))
                .then(() => undefined);
        });
    }
    async tryOpen(path, args, column) {
        const resource = vscode.Uri.file(path);
        if (vscode.window.activeTextEditor && file_1.isMarkdownFile(vscode.window.activeTextEditor.document)) {
            if (!path || vscode.window.activeTextEditor.document.uri.fsPath === resource.fsPath) {
                return this.tryRevealLine(vscode.window.activeTextEditor, args.fragment);
            }
        }
        return vscode.workspace.openTextDocument(resource)
            .then(document => vscode.window.showTextDocument(document, column))
            .then(editor => this.tryRevealLine(editor, args.fragment));
    }
    getViewColumn(resource) {
        const config = vscode.workspace.getConfiguration('markdown', resource);
        const openLinks = config.get('links.openLocation', OpenMarkdownLinks.currentGroup);
        switch (openLinks) {
            case OpenMarkdownLinks.beside:
                return vscode.ViewColumn.Beside;
            case OpenMarkdownLinks.currentGroup:
            default:
                return vscode.ViewColumn.Active;
        }
    }
    async tryRevealLine(editor, fragment) {
        if (editor && fragment) {
            const toc = new tableOfContentsProvider_1.TableOfContentsProvider(this.engine, editor.document);
            const entry = await toc.lookup(fragment);
            if (entry) {
                return editor.revealRange(new vscode.Range(entry.line, 0, entry.line, 0), vscode.TextEditorRevealType.AtTop);
            }
            const lineNumberFragment = fragment.match(/^L(\d+)$/i);
            if (lineNumberFragment) {
                const line = +lineNumberFragment[1] - 1;
                if (!isNaN(line)) {
                    return editor.revealRange(new vscode.Range(line, 0, line, 0), vscode.TextEditorRevealType.AtTop);
                }
            }
        }
    }
}
exports.OpenDocumentLinkCommand = OpenDocumentLinkCommand;
OpenDocumentLinkCommand.id = '_markdown.openDocumentLink';
async function resolveLinkToMarkdownFile(path) {
    try {
        const standardLink = await tryResolveLinkToMarkdownFile(path);
        if (standardLink) {
            return standardLink;
        }
    }
    catch (_a) {
        // Noop
    }
    // If no extension, try with `.md` extension
    if (path_1.extname(path) === '') {
        return tryResolveLinkToMarkdownFile(path + '.md');
    }
    return undefined;
}
exports.resolveLinkToMarkdownFile = resolveLinkToMarkdownFile;
async function tryResolveLinkToMarkdownFile(path) {
    const resource = vscode.Uri.file(path);
    let document;
    try {
        document = await vscode.workspace.openTextDocument(resource);
    }
    catch (_a) {
        return undefined;
    }
    if (file_1.isMarkdownFile(document)) {
        return document.uri;
    }
    return undefined;
}
//# sourceMappingURL=openDocumentLink.js.map