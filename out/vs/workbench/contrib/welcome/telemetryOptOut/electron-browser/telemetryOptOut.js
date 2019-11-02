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
define(["require", "exports", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/platform/notification/common/notification", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/product/common/productService", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/welcome/telemetryOptOut/browser/telemetryOptOut", "vs/platform/electron/node/electron"], function (require, exports, storage_1, telemetry_1, opener_1, notification_1, experimentService_1, configuration_1, extensionManagement_1, productService_1, host_1, telemetryOptOut_1, electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeTelemetryOptOut = class NativeTelemetryOptOut extends telemetryOptOut_1.AbstractTelemetryOptOut {
        constructor(storageService, openerService, notificationService, hostService, telemetryService, experimentService, configurationService, galleryService, productService, electronService) {
            super(storageService, openerService, notificationService, hostService, telemetryService, experimentService, configurationService, galleryService, productService);
            this.electronService = electronService;
            this.handleTelemetryOptOut();
        }
        getWindowCount() {
            return this.electronService.getWindowCount();
        }
    };
    NativeTelemetryOptOut = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, opener_1.IOpenerService),
        __param(2, notification_1.INotificationService),
        __param(3, host_1.IHostService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, experimentService_1.IExperimentService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, productService_1.IProductService),
        __param(9, electron_1.IElectronService)
    ], NativeTelemetryOptOut);
    exports.NativeTelemetryOptOut = NativeTelemetryOptOut;
});
//# sourceMappingURL=telemetryOptOut.js.map