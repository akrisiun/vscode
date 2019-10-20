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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/extensions/common/extensions", "./webviewEditorInput", "./webviewWorkbenchService"], function (require, exports, uri_1, uuid_1, extensions_1, webviewEditorInput_1, webviewWorkbenchService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewEditorInputFactory = class WebviewEditorInputFactory {
        constructor(_webviewWorkbenchService) {
            this._webviewWorkbenchService = _webviewWorkbenchService;
        }
        serialize(input) {
            if (!this._webviewWorkbenchService.shouldPersist(input)) {
                return undefined;
            }
            const data = this.toJson(input);
            try {
                return JSON.stringify(data);
            }
            catch (_a) {
                return undefined;
            }
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(serializedEditorInput);
            return this._webviewWorkbenchService.reviveWebview(data.id || uuid_1.generateUuid(), data.viewType, data.title, data.iconPath, data.state, data.options, data.extensionLocation && data.extensionId ? {
                location: data.extensionLocation,
                id: data.extensionId
            } : undefined, data.group);
        }
        fromJson(serializedEditorInput) {
            const data = JSON.parse(serializedEditorInput);
            return Object.assign(Object.assign({}, data), { extensionLocation: reviveUri(data.extensionLocation), extensionId: data.extensionId ? new extensions_1.ExtensionIdentifier(data.extensionId) : undefined, iconPath: reviveIconPath(data.iconPath), state: reviveState(data.state) });
        }
        toJson(input) {
            return {
                id: input.id,
                viewType: input.viewType,
                title: input.getName(),
                options: Object.assign(Object.assign({}, input.webview.options), input.webview.contentOptions),
                extensionLocation: input.extension ? input.extension.location : undefined,
                extensionId: input.extension && input.extension.id ? input.extension.id.value : undefined,
                state: input.webview.state,
                iconPath: input.iconPath ? { light: input.iconPath.light, dark: input.iconPath.dark, } : undefined,
                group: input.group
            };
        }
    };
    WebviewEditorInputFactory.ID = webviewEditorInput_1.WebviewInput.typeId;
    WebviewEditorInputFactory = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService)
    ], WebviewEditorInputFactory);
    exports.WebviewEditorInputFactory = WebviewEditorInputFactory;
    function reviveIconPath(data) {
        if (!data) {
            return undefined;
        }
        const light = reviveUri(data.light);
        const dark = reviveUri(data.dark);
        return light && dark ? { light, dark } : undefined;
    }
    function reviveUri(data) {
        if (!data) {
            return undefined;
        }
        try {
            if (typeof data === 'string') {
                return uri_1.URI.parse(data);
            }
            return uri_1.URI.from(data);
        }
        catch (_a) {
            return undefined;
        }
    }
    function reviveState(state) {
        return typeof state === 'string' ? state : undefined;
    }
});
//# sourceMappingURL=webviewEditorInputFactory.js.map