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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/remote/common/tunnel", "vs/platform/theme/common/themeService", "vs/workbench/contrib/webview/browser/webviewEditorService", "vs/workbench/contrib/webview/common/portMapping", "vs/workbench/contrib/webview/common/resourceLoader", "vs/workbench/contrib/webview/common/themeing", "vs/workbench/services/environment/common/environmentService"], function (require, exports, dom_1, event_1, lifecycle_1, platform_1, uri_1, configuration_1, files_1, tunnel_1, themeService_1, webviewEditorService_1, portMapping_1, resourceLoader_1, themeing_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let IFrameWebview = class IFrameWebview extends lifecycle_1.Disposable {
        constructor(id, options, contentOptions, themeService, tunnelService, environmentService, fileService, _configurationService) {
            super();
            this.id = id;
            this.environmentService = environmentService;
            this.fileService = fileService;
            this._configurationService = _configurationService;
            this._focused = false;
            this.initialScrollProgress = 0;
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
            if (!this.useExternalEndpoint && (!environmentService.options || typeof environmentService.webviewExternalEndpoint !== 'string')) {
                throw new Error('To use iframe based webviews, you must configure `environmentService.webviewExternalEndpoint`');
            }
            this._portMappingManager = this._register(new portMapping_1.WebviewPortMappingManager(() => this.extension ? this.extension.location : undefined, () => this.content.options.portMapping || [], tunnelService));
            this.content = {
                html: '',
                options: contentOptions,
                state: undefined
            };
            this.element = document.createElement('iframe');
            this.element.className = `webview ${options.customClasses}`;
            this.element.sandbox.add('allow-scripts', 'allow-same-origin');
            this.element.setAttribute('src', `${this.externalEndpoint}/index.html?id=${this.id}`);
            this.element.style.border = 'none';
            this.element.style.width = '100%';
            this.element.style.height = '100%';
            this._register(dom_1.addDisposableListener(window, 'message', e => {
                if (!e || !e.data || e.data.target !== this.id) {
                    return;
                }
                switch (e.data.channel) {
                    case 'onmessage':
                        if (e.data.data) {
                            this._onMessage.fire(e.data.data);
                        }
                        return;
                    case 'did-click-link':
                        const uri = e.data.data;
                        this._onDidClickLink.fire(uri_1.URI.parse(uri));
                        return;
                    case 'did-scroll':
                        // if (e.args && typeof e.args[0] === 'number') {
                        // 	this._onDidScroll.fire({ scrollYPercentage: e.args[0] });
                        // }
                        return;
                    case 'do-reload':
                        this.reload();
                        return;
                    case 'do-update-state':
                        const state = e.data.data;
                        this.state = state;
                        this._onDidUpdateState.fire(state);
                        return;
                    case 'did-focus':
                        this.handleFocusChange(true);
                        return;
                    case 'did-blur':
                        this.handleFocusChange(false);
                        return;
                    case 'load-resource':
                        {
                            const rawPath = e.data.data.path;
                            const normalizedPath = decodeURIComponent(rawPath);
                            const uri = uri_1.URI.parse(normalizedPath.replace(/^\/(\w+)\/(.+)$/, (_, scheme, path) => scheme + ':/' + path));
                            this.loadResource(rawPath, uri);
                            return;
                        }
                    case 'load-localhost':
                        {
                            this.localLocalhost(e.data.data.origin);
                            return;
                        }
                }
            }));
            this._ready = new Promise(resolve => {
                const subscription = this._register(dom_1.addDisposableListener(window, 'message', (e) => {
                    if (e.data && e.data.target === this.id && e.data.channel === 'webview-ready') {
                        if (this.element) {
                            dom_1.addClass(this.element, 'ready');
                        }
                        subscription.dispose();
                        resolve();
                    }
                }));
            });
            this.style(themeService.getTheme());
            this._register(themeService.onThemeChange(this.style, this));
        }
        get externalEndpoint() {
            const endpoint = this.environmentService.webviewExternalEndpoint.replace('{{uuid}}', this.id);
            if (endpoint[endpoint.length - 1] === '/') {
                return endpoint.slice(0, endpoint.length - 1);
            }
            return endpoint;
        }
        get useExternalEndpoint() {
            return platform_1.isWeb || this._configurationService.getValue('webview.experimental.useExternalEndpoint');
        }
        mountTo(parent) {
            if (this.element) {
                parent.appendChild(this.element);
            }
        }
        set contentOptions(options) {
            if (webviewEditorService_1.areWebviewInputOptionsEqual(options, this.content.options)) {
                return;
            }
            this.content = {
                html: this.content.html,
                options: options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        set html(value) {
            this.content = {
                html: this.preprocessHtml(value),
                options: this.content.options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        preprocessHtml(value) {
            return value.replace(/(["'])vscode-resource:([^\s'"]+?)(["'])/gi, (_, startQuote, path, endQuote) => `${startQuote}${this.externalEndpoint}/vscode-resource/file${path}${endQuote}`);
        }
        update(html, options, retainContextWhenHidden) {
            if (retainContextWhenHidden && html === this.content.html && webviewEditorService_1.areWebviewInputOptionsEqual(options, this.content.options)) {
                return;
            }
            this.content = {
                html: this.preprocessHtml(html),
                options: options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        doUpdateContent() {
            this._send('content', {
                contents: this.content.html,
                options: this.content.options,
                state: this.content.state,
                endpoint: this.externalEndpoint,
            });
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (this._focused) {
                this._onDidFocus.fire();
            }
        }
        sendMessage(data) {
            this._send('message', data);
        }
        layout() {
            // noop
        }
        focus() {
            if (this.element) {
                this.element.focus();
            }
        }
        dispose() {
            if (this.element) {
                if (this.element.parentElement) {
                    this.element.parentElement.removeChild(this.element);
                }
            }
            this.element = undefined;
            super.dispose();
        }
        reload() {
            this.doUpdateContent();
        }
        showFind() {
            throw new Error('Method not implemented.');
        }
        hideFind() {
            throw new Error('Method not implemented.');
        }
        runFindAction(previous) {
            throw new Error('Method not implemented.');
        }
        set state(state) {
            this.content = {
                html: this.content.html,
                options: this.content.options,
                state,
            };
        }
        _send(channel, data) {
            this._ready
                .then(() => {
                if (!this.element) {
                    return;
                }
                this.element.contentWindow.postMessage({
                    channel: channel,
                    args: data
                }, '*');
            })
                .catch(err => console.error(err));
        }
        style(theme) {
            const { styles, activeTheme } = themeing_1.getWebviewThemeData(theme, this._configurationService);
            this._send('styles', { styles, activeTheme });
        }
        async loadResource(requestPath, uri) {
            try {
                const result = await resourceLoader_1.loadLocalResource(uri, this.fileService, this.extension ? this.extension.location : undefined, () => (this.content.options.localResourceRoots || []));
                if (result.type === 'success') {
                    return this._send('did-load-resource', {
                        status: 200,
                        path: requestPath,
                        mime: result.mimeType,
                        data: result.data.buffer
                    });
                }
            }
            catch (_a) {
                // noop
            }
            return this._send('did-load-resource', {
                status: 404,
                path: uri.path
            });
        }
        async localLocalhost(origin) {
            const redirect = await this._portMappingManager.getRedirect(origin);
            return this._send('did-load-localhost', {
                origin,
                location: redirect
            });
        }
    };
    IFrameWebview = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, tunnel_1.ITunnelService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, files_1.IFileService),
        __param(7, configuration_1.IConfigurationService)
    ], IFrameWebview);
    exports.IFrameWebview = IFrameWebview;
});
//# sourceMappingURL=webviewElement.js.map