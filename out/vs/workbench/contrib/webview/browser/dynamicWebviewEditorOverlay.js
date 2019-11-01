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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, decorators_1, event_1, lifecycle_1, webview_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Webview editor overlay that creates and destroys the underlying webview as needed.
     */
    let DynamicWebviewEditorOverlay = class DynamicWebviewEditorOverlay extends lifecycle_1.Disposable {
        constructor(id, options, _contentOptions, _layoutService, _webviewService) {
            super();
            this.id = id;
            this.options = options;
            this._contentOptions = _contentOptions;
            this._layoutService = _layoutService;
            this._webviewService = _webviewService;
            this._pendingMessages = new Set();
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewEvents = this._register(new lifecycle_1.DisposableStore());
            this._html = '';
            this._initialScrollProgress = 0;
            this._state = undefined;
            this._owner = undefined;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._register(lifecycle_1.toDisposable(() => this.container.remove()));
        }
        get container() {
            const container = document.createElement('div');
            container.id = `webview-${this.id}`;
            container.style.visibility = 'hidden';
            this._layoutService.getContainer("workbench.parts.editor" /* EDITOR_PART */).appendChild(container);
            return container;
        }
        claim(owner) {
            this._owner = owner;
            this.show();
        }
        release(owner) {
            if (this._owner !== owner) {
                return;
            }
            this._owner = undefined;
            this.container.style.visibility = 'hidden';
            if (!this.options.retainContextWhenHidden) {
                this._webview.clear();
                this._webviewEvents.clear();
            }
        }
        layoutWebviewOverElement(element, dimension) {
            if (!this.container || !this.container.parentElement) {
                return;
            }
            const frameRect = element.getBoundingClientRect();
            const containerRect = this.container.parentElement.getBoundingClientRect();
            this.container.style.position = 'absolute';
            this.container.style.top = `${frameRect.top - containerRect.top}px`;
            this.container.style.left = `${frameRect.left - containerRect.left}px`;
            this.container.style.width = `${dimension ? dimension.width : frameRect.width}px`;
            this.container.style.height = `${dimension ? dimension.height : frameRect.height}px`;
        }
        show() {
            if (!this._webview.value) {
                const webview = this._webviewService.createWebview(this.id, this.options, this._contentOptions);
                this._webview.value = webview;
                webview.state = this._state;
                webview.html = this._html;
                webview.extension = this._extension;
                if (this.options.tryRestoreScrollPosition) {
                    webview.initialScrollProgress = this._initialScrollProgress;
                }
                this._webview.value.mountTo(this.container);
                this._webviewEvents.clear();
                webview.onDidFocus(() => { this._onDidFocus.fire(); }, undefined, this._webviewEvents);
                webview.onDidClickLink(x => { this._onDidClickLink.fire(x); }, undefined, this._webviewEvents);
                webview.onMessage(x => { this._onMessage.fire(x); }, undefined, this._webviewEvents);
                webview.onMissingCsp(x => { this._onMissingCsp.fire(x); }, undefined, this._webviewEvents);
                webview.onDidScroll(x => {
                    this._initialScrollProgress = x.scrollYPercentage;
                    this._onDidScroll.fire(x);
                }, undefined, this._webviewEvents);
                webview.onDidUpdateState(state => {
                    this._state = state;
                    this._onDidUpdateState.fire(state);
                }, undefined, this._webviewEvents);
                this._pendingMessages.forEach(msg => webview.sendMessage(msg));
                this._pendingMessages.clear();
            }
            this.container.style.visibility = 'visible';
        }
        get html() { return this._html; }
        set html(value) {
            this._html = value;
            this.withWebview(webview => webview.html = value);
        }
        get initialScrollProgress() { return this._initialScrollProgress; }
        set initialScrollProgress(value) {
            this._initialScrollProgress = value;
            this.withWebview(webview => webview.initialScrollProgress = value);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this.withWebview(webview => webview.state = value);
        }
        get contentOptions() { return this._contentOptions; }
        set contentOptions(value) {
            this._contentOptions = value;
            this.withWebview(webview => webview.contentOptions = value);
        }
        get extension() { return this._extension; }
        set extension(value) {
            this._extension = value;
            this.withWebview(webview => webview.extension = value);
        }
        sendMessage(data) {
            if (this._webview.value) {
                this._webview.value.sendMessage(data);
            }
            else {
                this._pendingMessages.add(data);
            }
        }
        update(html, options, retainContextWhenHidden) {
            this._contentOptions = options;
            this._html = html;
            this.withWebview(webview => {
                webview.update(html, options, retainContextWhenHidden);
            });
        }
        layout() { this.withWebview(webview => webview.layout()); }
        focus() { this.withWebview(webview => webview.focus()); }
        reload() { this.withWebview(webview => webview.reload()); }
        showFind() { this.withWebview(webview => webview.showFind()); }
        hideFind() { this.withWebview(webview => webview.hideFind()); }
        runFindAction(previous) { this.withWebview(webview => webview.runFindAction(previous)); }
        getInnerWebview() {
            return this._webview.value;
        }
        withWebview(f) {
            if (this._webview.value) {
                f(this._webview.value);
            }
        }
    };
    __decorate([
        decorators_1.memoize
    ], DynamicWebviewEditorOverlay.prototype, "container", null);
    DynamicWebviewEditorOverlay = __decorate([
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, webview_1.IWebviewService)
    ], DynamicWebviewEditorOverlay);
    exports.DynamicWebviewEditorOverlay = DynamicWebviewEditorOverlay;
});
//# sourceMappingURL=dynamicWebviewEditorOverlay.js.map