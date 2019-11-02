/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/decorators", "vs/base/common/uri", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/common/editor"], function (require, exports, dom, decorators_1, uri_1, lifecycle_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const WebviewPanelResourceScheme = 'webview-panel';
    class WebviewIconsManager {
        constructor() {
            this._icons = new Map();
        }
        get _styleElement() {
            const element = dom.createStyleSheet();
            element.className = 'webview-icons';
            return element;
        }
        setIcons(webviewId, iconPath, lifecycleService) {
            if (iconPath) {
                this._icons.set(webviewId, iconPath);
            }
            else {
                this._icons.delete(webviewId);
            }
            this.updateStyleSheet(lifecycleService);
        }
        async updateStyleSheet(lifecycleService) {
            await lifecycleService.when(1 /* Starting */);
            try {
                const cssRules = [];
                this._icons.forEach((value, key) => {
                    const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                    if (uri_1.URI.isUri(value)) {
                        cssRules.push(`${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value)}; }`);
                    }
                    else {
                        cssRules.push(`.vs ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.light)}; }`);
                        cssRules.push(`.vs-dark ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.dark)}; }`);
                    }
                });
                this._styleElement.innerHTML = cssRules.join('\n');
            }
            catch (_a) {
                // noop
            }
        }
    }
    __decorate([
        decorators_1.memoize
    ], WebviewIconsManager.prototype, "_styleElement", null);
    let WebviewInput = class WebviewInput extends editor_1.EditorInput {
        constructor(id, viewType, name, webview, lifecycleService) {
            super();
            this.id = id;
            this.viewType = viewType;
            this.lifecycleService = lifecycleService;
            this._name = name;
            this._webview = webview.map(value => this._register(value.acquire())); // The input owns this webview
        }
        getTypeId() {
            return WebviewInput.typeId;
        }
        getResource() {
            return uri_1.URI.from({
                scheme: WebviewPanelResourceScheme,
                path: `webview-panel/webview-${this.id}`
            });
        }
        getName() {
            return this._name;
        }
        getTitle(_verbosity) {
            return this.getName();
        }
        getDescription() {
            return undefined;
        }
        setName(value) {
            this._name = value;
            this._onDidChangeLabel.fire();
        }
        get webview() {
            return this._webview.getValue();
        }
        get extension() {
            return this._webview.getValue().extension;
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            WebviewInput.iconsManager.setIcons(this.id, value, this.lifecycleService);
        }
        matches(other) {
            return other === this;
        }
        get group() {
            return this._group;
        }
        updateGroup(group) {
            this._group = group;
        }
        async resolve() {
            return new editor_1.EditorModel();
        }
        supportsSplitEditor() {
            return false;
        }
    };
    WebviewInput.typeId = 'workbench.editors.webviewInput';
    WebviewInput.iconsManager = new WebviewIconsManager();
    WebviewInput = __decorate([
        __param(4, lifecycle_1.ILifecycleService)
    ], WebviewInput);
    exports.WebviewInput = WebviewInput;
});
//# sourceMappingURL=webviewEditorInput.js.map