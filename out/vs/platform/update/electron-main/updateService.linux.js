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
define(["require", "exports", "vs/platform/product/common/product", "vs/platform/configuration/common/configuration", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/update/common/update", "vs/platform/telemetry/common/telemetry", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/update/electron-main/abstractUpdateService", "vs/platform/request/common/request", "electron", "vs/base/common/cancellation"], function (require, exports, product_1, configuration_1, lifecycleMainService_1, update_1, telemetry_1, environment_1, log_1, abstractUpdateService_1, request_1, electron_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let LinuxUpdateService = class LinuxUpdateService extends abstractUpdateService_1.AbstractUpdateService {
        constructor(lifecycleMainService, configurationService, telemetryService, environmentService, requestService, logService) {
            super(lifecycleMainService, configurationService, environmentService, requestService, logService);
            this.telemetryService = telemetryService;
        }
        buildUpdateFeedUrl(quality) {
            return abstractUpdateService_1.createUpdateURL(`linux-${process.arch}`, quality);
        }
        doCheckForUpdates(context) {
            if (!this.url) {
                return;
            }
            this.setState(update_1.State.CheckingForUpdates(context));
            this.requestService.request({ url: this.url }, cancellation_1.CancellationToken.None)
                .then(request_1.asJson)
                .then(update => {
                if (!update || !update.url || !update.version || !update.productVersion) {
                    this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                    this.setState(update_1.State.Idle(1 /* Archive */));
                }
                else {
                    this.setState(update_1.State.AvailableForDownload(update));
                }
            })
                .then(undefined, err => {
                this.logService.error(err);
                this.telemetryService.publicLog2('update:notAvailable', { explicit: !!context });
                // only show message when explicitly checking for updates
                const message = !!context ? (err.message || err) : undefined;
                this.setState(update_1.State.Idle(1 /* Archive */, message));
            });
        }
        async doDownloadUpdate(state) {
            // Use the download URL if available as we don't currently detect the package type that was
            // installed and the website download page is more useful than the tarball generally.
            if (product_1.default.downloadUrl && product_1.default.downloadUrl.length > 0) {
                electron_1.shell.openExternal(product_1.default.downloadUrl);
            }
            else if (state.update.url) {
                electron_1.shell.openExternal(state.update.url);
            }
            this.setState(update_1.State.Idle(1 /* Archive */));
        }
    };
    LinuxUpdateService = __decorate([
        __param(0, lifecycleMainService_1.ILifecycleMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, request_1.IRequestService),
        __param(5, log_1.ILogService)
    ], LinuxUpdateService);
    exports.LinuxUpdateService = LinuxUpdateService;
});
//# sourceMappingURL=updateService.linux.js.map