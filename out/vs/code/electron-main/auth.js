/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "electron"], function (require, exports, nls_1, lifecycle_1, event_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProxyAuthHandler extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.retryCount = 0;
            this.registerListeners();
        }
        registerListeners() {
            const onLogin = event_1.Event.fromNodeEventEmitter(electron_1.app, 'login', (event, webContents, req, authInfo, cb) => ({ event, webContents, req, authInfo, cb }));
            this._register(onLogin(this.onLogin, this));
        }
        onLogin({ event, authInfo, cb }) {
            if (!authInfo.isProxy) {
                return;
            }
            if (this.retryCount++ > 1) {
                return;
            }
            event.preventDefault();
            const opts = {
                alwaysOnTop: true,
                skipTaskbar: true,
                resizable: false,
                width: 450,
                height: 220,
                show: true,
                title: 'VS Code',
                webPreferences: {
                    nodeIntegration: true,
                    webviewTag: true
                }
            };
            const focusedWindow = electron_1.BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
                opts.parent = focusedWindow;
                opts.modal = true;
            }
            const win = new electron_1.BrowserWindow(opts);
            const config = {};
            const baseUrl = require.toUrl('vs/code/electron-browser/proxy/auth.html');
            const url = `${baseUrl}?config=${encodeURIComponent(JSON.stringify(config))}`;
            const proxyUrl = `${authInfo.host}:${authInfo.port}`;
            const title = nls_1.localize('authRequire', "Proxy Authentication Required");
            const message = nls_1.localize('proxyauth', "The proxy {0} requires authentication.", proxyUrl);
            const data = { title, message };
            const javascript = 'promptForCredentials(' + JSON.stringify(data) + ')';
            const onWindowClose = () => cb('', '');
            win.on('close', onWindowClose);
            win.setMenu(null);
            win.loadURL(url);
            win.webContents.executeJavaScript(javascript, true).then(({ username, password }) => {
                cb(username, password);
                win.removeListener('close', onWindowClose);
                win.close();
            });
        }
    }
    exports.ProxyAuthHandler = ProxyAuthHandler;
});
//# sourceMappingURL=auth.js.map