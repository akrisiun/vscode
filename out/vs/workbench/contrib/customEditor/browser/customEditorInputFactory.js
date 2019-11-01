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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/webview/browser/webviewEditorInputFactory", "vs/workbench/contrib/webview/browser/webviewEditorService"], function (require, exports, lifecycle_1, uri_1, uuid_1, instantiation_1, customEditorInput_1, webviewEditorInputFactory_1, webviewEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CustomEditoInputFactory = class CustomEditoInputFactory extends webviewEditorInputFactory_1.WebviewEditorInputFactory {
        constructor(_instantiationService, webviewService) {
            super(webviewService);
            this._instantiationService = _instantiationService;
            this.webviewService = webviewService;
        }
        serialize(input) {
            const data = Object.assign(Object.assign({}, this.toJson(input)), { editorResource: input.getResource().toJSON() });
            try {
                return JSON.stringify(data);
            }
            catch (_a) {
                return undefined;
            }
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(serializedEditorInput);
            const id = data.id || uuid_1.generateUuid();
            const webviewInput = this.webviewService.reviveWebview(id, data.viewType, data.title, data.iconPath, data.state, data.options, data.extensionLocation ? {
                location: data.extensionLocation,
                id: data.extensionId
            } : undefined, data.group);
            const customInput = this._instantiationService.createInstance(customEditorInput_1.CustomFileEditorInput, uri_1.URI.from(data.editorResource), data.viewType, id, new lifecycle_1.UnownedDisposable(webviewInput.webview));
            if (typeof data.group === 'number') {
                customInput.updateGroup(data.group);
            }
            return customInput;
        }
    };
    CustomEditoInputFactory.ID = customEditorInput_1.CustomFileEditorInput.typeId;
    CustomEditoInputFactory = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, webviewEditorService_1.IWebviewEditorService)
    ], CustomEditoInputFactory);
    exports.CustomEditoInputFactory = CustomEditoInputFactory;
});
//# sourceMappingURL=customEditorInputFactory.js.map