"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const nls = require("vscode-nls");
const dispose_1 = require("./dispose");
const localize = nls.loadMessageBundle();
class PreviewManager {
    constructor(extensionRoot, sizeStatusBarEntry, zoomStatusBarEntry) {
        this.extensionRoot = extensionRoot;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this._previews = new Set();
    }
    resolve(resource, webviewEditor) {
        const preview = new Preview(this.extensionRoot, resource, webviewEditor, this.sizeStatusBarEntry, this.zoomStatusBarEntry);
        this._previews.add(preview);
        this.setActivePreview(preview);
        webviewEditor.onDidDispose(() => { this._previews.delete(preview); });
        webviewEditor.onDidChangeViewState(() => {
            if (webviewEditor.active) {
                this.setActivePreview(preview);
            }
            else if (this._activePreview === preview && !webviewEditor.active) {
                this.setActivePreview(undefined);
            }
        });
    }
    get activePreview() { return this._activePreview; }
    setActivePreview(value) {
        this._activePreview = value;
        this.setPreviewActiveContext(!!value);
    }
    setPreviewActiveContext(value) {
        vscode.commands.executeCommand('setContext', 'imagePreviewFocus', value);
    }
}
exports.PreviewManager = PreviewManager;
PreviewManager.viewType = 'imagePreview.previewEditor';
class Preview extends dispose_1.Disposable {
    constructor(extensionRoot, resource, webviewEditor, sizeStatusBarEntry, zoomStatusBarEntry) {
        super();
        this.extensionRoot = extensionRoot;
        this.resource = resource;
        this.webviewEditor = webviewEditor;
        this.sizeStatusBarEntry = sizeStatusBarEntry;
        this.zoomStatusBarEntry = zoomStatusBarEntry;
        this.id = `${Date.now()}-${Math.random().toString()}`;
        this._previewState = 1 /* Visible */;
        const resourceRoot = resource.with({
            path: resource.path.replace(/\/[^\/]+?\.\w+$/, '/'),
        });
        webviewEditor.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                resourceRoot,
                extensionRoot,
            ]
        };
        this._register(webviewEditor.webview.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'size':
                    {
                        this._imageSize = message.value;
                        this.update();
                        break;
                    }
                case 'zoom':
                    {
                        this._imageZoom = message.value;
                        this.update();
                        break;
                    }
            }
        }));
        this._register(zoomStatusBarEntry.onDidChangeScale(e => {
            if (this._previewState === 2 /* Active */) {
                this.webviewEditor.webview.postMessage({ type: 'setScale', scale: e.scale });
            }
        }));
        this._register(webviewEditor.onDidChangeViewState(() => {
            this.update();
        }));
        this._register(webviewEditor.onDidDispose(() => {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 0 /* Disposed */;
        }));
        const watcher = this._register(vscode.workspace.createFileSystemWatcher(resource.fsPath));
        this._register(watcher.onDidChange(e => {
            if (e.toString() === this.resource.toString()) {
                this.render();
            }
        }));
        this._register(watcher.onDidDelete(e => {
            if (e.toString() === this.resource.toString()) {
                this.webviewEditor.dispose();
            }
        }));
        this.render();
        this.update();
    }
    zoomIn() {
        if (this._previewState === 2 /* Active */) {
            this.webviewEditor.webview.postMessage({ type: 'zoomIn' });
        }
    }
    zoomOut() {
        if (this._previewState === 2 /* Active */) {
            this.webviewEditor.webview.postMessage({ type: 'zoomOut' });
        }
    }
    render() {
        if (this._previewState !== 0 /* Disposed */) {
            this.webviewEditor.webview.html = this.getWebiewContents();
        }
    }
    update() {
        if (this._previewState === 0 /* Disposed */) {
            return;
        }
        if (this.webviewEditor.active) {
            this._previewState = 2 /* Active */;
            this.sizeStatusBarEntry.show(this.id, this._imageSize || '');
            this.zoomStatusBarEntry.show(this.id, this._imageZoom || 'fit');
        }
        else {
            if (this._previewState === 2 /* Active */) {
                this.sizeStatusBarEntry.hide(this.id);
                this.zoomStatusBarEntry.hide(this.id);
            }
            this._previewState = 1 /* Visible */;
        }
        this.webviewEditor.webview.postMessage({ type: 'setActive', value: this.webviewEditor.active });
    }
    getWebiewContents() {
        const version = Date.now().toString();
        const settings = {
            isMac: process.platform === 'darwin',
            src: this.getResourcePath(this.webviewEditor, this.resource, version),
        };
        const nonce = Date.now().toString();
        return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>Image Preview</title>

	<link rel="stylesheet" href="${escapeAttribute(this.extensionResource('/media/main.css'))}" type="text/css" media="screen" nonce="${nonce}">

	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data: ${this.webviewEditor.webview.cspSource}; script-src 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';">
	<meta id="image-preview-settings" data-settings="${escapeAttribute(JSON.stringify(settings))}">
</head>
<body class="container image scale-to-fit loading">
	<div class="loading-indicator"></div>
	<div class="image-load-error-message">${localize('preview.imageLoadError', "An error occurred while loading the image")}</div>
	<script src="${escapeAttribute(this.extensionResource('/media/main.js'))}" nonce="${nonce}"></script>
</body>
</html>`;
    }
    getResourcePath(webviewEditor, resource, version) {
        switch (resource.scheme) {
            case 'data':
                return encodeURI(resource.toString(true));
            case 'git':
                // Show blank image
                return encodeURI('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42gEFAPr/AP///wAI/AL+Sr4t6gAAAABJRU5ErkJggg==');
            default:
                return encodeURI(webviewEditor.webview.asWebviewUri(resource).toString(true) + `?version=${version}`);
        }
    }
    extensionResource(path) {
        return this.webviewEditor.webview.asWebviewUri(this.extensionRoot.with({
            path: this.extensionRoot.path + path
        }));
    }
}
function escapeAttribute(value) {
    return value.toString().replace(/"/g, '&quot;');
}
//# sourceMappingURL=preview.js.map