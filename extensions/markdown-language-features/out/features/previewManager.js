"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const dispose_1 = require("../util/dispose");
const topmostLineMonitor_1 = require("../util/topmostLineMonitor");
const preview_1 = require("./preview");
const previewConfig_1 = require("./previewConfig");
class MarkdownPreviewManager extends dispose_1.Disposable {
    constructor(_contentProvider, _logger, _contributions) {
        super();
        this._contentProvider = _contentProvider;
        this._logger = _logger;
        this._contributions = _contributions;
        this._topmostLineMonitor = new topmostLineMonitor_1.MarkdownFileTopmostLineMonitor();
        this._previewConfigurations = new previewConfig_1.MarkdownPreviewConfigurationManager();
        this._previews = [];
        this._activePreview = undefined;
        this._register(vscode.window.registerWebviewPanelSerializer(preview_1.MarkdownPreview.viewType, this));
    }
    dispose() {
        super.dispose();
        dispose_1.disposeAll(this._previews);
    }
    refresh() {
        for (const preview of this._previews) {
            preview.refresh();
        }
    }
    updateConfiguration() {
        for (const preview of this._previews) {
            preview.updateConfiguration();
        }
    }
    preview(resource, previewSettings) {
        let preview = this.getExistingPreview(resource, previewSettings);
        if (preview) {
            preview.reveal(previewSettings.previewColumn);
        }
        else {
            preview = this.createNewPreview(resource, previewSettings);
        }
        preview.update(resource);
    }
    get activePreviewResource() {
        return this._activePreview && this._activePreview.resource;
    }
    get activePreviewResourceColumn() {
        return this._activePreview && this._activePreview.resourceColumn;
    }
    toggleLock() {
        const preview = this._activePreview;
        if (preview) {
            preview.toggleLock();
            // Close any previews that are now redundant, such as having two dynamic previews in the same editor group
            for (const otherPreview of this._previews) {
                if (otherPreview !== preview && preview.matches(otherPreview)) {
                    otherPreview.dispose();
                }
            }
        }
    }
    async deserializeWebviewPanel(webview, state) {
        const preview = await preview_1.MarkdownPreview.revive(webview, state, this._contentProvider, this._previewConfigurations, this._logger, this._topmostLineMonitor, this._contributions);
        this.registerPreview(preview);
    }
    getExistingPreview(resource, previewSettings) {
        return this._previews.find(preview => preview.matchesResource(resource, previewSettings.previewColumn, previewSettings.locked));
    }
    createNewPreview(resource, previewSettings) {
        const preview = preview_1.MarkdownPreview.create(resource, previewSettings.previewColumn, previewSettings.resourceColumn, previewSettings.locked, this._contentProvider, this._previewConfigurations, this._logger, this._topmostLineMonitor, this._contributions);
        this.setPreviewActiveContext(true);
        this._activePreview = preview;
        return this.registerPreview(preview);
    }
    registerPreview(preview) {
        this._previews.push(preview);
        preview.onDispose(() => {
            const existing = this._previews.indexOf(preview);
            if (existing === -1) {
                return;
            }
            this._previews.splice(existing, 1);
            if (this._activePreview === preview) {
                this.setPreviewActiveContext(false);
                this._activePreview = undefined;
            }
        });
        preview.onDidChangeViewState(({ webviewPanel }) => {
            dispose_1.disposeAll(this._previews.filter(otherPreview => preview !== otherPreview && preview.matches(otherPreview)));
            this.setPreviewActiveContext(webviewPanel.active);
            this._activePreview = webviewPanel.active ? preview : undefined;
        });
        return preview;
    }
    setPreviewActiveContext(value) {
        vscode.commands.executeCommand('setContext', MarkdownPreviewManager.markdownPreviewActiveContextKey, value);
    }
}
exports.MarkdownPreviewManager = MarkdownPreviewManager;
MarkdownPreviewManager.markdownPreviewActiveContextKey = 'markdownPreviewFocus';
//# sourceMappingURL=previewManager.js.map