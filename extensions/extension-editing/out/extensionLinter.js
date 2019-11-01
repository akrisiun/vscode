"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const url_1 = require("url");
const nls = require("vscode-nls");
const localize = nls.loadMessageBundle();
const jsonc_parser_1 = require("jsonc-parser");
const vscode_1 = require("vscode");
const product = JSON.parse(fs.readFileSync(path.join(vscode_1.env.appRoot, 'product.json'), { encoding: 'utf-8' }));
const allowedBadgeProviders = (product.extensionAllowedBadgeProviders || []).map((s) => s.toLowerCase());
const httpsRequired = localize('httpsRequired', "Images must use the HTTPS protocol.");
const svgsNotValid = localize('svgsNotValid', "SVGs are not a valid image source.");
const embeddedSvgsNotValid = localize('embeddedSvgsNotValid', "Embedded SVGs are not a valid image source.");
const dataUrlsNotValid = localize('dataUrlsNotValid', "Data URLs are not a valid image source.");
const relativeUrlRequiresHttpsRepository = localize('relativeUrlRequiresHttpsRepository', "Relative image URLs require a repository with HTTPS protocol to be specified in the package.json.");
const relativeIconUrlRequiresHttpsRepository = localize('relativeIconUrlRequiresHttpsRepository', "An icon requires a repository with HTTPS protocol to be specified in this package.json.");
const relativeBadgeUrlRequiresHttpsRepository = localize('relativeBadgeUrlRequiresHttpsRepository', "Relative badge URLs require a repository with HTTPS protocol to be specified in this package.json.");
var Context;
(function (Context) {
    Context[Context["ICON"] = 0] = "ICON";
    Context[Context["BADGE"] = 1] = "BADGE";
    Context[Context["MARKDOWN"] = 2] = "MARKDOWN";
})(Context || (Context = {}));
class ExtensionLinter {
    constructor() {
        this.diagnosticsCollection = vscode_1.languages.createDiagnosticCollection('extension-editing');
        this.fileWatcher = vscode_1.workspace.createFileSystemWatcher('**/package.json');
        this.disposables = [this.diagnosticsCollection, this.fileWatcher];
        this.folderToPackageJsonInfo = {};
        this.packageJsonQ = new Set();
        this.readmeQ = new Set();
        this.disposables.push(vscode_1.workspace.onDidOpenTextDocument(document => this.queue(document)), vscode_1.workspace.onDidChangeTextDocument(event => this.queue(event.document)), vscode_1.workspace.onDidCloseTextDocument(document => this.clear(document)), this.fileWatcher.onDidChange(uri => this.packageJsonChanged(this.getUriFolder(uri))), this.fileWatcher.onDidCreate(uri => this.packageJsonChanged(this.getUriFolder(uri))), this.fileWatcher.onDidDelete(uri => this.packageJsonChanged(this.getUriFolder(uri))));
        vscode_1.workspace.textDocuments.forEach(document => this.queue(document));
    }
    queue(document) {
        const p = document.uri.path;
        if (document.languageId === 'json' && endsWith(p, '/package.json')) {
            this.packageJsonQ.add(document);
            this.startTimer();
        }
        this.queueReadme(document);
    }
    queueReadme(document) {
        const p = document.uri.path;
        if (document.languageId === 'markdown' && (endsWith(p.toLowerCase(), '/readme.md') || endsWith(p.toLowerCase(), '/changelog.md'))) {
            this.readmeQ.add(document);
            this.startTimer();
        }
    }
    startTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.lint()
                .catch(console.error);
        }, 300);
    }
    async lint() {
        this.lintPackageJson();
        await this.lintReadme();
    }
    lintPackageJson() {
        this.packageJsonQ.forEach(document => {
            this.packageJsonQ.delete(document);
            if (document.isClosed) {
                return;
            }
            const diagnostics = [];
            const tree = jsonc_parser_1.parseTree(document.getText());
            const info = this.readPackageJsonInfo(this.getUriFolder(document.uri), tree);
            if (info.isExtension) {
                const icon = jsonc_parser_1.findNodeAtLocation(tree, ['icon']);
                if (icon && icon.type === 'string') {
                    this.addDiagnostics(diagnostics, document, icon.offset + 1, icon.offset + icon.length - 1, icon.value, Context.ICON, info);
                }
                const badges = jsonc_parser_1.findNodeAtLocation(tree, ['badges']);
                if (badges && badges.type === 'array' && badges.children) {
                    badges.children.map(child => jsonc_parser_1.findNodeAtLocation(child, ['url']))
                        .filter(url => url && url.type === 'string')
                        .map(url => this.addDiagnostics(diagnostics, document, url.offset + 1, url.offset + url.length - 1, url.value, Context.BADGE, info));
                }
            }
            this.diagnosticsCollection.set(document.uri, diagnostics);
        });
    }
    async lintReadme() {
        for (const document of Array.from(this.readmeQ)) {
            this.readmeQ.delete(document);
            if (document.isClosed) {
                return;
            }
            const folder = this.getUriFolder(document.uri);
            let info = this.folderToPackageJsonInfo[folder.toString()];
            if (!info) {
                const tree = await this.loadPackageJson(folder);
                info = this.readPackageJsonInfo(folder, tree);
            }
            if (!info.isExtension) {
                this.diagnosticsCollection.set(document.uri, []);
                return;
            }
            const text = document.getText();
            if (!this.markdownIt) {
                this.markdownIt = new (await Promise.resolve().then(() => require('markdown-it')));
            }
            const tokens = this.markdownIt.parse(text, {});
            const tokensAndPositions = (function toTokensAndPositions(tokens, begin = 0, end = text.length) {
                const tokensAndPositions = tokens.map(token => {
                    if (token.map) {
                        const tokenBegin = document.offsetAt(new vscode_1.Position(token.map[0], 0));
                        const tokenEnd = begin = document.offsetAt(new vscode_1.Position(token.map[1], 0));
                        return {
                            token,
                            begin: tokenBegin,
                            end: tokenEnd
                        };
                    }
                    const image = token.type === 'image' && this.locateToken(text, begin, end, token, token.attrGet('src'));
                    const other = image || this.locateToken(text, begin, end, token, token.content);
                    return other || {
                        token,
                        begin,
                        end: begin
                    };
                });
                return tokensAndPositions.concat(...tokensAndPositions.filter(tnp => tnp.token.children && tnp.token.children.length)
                    .map(tnp => toTokensAndPositions.call(this, tnp.token.children, tnp.begin, tnp.end)));
            }).call(this, tokens);
            const diagnostics = [];
            tokensAndPositions.filter(tnp => tnp.token.type === 'image' && tnp.token.attrGet('src'))
                .map(inp => {
                const src = inp.token.attrGet('src');
                const begin = text.indexOf(src, inp.begin);
                if (begin !== -1 && begin < inp.end) {
                    this.addDiagnostics(diagnostics, document, begin, begin + src.length, src, Context.MARKDOWN, info);
                }
                else {
                    const content = inp.token.content;
                    const begin = text.indexOf(content, inp.begin);
                    if (begin !== -1 && begin < inp.end) {
                        this.addDiagnostics(diagnostics, document, begin, begin + content.length, src, Context.MARKDOWN, info);
                    }
                }
            });
            let svgStart;
            for (const tnp of tokensAndPositions) {
                if (tnp.token.type === 'text' && tnp.token.content) {
                    const parse5 = await Promise.resolve().then(() => require('parse5'));
                    const parser = new parse5.SAXParser({ locationInfo: true });
                    parser.on('startTag', (name, attrs, _selfClosing, location) => {
                        if (name === 'img') {
                            const src = attrs.find(a => a.name === 'src');
                            if (src && src.value && location) {
                                const begin = text.indexOf(src.value, tnp.begin + location.startOffset);
                                if (begin !== -1 && begin < tnp.end) {
                                    this.addDiagnostics(diagnostics, document, begin, begin + src.value.length, src.value, Context.MARKDOWN, info);
                                }
                            }
                        }
                        else if (name === 'svg' && location) {
                            const begin = tnp.begin + location.startOffset;
                            const end = tnp.begin + location.endOffset;
                            const range = new vscode_1.Range(document.positionAt(begin), document.positionAt(end));
                            svgStart = new vscode_1.Diagnostic(range, embeddedSvgsNotValid, vscode_1.DiagnosticSeverity.Warning);
                            diagnostics.push(svgStart);
                        }
                    });
                    parser.on('endTag', (name, location) => {
                        if (name === 'svg' && svgStart && location) {
                            const end = tnp.begin + location.endOffset;
                            svgStart.range = new vscode_1.Range(svgStart.range.start, document.positionAt(end));
                        }
                    });
                    parser.write(tnp.token.content);
                    parser.end();
                }
            }
            this.diagnosticsCollection.set(document.uri, diagnostics);
        }
    }
    locateToken(text, begin, end, token, content) {
        if (content) {
            const tokenBegin = text.indexOf(content, begin);
            if (tokenBegin !== -1) {
                const tokenEnd = tokenBegin + content.length;
                if (tokenEnd <= end) {
                    begin = tokenEnd;
                    return {
                        token,
                        begin: tokenBegin,
                        end: tokenEnd
                    };
                }
            }
        }
        return undefined;
    }
    readPackageJsonInfo(folder, tree) {
        const engine = tree && jsonc_parser_1.findNodeAtLocation(tree, ['engines', 'vscode']);
        const repo = tree && jsonc_parser_1.findNodeAtLocation(tree, ['repository', 'url']);
        const uri = repo && parseUri(repo.value);
        const info = {
            isExtension: !!(engine && engine.type === 'string'),
            hasHttpsRepository: !!(repo && repo.type === 'string' && repo.value && uri && uri.scheme.toLowerCase() === 'https'),
            repository: uri
        };
        const str = folder.toString();
        const oldInfo = this.folderToPackageJsonInfo[str];
        if (oldInfo && (oldInfo.isExtension !== info.isExtension || oldInfo.hasHttpsRepository !== info.hasHttpsRepository)) {
            this.packageJsonChanged(folder); // clears this.folderToPackageJsonInfo[str]
        }
        this.folderToPackageJsonInfo[str] = info;
        return info;
    }
    async loadPackageJson(folder) {
        if (folder.scheme === 'git') { // #36236
            return undefined;
        }
        const file = folder.with({ path: path.posix.join(folder.path, 'package.json') });
        try {
            const document = await vscode_1.workspace.openTextDocument(file);
            return jsonc_parser_1.parseTree(document.getText());
        }
        catch (err) {
            return undefined;
        }
    }
    packageJsonChanged(folder) {
        delete this.folderToPackageJsonInfo[folder.toString()];
        const str = folder.toString().toLowerCase();
        vscode_1.workspace.textDocuments.filter(document => this.getUriFolder(document.uri).toString().toLowerCase() === str)
            .forEach(document => this.queueReadme(document));
    }
    getUriFolder(uri) {
        return uri.with({ path: path.posix.dirname(uri.path) });
    }
    addDiagnostics(diagnostics, document, begin, end, src, context, info) {
        const hasScheme = /^\w[\w\d+.-]*:/.test(src);
        const uri = parseUri(src, info.repository ? info.repository.toString() : document.uri.toString());
        if (!uri) {
            return;
        }
        const scheme = uri.scheme.toLowerCase();
        if (hasScheme && scheme !== 'https' && scheme !== 'data') {
            const range = new vscode_1.Range(document.positionAt(begin), document.positionAt(end));
            diagnostics.push(new vscode_1.Diagnostic(range, httpsRequired, vscode_1.DiagnosticSeverity.Warning));
        }
        if (hasScheme && scheme === 'data') {
            const range = new vscode_1.Range(document.positionAt(begin), document.positionAt(end));
            diagnostics.push(new vscode_1.Diagnostic(range, dataUrlsNotValid, vscode_1.DiagnosticSeverity.Warning));
        }
        if (!hasScheme && !info.hasHttpsRepository) {
            const range = new vscode_1.Range(document.positionAt(begin), document.positionAt(end));
            let message = (() => {
                switch (context) {
                    case Context.ICON: return relativeIconUrlRequiresHttpsRepository;
                    case Context.BADGE: return relativeBadgeUrlRequiresHttpsRepository;
                    default: return relativeUrlRequiresHttpsRepository;
                }
            })();
            diagnostics.push(new vscode_1.Diagnostic(range, message, vscode_1.DiagnosticSeverity.Warning));
        }
        if (endsWith(uri.path.toLowerCase(), '.svg') && allowedBadgeProviders.indexOf(uri.authority.toLowerCase()) === -1) {
            const range = new vscode_1.Range(document.positionAt(begin), document.positionAt(end));
            diagnostics.push(new vscode_1.Diagnostic(range, svgsNotValid, vscode_1.DiagnosticSeverity.Warning));
        }
    }
    clear(document) {
        this.diagnosticsCollection.delete(document.uri);
        this.packageJsonQ.delete(document);
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.ExtensionLinter = ExtensionLinter;
function endsWith(haystack, needle) {
    let diff = haystack.length - needle.length;
    if (diff > 0) {
        return haystack.indexOf(needle, diff) === diff;
    }
    else if (diff === 0) {
        return haystack === needle;
    }
    else {
        return false;
    }
}
function parseUri(src, base, retry = true) {
    try {
        let url = new url_1.URL(src, base);
        return vscode_1.Uri.parse(url.toString());
    }
    catch (err) {
        if (retry) {
            return parseUri(encodeURI(src), base, false);
        }
        else {
            return null;
        }
    }
}
//# sourceMappingURL=extensionLinter.js.map