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
define(["require", "exports", "vs/workbench/services/textMate/common/textMateService", "vs/platform/instantiation/common/extensions", "vs/workbench/services/textMate/browser/abstractTextMateService", "vs/editor/common/services/modeService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/configuration/common/configuration", "vs/platform/storage/common/storage", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader"], function (require, exports, textMateService_1, extensions_1, abstractTextMateService_1, modeService_1, log_1, notification_1, workbenchThemeService_1, configuration_1, storage_1, extensionResourceLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TextMateService = class TextMateService extends abstractTextMateService_1.AbstractTextMateService {
        constructor(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService) {
            super(modeService, themeService, extensionResourceLoaderService, notificationService, logService, configurationService, storageService);
        }
        _loadVSCodeTextmate() {
            return new Promise((resolve_1, reject_1) => { require(['vscode-textmate'], resolve_1, reject_1); });
        }
        _loadOnigLib() {
            return loadOnigasm();
        }
    };
    TextMateService = __decorate([
        __param(0, modeService_1.IModeService),
        __param(1, workbenchThemeService_1.IWorkbenchThemeService),
        __param(2, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, storage_1.IStorageService)
    ], TextMateService);
    exports.TextMateService = TextMateService;
    let onigasmPromise = null;
    async function loadOnigasm() {
        if (!onigasmPromise) {
            onigasmPromise = doLoadOnigasm();
        }
        return onigasmPromise;
    }
    async function doLoadOnigasm() {
        const [wasmBytes, onigasm] = await Promise.all([
            loadOnigasmWASM(),
            new Promise((resolve_2, reject_2) => { require(['onigasm-umd'], resolve_2, reject_2); })
        ]);
        await onigasm.loadWASM(wasmBytes);
        return {
            createOnigScanner(patterns) { return new onigasm.OnigScanner(patterns); },
            createOnigString(s) { return new onigasm.OnigString(s); }
        };
    }
    async function loadOnigasmWASM() {
        const wasmPath = require.toUrl('onigasm-umd/../onigasm.wasm');
        const response = await fetch(wasmPath);
        const bytes = await response.arrayBuffer();
        return bytes;
    }
    extensions_1.registerSingleton(textMateService_1.ITextMateService, TextMateService);
});
//# sourceMappingURL=textMateService.js.map