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
define(["require", "exports", "vs/base/common/errorMessage", "vs/platform/lifecycle/common/lifecycle", "vs/platform/storage/common/storage", "electron", "vs/workbench/services/electron/electron-browser/electronEnvironmentService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/base/common/errors", "vs/platform/lifecycle/common/lifecycleService", "vs/platform/instantiation/common/extensions"], function (require, exports, errorMessage_1, lifecycle_1, storage_1, electron_1, electronEnvironmentService_1, log_1, notification_1, errors_1, lifecycleService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeLifecycleService = class NativeLifecycleService extends lifecycleService_1.AbstractLifecycleService {
        constructor(notificationService, electronEnvironmentService, storageService, logService) {
            super(logService);
            this.notificationService = notificationService;
            this.electronEnvironmentService = electronEnvironmentService;
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
            const windowId = this.electronEnvironmentService.windowId;
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
            return lifecycle_1.handleVetos(vetos, err => {
                this.notificationService.error(errorMessage_1.toErrorMessage(err));
                errors_1.onUnexpectedError(err);
            });
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
                this.notificationService.error(errorMessage_1.toErrorMessage(error));
                errors_1.onUnexpectedError(error);
            }
        }
    };
    NativeLifecycleService.LAST_SHUTDOWN_REASON_KEY = 'lifecyle.lastShutdownReason';
    NativeLifecycleService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, electronEnvironmentService_1.IElectronEnvironmentService),
        __param(2, storage_1.IStorageService),
        __param(3, log_1.ILogService)
    ], NativeLifecycleService);
    exports.NativeLifecycleService = NativeLifecycleService;
    extensions_1.registerSingleton(lifecycle_1.ILifecycleService, NativeLifecycleService);
});
//# sourceMappingURL=lifecycleService.js.map