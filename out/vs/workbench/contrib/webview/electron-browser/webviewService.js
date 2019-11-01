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
define(["require", "exports", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/dynamicWebviewEditorOverlay", "vs/workbench/contrib/webview/browser/webviewElement", "vs/workbench/contrib/webview/electron-browser/webviewElement"], function (require, exports, configuration_1, instantiation_1, dynamicWebviewEditorOverlay_1, webviewElement_1, webviewElement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ElectronWebviewService = class ElectronWebviewService {
        constructor(_instantiationService, _configService) {
            this._instantiationService = _instantiationService;
            this._configService = _configService;
        }
        createWebview(id, options, contentOptions) {
            const useExternalEndpoint = this._configService.getValue('webview.experimental.useExternalEndpoint');
            if (useExternalEndpoint) {
                return this._instantiationService.createInstance(webviewElement_1.IFrameWebview, id, options, contentOptions);
            }
            else {
                return this._instantiationService.createInstance(webviewElement_2.ElectronWebviewBasedWebview, options, contentOptions);
            }
        }
        createWebviewEditorOverlay(id, options, contentOptions) {
            return this._instantiationService.createInstance(dynamicWebviewEditorOverlay_1.DynamicWebviewEditorOverlay, id, options, contentOptions);
        }
    };
    ElectronWebviewService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, configuration_1.IConfigurationService)
    ], ElectronWebviewService);
    exports.ElectronWebviewService = ElectronWebviewService;
});
//# sourceMappingURL=webviewService.js.map