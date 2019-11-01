/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "./extHost.protocol", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/strings"], function (require, exports, event_1, extHost_protocol_1, uri_1, network_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtHostWindow {
        constructor(mainContext) {
            this._onDidChangeWindowState = new event_1.Emitter();
            this.onDidChangeWindowState = this._onDidChangeWindowState.event;
            this._state = ExtHostWindow.InitialState;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadWindow);
            this._proxy.$getWindowVisibility().then(isFocused => this.$onDidChangeWindowFocus(isFocused));
        }
        get state() { return this._state; }
        $onDidChangeWindowFocus(focused) {
            if (focused === this._state.focused) {
                return;
            }
            this._state = Object.assign(Object.assign({}, this._state), { focused });
            this._onDidChangeWindowState.fire(this._state);
        }
        openUri(stringOrUri, options) {
            if (typeof stringOrUri === 'string') {
                try {
                    stringOrUri = uri_1.URI.parse(stringOrUri);
                }
                catch (e) {
                    return Promise.reject(`Invalid uri - '${stringOrUri}'`);
                }
            }
            if (strings_1.isFalsyOrWhitespace(stringOrUri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (stringOrUri.scheme === network_1.Schemas.command) {
                return Promise.reject(`Invalid scheme '${stringOrUri.scheme}'`);
            }
            return this._proxy.$openUri(stringOrUri, options);
        }
        async asExternalUri(uri, options) {
            if (strings_1.isFalsyOrWhitespace(uri.scheme)) {
                return Promise.reject('Invalid scheme - cannot be empty');
            }
            else if (!new Set([network_1.Schemas.http, network_1.Schemas.https]).has(uri.scheme)) {
                return Promise.reject(`Invalid scheme '${uri.scheme}'`);
            }
            const result = await this._proxy.$asExternalUri(uri, options);
            return uri_1.URI.from(result);
        }
    }
    exports.ExtHostWindow = ExtHostWindow;
    ExtHostWindow.InitialState = {
        focused: true
    };
});
//# sourceMappingURL=extHostWindow.js.map