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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/decorators", "vs/platform/environment/common/environment", "electron", "vs/base/common/async", "vs/platform/log/common/log", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/theme/electron-main/themeMainService", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, objects_1, decorators_1, environment_1, electron_1, async_1, log_1, lifecycleMainService_1, themeMainService_1, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SharedProcess = class SharedProcess {
        constructor(machineId, userEnv, environmentService, lifecycleMainService, logService, themeMainService) {
            this.machineId = machineId;
            this.userEnv = userEnv;
            this.environmentService = environmentService;
            this.lifecycleMainService = lifecycleMainService;
            this.logService = logService;
            this.themeMainService = themeMainService;
            this.barrier = new async_1.Barrier();
            this.window = null;
        }
        get _whenReady() {
            this.window = new electron_1.BrowserWindow({
                show: false,
                backgroundColor: this.themeMainService.getBackgroundColor(),
                webPreferences: {
                    images: false,
                    nodeIntegration: true,
                    webgl: false,
                    disableBlinkFeatures: 'Auxclick' // do NOT change, allows us to identify this window as shared-process in the process explorer
                }
            });
            const config = objects_1.assign({
                appRoot: this.environmentService.appRoot,
                machineId: this.machineId,
                nodeCachedDataDir: this.environmentService.nodeCachedDataDir,
                userEnv: this.userEnv,
                windowId: this.window.id
            });
            const url = `${require.toUrl('vs/code/electron-browser/sharedProcess/sharedProcess.html')}?config=${encodeURIComponent(JSON.stringify(config))}`;
            this.window.loadURL(url);
            // Prevent the window from dying
            const onClose = (e) => {
                this.logService.trace('SharedProcess#close prevented');
                // We never allow to close the shared process unless we get explicitly disposed()
                e.preventDefault();
                // Still hide the window though if visible
                if (this.window && this.window.isVisible()) {
                    this.window.hide();
                }
            };
            this.window.on('close', onClose);
            const disposables = new lifecycle_1.DisposableStore();
            this.lifecycleMainService.onWillShutdown(() => {
                disposables.dispose();
                // Shut the shared process down when we are quitting
                //
                // Note: because we veto the window close, we must first remove our veto.
                // Otherwise the application would never quit because the shared process
                // window is refusing to close!
                //
                if (this.window) {
                    this.window.removeListener('close', onClose);
                }
                // Electron seems to crash on Windows without this setTimeout :|
                setTimeout(() => {
                    try {
                        if (this.window) {
                            this.window.close();
                        }
                    }
                    catch (err) {
                        // ignore, as electron is already shutting down
                    }
                    this.window = null;
                }, 0);
            });
            return new Promise(c => {
                const onHello = event_1.Event.once(event_1.Event.fromNodeEventEmitter(electron_1.ipcMain, 'handshake:hello', ({ sender }) => sender));
                disposables.add(onHello(sender => {
                    sender.send('handshake:hey there', {
                        sharedIPCHandle: this.environmentService.sharedIPCHandle,
                        args: this.environmentService.args,
                        logLevel: this.logService.getLevel()
                    });
                    disposables.add(lifecycle_1.toDisposable(() => sender.send('handshake:goodbye')));
                    electron_1.ipcMain.once('handshake:im ready', () => c(undefined));
                }));
            });
        }
        spawn(userEnv) {
            this.userEnv = Object.assign(Object.assign({}, this.userEnv), userEnv);
            this.barrier.open();
        }
        async whenReady() {
            await this.barrier.wait();
            await this._whenReady;
        }
        toggle() {
            if (!this.window || this.window.isVisible()) {
                this.hide();
            }
            else {
                this.show();
            }
        }
        show() {
            if (this.window) {
                this.window.show();
                this.window.webContents.openDevTools();
            }
        }
        hide() {
            if (this.window) {
                this.window.webContents.closeDevTools();
                this.window.hide();
            }
        }
    };
    __decorate([
        decorators_1.memoize
    ], SharedProcess.prototype, "_whenReady", null);
    SharedProcess = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, lifecycleMainService_1.ILifecycleMainService),
        __param(4, log_1.ILogService),
        __param(5, themeMainService_1.IThemeMainService)
    ], SharedProcess);
    exports.SharedProcess = SharedProcess;
});
//# sourceMappingURL=sharedProcess.js.map