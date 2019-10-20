"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const dispose_1 = require("../util/dispose");
const nls = require("vscode-nls");
const topmostLineMonitor_1 = require("../util/topmostLineMonitor");
const file_1 = require("../util/file");
const openDocumentLink_1 = require("../commands/openDocumentLink");
const resources_1 = require("../util/resources");
const localize = nls.loadMessageBundle();
class PreviewDocumentVersion {
    constructor(resource, version) {
        this.resource = resource;
        this.version = version;
    }
    equals(other) {
        return this.resource.fsPath === other.resource.fsPath
            && this.version === other.version;
    }
}
exports.PreviewDocumentVersion = PreviewDocumentVersion;
class MarkdownPreview extends dispose_1.Disposable {
    constructor(webview, resource, locked, _resourceColumn, _contentProvider, _previewConfigurations, _logger, topmostLineMonitor, _contributionProvider) {
        super();
        this._resourceColumn = _resourceColumn;
        this._contentProvider = _contentProvider;
        this._previewConfigurations = _previewConfigurations;
        this._logger = _logger;
        this._contributionProvider = _contributionProvider;
        this.line = undefined;
        this.firstUpdate = true;
        this.forceUpdate = false;
        this.isScrolling = false;
        this._disposed = false;
        this.imageInfo = [];
        this._onDisposeEmitter = this._register(new vscode.EventEmitter());
        this.onDispose = this._onDisposeEmitter.event;
        this._onDidChangeViewStateEmitter = this._register(new vscode.EventEmitter());
        this.onDidChangeViewState = this._onDidChangeViewStateEmitter.event;
        this._resource = resource;
        this._locked = locked;
        this.editor = webview;
        this._register(this.editor.onDidDispose(() => {
            this.dispose();
        }));
        this._register(this.editor.onDidChangeViewState(e => {
            this._onDidChangeViewStateEmitter.fire(e);
        }));
        this._register(_contributionProvider.onContributionsChanged(() => {
            setImmediate(() => this.refresh());
        }));
        this._register(this.editor.webview.onDidReceiveMessage((e) => {
            if (e.source !== this._resource.toString()) {
                return;
            }
            switch (e.type) {
                case 'cacheImageSizes':
                    this.onCacheImageSizes(e.body);
                    break;
                case 'revealLine':
                    this.onDidScrollPreview(e.body.line);
                    break;
                case 'didClick':
                    this.onDidClickPreview(e.body.line);
                    break;
                case 'openLink':
                    this.onDidClickPreviewLink(e.body.href);
                    break;
                case 'showPreviewSecuritySelector':
                    vscode.commands.executeCommand('markdown.showPreviewSecuritySelector', e.source);
                    break;
                case 'previewStyleLoadError':
                    vscode.window.showWarningMessage(localize('onPreviewStyleLoadError', "Could not load 'markdown.styles': {0}", e.body.unloadedStyles.join(', ')));
                    break;
            }
        }));
        this._register(vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isPreviewOf(event.document.uri)) {
                this.refresh();
            }
        }));
        this._register(topmostLineMonitor.onDidChangeTopmostLine(event => {
            if (this.isPreviewOf(event.resource)) {
                this.updateForView(event.resource, event.line);
            }
        }));
        this._register(vscode.window.onDidChangeTextEditorSelection(event => {
            if (this.isPreviewOf(event.textEditor.document.uri)) {
                this.postMessage({
                    type: 'onDidChangeTextEditorSelection',
                    line: event.selections[0].active.line,
                    source: this.resource.toString()
                });
            }
        }));
        this._register(vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && file_1.isMarkdownFile(editor.document) && !this._locked) {
                this.update(editor.document.uri);
            }
        }));
    }
    static async revive(webview, state, contentProvider, previewConfigurations, logger, topmostLineMonitor, contributionProvider) {
        const resource = vscode.Uri.parse(state.resource);
        const locked = state.locked;
        const line = state.line;
        const resourceColumn = state.resourceColumn;
        const preview = new MarkdownPreview(webview, resource, locked, resourceColumn, contentProvider, previewConfigurations, logger, topmostLineMonitor, contributionProvider);
        preview.editor.webview.options = MarkdownPreview.getWebviewOptions(resource, contributionProvider.contributions);
        if (!isNaN(line)) {
            preview.line = line;
        }
        await preview.doUpdate();
        return preview;
    }
    static create(resource, previewColumn, resourceColumn, locked, contentProvider, previewConfigurations, logger, topmostLineMonitor, contributionProvider) {
        const webview = vscode.window.createWebviewPanel(MarkdownPreview.viewType, MarkdownPreview.getPreviewTitle(resource, locked), previewColumn, {
            enableFindWidget: true,
            ...MarkdownPreview.getWebviewOptions(resource, contributionProvider.contributions)
        });
        return new MarkdownPreview(webview, resource, locked, resourceColumn, contentProvider, previewConfigurations, logger, topmostLineMonitor, contributionProvider);
    }
    get resource() {
        return this._resource;
    }
    get resourceColumn() {
        return this._resourceColumn;
    }
    get state() {
        return {
            resource: this.resource.toString(),
            locked: this._locked,
            line: this.line,
            resourceColumn: this.resourceColumn,
            imageInfo: this.imageInfo,
            fragment: this.scrollToFragment
        };
    }
    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._onDisposeEmitter.fire();
        this._onDisposeEmitter.dispose();
        this._onDidChangeViewStateEmitter.dispose();
        this.editor.dispose();
        super.dispose();
    }
    update(resource, isRefresh = true) {
        // Reposition scroll preview, position scroll to the top if active text editor
        // doesn't corresponds with preview
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            if (!isRefresh || this._previewConfigurations.loadAndCacheConfiguration(this._resource).scrollEditorWithPreview) {
                if (editor.document.uri.fsPath === resource.fsPath) {
                    this.line = topmostLineMonitor_1.getVisibleLine(editor);
                }
                else {
                    this.line = 0;
                }
            }
        }
        // If we have changed resources, cancel any pending updates
        const isResourceChange = resource.fsPath !== this._resource.fsPath;
        if (isResourceChange) {
            clearTimeout(this.throttleTimer);
            this.throttleTimer = undefined;
        }
        this._resource = resource;
        // Schedule update if none is pending
        if (!this.throttleTimer) {
            if (isResourceChange || this.firstUpdate) {
                this.doUpdate();
            }
            else {
                this.throttleTimer = setTimeout(() => this.doUpdate(), 300);
            }
        }
        this.firstUpdate = false;
    }
    refresh() {
        this.forceUpdate = true;
        this.update(this._resource, true);
    }
    updateConfiguration() {
        if (this._previewConfigurations.hasConfigurationChanged(this._resource)) {
            this.refresh();
        }
    }
    get position() {
        return this.editor.viewColumn;
    }
    matchesResource(otherResource, otherPosition, otherLocked) {
        if (this.position !== otherPosition) {
            return false;
        }
        if (this._locked) {
            return otherLocked && this.isPreviewOf(otherResource);
        }
        else {
            return !otherLocked;
        }
    }
    matches(otherPreview) {
        return this.matchesResource(otherPreview._resource, otherPreview.position, otherPreview._locked);
    }
    reveal(viewColumn) {
        this.editor.reveal(viewColumn);
    }
    toggleLock() {
        this._locked = !this._locked;
        this.editor.title = MarkdownPreview.getPreviewTitle(this._resource, this._locked);
    }
    get iconPath() {
        const root = path.join(this._contributionProvider.extensionPath, 'media');
        return {
            light: vscode.Uri.file(path.join(root, 'preview-light.svg')),
            dark: vscode.Uri.file(path.join(root, 'preview-dark.svg'))
        };
    }
    isPreviewOf(resource) {
        return this._resource.fsPath === resource.fsPath;
    }
    static getPreviewTitle(resource, locked) {
        return locked
            ? localize('lockedPreviewTitle', '[Preview] {0}', path.basename(resource.fsPath))
            : localize('previewTitle', 'Preview {0}', path.basename(resource.fsPath));
    }
    updateForView(resource, topLine) {
        if (!this.isPreviewOf(resource)) {
            return;
        }
        if (this.isScrolling) {
            this.isScrolling = false;
            return;
        }
        if (typeof topLine === 'number') {
            this._logger.log('updateForView', { markdownFile: resource });
            this.line = topLine;
            this.postMessage({
                type: 'updateView',
                line: topLine,
                source: resource.toString()
            });
        }
    }
    postMessage(msg) {
        if (!this._disposed) {
            this.editor.webview.postMessage(msg);
        }
    }
    async doUpdate() {
        if (this._disposed) {
            return;
        }
        const markdownResource = this._resource;
        clearTimeout(this.throttleTimer);
        this.throttleTimer = undefined;
        let document;
        try {
            document = await vscode.workspace.openTextDocument(markdownResource);
        }
        catch (_a) {
            await this.showFileNotFoundError();
            return;
        }
        if (this._disposed) {
            return;
        }
        const pendingVersion = new PreviewDocumentVersion(markdownResource, document.version);
        if (!this.forceUpdate && this.currentVersion && this.currentVersion.equals(pendingVersion)) {
            if (this.line) {
                this.updateForView(markdownResource, this.line);
            }
            return;
        }
        this.forceUpdate = false;
        this.currentVersion = pendingVersion;
        if (this._resource === markdownResource) {
            const self = this;
            const resourceProvider = {
                asWebviewUri: (resource) => {
                    return this.editor.webview.asWebviewUri(resources_1.normalizeResource(markdownResource, resource));
                },
                get cspSource() { return self.editor.webview.cspSource; }
            };
            const content = await this._contentProvider.provideTextDocumentContent(document, resourceProvider, this._previewConfigurations, this.line, this.state);
            // Another call to `doUpdate` may have happened.
            // Make sure we are still updating for the correct document
            if (this.currentVersion && this.currentVersion.equals(pendingVersion)) {
                this.setContent(content);
            }
        }
    }
    static getWebviewOptions(resource, contributions) {
        return {
            enableScripts: true,
            localResourceRoots: MarkdownPreview.getLocalResourceRoots(resource, contributions)
        };
    }
    static getLocalResourceRoots(base, contributions) {
        const baseRoots = Array.from(contributions.previewResourceRoots);
        const folder = vscode.workspace.getWorkspaceFolder(base);
        if (folder) {
            baseRoots.push(folder.uri);
        }
        else if (!base.scheme || base.scheme === 'file') {
            baseRoots.push(vscode.Uri.file(path.dirname(base.fsPath)));
        }
        return baseRoots.map(root => resources_1.normalizeResource(base, root));
    }
    onDidScrollPreview(line) {
        this.line = line;
        const config = this._previewConfigurations.loadAndCacheConfiguration(this._resource);
        if (!config.scrollEditorWithPreview) {
            return;
        }
        for (const editor of vscode.window.visibleTextEditors) {
            if (!this.isPreviewOf(editor.document.uri)) {
                continue;
            }
            this.isScrolling = true;
            const sourceLine = Math.floor(line);
            const fraction = line - sourceLine;
            const text = editor.document.lineAt(sourceLine).text;
            const start = Math.floor(fraction * text.length);
            editor.revealRange(new vscode.Range(sourceLine, start, sourceLine + 1, 0), vscode.TextEditorRevealType.AtTop);
        }
    }
    async onDidClickPreview(line) {
        for (const visibleEditor of vscode.window.visibleTextEditors) {
            if (this.isPreviewOf(visibleEditor.document.uri)) {
                const editor = await vscode.window.showTextDocument(visibleEditor.document, visibleEditor.viewColumn);
                const position = new vscode.Position(line, 0);
                editor.selection = new vscode.Selection(position, position);
                return;
            }
        }
        vscode.workspace.openTextDocument(this._resource)
            .then(vscode.window.showTextDocument)
            .then(undefined, () => {
            vscode.window.showErrorMessage(localize('preview.clickOpenFailed', 'Could not open {0}', this._resource.toString()));
        });
    }
    async showFileNotFoundError() {
        this.setContent(this._contentProvider.provideFileNotFoundContent(this._resource));
    }
    setContent(html) {
        this.editor.title = MarkdownPreview.getPreviewTitle(this._resource, this._locked);
        this.editor.iconPath = this.iconPath;
        this.editor.webview.options = MarkdownPreview.getWebviewOptions(this._resource, this._contributionProvider.contributions);
        this.editor.webview.html = html;
    }
    async onDidClickPreviewLink(href) {
        let [hrefPath, fragment] = decodeURIComponent(href).split('#');
        // We perviously already resolve absolute paths.
        // Now make sure we handle relative file paths
        if (hrefPath[0] !== '/') {
            hrefPath = path.join(path.dirname(this.resource.path), hrefPath);
        }
        const config = vscode.workspace.getConfiguration('markdown', this.resource);
        const openLinks = config.get('preview.openMarkdownLinks', 'inPreview');
        if (openLinks === 'inPreview') {
            const markdownLink = await openDocumentLink_1.resolveLinkToMarkdownFile(hrefPath);
            if (markdownLink) {
                if (fragment) {
                    this.scrollToFragment = fragment;
                }
                this.update(markdownLink);
                return;
            }
        }
        vscode.commands.executeCommand('_markdown.openDocumentLink', { path: hrefPath, fragment, fromResource: this.resource });
    }
    async onCacheImageSizes(imageInfo) {
        this.imageInfo = imageInfo;
    }
}
exports.MarkdownPreview = MarkdownPreview;
MarkdownPreview.viewType = 'markdown.preview';
//# sourceMappingURL=preview.js.map