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
define(["require", "exports", "vs/platform/debug/common/extensionHostDebugIpc", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/extensions", "vs/platform/debug/common/extensionHostDebug", "vs/workbench/contrib/debug/common/debug", "vs/base/common/event", "vs/base/common/uri"], function (require, exports, extensionHostDebugIpc_1, remoteAgentService_1, environment_1, extensions_1, extensionHostDebug_1, debug_1, event_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserExtensionHostDebugService = class BrowserExtensionHostDebugService extends extensionHostDebugIpc_1.ExtensionHostDebugChannelClient {
        constructor(remoteAgentService, environmentService) {
            const connection = remoteAgentService.getConnection();
            let channel;
            if (connection) {
                channel = connection.getChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName);
            }
            else {
                channel = { call: async () => undefined, listen: () => event_1.Event.None };
                // TODO@weinand TODO@isidorn fallback?
                console.warn('Extension Host Debugging not available due to missing connection.');
            }
            super(channel);
            this._register(this.onReload(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.location.reload();
                }
            }));
            this._register(this.onClose(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    window.close();
                }
            }));
        }
        openExtensionDevelopmentHostWindow(args, env) {
            // we pass the "ParsedArgs" as query parameters of the URL
            let newAddress = `${document.location.origin}${document.location.pathname}?`;
            let gotFolder = false;
            const addQueryParameter = (key, value) => {
                const lastChar = newAddress.charAt(newAddress.length - 1);
                if (lastChar !== '?' && lastChar !== '&') {
                    newAddress += '&';
                }
                newAddress += `${key}=${encodeURIComponent(value)}`;
            };
            const f = args['folder-uri'];
            if (f) {
                const u = uri_1.URI.parse(f[0]);
                gotFolder = true;
                addQueryParameter('folder', u.path);
            }
            if (!gotFolder) {
                // request empty window
                addQueryParameter('ew', 'true');
            }
            const ep = args['extensionDevelopmentPath'];
            if (ep) {
                let u = ep[0];
                addQueryParameter('edp', u);
            }
            const di = args['debugId'];
            if (di) {
                addQueryParameter('di', di);
            }
            const ibe = args['inspect-brk-extensions'];
            if (ibe) {
                addQueryParameter('ibe', ibe);
            }
            window.open(newAddress);
            return Promise.resolve();
        }
    };
    BrowserExtensionHostDebugService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environment_1.IEnvironmentService)
    ], BrowserExtensionHostDebugService);
    extensions_1.registerSingleton(extensionHostDebug_1.IExtensionHostDebugService, BrowserExtensionHostDebugService);
    class BrowserDebugHelperService {
        createTelemetryService(configurationService, args) {
            return undefined;
        }
    }
    extensions_1.registerSingleton(debug_1.IDebugHelperService, BrowserDebugHelperService);
});
//# sourceMappingURL=extensionHostDebugService.js.map