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
define(["require", "exports", "vs/base/common/errorMessage", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "electron", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/base/common/errors", "vs/platform/lifecycle/common/lifecycleService", "vs/platform/instantiation/common/extensions", "vs/base/common/severity", "vs/nls", "vs/workbench/services/environment/common/environmentService"], function (require, exports, errorMessage_1, lifecycle_1, storage_1, electron_1, log_1, notification_1, errors_1, lifecycleService_1, extensions_1, severity_1, nls_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLifecycleService = void 0;
    let NativeLifecycleService = /** @class */ (() => {
        let NativeLifecycleService = class NativeLifecycleService extends lifecycleService_1.AbstractLifecycleService {
            constructor(notificationService, environmentService, storageService, logService) {
                super(logService);
                this.notificationService = notificationService;
                this.environmentService = environmentService;
                this.storageService = storageService;
                this.logService = logService;
                this._startupKind = this.resolveStartupKind();
                this.registerListeners();
            }
            resolveStartupKind() {
                const lastShutdownReason = this.storageService.getNumber(NativeLifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* WORKSPACE */);
                this.storageService.remove(NativeLifecycleService.LAST_SHUTDOWN_REASON_KEY, 1 /* WORKSPACE */);
                let startupKind;
                if (lastShutdownReason === 3 /* RELOAD */) {
                    startupKind = 3 /* ReloadedWindow */;
                }
                else if (lastShutdownReason === 4 /* LOAD */) {
                    startupKind = 4 /* ReopenedWindow */;
                }
                else {
                    startupKind = 1 /* NewWindow */;
                }
                this.logService.trace(`lifecycle: starting up (startup kind: ${this._startupKind})`);
                return startupKind;
            }
            registerListeners() {
                const windowId = this.environmentService.configuration.windowId;
                // Main side indicates that window is about to unload, check for vetos
                electron_1.ipcRenderer.on('vscode:onBeforeUnload', (_event, reply) => {
                    this.logService.trace(`lifecycle: onBeforeUnload (reason: ${reply.reason})`);
                    // trigger onBeforeShutdown events and veto collecting
                    this.handleBeforeShutdown(reply.reason).then(veto => {
                        if (veto) {
                            this.logService.trace('lifecycle: onBeforeUnload prevented via veto');
                            electron_1.ipcRenderer.send(reply.cancelChannel, windowId);
                        }
                        else {
                            this.logService.trace('lifecycle: onBeforeUnload continues without veto');
                            this.shutdownReason = reply.reason;
                            electron_1.ipcRenderer.send(reply.okChannel, windowId);
                        }
                    });
                });
                // Main side indicates that we will indeed shutdown
                electron_1.ipcRenderer.on('vscode:onWillUnload', async (_event, reply) => {
                    this.logService.trace(`lifecycle: onWillUnload (reason: ${reply.reason})`);
                    // trigger onWillShutdown events and joining
                    await this.handleWillShutdown(reply.reason);
                    // trigger onShutdown event now that we know we will quit
                    this._onShutdown.fire();
                    // acknowledge to main side
                    electron_1.ipcRenderer.send(reply.replyChannel, windowId);
                });
                // Save shutdown reason to retrieve on next startup
                this.storageService.onWillSaveState(e => {
                    if (e.reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                        this.storageService.store(NativeLifecycleService.LAST_SHUTDOWN_REASON_KEY, this.shutdownReason, 1 /* WORKSPACE */);
                    }
                });
            }
            handleBeforeShutdown(reason) {
                const vetos = [];
                this._onBeforeShutdown.fire({
                    veto(value) {
                        vetos.push(value);
                    },
                    reason
                });
                return lifecycle_1.handleVetos(vetos, error => this.onShutdownError(reason, error));
            }
            async handleWillShutdown(reason) {
                const joiners = [];
                this._onWillShutdown.fire({
                    join(promise) {
                        if (promise) {
                            joiners.push(promise);
                        }
                    },
                    reason
                });
                try {
                    await Promise.all(joiners);
                }
                catch (error) {
                    this.onShutdownError(reason, error);
                }
            }
            onShutdownError(reason, error) {
                let message;
                switch (reason) {
                    case 1 /* CLOSE */:
                        message = nls_1.localize('errorClose', "An unexpected error prevented the window from closing ({0}).", errorMessage_1.toErrorMessage(error));
                        break;
                    case 2 /* QUIT */:
                        message = nls_1.localize('errorQuit', "An unexpected error prevented the application from closing ({0}).", errorMessage_1.toErrorMessage(error));
                        break;
                    case 3 /* RELOAD */:
                        message = nls_1.localize('errorReload', "An unexpected error prevented the window from reloading ({0}).", errorMessage_1.toErrorMessage(error));
                        break;
                    case 4 /* LOAD */:
                        message = nls_1.localize('errorLoad', "An unexpected error prevented the window from changing it's workspace ({0}).", errorMessage_1.toErrorMessage(error));
                        break;
                }
                this.notificationService.notify({
                    severity: severity_1.default.Error,
                    message,
                    sticky: true
                });
                errors_1.onUnexpectedError(error);
            }
        };
        NativeLifecycleService.LAST_SHUTDOWN_REASON_KEY = 'lifecyle.lastShutdownReason';
        NativeLifecycleService = __decorate([
            __param(0, notification_1.INotificationService),
            __param(1, environmentService_1.IWorkbenchEnvironmentService),
            __param(2, storage_1.IStorageService),
            __param(3, log_1.ILogService)
        ], NativeLifecycleService);
        return NativeLifecycleService;
    })();
    exports.NativeLifecycleService = NativeLifecycleService;
    extensions_1.registerSingleton(lifecycle_1.ILifecycleService, NativeLifecycleService);
});
//# sourceMappingURL=lifecycleService.js.map