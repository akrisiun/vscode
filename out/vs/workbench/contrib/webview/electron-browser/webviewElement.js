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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/tunnel", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/webview/common/portMapping", "vs/workbench/contrib/webview/common/resourceLoader", "vs/workbench/contrib/webview/common/themeing", "vs/workbench/contrib/webview/electron-browser/webviewProtocols", "../browser/webviewEditorService", "../browser/webviewFindWidget"], function (require, exports, dom_1, event_1, functional_1, lifecycle_1, platform_1, uri_1, configuration_1, environment_1, files_1, instantiation_1, tunnel_1, telemetry_1, themeService_1, portMapping_1, resourceLoader_1, themeing_1, webviewProtocols_1, webviewEditorService_1, webviewFindWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebviewSession extends lifecycle_1.Disposable {
        constructor(webview) {
            super();
            this._onBeforeRequestDelegates = [];
            this._onHeadersReceivedDelegates = [];
            this._register(dom_1.addDisposableListener(webview, 'did-start-loading', functional_1.once(() => {
                const contents = webview.getWebContents();
                if (!contents) {
                    return;
                }
                contents.session.webRequest.onBeforeRequest(async (details, callback) => {
                    for (const delegate of this._onBeforeRequestDelegates) {
                        const result = await delegate(details);
                        if (typeof result !== 'undefined') {
                            callback(result);
                            return;
                        }
                    }
                    callback({});
                });
                contents.session.webRequest.onHeadersReceived((details, callback) => {
                    for (const delegate of this._onHeadersReceivedDelegates) {
                        const result = delegate(details);
                        if (typeof result !== 'undefined') {
                            callback(result);
                            return;
                        }
                    }
                    callback({ cancel: false, responseHeaders: details.responseHeaders });
                });
            })));
        }
        onBeforeRequest(delegate) {
            this._onBeforeRequestDelegates.push(delegate);
        }
        onHeadersReceived(delegate) {
            this._onHeadersReceivedDelegates.push(delegate);
        }
    }
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        constructor(webview, _getExtensionLocation, _getLocalResourceRoots, _fileService) {
            super();
            this._getExtensionLocation = _getExtensionLocation;
            this._getLocalResourceRoots = _getLocalResourceRoots;
            this._fileService = _fileService;
            this._register(dom_1.addDisposableListener(webview, 'did-start-loading', functional_1.once(() => {
                const contents = webview.getWebContents();
                if (contents) {
                    this.registerProtocols(contents);
                }
            })));
        }
        registerProtocols(contents) {
            if (contents.isDestroyed()) {
                return;
            }
            webviewProtocols_1.registerFileProtocol(contents, resourceLoader_1.WebviewResourceScheme, this._fileService, this._getExtensionLocation(), () => this._getLocalResourceRoots());
        }
    }
    class WebviewPortMappingProvider extends lifecycle_1.Disposable {
        constructor(session, getExtensionLocation, mappings, tunnelService) {
            super();
            this._manager = this._register(new portMapping_1.WebviewPortMappingManager(getExtensionLocation, mappings, tunnelService));
            session.onBeforeRequest(async (details) => {
                const redirect = await this._manager.getRedirect(details.url);
                return redirect ? { redirectURL: redirect } : undefined;
            });
        }
    }
    class WebviewKeyboardHandler extends lifecycle_1.Disposable {
        constructor(_webview) {
            super();
            this._webview = _webview;
            this._ignoreMenuShortcut = false;
            if (this.shouldToggleMenuShortcutsEnablement) {
                this._register(dom_1.addDisposableListener(this._webview, 'did-start-loading', () => {
                    const contents = this.getWebContents();
                    if (contents) {
                        contents.on('before-input-event', (_event, input) => {
                            if (input.type === 'keyDown' && document.activeElement === this._webview) {
                                this._ignoreMenuShortcut = input.control || input.meta;
                                this.setIgnoreMenuShortcuts(this._ignoreMenuShortcut);
                            }
                        });
                    }
                }));
            }
            this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                switch (event.channel) {
                    case 'did-keydown':
                        // Electron: workaround for https://github.com/electron/electron/issues/14258
                        // We have to detect keyboard events in the <webview> and dispatch them to our
                        // keybinding service because these events do not bubble to the parent window anymore.
                        this.handleKeydown(event.args[0]);
                        return;
                    case 'did-focus':
                        this.setIgnoreMenuShortcuts(this._ignoreMenuShortcut);
                        break;
                    case 'did-blur':
                        this.setIgnoreMenuShortcuts(false);
                        return;
                }
            }));
        }
        get shouldToggleMenuShortcutsEnablement() {
            return platform_1.isMacintosh;
        }
        setIgnoreMenuShortcuts(value) {
            if (!this.shouldToggleMenuShortcutsEnablement) {
                return;
            }
            const contents = this.getWebContents();
            if (contents) {
                contents.setIgnoreMenuShortcuts(value);
            }
        }
        getWebContents() {
            const contents = this._webview.getWebContents();
            if (contents && !contents.isDestroyed()) {
                return contents;
            }
            return undefined;
        }
        handleKeydown(event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent('keydown', event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this._webview
            });
            // And re-dispatch
            window.dispatchEvent(emulatedKeyboardEvent);
        }
    }
    let ElectronWebviewBasedWebview = class ElectronWebviewBasedWebview extends lifecycle_1.Disposable {
        constructor(options, contentOptions, instantiationService, themeService, fileService, tunnelService, _configurationService, _telemetryService, _environementService) {
            super();
            this._configurationService = _configurationService;
            this._telemetryService = _telemetryService;
            this._environementService = _environementService;
            this._findStarted = false;
            this._focused = false;
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
            this._hasAlertedAboutMissingCsp = false;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this.content = {
                html: '',
                options: contentOptions,
                state: undefined
            };
            this._webview = document.createElement('webview');
            this._webview.setAttribute('partition', `webview${Date.now()}`);
            this._webview.setAttribute('webpreferences', 'contextIsolation=yes');
            this._webview.className = `webview ${options.customClasses}`;
            this._webview.style.flex = '0 1';
            this._webview.style.width = '0';
            this._webview.style.height = '0';
            this._webview.style.outline = '0';
            this._webview.preload = require.toUrl('./pre/electron-index.js');
            this._webview.src = 'data:text/html;charset=utf-8,%3C%21DOCTYPE%20html%3E%0D%0A%3Chtml%20lang%3D%22en%22%20style%3D%22width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3Chead%3E%0D%0A%09%3Ctitle%3EVirtual%20Document%3C%2Ftitle%3E%0D%0A%3C%2Fhead%3E%0D%0A%3Cbody%20style%3D%22margin%3A%200%3B%20overflow%3A%20hidden%3B%20width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3C%2Fbody%3E%0D%0A%3C%2Fhtml%3E';
            this._ready = new Promise(resolve => {
                const subscription = this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                    if (this._webview && event.channel === 'webview-ready') {
                        // console.info('[PID Webview] ' event.args[0]);
                        dom_1.addClass(this._webview, 'ready'); // can be found by debug command
                        subscription.dispose();
                        resolve();
                    }
                }));
            });
            const session = this._register(new WebviewSession(this._webview));
            this._register(new WebviewProtocolProvider(this._webview, () => this.extension ? this.extension.location : undefined, () => (this.content.options.localResourceRoots || []), fileService));
            this._register(new WebviewPortMappingProvider(session, () => this.extension ? this.extension.location : undefined, () => (this.content.options.portMapping || []), tunnelService));
            this._register(new WebviewKeyboardHandler(this._webview));
            this._register(dom_1.addDisposableListener(this._webview, 'console-message', function (e) {
                console.log(`[Embedded Page] ${e.message}`);
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'dom-ready', () => {
                this.layout();
                // Workaround for https://github.com/electron/electron/issues/14474
                if (this._webview && (this._focused || document.activeElement === this._webview)) {
                    this._webview.blur();
                    this._webview.focus();
                }
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'crashed', () => {
                console.error('embedded page crashed');
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'ipc-message', (event) => {
                if (!this._webview) {
                    return;
                }
                switch (event.channel) {
                    case 'onmessage':
                        if (event.args && event.args.length) {
                            this._onMessage.fire(event.args[0]);
                        }
                        return;
                    case 'did-click-link':
                        const [uri] = event.args;
                        this._onDidClickLink.fire(uri_1.URI.parse(uri));
                        return;
                    case 'synthetic-mouse-event':
                        {
                            const rawEvent = event.args[0];
                            const bounds = this._webview.getBoundingClientRect();
                            try {
                                window.dispatchEvent(new MouseEvent(rawEvent.type, Object.assign(Object.assign({}, rawEvent), { clientX: rawEvent.clientX + bounds.left, clientY: rawEvent.clientY + bounds.top })));
                                return;
                            }
                            catch (_a) {
                                // CustomEvent was treated as MouseEvent so don't do anything - https://github.com/microsoft/vscode/issues/78915
                                return;
                            }
                        }
                    case 'did-set-content':
                        this._webview.style.flex = '';
                        this._webview.style.width = '100%';
                        this._webview.style.height = '100%';
                        this.layout();
                        return;
                    case 'did-scroll':
                        if (event.args && typeof event.args[0] === 'number') {
                            this._onDidScroll.fire({ scrollYPercentage: event.args[0] });
                        }
                        return;
                    case 'do-reload':
                        this.reload();
                        return;
                    case 'do-update-state':
                        const state = event.args[0];
                        this.state = state;
                        this._onDidUpdateState.fire(state);
                        return;
                    case 'did-focus':
                        this.handleFocusChange(true);
                        return;
                    case 'did-blur':
                        this.handleFocusChange(false);
                        return;
                    case 'no-csp-found':
                        this.handleNoCspFound();
                        return;
                }
            }));
            this._register(dom_1.addDisposableListener(this._webview, 'devtools-opened', () => {
                this._send('devtools-opened');
            }));
            if (options.enableFindWidget) {
                this._webviewFindWidget = this._register(instantiationService.createInstance(webviewFindWidget_1.WebviewFindWidget, this));
                this._register(dom_1.addDisposableListener(this._webview, 'found-in-page', e => {
                    this._hasFindResult.fire(e.result.matches > 0);
                }));
            }
            this.style(themeService.getTheme());
            this._register(themeService.onThemeChange(this.style, this));
        }
        mountTo(parent) {
            if (!this._webview) {
                return;
            }
            if (this._webviewFindWidget) {
                parent.appendChild(this._webviewFindWidget.getDomNode());
            }
            parent.appendChild(this._webview);
        }
        dispose() {
            if (this._webview) {
                if (this._webview.parentElement) {
                    this._webview.parentElement.removeChild(this._webview);
                }
                this._webview = undefined;
            }
            if (this._webviewFindWidget) {
                this._webviewFindWidget.dispose();
                this._webviewFindWidget = undefined;
            }
            super.dispose();
        }
        _send(channel, data) {
            this._ready
                .then(() => {
                if (this._webview) {
                    this._webview.send(channel, data);
                }
            })
                .catch(err => console.error(err));
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        set state(state) {
            this.content = {
                html: this.content.html,
                options: this.content.options,
                state,
            };
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
                html: value,
                options: this.content.options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        update(html, options, retainContextWhenHidden) {
            if (retainContextWhenHidden && html === this.content.html && webviewEditorService_1.areWebviewInputOptionsEqual(options, this.content.options)) {
                return;
            }
            this.content = {
                html: html,
                options: options,
                state: this.content.state,
            };
            this.doUpdateContent();
        }
        doUpdateContent() {
            this._send('content', {
                contents: this.content.html,
                options: this.content.options,
                state: this.content.state
            });
        }
        focus() {
            if (!this._webview) {
                return;
            }
            try {
                this._webview.focus();
            }
            catch (_a) {
                // noop
            }
            this._send('focus');
            // Handle focus change programmatically (do not rely on event from <webview>)
            this.handleFocusChange(true);
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
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
        sendMessage(data) {
            this._send('message', data);
        }
        style(theme) {
            const { styles, activeTheme } = themeing_1.getWebviewThemeData(theme, this._configurationService);
            this._send('styles', { styles, activeTheme });
            if (this._webviewFindWidget) {
                this._webviewFindWidget.updateTheme(theme);
            }
        }
        layout() {
            if (!this._webview || this._webview.style.width === '0px') {
                return;
            }
            const contents = this._webview.getWebContents();
            if (!contents || contents.isDestroyed()) {
                return;
            }
            const window = contents.getOwnerBrowserWindow();
            if (!window || !window.webContents || window.webContents.isDestroyed()) {
                return;
            }
            window.webContents.getZoomFactor((factor) => {
                if (contents.isDestroyed()) {
                    return;
                }
                contents.setZoomFactor(factor);
            });
        }
        startFind(value, options) {
            if (!value || !this._webview) {
                return;
            }
            // ensure options is defined without modifying the original
            options = options || {};
            // FindNext must be false for a first request
            const findOptions = {
                forward: options.forward,
                findNext: false,
                matchCase: options.matchCase,
                medialCapitalAsWordStart: options.medialCapitalAsWordStart
            };
            this._findStarted = true;
            this._webview.findInPage(value, findOptions);
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, previous) {
            if (!this._webview) {
                return;
            }
            // Searching with an empty value will throw an exception
            if (!value) {
                return;
            }
            const options = { findNext: true, forward: !previous };
            if (!this._findStarted) {
                this.startFind(value, options);
                return;
            }
            this._webview.findInPage(value, options);
        }
        stopFind(keepSelection) {
            this._hasFindResult.fire(false);
            if (!this._webview) {
                return;
            }
            this._findStarted = false;
            this._webview.stopFindInPage(keepSelection ? 'keepSelection' : 'clearSelection');
        }
        showFind() {
            if (this._webviewFindWidget) {
                this._webviewFindWidget.reveal();
            }
        }
        hideFind() {
            if (this._webviewFindWidget) {
                this._webviewFindWidget.hide();
            }
        }
        runFindAction(previous) {
            if (this._webviewFindWidget) {
                this._webviewFindWidget.find(previous);
            }
        }
        reload() {
            this.doUpdateContent();
        }
        selectAll() {
            if (this._webview) {
                this._webview.selectAll();
            }
        }
        copy() {
            if (this._webview) {
                this._webview.copy();
            }
        }
        paste() {
            if (this._webview) {
                this._webview.paste();
            }
        }
        cut() {
            if (this._webview) {
                this._webview.cut();
            }
        }
        undo() {
            if (this._webview) {
                this._webview.undo();
            }
        }
        redo() {
            if (this._webview) {
                this._webview.redo();
            }
        }
    };
    ElectronWebviewBasedWebview = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, themeService_1.IThemeService),
        __param(4, files_1.IFileService),
        __param(5, tunnel_1.ITunnelService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, environment_1.IEnvironmentService)
    ], ElectronWebviewBasedWebview);
    exports.ElectronWebviewBasedWebview = ElectronWebviewBasedWebview;
});
//# sourceMappingURL=webviewElement.js.map