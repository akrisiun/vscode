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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/webviewElement", "vs/workbench/contrib/webview/browser/webview", "./dynamicWebviewEditorOverlay", "vs/platform/instantiation/common/extensions"], function (require, exports, instantiation_1, webviewElement_1, webview_1, dynamicWebviewEditorOverlay_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebviewService = class WebviewService {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
        }
        createWebview(id, options, contentOptions) {
            return this._instantiationService.createInstance(webviewElement_1.IFrameWebview, id, options, contentOptions);
        }
        createWebviewEditorOverlay(id, options, contentOptions) {
            return this._instantiationService.createInstance(dynamicWebviewEditorOverlay_1.DynamicWebviewEditorOverlay, id, options, contentOptions);
        }
    };
    WebviewService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebviewService);
    exports.WebviewService = WebviewService;
    extensions_1.registerSingleton(webview_1.IWebviewService, WebviewService, true);
});
//# sourceMappingURL=webviewService.js.map