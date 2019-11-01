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
define(["require", "exports", "vs/base/parts/ipc/node/ipc", "vs/platform/localizations/common/localizations", "vs/platform/ipc/electron-browser/sharedProcessService", "vs/platform/instantiation/common/extensions"], function (require, exports, ipc_1, localizations_1, sharedProcessService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LocalizationsService = class LocalizationsService {
        constructor(sharedProcessService) {
            return ipc_1.createChannelSender(sharedProcessService.getChannel('localizations'));
        }
    };
    LocalizationsService = __decorate([
        __param(0, sharedProcessService_1.ISharedProcessService)
    ], LocalizationsService);
    exports.LocalizationsService = LocalizationsService;
    extensions_1.registerSingleton(localizations_1.ILocalizationsService, LocalizationsService, true);
});
//# sourceMappingURL=localizationsService.js.map