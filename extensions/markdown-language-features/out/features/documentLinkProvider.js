"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const nls = require("vscode-nls");
const openDocumentLink_1 = require("../commands/openDocumentLink");
const links_1 = require("../util/links");
const localize = nls.loadMessageBundle();
function parseLink(document, link, base) {
    const externalSchemeUri = links_1.getUriForLinkWithKnownExternalScheme(link);
    if (externalSchemeUri) {
        // Normalize VS Code links to target currently running version
        if (links_1.isOfScheme(links_1.Schemes.vscode, link) || links_1.isOfScheme(links_1.Schemes['vscode-insiders'], link)) {
            return { uri: vscode.Uri.parse(link).with({ scheme: vscode.env.uriScheme }) };
        }
        return { uri: externalSchemeUri };
    }
    // Assume it must be an relative or absolute file path
    // Use a fake scheme to avoid parse warnings
    const tempUri = vscode.Uri.parse(`vscode-resource:${link}`);
    let resourcePath = tempUri.path;
    if (!tempUri.path && document.uri.scheme === 'file') {
        resourcePath = document.uri.path;
    }
    else if (tempUri.path[0] === '/') {
        const root = vscode.workspace.getWorkspaceFolder(document.uri);
        if (root) {
            resourcePath = path.join(root.uri.fsPath, tempUri.path);
        }
    }
    else {
        resourcePath = base ? path.join(base, tempUri.path) : tempUri.path;
    }
    return {
        uri: openDocumentLink_1.OpenDocumentLinkCommand.createCommandUri(document.uri, resourcePath, tempUri.fragment),
        tooltip: localize('documentLink.tooltip', 'Follow link')
    };
}
function matchAll(pattern, text) {
    const out = [];
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text))) {
        out.push(match);
    }
    return out;
}
function extractDocumentLink(document, base, pre, link, matchIndex) {
    const offset = (matchIndex || 0) + pre;
    const linkStart = document.positionAt(offset);
    const linkEnd = document.positionAt(offset + link.length);
    try {
        const { uri, tooltip } = parseLink(document, link, base);
        const documentLink = new vscode.DocumentLink(new vscode.Range(linkStart, linkEnd), uri);
        documentLink.tooltip = tooltip;
        return documentLink;
    }
    catch (e) {
        return undefined;
    }
}
class LinkProvider {
    constructor() {
        this.linkPattern = /(\[((!\[[^\]]*?\]\(\s*)([^\s\(\)]+?)\s*\)\]|(?:\\\]|[^\]])*\])\(\s*)(([^\s\(\)]|\(\S*?\))+)\s*(".*?")?\)/g;
        this.referenceLinkPattern = /(\[((?:\\\]|[^\]])+)\]\[\s*?)([^\s\]]*?)\]/g;
        this.definitionPattern = /^([\t ]*\[((?:\\\]|[^\]])+)\]:\s*)(\S+)/gm;
    }
    provideDocumentLinks(document, _token) {
        const base = document.uri.scheme === 'file' ? path.dirname(document.uri.fsPath) : '';
        const text = document.getText();
        return [
            ...this.providerInlineLinks(text, document, base),
            ...this.provideReferenceLinks(text, document, base)
        ];
    }
    providerInlineLinks(text, document, base) {
        const results = [];
        for (const match of matchAll(this.linkPattern, text)) {
            const matchImage = match[4] && extractDocumentLink(document, base, match[3].length + 1, match[4], match.index);
            if (matchImage) {
                results.push(matchImage);
            }
            const matchLink = extractDocumentLink(document, base, match[1].length, match[5], match.index);
            if (matchLink) {
                results.push(matchLink);
            }
        }
        return results;
    }
    provideReferenceLinks(text, document, base) {
        const results = [];
        const definitions = this.getDefinitions(text, document);
        for (const match of matchAll(this.referenceLinkPattern, text)) {
            let linkStart;
            let linkEnd;
            let reference = match[3];
            if (reference) { // [text][ref]
                const pre = match[1];
                const offset = (match.index || 0) + pre.length;
                linkStart = document.positionAt(offset);
                linkEnd = document.positionAt(offset + reference.length);
            }
            else if (match[2]) { // [ref][]
                reference = match[2];
                const offset = (match.index || 0) + 1;
                linkStart = document.positionAt(offset);
                linkEnd = document.positionAt(offset + match[2].length);
            }
            else {
                continue;
            }
            try {
                const link = definitions.get(reference);
                if (link) {
                    results.push(new vscode.DocumentLink(new vscode.Range(linkStart, linkEnd), vscode.Uri.parse(`command:_markdown.moveCursorToPosition?${encodeURIComponent(JSON.stringify([link.linkRange.start.line, link.linkRange.start.character]))}`)));
                }
            }
            catch (e) {
                // noop
            }
        }
        for (const definition of definitions.values()) {
            try {
                const { uri } = parseLink(document, definition.link, base);
                results.push(new vscode.DocumentLink(definition.linkRange, uri));
            }
            catch (e) {
                // noop
            }
        }
        return results;
    }
    getDefinitions(text, document) {
        const out = new Map();
        for (const match of matchAll(this.definitionPattern, text)) {
            const pre = match[1];
            const reference = match[2];
            const link = match[3].trim();
            const offset = (match.index || 0) + pre.length;
            const linkStart = document.positionAt(offset);
            const linkEnd = document.positionAt(offset + link.length);
            out.set(reference, {
                link: link,
                linkRange: new vscode.Range(linkStart, linkEnd)
            });
        }
        return out;
    }
}
exports.default = LinkProvider;
//# sourceMappingURL=documentLinkProvider.js.map