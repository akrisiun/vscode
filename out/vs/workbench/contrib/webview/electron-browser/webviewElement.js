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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/remote/common/tunnel", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/webview/common/portMapping", "vs/workbench/contrib/webview/common/resourceLoader", "vs/workbench/contrib/webview/electron-browser/webviewProtocols", "../browser/webviewFindWidget", "vs/workbench/contrib/webview/browser/baseWebviewElement", "vs/workbench/services/environment/common/environmentService"], function (require, exports, dom_1, event_1, functional_1, lifecycle_1, platform_1, environment_1, files_1, instantiation_1, tunnel_1, telemetry_1, portMapping_1, resourceLoader_1, webviewProtocols_1, webviewFindWidget_1, baseWebviewElement_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebviewTagHandle extends lifecycle_1.Disposable {
        constructor(webview) {
            super();
            this.webview = webview;
            this._onFirstLoad = this._register(new event_1.Emitter());
            this.onFirstLoad = this._onFirstLoad.event;
            this._register(dom_1.addDisposableListener(this.webview, 'destroyed', () => {
                this._webContents = 'destroyed';
            }));
            this._register(dom_1.addDisposableListener(this.webview, 'did-start-loading', functional_1.once(() => {
                const contents = this.webContents;
                if (contents) {
                    this._onFirstLoad.fire(contents);
                    this._register(lifecycle_1.toDisposable(() => {
                        contents.removeAllListeners();
                    }));
                }
            })));
        }
        get webContents() {
            if (this._webContents === 'destroyed') {
                return undefined;
            }
            if (this._webContents) {
                return this._webContents;
            }
            this._webContents = this.webview.getWebContents();
            return this._webContents;
        }
    }
    class WebviewSession extends lifecycle_1.Disposable {
        constructor(webviewHandle) {
            super();
            this._onBeforeRequestDelegates = [];
            this._onHeadersReceivedDelegates = [];
            this._register(webviewHandle.onFirstLoad(contents => {
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
            }));
        }
        onBeforeRequest(delegate) {
            this._onBeforeRequestDelegates.push(delegate);
        }
        onHeadersReceived(delegate) {
            this._onHeadersReceivedDelegates.push(delegate);
        }
    }
    class WebviewProtocolProvider extends lifecycle_1.Disposable {
        constructor(handle, _getExtensionLocation, _getLocalResourceRoots, _fileService) {
            super();
            this._getExtensionLocation = _getExtensionLocation;
            this._getLocalResourceRoots = _getLocalResourceRoots;
            this._fileService = _fileService;
            this._register(handle.onFirstLoad(contents => {
                this.registerProtocols(contents);
            }));
        }
        registerProtocols(contents) {
            webviewProtocols_1.registerFileProtocol(contents, resourceLoader_1.WebviewResourceScheme, this._fileService, this._getExtensionLocation(), () => this._getLocalResourceRoots());
        }
    }
    class WebviewPortMappingProvider extends lifecycle_1.Disposable {
        constructor(session, getExtensionLocation, mappings, tunnelService) {
            super();
            const manager = this._register(new portMapping_1.WebviewPortMappingManager(getExtensionLocation, mappings, tunnelService));
            session.onBeforeRequest(async (details) => {
                const redirect = await manager.getRedirect(details.url);
                return redirect ? { redirectURL: redirect } : undefined;
            });
        }
    }
    class WebviewKeyboardHandler extends lifecycle_1.Disposable {
        constructor(_webviewHandle) {
            super();
            this._webviewHandle = _webviewHandle;
            this._ignoreMenuShortcut = false;
            if (this.shouldToggleMenuShortcutsEnablement) {
                this._register(_webviewHandle.onFirstLoad(contents => {
                    contents.on('before-input-event', (_event, input) => {
                        if (input.type === 'keyDown' && document.activeElement === this._webviewHandle.webview) {
                            this._ignoreMenuShortcut = input.control || input.meta;
                            this.setIgnoreMenuShortcuts(this._ignoreMenuShortcut);
                        }
                    });
                }));
            }
            this._register(dom_1.addDisposableListener(this._webviewHandle.webview, 'ipc-message', (event) => {
                switch (event.channel) {
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
            const contents = this._webviewHandle.webContents;
            if (contents) {
                contents.setIgnoreMenuShortcuts(value);
            }
        }
    }
    let ElectronWebviewBasedWebview = class ElectronWebviewBasedWebview extends baseWebviewElement_1.BaseWebview {
        constructor(id, options, contentOptions, _webviewThemeDataProvider, instantiationService, fileService, tunnelService, telemetryService, environementService, workbenchEnvironmentService) {
            super(id, options, contentOptions, _webviewThemeDataProvider, telemetryService, environementService, workbenchEnvironmentService);
            this._webviewThemeDataProvider = _webviewThemeDataProvider;
            this._findStarted = false;
            this.extraContentOptions = {};
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            const webviewAndContents = this._register(new WebviewTagHandle(this.element));
            const session = this._register(new WebviewSession(webviewAndContents));
            this._register(new WebviewProtocolProvider(webviewAndContents, () => this.extension ? this.extension.location : undefined, () => (this.content.options.localResourceRoots || []), fileService));
            this._register(new WebviewPortMappingProvider(session, () => this.extension ? this.extension.location : undefined, () => (this.content.options.portMapping || []), tunnelService));
            this._register(new WebviewKeyboardHandler(webviewAndContents));
            this._register(dom_1.addDisposableListener(this.element, 'console-message', function (e) {
                console.log(`[Embedded Page] ${e.message}`);
            }));
            this._register(dom_1.addDisposableListener(this.element, 'dom-ready', () => {
                // Workaround for https://github.com/electron/electron/issues/14474
                if (this.element && (this.focused || document.activeElement === this.element)) {
                    this.element.blur();
                    this.element.focus();
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, 'crashed', () => {
                console.error('embedded page crashed');
            }));
            this._register(this.on('synthetic-mouse-event', (rawEvent) => {
                if (!this.element) {
                    return;
                }
                const bounds = this.element.getBoundingClientRect();
                try {
                    window.dispatchEvent(new MouseEvent(rawEvent.type, Object.assign(Object.assign({}, rawEvent), { clientX: rawEvent.clientX + bounds.left, clientY: rawEvent.clientY + bounds.top })));
                    return;
                }
                catch (_a) {
                    // CustomEvent was treated as MouseEvent so don't do anything - https://github.com/microsoft/vscode/issues/78915
                    return;
                }
            }));
            this._register(this.on('did-set-content', () => {
                if (this.element) {
                    this.element.style.flex = '';
                    this.element.style.width = '100%';
                    this.element.style.height = '100%';
                }
            }));
            this._register(dom_1.addDisposableListener(this.element, 'devtools-opened', () => {
                this._send('devtools-opened');
            }));
            if (options.enableFindWidget) {
                this._webviewFindWidget = this._register(instantiationService.createInstance(webviewFindWidget_1.WebviewFindWidget, this));
                this._register(dom_1.addDisposableListener(this.element, 'found-in-page', e => {
                    this._hasFindResult.fire(e.result.matches > 0);
                }));
                this.styledFindWidget();
            }
        }
        createElement(options) {
            const element = document.createElement('webview');
            element.setAttribute('partition', `webview${Date.now()}`);
            element.setAttribute('webpreferences', 'contextIsolation=yes');
            element.className = `webview ${options.customClasses || ''}`;
            element.style.flex = '0 1';
            element.style.width = '0';
            element.style.height = '0';
            element.style.outline = '0';
            element.preload = require.toUrl('./pre/electron-index.js');
            element.src = 'data:text/html;charset=utf-8,%3C%21DOCTYPE%20html%3E%0D%0A%3Chtml%20lang%3D%22en%22%20style%3D%22width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3Chead%3E%0D%0A%09%3Ctitle%3EVirtual%20Document%3C%2Ftitle%3E%0D%0A%3C%2Fhead%3E%0D%0A%3Cbody%20style%3D%22margin%3A%200%3B%20overflow%3A%20hidden%3B%20width%3A%20100%25%3B%20height%3A%20100%25%22%3E%0D%0A%3C%2Fbody%3E%0D%0A%3C%2Fhtml%3E';
            return element;
        }
        mountTo(parent) {
            if (!this.element) {
                return;
            }
            if (this._webviewFindWidget) {
                parent.appendChild(this._webviewFindWidget.getDomNode());
            }
            parent.appendChild(this.element);
        }
        postMessage(channel, data) {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.send(channel, data);
        }
        focus() {
            if (!this.element) {
                return;
            }
            try {
                this.element.focus();
            }
            catch (_a) {
                // noop
            }
            this._send('focus');
            // Handle focus change programmatically (do not rely on event from <webview>)
            this.handleFocusChange(true);
        }
        style() {
            super.style();
            this.styledFindWidget();
        }
        styledFindWidget() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.updateTheme(this._webviewThemeDataProvider.getTheme());
        }
        startFind(value, options) {
            if (!value || !this.element) {
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
            this.element.findInPage(value, findOptions);
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, previous) {
            if (!this.element) {
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
            this.element.findInPage(value, options);
        }
        stopFind(keepSelection) {
            this._hasFindResult.fire(false);
            if (!this.element) {
                return;
            }
            this._findStarted = false;
            this.element.stopFindInPage(keepSelection ? 'keepSelection' : 'clearSelection');
        }
        showFind() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.reveal();
        }
        hideFind() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.hide();
        }
        runFindAction(previous) {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.find(previous);
        }
        selectAll() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.selectAll();
        }
        copy() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.copy();
        }
        paste() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.paste();
        }
        cut() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.cut();
        }
        undo() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.undo();
        }
        redo() {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.redo();
        }
        on(channel, handler) {
            if (!this.element) {
                return lifecycle_1.Disposable.None;
            }
            return dom_1.addDisposableListener(this.element, 'ipc-message', (event) => {
                if (!this.element) {
                    return;
                }
                if (event.channel === channel && event.args && event.args.length) {
                    handler(event.args[0]);
                }
            });
        }
    };
    ElectronWebviewBasedWebview = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, files_1.IFileService),
        __param(6, tunnel_1.ITunnelService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, environment_1.IEnvironmentService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService)
    ], ElectronWebviewBasedWebview);
    exports.ElectronWebviewBasedWebview = ElectronWebviewBasedWebview;
});
//# sourceMappingURL=webviewElement.js.map