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
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "../common/extHostCustomers", "vs/platform/url/common/url", "vs/workbench/services/extensions/browser/extensionUrlHandler", "vs/platform/extensions/common/extensions"], function (require, exports, extHost_protocol_1, extHostCustomers_1, url_1, extensionUrlHandler_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExtensionUrlHandler {
        constructor(proxy, handle, extensionId) {
            this.proxy = proxy;
            this.handle = handle;
            this.extensionId = extensionId;
        }
        handleURL(uri, options) {
            if (!extensions_1.ExtensionIdentifier.equals(this.extensionId, uri.authority)) {
                return Promise.resolve(false);
            }
            return Promise.resolve(this.proxy.$handleExternalUri(this.handle, uri)).then(() => true);
        }
    }
    let MainThreadUrls = class MainThreadUrls {
        constructor(context, urlService, extensionUrlHandler) {
            this.urlService = urlService;
            this.extensionUrlHandler = extensionUrlHandler;
            this.handlers = new Map();
            this.proxy = context.getProxy(extHost_protocol_1.ExtHostContext.ExtHostUrls);
        }
        $registerUriHandler(handle, extensionId) {
            const handler = new ExtensionUrlHandler(this.proxy, handle, extensionId);
            const disposable = this.urlService.registerHandler(handler);
            this.handlers.set(handle, { extensionId, disposable });
            this.extensionUrlHandler.registerExtensionHandler(extensionId, handler);
            return Promise.resolve(undefined);
        }
        $unregisterUriHandler(handle) {
            const tuple = this.handlers.get(handle);
            if (!tuple) {
                return Promise.resolve(undefined);
            }
            const { extensionId, disposable } = tuple;
            this.extensionUrlHandler.unregisterExtensionHandler(extensionId);
            this.handlers.delete(handle);
            disposable.dispose();
            return Promise.resolve(undefined);
        }
        async $createAppUri(uri) {
            return this.urlService.create(uri);
        }
        async $proposedCreateAppUri(extensionId, options) {
            const payload = options && options.payload ? options.payload : Object.create(null);
            // we define the authority to be the extension ID to ensure
            // that the Uri gets routed back to the extension properly.
            payload.authority = extensionId.value;
            return this.urlService.create(payload);
        }
        dispose() {
            this.handlers.forEach(({ disposable }) => disposable.dispose());
            this.handlers.clear();
        }
    };
    MainThreadUrls = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadUrls),
        __param(1, url_1.IURLService),
        __param(2, extensionUrlHandler_1.IExtensionUrlHandler)
    ], MainThreadUrls);
    exports.MainThreadUrls = MainThreadUrls;
});
//# sourceMappingURL=mainThreadUrls.js.map