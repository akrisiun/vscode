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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/telemetry/common/telemetry", "vs/base/common/uri", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/environment/common/environmentService"], function (require, exports, dom_1, event_1, lifecycle_1, environment_1, telemetry_1, uri_1, webviewWorkbenchService_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WebviewMessageChannels;
    (function (WebviewMessageChannels) {
        WebviewMessageChannels["onmessage"] = "onmessage";
        WebviewMessageChannels["didClickLink"] = "did-click-link";
        WebviewMessageChannels["didScroll"] = "did-scroll";
        WebviewMessageChannels["didFocus"] = "did-focus";
        WebviewMessageChannels["didBlur"] = "did-blur";
        WebviewMessageChannels["doUpdateState"] = "do-update-state";
        WebviewMessageChannels["doReload"] = "do-reload";
        WebviewMessageChannels["loadResource"] = "load-resource";
        WebviewMessageChannels["loadLocalhost"] = "load-localhost";
        WebviewMessageChannels["webviewReady"] = "webview-ready";
    })(WebviewMessageChannels = exports.WebviewMessageChannels || (exports.WebviewMessageChannels = {}));
    let BaseWebview = class BaseWebview extends lifecycle_1.Disposable {
        constructor(
        // TODO: matb, this should not be protected. The only reason it needs to be is that the base class ends up using it in the call to createElement
        id, options, contentOptions, webviewThemeDataProvider, _telemetryService, _environementService, workbenchEnvironmentService) {
            super();
            this.id = id;
            this.webviewThemeDataProvider = webviewThemeDataProvider;
            this._telemetryService = _telemetryService;
            this._environementService = _environementService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._hasAlertedAboutMissingCsp = false;
            this.content = {
                html: '',
                options: contentOptions,
                state: undefined
            };
            this._element = this.createElement(options);
            this._ready = new Promise(resolve => {
                const subscription = this._register(this.on("webview-ready" /* webviewReady */, () => {
                    if (this.element) {
                        dom_1.addClass(this.element, 'ready');
                    }
                    subscription.dispose();
                    resolve();
                }));
            });
            this._register(this.on('no-csp-found', () => {
                this.handleNoCspFound();
            }));
            this._register(this.on("did-click-link" /* didClickLink */, (uri) => {
                this._onDidClickLink.fire(uri_1.URI.parse(uri));
            }));
            this._register(this.on("onmessage" /* onmessage */, (data) => {
                this._onMessage.fire(data);
            }));
            this._register(this.on("did-scroll" /* didScroll */, (scrollYPercentage) => {
                this._onDidScroll.fire({ scrollYPercentage: scrollYPercentage });
            }));
            this._register(this.on("do-reload" /* doReload */, () => {
                this.reload();
            }));
            this._register(this.on("do-update-state" /* doUpdateState */, (state) => {
                this.state = state;
                this._onDidUpdateState.fire(state);
            }));
            this._register(this.on("did-focus" /* didFocus */, () => {
                this.handleFocusChange(true);
            }));
            this._register(this.on("did-blur" /* didBlur */, () => {
                this.handleFocusChange(false);
            }));
            this._register(this.on('did-keydown', (data) => {
                // Electron: workaround for https://github.com/electron/electron/issues/14258
                // We have to detect keyboard events in the <webview> and dispatch them to our
                // keybinding service because these events do not bubble to the parent window anymore.
                this.handleKeyDown(data);
            }));
            this.style();
            this._register(webviewThemeDataProvider.onThemeDataChanged(this.style, this));
        }
        get element() { return this._element; }
        get focused() { return this._focused; }
        dispose() {
            if (this.element) {
                this.element.remove();
            }
            this._element = undefined;
            super.dispose();
        }
        sendMessage(data) {
            this._send('message', data);
        }
        _send(channel, data) {
            this._ready
                .then(() => this.postMessage(channel, data))
                .catch(err => console.error(err));
        }
        handleNoCspFound() {
            if (this._hasAlertedAboutMissingCsp) {
                return;
            }
            this._hasAlertedAboutMissingCsp = true;
            if (this.extension && this.extension.id) {
                if (this._environementService.isExtensionDevelopment) {
                    this._onMissingCsp.fire(this.extension.id);
                }
                this._telemetryService.publicLog2('webviewMissingCsp', {
                    extension: this.extension.id.value
                });
            }
        }
        reload() {
            this.doUpdateContent();
        }
        set html(value) {
            this.content = {
                html: value,
                options: this.content.options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        set contentOptions(options) {
            if (webviewWorkbenchService_1.areWebviewInputOptionsEqual(options, this.content.options)) {
                return;
            }
            this.content = {
                html: this.content.html,
                options: options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        set state(state) {
            this.content = {
                html: this.content.html,
                options: this.content.options,
                state,
            };
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        doUpdateContent() {
            this._send('content', Object.assign({ contents: this.content.html, options: this.content.options, state: this.content.state }, this.extraContentOptions));
        }
        style() {
            const { styles, activeTheme } = this.webviewThemeDataProvider.getWebviewThemeData();
            this._send('styles', { styles, activeTheme });
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
        }
        handleKeyDown(event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent('keydown', event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this.element,
            });
            // And re-dispatch
            window.dispatchEvent(emulatedKeyboardEvent);
        }
    };
    BaseWebview = __decorate([
        __param(4, telemetry_1.ITelemetryService),
        __param(5, environment_1.IEnvironmentService),
        __param(6, environmentService_1.IWorkbenchEnvironmentService)
    ], BaseWebview);
    exports.BaseWebview = BaseWebview;
});
//# sourceMappingURL=baseWebviewElement.js.map